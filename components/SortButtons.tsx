import React from 'react';
import { Flame, Sliders, ArrowDownAZ } from 'lucide-react';

type SortOption = 'popular' | 'difficulty' | 'alphabetical';

interface SortButtonsProps {
  currentSort: SortOption;
  onChange: (sort: SortOption) => void;
  disabled?: boolean;
}

const SortButtons: React.FC<SortButtonsProps> = ({
  currentSort,
  onChange,
  disabled = false
}) => {
  const items: Array<{ key: SortOption; Icon: React.ElementType }> = [
    { key: 'popular', Icon: Flame },
    { key: 'difficulty', Icon: Sliders },
    { key: 'alphabetical', Icon: ArrowDownAZ }
  ];

  return (
    <div className="flex items-center gap-2" aria-label="Sort options">
      {items.map(({ key, Icon }) => {
        const isActive = currentSort === key;
        const btnBase = 'flex items-center justify-center transition-all duration-300';
        const activeClasses = 'bg-white h-11 px-5 rounded-full text-black';
        const inactiveClasses = 'text-zinc-700 p-3';
        const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
        const className = `${btnBase} ${isActive ? activeClasses : inactiveClasses} ${disabledClasses}`;

        const handleClick = () => {
          if (!disabled) onChange(key);
        };

        const title = disabled ? 'Sort not available during search' : undefined;
        const IconSize = isActive ? 18 : 22;
        const IconStroke = isActive ? 2.5 : 2;
        const iconElement = React.createElement(Icon, { size: IconSize, strokeWidth: IconStroke });

        return (
          <button
            type="button"
            key={key}
            onClick={handleClick}
            className={className}
            title={title}
            aria-pressed={isActive}
            aria-label={`Sort by ${key}`}
            disabled={disabled}
          >
            {iconElement}
          </button>
        );
      })}
    </div>
  );
};

export default SortButtons;
