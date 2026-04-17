import React from 'react';

interface PremiumSectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
}

const PremiumSectionHeader: React.FC<PremiumSectionHeaderProps> = ({ 
  title, 
  rightElement,
  className = "",
  variant = 'default'
}) => {
  const textColor = variant === 'muted' ? 'text-white/20' : 'text-white/30';
  
  return (
    <div className={`flex justify-between items-center mb-6 px-1 ${className}`}>
      <div className="flex flex-col text-left">
        <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${textColor}`}>
          {title}
        </h2>
      </div>
      {rightElement && (
        <div className="flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default PremiumSectionHeader;
