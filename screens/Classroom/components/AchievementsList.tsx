import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Award, Lock } from 'lucide-react';
import { ACHIEVEMENTS_DATA } from '../store';

interface AchievementsListProps {
  unlockedIds: Record<string, string>;
  totalLessonsCompleted: number;
}

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  starter: Star,
  consistent: Medal,
  athlete: Trophy,
  scholar: Award,
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  starter: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  consistent: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  athlete: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  scholar: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

export const AchievementsList: React.FC<AchievementsListProps> = ({ unlockedIds, totalLessonsCompleted }) => {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-white">Achievements</h3>
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {Object.keys(unlockedIds).length} / {ACHIEVEMENTS_DATA.length} Unlocked
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
        {ACHIEVEMENTS_DATA.map((achievement, index) => {
          const isUnlocked = !!unlockedIds[achievement.id];
          const Icon = ACHIEVEMENT_ICONS[achievement.id] || Trophy;
          const colorClass = ACHIEVEMENT_COLORS[achievement.id] || 'text-white';
          
          // Calculate progress for locked items
          const progress = Math.min(100, Math.round((totalLessonsCompleted / achievement.threshold) * 100));
          const remaining = Math.max(0, achievement.threshold - totalLessonsCompleted);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex-shrink-0 w-40 p-4 rounded-2xl border snap-center
                flex flex-col items-center text-center gap-3
                transition-all duration-300
                ${isUnlocked 
                  ? 'bg-[#1c1c1e] border-white/10 shadow-lg shadow-black/20' 
                  : 'bg-[#1c1c1e]/50 border-white/5 grayscale opacity-70'
                }
              `}
            >
              {/* Icon Container */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl
                ${isUnlocked ? colorClass : 'bg-white/5 text-white/20 border border-white/5'}
                ${isUnlocked ? 'border' : ''}
              `}>
                {isUnlocked ? <Icon size={24} /> : <Lock size={20} />}
              </div>

              {/* Text Content */}
              <div className="space-y-1 w-full">
                <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                  {achievement.title}
                </h4>
                <p className="text-[10px] leading-tight text-white/40 line-clamp-2 h-8">
                  {achievement.description}
                </p>
              </div>

              {/* Footer: Date or Progress */}
              <div className="w-full pt-2 border-t border-white/5 mt-auto">
                {isUnlocked ? (
                  <span className="text-[10px] font-medium text-emerald-400/80 block">
                    Earned {new Date(unlockedIds[achievement.id]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-white/30 font-medium uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{Math.min(totalLessonsCompleted, achievement.threshold)}/{achievement.threshold}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/20 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Glow Effect for Unlocked */}
              {isUnlocked && (
                <div className={`absolute inset-0 rounded-2xl opacity-10 pointer-events-none ${colorClass.split(' ')[1]}`} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
