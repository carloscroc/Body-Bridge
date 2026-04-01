import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Award, Zap, Star } from "lucide-react";
import { cn } from "../lib/utils";

interface PremiumStreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  onMilestone?: (milestone: number) => void;
  className?: string;
}

const milestones = [
  { days: 7, icon: Flame, color: "from-orange-500 to-red-500", label: "Week Warrior" },
  { days: 14, icon: Trophy, color: "from-yellow-500 to-amber-500", label: "Two Week Titan" },
  { days: 30, icon: Award, color: "from-purple-500 to-pink-500", label: "Monthly Master" },
  { days: 60, icon: Zap, color: "from-blue-500 to-cyan-500", label: "Double Dynamo" },
  { days: 90, icon: Star, color: "from-emerald-500 to-green-500", label: "Quarter Champion" },
];

export default function PremiumStreakCounter({
  currentStreak,
  longestStreak,
  onMilestone,
  className,
}: PremiumStreakCounterProps) {
  const getNextMilestone = () => {
    return milestones.find((m) => m.days > currentStreak) || null;
  };

  const getPreviousMilestone = () => {
    return [...milestones].reverse().find((m) => m.days <= currentStreak) || null;
  };

  const getProgressToNextMilestone = () => {
    const next = getNextMilestone();
    const prev = getPreviousMilestone();
    if (!next || !prev) return 0;
    const range = next.days - prev.days;
    const progress = currentStreak - prev.days;
    return Math.min((progress / range) * 100, 100);
  };

  const nextMilestone = getNextMilestone();
  const previousMilestone = getPreviousMilestone();
  const progress = getProgressToNextMilestone();

  return (
    <div className={cn("relative", className)}>
      {/* Main streak display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-3"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
          <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Flame size={24} className="text-white" />
          </div>
        </motion.div>

        <div className="flex flex-col">
          <span className="text-[32px] font-black leading-none tracking-tighter text-white">
            {currentStreak}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            {currentStreak === 1 ? "day" : "days"} in a row
          </span>
        </div>

        {longestStreak > 0 && (
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[12px] font-bold text-white/40">Best</span>
            <span className="text-[16px] font-black text-white/60">{longestStreak}</span>
          </div>
        )}
      </motion.div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Next: {nextMilestone.label}
            </span>
            <span className="text-[10px] font-bold text-white/60">
              {nextMilestone.days - currentStreak} days to go
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={cn(
                "h-full rounded-full",
                `bg-gradient-to-r ${nextMilestone.color}`
              )}
            />
          </div>
        </motion.div>
      )}

      {/* Milestone celebration */}
      <AnimatePresence>
        {previousMilestone && currentStreak === previousMilestone.days && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-10"
          >
            <div
              className={cn(
                "px-4 py-2 rounded-full bg-gradient-to-r shadow-2xl border border-white/20 flex items-center gap-2"
              )}
            >
              <previousMilestone.icon size={16} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                {previousMilestone.label}!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone badges */}
      <div className="mt-4 flex gap-2">
        {milestones.map((milestone) => {
          const MilestoneIcon = milestone.icon;
          const achieved = currentStreak >= milestone.days;
          const isNext = nextMilestone?.days === milestone.days;

          return (
            <motion.div
              key={milestone.days}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: milestone.days * 0.05 }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                achieved
                  ? `bg-gradient-to-br ${milestone.color} border-white/30 shadow-lg`
                  : isNext
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-white/10 opacity-40"
              )}
            >
              <MilestoneIcon
                size={14}
                className={cn(
                  achieved ? "text-white" : "text-white/40"
                )}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}