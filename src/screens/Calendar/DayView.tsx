import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarEvent } from './calendarUtils';
import { Meal, MealType, Workout, WorkoutSlotType } from '../../types';
import { Check, Circle, Flame, GripVertical, Plus, Play, Edit3 } from 'lucide-react';

interface DayViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectWorkout: (workout: Workout) => void;
  onSelectMeal: (meal: Meal) => void;
  onDateSelect: (date: Date) => void;
  onAddWorkout: () => void;
  onAddMeal: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onUpdatePlanItem?: (
    id: string,
    updates: Partial<{ scheduledDate: string; scheduledTime: string; mealType: MealType | WorkoutSlotType; completed: boolean }>,
  ) => void;
}

const DayView: React.FC<DayViewProps> = ({
  events,
  selectedDate,
  onSelectWorkout,
  onSelectMeal,
  onAddWorkout,
  onAddMeal,
  onEditEvent,
  onUpdatePlanItem,
}) => {
  const HOUR_HEIGHT = 84;
  const PX_PER_MIN = HOUR_HEIGHT / 60;

  const dateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  const dayEvents = useMemo(() => events.filter(e => e.date === dateStr), [events, dateStr]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const pendingPressRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    timer: number | null;
    cancelled: boolean;
    event: CalendarEvent;
    durationMinutes: number;
  } | null>(null);

  const dragRef = useRef<{
    pointerId: number;
    event: CalendarEvent;
    durationMinutes: number;
    offsetY: number;
  } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    timeLabel: string;
  } | null>(null);
  const lastDragTimeRef = useRef<string | null>(null);

  const isSameDay = (a: Date, b: Date) => (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );

  const parseTimeToMinutes = (time: string) => {
    const m = time.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
    const min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
    return h * 60 + min;
  };

  const parseDurationMinutes = (duration?: string) => {
    if (!duration) return 45;
    const s = duration.toLowerCase().trim();

    // Common formats: "20 min", "45min", "1h", "1h 30m", "01:30"
    const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);

    const h = s.match(/(\d+)\s*h/);
    const m = s.match(/(\d+)\s*m/);
    if (h || m) return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);

    const min = s.match(/(\d+)\s*(min|mins|minute|minutes)/);
    if (min) return parseInt(min[1], 10);

    const num = s.match(/^(\d+)$/);
    if (num) return parseInt(num[1], 10);

    return 45;
  };

  const minutesToTime = (minutesTotal: number) => {
    const clamped = Math.max(0, Math.min(24 * 60 - 1, minutesTotal));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const inferSlot = (event: CalendarEvent, minutesTotal: number): MealType | WorkoutSlotType => {
    const hour = Math.floor(minutesTotal / 60);
    if (event.type === 'workout') {
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      return 'evening';
    }

    // Meals
    if (hour < 10) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  const formatAxisLabel = (hour: number) => {
    const h12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h12} ${ampm}`;
  };

  const addMinutesToTime = (time: string, minutes: number) => {
    const start = parseTimeToMinutes(time);
    const end = Math.max(0, Math.min(24 * 60, start + minutes));
    const h = Math.floor(end / 60);
    const m = end % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    if (!isSameDay(selectedDate, new Date())) return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetTop = nowMinutes * PX_PER_MIN;
    const container = scrollRef.current;

    // Scroll a little above "now" so upcoming items are visible.
    const desired = targetTop - container.clientHeight * 0.35;
    container.scrollTop = Math.max(0, desired);
  }, [selectedDate]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingPressRef.current;
      const d = dragRef.current;

      // Cancel pending long-press if user starts scrolling/moving.
      if (pending && e.pointerId === pending.pointerId && !d) {
        const dx = Math.abs(e.clientX - pending.startX);
        const dy = Math.abs(e.clientY - pending.startY);
        if (dx + dy > 10) {
          pending.cancelled = true;
          if (pending.timer) window.clearTimeout(pending.timer);
          pendingPressRef.current = null;
        }
        return;
      }

      if (!d) return;
      if (e.pointerId !== d.pointerId) return;

      if (e.pointerType === 'touch' || e.pointerType === 'pen') e.preventDefault();
      if (!trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const yWithin = e.clientY - trackRect.top - d.offsetY;
      const minutesRaw = yWithin / PX_PER_MIN;
      const snap = 5;
      const snappedMinutes = Math.round(minutesRaw / snap) * snap;

      const maxStart = 24 * 60 - d.durationMinutes;
      const nextStartMinutes = Math.max(0, Math.min(maxStart, snappedMinutes));
      const nextTime = minutesToTime(nextStartMinutes);

      lastDragTimeRef.current = nextTime;

      setDragGhost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          x: e.clientX,
          y: e.clientY,
          timeLabel: nextTime,
        };
      });
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;

      // Commit update
      const timeLabel = lastDragTimeRef.current;
      if (timeLabel && onUpdatePlanItem) {
        const minutesTotal = parseTimeToMinutes(timeLabel);
        const slot = inferSlot(d.event, minutesTotal);
        onUpdatePlanItem(d.event.id, {
          scheduledTime: timeLabel,
          mealType: slot,
        });
      }

      dragRef.current = null;
      pendingPressRef.current = null;
      lastDragTimeRef.current = null;
      setDraggingId(null);
      setDragGhost(null);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [PX_PER_MIN, onUpdatePlanItem]);

  const getAccent = (event: CalendarEvent) => {
    if (event.type === 'meal') return 'bg-emerald-500';
    if (event.intensity === 'Hard') return 'bg-red-500';
    if (event.intensity === 'Medium') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const EventCard: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const isWorkout = event.type === 'workout';
    const startMinutes = parseTimeToMinutes(event.time);
    const durationMinutes = isWorkout ? parseDurationMinutes(event.duration) : 30;
    const top = startMinutes * PX_PER_MIN;
    const height = Math.max(22, durationMinutes * PX_PER_MIN);
    const endTime = addMinutesToTime(event.time, durationMinutes);

    const isDraggingThis = draggingId === event.id;

    return (
      <div
        className={
          'absolute left-3 right-3 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-xl transition-all text-left ' +
          (isDraggingThis ? 'opacity-30 scale-95' : 'hover:bg-zinc-800 active:scale-[0.98]')
        }
        style={{ top, height, touchAction: isDraggingThis ? 'none' : 'pan-y' }}
        onPointerDown={(e) => {
          if (!onUpdatePlanItem) return;
          if (e.pointerType === 'mouse' && e.button !== 0) return;

          const pointerId = e.pointerId;
          const startX = e.clientX;
          const startY = e.clientY;
          const cardEl = e.currentTarget as HTMLDivElement;
          const rect = cardEl.getBoundingClientRect();

          const timer = window.setTimeout(() => {
            const pending = pendingPressRef.current;
            if (!pending || pending.cancelled) return;
            if (pending.pointerId !== pointerId) return;

            try {
              cardEl.setPointerCapture(pointerId);
            } catch {
              // ignore
            }

            const offsetY = startY - rect.top;
            dragRef.current = {
              pointerId,
              event,
              durationMinutes,
              offsetY,
            };
            setDraggingId(event.id);
            setDragGhost({
              x: startX,
              y: startY,
              width: rect.width,
              height: rect.height,
              title: event.title,
              timeLabel: event.time,
            });
            lastDragTimeRef.current = event.time;
          }, 220);

          pendingPressRef.current = {
            pointerId,
            startX,
            startY,
            timer,
            cancelled: false,
            event,
            durationMinutes,
          };
        }}
        onPointerUp={(e) => {
          const pending = pendingPressRef.current;
          const d = dragRef.current;

          if (pending && pending.pointerId === e.pointerId) {
            if (pending.timer) window.clearTimeout(pending.timer);
            pendingPressRef.current = null;
          }

          // If we're dragging, pointerup is handled globally (commit).
          if (d && d.pointerId === e.pointerId) return;

          // Tap → open Edit modal instead of just detail
          if (onEditEvent) {
             onEditEvent(event);
          } else {
             if (isWorkout) onSelectWorkout(event.data as Workout);
             else onSelectMeal(event.data as Meal);
          }
        }}
        onPointerCancel={(e) => {
          const pending = pendingPressRef.current;
          if (pending && pending.pointerId === e.pointerId) {
            if (pending.timer) window.clearTimeout(pending.timer);
            pendingPressRef.current = null;
          }
        }}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getAccent(event)} shadow-[2px_0_10px_rgba(0,0,0,0.3)] transition-colors duration-500`} />

        <div className="relative h-full px-4 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${event.completed ? 'text-white/20' : 'text-white/40'}`}>
                  {event.time} – {endTime}
                </div>
                <div className={`mt-1 text-[15px] font-bold leading-tight truncate transition-all duration-500 ${event.completed ? 'text-white/20 italic line-through' : 'text-white'}`}>
                  {event.title}
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                {event.completed ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all">
                    <Check size={16} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/40 transition-all hover:border-white/60 hover:text-white">
                    <Circle size={14} />
                  </div>
                )}
              </div>
            </div>

            {durationMinutes > 40 && (event.calories || event.protein) && (
              <div className="mt-2 flex items-center gap-3">
                {event.calories ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-white/30 uppercase tracking-widest">
                    <Flame size={11} className={event.completed ? 'text-white/10' : 'text-orange-500'} />
                    {event.calories}
                  </span>
                ) : null}
                {event.protein ? <span className={`text-[10px] font-black uppercase tracking-widest ${event.completed ? 'text-white/10' : 'text-emerald-500/60'}`}>{event.protein}G PRO</span> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] overflow-hidden border border-white/10 bg-white/[0.02]">
        <div ref={scrollRef} className="h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex">
            {/* Time Axis */}
            <div className="w-16 flex-shrink-0 border-r border-white/5 bg-black/20">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="h-[84px] pr-3 pt-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">
                    {hour % 2 === 0 ? formatAxisLabel(hour) : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Track */}
            <div ref={trackRef} className="relative flex-1" style={{ height: 24 * HOUR_HEIGHT }}>
              {/* Grid */}
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="relative h-[84px] border-b border-white/5">
                  <div className="absolute left-0 right-0 top-1/2 border-t border-white/5 opacity-40" />
                </div>
              ))}

              {/* Now line */}
              {isSameDay(selectedDate, new Date()) && (
                (() => {
                  const now = new Date();
                  const nowMinutes = now.getHours() * 60 + now.getMinutes();
                  const top = nowMinutes * PX_PER_MIN;
                  return (
                    <div className="absolute left-0 right-0 z-30" style={{ top }}>
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-white" />
                      <div className="h-[2px] bg-white/80" />
                    </div>
                  );
                })()
              )}

              {/* Events */}
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {dragGhost && (
        <div
          className="fixed z-[500] pointer-events-none"
          style={{
            left: Math.round(dragGhost.x - dragGhost.width * 0.5),
            top: Math.round(dragGhost.y - 16),
            width: Math.round(dragGhost.width),
          }}
        >
          <div className="rounded-2xl border border-white/20 bg-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{dragGhost.timeLabel}</div>
              <div className="mt-1 text-[13px] font-extrabold text-white truncate">{dragGhost.title}</div>
              <div className="mt-2 text-[10px] text-white/35">Drag to move</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayView;
