import { motion } from "framer-motion";
import { Calendar, Clock, Flame, Trophy } from "lucide-react";
import { cn } from "../lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  type: "workout" | "nutrition" | "recovery" | "other";
  startTime: string;
  endTime: string;
  completed: boolean;
}

interface PremiumTimelineProps {
  events: TimelineEvent[];
  selectedDate: Date;
  className?: string;
}

const timeSlots = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
];

const typeColors = {
  workout: "bg-gradient-to-r from-orange-500 to-red-500",
  nutrition: "bg-gradient-to-r from-green-500 to-emerald-500",
  recovery: "bg-gradient-to-r from-blue-500 to-cyan-500",
  other: "bg-gradient-to-r from-purple-500 to-pink-500"
};

const typeIcons = {
  workout: Flame,
  nutrition: Calendar,
  recovery: Clock,
  other: Trophy
};

export default function PremiumTimeline({ events, selectedDate, className }: PremiumTimelineProps) {
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 6 * 60; // 6 AM
    const endMinutes = 22 * 60; // 10 PM
    const rangeMinutes = endMinutes - startMinutes;
    return ((totalMinutes - startMinutes) / rangeMinutes) * 100;
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const getEventPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 6 * 60;
    const endMinutes = 22 * 60;
    const rangeMinutes = endMinutes - startMinutes;
    return ((totalMinutes - startMinutes) / rangeMinutes) * 100;
  };

  const getEventHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const timelineStartMinutes = 6 * 60;
    const timelineEndMinutes = 22 * 60;
    const rangeMinutes = timelineEndMinutes - timelineStartMinutes;
    return (durationMinutes / rangeMinutes) * 100;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Time labels */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-4">
        {timeSlots.map((time) => (
          <div key={time} className="text-xs text-gray-400 font-medium">
            {time}
          </div>
        ))}
      </div>

      {/* Timeline content */}
      <div className="ml-16 relative h-full">
        {/* Current time indicator */}
        {isToday() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 z-10"
            style={{ top: `${getCurrentTimePosition()}%` }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <div className="flex-1 h-px bg-orange-500" />
            </div>
          </motion.div>
        )}

        {/* Event cards */}
        {events.map((event, index) => {
          const Icon = typeIcons[event.type];
          const top = getEventPosition(event.startTime);
          const height = getEventHeight(event.startTime, event.endTime);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="absolute left-0 right-0"
              style={{ top: `${top}%`, height: `${Math.max(height, 8)}%` }}
            >
              <div
                className={cn(
                  "h-full rounded-lg p-3 shadow-lg border border-white/10",
                  typeColors[event.type],
                  event.completed && "opacity-60"
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {event.title}
                    </h4>
                    <p className="text-xs text-white/80">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                  {event.completed && (
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty state */}
        {events.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No events scheduled</p>
              <p className="text-xs text-gray-600 mt-1">Tap + to add your first event</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}