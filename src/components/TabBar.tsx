
import React from 'react';
import { Tab } from '../types';
import { TABS } from '../constants';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 pb-4 bg-black/60 blur-surface flex items-center justify-around px-6 z-[100] border-t border-white/[0.03]">
      <div className="flex items-center justify-around w-full max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center transition-all duration-300 ease-out active:scale-90 ${
                isActive
                  ? 'backdrop-blur-sm bg-white/90 h-11 px-5 rounded-full text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                  : 'text-zinc-700 p-3'
              }`}
            >
              <div className={`${isActive ? 'scale-90' : 'scale-110'} transition-transform duration-200`}>
                {React.cloneElement(tab.icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { 
                  size: isActive ? 18 : 22, 
                  strokeWidth: isActive ? 2.5 : 2 
                })}
              </div>
               {isActive && (
                 <span className="ml-2.5 text-[10px] font-black uppercase tracking-widest">
                   {tab.id}
                 </span>
               )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
