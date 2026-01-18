import React from 'react';
import { Globe } from 'lucide-react';

export default function LanguagePicker({ locale, setLocale }) {
    return (
        <div className="flex items-center gap-3 mr-4 border-r border-slate-800 pr-4">
            <Globe size={14} className="text-slate-500" />

            {/* 容器：相对定位 */}
            <div className="bg-slate-800/80 rounded-lg flex relative h-8 w-28 p-1 border border-slate-700/50">

                {/* 滑块：绝对定位，宽度刚好是父容器内部的一半 */}
                <div
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-slate-600 rounded-md transition-transform duration-300 ease-in-out ${locale === 'zh' ? 'translate-x-full' : 'translate-x-0'
                        }`}
                />

                {/* 按钮 1 */}
                <button
                    onClick={() => setLocale('en')}
                    className={`flex-1 relative z-10 text-[11px] font-bold transition-colors ${locale === 'en' ? 'text-white' : 'text-slate-500'
                        }`}
                >
                    EN
                </button>

                {/* 按钮 2 */}
                <button
                    onClick={() => setLocale('zh')}
                    className={`flex-1 relative z-10 text-[11px] font-bold transition-colors ${locale === 'zh' ? 'text-white' : 'text-slate-500'
                        }`}
                >
                    中文
                </button>
            </div>
        </div>
    );
}
