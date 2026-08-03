import React, { useState, useEffect, useRef } from 'react';
import { Menu, Calendar, Dumbbell, Utensils, Users, ChevronRight, CheckCircle } from 'lucide-react';

interface UnifiedNavMenuProps {
  onNavigateToToday?: () => void;
  onNavigateToWorkouts?: () => void;
  onNavigateToMeals?: () => void;
  onNavigateToExercises?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToCalendar?: () => void;
  onOpenNotifications?: () => void;
  userName?: string;
  userAvatar?: string;
}

const UnifiedNavMenu: React.FC<UnifiedNavMenuProps> = ({
  onNavigateToToday,
  onNavigateToWorkouts,
  onNavigateToMeals,
  onNavigateToExercises,
  onNavigateToCommunity,
  onNavigateToSettings,
  onNavigateToCalendar,
  onOpenNotifications,
  userName = 'Member',
  userAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    { icon: Calendar, label: "Today's Plan", onClick: onNavigateToToday, subtitle: 'View your daily plan' },
    { icon: Dumbbell, label: 'My Workouts', onClick: onNavigateToWorkouts, subtitle: 'Workout library' },
    { icon: Utensils, label: 'My Meals', onClick: onNavigateToMeals, subtitle: 'Nutrition plan' },
    { icon: Users, label: 'Community', onClick: onNavigateToCommunity, subtitle: 'Connect with others' },
  ];

  return (
    <>
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center press-scale hover:bg-white/10 transition-all"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Menu size={18} className="text-white/60" strokeWidth={2.5} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div
            ref={menuRef}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[280px] bg-[#050505] z-50 border-l border-white/[0.03] shadow-3xl animate-in slide-in-from-right duration-300 ease-out"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-6 border-b border-white/[0.05]">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/30 mb-3">Welcome back</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-900 flex-shrink-0">
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-black text-white truncate uppercase tracking-tight">{userName}</h3>
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider truncate">Member Account</p>
                  </div>
                </div>
              </div>

              {/* Menu Content - Just Quick Actions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {menuItems.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      }
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.02] transition-colors text-left group press-scale"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-white/40 group-hover:text-white/60 transition-colors" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-white group-hover:text-white/80 transition-colors truncate">
                        {item.label}
                      </p>
                      {item.subtitle && (
                        <p className="text-[10px] font-medium text-white/30 truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/[0.05]">
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} className="text-green-400" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white">Forge Engine v4.2.1-stable</p>
                      <p className="text-[8px] font-bold text-white/30 uppercase tracking-wider">Terminal B0-7A-5A-D2</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UnifiedNavMenu;
