import { PlanItem, Workout, Meal } from '../../types';

export type ViewType = 'list' | 'day' | '3days' | 'week' | 'month';

export type EventType = 'workout' | 'meal';

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  time: string;
  duration?: string;
  calories?: number;
  protein?: number;
  completed: boolean;
  data: Workout | Meal;
  date: string;
  slot?: string;
  intensity?: 'Easy' | 'Medium' | 'Hard';
  image?: string;
  tags?: string[];
  notes?: string;
}

export function generateCalendarEvents(planItems: PlanItem[]): CalendarEvent[] {
  return planItems.map(item => {
    const slot = item.mealType || 'morning';
    const baseEvent: CalendarEvent = {
      id: item.id,
      type: item.type as EventType,
      title: (item.item as any).title,
      time: item.scheduledTime || getDefaultTime(item.type, slot),
      completed: item.completed,
      data: item.item as Workout | Meal,
      date: item.scheduledDate,
      slot: slot,
      notes: item.notes,
    };

    if (item.type === 'workout') {
      const workout = item.item as Workout;
      return {
        ...baseEvent,
        duration: workout.duration,
        calories: workout.kcal,
        intensity: workout.intensity,
        image: workout.image,
      };
    } else {
      const meal = item.item as Meal;
      return {
        ...baseEvent,
        calories: meal.calories,
        protein: meal.protein,
        image: meal.image,
        tags: meal.tags,
      };
    }
  }).sort((a, b) => a.time.localeCompare(b.time));
}

function getDefaultTime(type: string, slot?: string): string {
  if (type === 'workout') {
    switch (slot) {
      case 'morning': return '05:00';
      case 'afternoon': return '12:00';
      case 'evening': return '17:00';
      default: return '09:00';
    }
  } else {
    switch (slot) {
      case 'breakfast': return '07:00';
      case 'lunch': return '12:00';
      case 'dinner': return '18:00';
      case 'snack': return '15:00';
      default: return '12:00';
    }
  }
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getEventColor(type: EventType, intensity?: string): string {
  if (type === 'workout') {
    switch (intensity) {
      case 'Hard': return 'border-l-red-500 bg-red-500/5';
      case 'Medium': return 'border-l-orange-500 bg-orange-500/5';
      case 'Low': return 'border-l-green-500 bg-green-500/5';
      default: return 'border-l-blue-500 bg-blue-500/5';
    }
  } else {
    return 'border-l-emerald-500 bg-emerald-500/5';
  }
}

export function getEventGlow(type: EventType, intensity?: string): string {
  if (type === 'workout') {
    switch (intensity) {
      case 'Hard': return 'shadow-[0_0_20px_rgba(239,68,68,0.1)]';
      case 'Medium': return 'shadow-[0_0_20px_rgba(249,115,22,0.1)]';
      case 'Low': return 'shadow-[0_0_20px_rgba(34,197,94,0.1)]';
      default: return 'shadow-[0_0_20px_rgba(59,130,246,0.1)]';
    }
  } else {
    return 'shadow-[0_0_20px_rgba(16,185,129,0.1)]';
  }
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  
  events.forEach(event => {
    const existing = grouped.get(event.date) || [];
    existing.push(event);
    grouped.set(event.date, existing);
  });
  
  return grouped;
}

export function groupEventsByTimeBlock(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  
  events.forEach(event => {
    const hour = parseInt(event.time.split(':')[0]);
    let block: string;
    
    if (hour >= 5 && hour < 12) block = 'morning';
    else if (hour >= 12 && hour < 17) block = 'afternoon';
    else if (hour >= 17 && hour < 22) block = 'evening';
    else block = 'night';
    
    const existing = grouped.get(block) || [];
    existing.push(event);
    grouped.set(block, existing);
  });
  
  return grouped;
}

export const timeBlockLabels: Record<string, { label: string; icon: string; color: string }> = {
  morning: { 
    label: 'Morning Block', 
    icon: '🌅',
    color: 'text-amber-400'
  },
  afternoon: { 
    label: 'Afternoon Block', 
    icon: '🌞',
    color: 'text-orange-400'
  },
  evening: { 
    label: 'Evening Block', 
    icon: '🌆',
    color: 'text-purple-400'
  },
  night: { 
    label: 'Night Block', 
    icon: '🌙',
    color: 'text-blue-400'
  },
};

export function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add padding days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() - i - 1);
    days.push(d);
  }
  
  // Add all days in month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add padding days from next month to complete grid
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(lastDay);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  
  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
