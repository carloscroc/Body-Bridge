import React from 'react';
import { UserProgress } from '../types';
import { Trophy, Star } from 'lucide-react';

interface ProfileHeaderProps {
  progress: UserProgress;
  nextLevelProgress: number; // 0 to 1
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ progress, nextLevelProgress }) => {
  // Calculate XP needed for next level (assuming 500 XP per level based on the prompt "340/500 XP")
  const xpPerLevel = 500;
  const currentLevelXp = progress.xp % xpPerLevel;
  const xpToNextLevel = xpPerLevel - currentLevelXp;

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[#0B0B0C] border border-white/[0.08] p-6 animate-silk-up">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center gap-6">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-[3px] border-white/[0.1] p-1">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center overflow-hidden">
               {/* Placeholder Avatar */}
               <span className="text-2xl font-bold text-white/20">YOU</span>
            </div>
          </div>
          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-[3px] border-[#0B0B0C] shadow-lg">
            <span className="text-[10px] font-black text-black">{progress.level}</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-white tracking-tight">You</h2>
            <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-wider">
              Level {progress.level} Elite
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-zinc-400">
                <span className="text-white">{currentLevelXp}</span>
                <span className="text-zinc-600">/</span>
                {xpPerLevel} XP
              </span>
              <span className="text-blue-400">{xpToNextLevel} XP to Level {progress.level + 1}</span>
            </div>
            
            <div className="h-3 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-white/[0.05]">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${nextLevelProgress * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
