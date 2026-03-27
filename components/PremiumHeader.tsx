import React from 'react';
import UnifiedNavMenu from './UnifiedNavMenu';
import { Settings as SettingsIcon } from 'lucide-react';

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  userName?: string;
  userAvatar?: string;
  onNavigateToToday?: () => void;
  onNavigateToWorkouts?: () => void;
  onNavigateToMeals?: () => void;
  onNavigateToExercises?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToCalendar?: () => void;
  onOpenNotifications?: () => void;
}

const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = "",
  userName,
  userAvatar,
  onNavigateToToday,
  onNavigateToWorkouts,
  onNavigateToMeals,
  onNavigateToExercises,
  onNavigateToCommunity,
  onNavigateToSettings,
  onNavigateToCalendar,
  onOpenNotifications,
}) => {
  return (
    <div className={`flex justify-between items-start mb-10 animate-silk-up ${className}`}>
      <div className="flex flex-col text-left">
        {subtitle && (
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">
            {subtitle}
          </p>
        )}
        <h1 className="editorial-title text-4xl text-white italic leading-tight tracking-tighter">
          {title}
        </h1>
      </div>
      <div className="flex gap-2 mt-2 items-center">
        {onNavigateToSettings && (
          <button
            type="button"
            onClick={() => {
              try {
                onNavigateToSettings?.();
                try { console.log('[DEV DEBUG] PremiumHeader clicked - onNavigateToSettings called'); } catch (e) {}
              } catch (e) {
                // ignore
              }
              // Broadcast app navigation event as fallback for other listeners
              try { window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: '/settings' } })); } catch (e) {}
            }}
            className="w-11 h-11 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center press-scale"
            aria-label="Open settings"
            title="Settings"
          >
            <SettingsIcon size={18} className="text-white/60" />
          </button>
        )}
        {actions}
      </div>
    </div>
  );
};

export default PremiumHeader;
