import React from 'react';
import { Zap, Shield, RotateCcw } from 'lucide-react';

export default function ModeSwitcher({ activeMode, setMode, locale }) {
  const modes = [
    { id: 'feature', label: { zh: '功能开发', en: 'Feature' }, icon: Zap },
    { id: 'testing', label: { zh: '测试模式', en: 'Test' }, icon: Shield },
    { id: 'refactor', label: { zh: '重构模式', en: 'Refactor' }, icon: RotateCcw }
  ];

  return (
    <div className="px-6 py-4 border-b border-slate-800">
      <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 py-2 gap-1
                rounded-lg transition-all duration-200 group
                ${isActive
                  ? 'bg-orange-500 shadow-lg shadow-orange-500/20 text-slate-950'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}
              `}
            >
              <Icon size={14} className={isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-slate-400'} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-slate-950' : 'text-slate-500'}`}>
                {mode.label?.[locale] || mode.label?.en || mode.id}
              </span>
              
              {/* 激活时的微光动效 */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
