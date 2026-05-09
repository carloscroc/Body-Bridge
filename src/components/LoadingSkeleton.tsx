import { cn } from "../lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "default" | "circle" | "text";
}

function LoadingSkeleton({ className, variant = "default" }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-white/10 rounded",
        variant === "circle" && "rounded-full",
        variant === "text" && "h-4 w-3/4",
        className
      )}
    />
  );
}

// Pre-built skeleton components for common patterns

export function CardSkeleton() {
  return (
    <div className="relative h-[280px] md:h-[400px] rounded-[56px] overflow-hidden border border-white/10">
      <LoadingSkeleton className="w-full h-full" />
      <div className="absolute top-8 left-8">
        <LoadingSkeleton className="w-32 h-8 rounded-full" />
      </div>
      <div className="absolute bottom-12 md:bottom-16 left-10 right-10">
        <LoadingSkeleton className="h-10 w-3/4 mb-4" />
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-12 w-32 rounded-full" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function MealCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[240px] aspect-[3/4] rounded-[44px] overflow-hidden border border-white/10">
      <LoadingSkeleton className="w-full h-full" />
      <div className="absolute bottom-8 left-8 right-8">
        <LoadingSkeleton className="h-6 w-full mb-2" />
        <LoadingSkeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  const timeSlots = ['6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '1:00'];
  const eventSlots = ['event-1', 'event-2', 'event-3'];
  
  return (
    <div className="h-[600px] rounded-[40px] border border-white/10 p-4">
      <div className="flex gap-4">
        <div className="w-16 flex flex-col justify-between py-4">
          {timeSlots.map((time) => (
            <LoadingSkeleton key={`time-${time}`} className="h-4 w-12" />
          ))}
        </div>
        <div className="flex-1 relative">
          {eventSlots.map((eventId) => (
            <div
              key={eventId}
              className="absolute left-0 right-0 h-16 rounded-lg border border-white/10"
              style={{ top: `${eventSlots.indexOf(eventId) * 25}%` }}
            >
              <LoadingSkeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StreakCounterSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <LoadingSkeleton variant="circle" className="w-12 h-12" />
      <div className="flex flex-col">
        <LoadingSkeleton className="h-8 w-16 mb-1" />
        <LoadingSkeleton className="h-4 w-24" />
      </div>
    </div>
  );
}