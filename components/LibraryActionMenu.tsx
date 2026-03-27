import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Flame, Sliders, ArrowDownAZ, Check, ChevronRight } from 'lucide-react';

type SortOption = 'popular' | 'difficulty' | 'alphabetical';

interface LibraryActionMenuProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onFilterClick?: () => void;
  disabled?: boolean;
}

const LibraryActionMenu: React.FC<LibraryActionMenuProps> = ({
  currentSort,
  onSortChange,
  onFilterClick,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sortOptions: Array<{ key: SortOption; label: string; icon: any; description: string }> = [
    { key: 'popular', label: 'Most Popular', icon: Flame, description: 'Trending exercises' },
    { key: 'difficulty', label: 'By Difficulty', icon: Sliders, description: 'Beginner to Advanced' },
    { key: 'alphabetical', label: 'Alphabetical', icon: ArrowDownAZ, description: 'A to Z listing' },
  ];

  const currentOption = sortOptions.find(opt => opt.key === currentSort) || sortOptions[0];
  const ActiveIcon = currentOption.icon;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all press-scale border ${disabled ? 'opacity-50 grayscale' : ''} ${isOpen ? 'bg-white border-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
        aria-label="Open filter and sort menu"
      >
        <ActiveIcon size={20} strokeWidth={isOpen ? 2.5 : 2} className={isOpen ? 'text-black' : 'text-white'} />
      </button>

      {isOpen && createPortal(
        <>
          <div 

            className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 

            onClick={() => setIsOpen(false)} 

          />
          <div
            ref={menuRef}
            style={{ 

              top: menuPosition.top, 

              right: menuPosition.right 

            }}
            className="fixed w-[280px] bg-[#0A0A0A] border border-white/10 rounded-[38px] shadow-3xl z-[1000] p-3 animate-in zoom-in-95 slide-in-from-top-4 duration-500 cubic-bezier(0.16, 1, 0.3, 1) backdrop-blur-2xl"
          >
            <div className="px-5 py-4 border-b border-white/[0.12] mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Sort Library By</p>
            </div>
            
            <div className="space-y-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    onSortChange(opt.key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-[24px] transition-all group hover:bg-white/[0.08] ${currentSort === opt.key ? 'bg-white/[0.04]' : ''}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${currentSort === opt.key ? 'bg-white border-white text-black shadow-[0_0_25px_rgba(255,255,255,0.25)]' : 'bg-white/5 border-white/10 text-white/50 group-hover:text-white group-hover:border-white/20'}`}>
                    <opt.icon size={18} strokeWidth={currentSort === opt.key ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-[14px] font-black transition-colors ${currentSort === opt.key ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                      {opt.label}
                    </p>
                    <p className={`text-[11px] font-medium transition-colors ${currentSort === opt.key ? 'text-white/60' : 'text-white/40 group-hover:text-white/60'}`}>
                      {opt.description}
                    </p>
                  </div>
                  {currentSort === opt.key && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <Check size={12} className="text-black" strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-white/[0.12]">
              <button
                onClick={() => {
                  onFilterClick?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 rounded-[24px] hover:bg-white/[0.08] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/25 group-hover:border-blue-500/50 transition-all shadow-inner shadow-blue-500/10">
                    <Filter size={18} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-black text-white/90 group-hover:text-white">Advanced Filters</p>
                    <p className="text-[11px] font-medium text-white/40 group-hover:text-white/60">Refine by muscle, equipment</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default LibraryActionMenu;
