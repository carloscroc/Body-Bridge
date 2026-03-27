import React from 'react';
import { X, Calendar } from 'lucide-react';

interface PlanningBannerProps {
  dateStr: string;
  type: 'workout' | 'meal';
  onCancel: () => void;
}

const PlanningBanner: React.FC<PlanningBannerProps> = ({
  dateStr,
  type,
  onCancel,
}) => {
  const colors = type === 'workout'
    ? {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-200',
        icon: 'text-blue-300',
        badge: 'bg-blue-500/20',
      }
    : {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-200',
        icon: 'text-emerald-300',
        badge: 'bg-emerald-500/20',
      };

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-3xl p-5 mb-6 animate-silk-up`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${colors.badge} flex items-center justify-center border ${colors.border}`}>
            <Calendar size={22} className={colors.icon} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                Planning {type} for
              </span>
              <div className={`px-3 py-1 rounded-full ${colors.badge} ${colors.border} ${colors.text}`}>
                <span className="text-[11px] font-black uppercase tracking-widest">
                  {dateStr}
                </span>
              </div>
            </div>
            <p className={`text-[12px] ${colors.text} mt-0.5`}>
              Tap any item to add to your plan
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-5 h-12 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 press-scale transition-all group"
        >
          <X size={18} className="text-white/60 group-hover:text-white" />
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider group-hover:text-white hidden sm:block">
            Cancel
          </span>
        </button>
      </div>
    </div>
  );
};

export default PlanningBanner;
