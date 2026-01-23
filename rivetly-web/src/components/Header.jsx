import React from 'react';
import logoUrl from '../assets/logo.svg';
import { isWebview } from '../utils/vscode';

export default function Header({ locale, setLocale }) {
    // Check if in VS Code environment using the utility
    const isVsCode = isWebview;

    return (
        <header className={`
            flex-shrink-0 w-full flex items-center px-4 border-b border-slate-800 bg-[#0a0a0c] z-30
            ${isVsCode ? 'h-10' : 'h-[56px]'} 
        `}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <img src={logoUrl} className={`${isVsCode ? 'w-4 h-4' : 'w-5 h-5'}`} alt="Rivetly" />
                    {!isVsCode && (
                        <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase">RIVETLY</span>
                    )}
                </div>

                {/* 语言切换紧跟标题 */}
                <div className="flex items-center bg-slate-800/40 rounded p-0.5 border border-slate-700/50">
                    <button 
                        onClick={() => setLocale('en')} 
                        className={`px-2 py-0.5 text-[10px] rounded transition-all ${locale === 'en' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => setLocale('zh')} 
                        className={`px-2 py-0.5 text-[10px] rounded transition-all ${locale === 'zh' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        中文
                    </button>
                </div>
            </div>
        </header>
    );
}
