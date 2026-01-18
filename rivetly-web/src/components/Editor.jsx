import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { generateFinalPrompt } from '../utils/adapter-engine';
import { processRulesOutput, handleDownload, handleExport, PLATFORMS } from '../utils/platformManager';

function Editor({ mode, selectedIds, customConstraints, locale, showToast }) {
    const [activePlatform, setActivePlatform] = useState('CURSOR');
    const [copied, setCopied] = useState(false);

    // Use useMemo for declarative rule generation
    const previewContent = React.useMemo(() => {
        return generateFinalPrompt({
            mode,
            selectedIds,
            customConstraints,
            platform: activePlatform.toLowerCase(),
            locale
        });
    }, [mode, selectedIds, customConstraints, activePlatform, locale]);

    const handleCopy = () => {
        const vscode = getVsCodeApi();

        if (vscode) {
            vscode.postMessage({ 
                command: 'updateRules',  
                content: previewContent, 
                fileName: currentPlatform.file 
            });
            return;
        }

        // 使用新的 handleExport 逻辑
        handleExport(activePlatform, { mode, selectedIds, locale }, previewContent, showToast);
        
        setCopied(false); // Reset first to ensure transition if already true
        setTimeout(() => setCopied(true), 10);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentPlatform = PLATFORMS[activePlatform];

    return (
        <div className="w-full h-full flex flex-col bg-[#0d0d0f]">
            {/* Tabs (Compact 5-Platform Layout) */}
            <div className="pt-6 pb-4 px-8">
                <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 gap-1 w-fit">
                    {Object.values(PLATFORMS).map((p) => {
                        const isActive = activePlatform === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setActivePlatform(p.id)}
                                className={`
                                    flex items-center justify-center px-4 py-2 rounded-lg transition-all
                                    ${isActive 
                                        ? 'bg-orange-500/10 border border-orange-500/20 shadow-sm text-orange-500' 
                                        : 'hover:bg-slate-800/40 border border-transparent text-slate-500 hover:text-slate-300'}
                                `}
                            >
                                <span className="text-[11px] font-bold tracking-tight">
                                    {p.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Editor Box */}
            <div className="flex-1 bg-slate-950 border-t border-slate-800 flex flex-col relative">
                {/* Integrated Window Header */}
                <div className="h-12 shrink-0 bg-slate-900/40 px-8 flex items-center justify-between border-b border-slate-800/50">
                    {/* Left: Window Controls + Filename */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mr-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/20" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            {currentPlatform.file}
                        </span>
                    </div>

                    {/* Right: Actions Group */}
                    <div className="flex items-center gap-2">
                        {/* Download Button */}
                        <button
                            onClick={() => {
                                handleDownload(previewContent, { mode, selectedIds, locale }, activePlatform, showToast);
                            }}
                            className="flex items-center justify-center gap-1.5 h-7 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title={locale === 'zh' ? '下载文件' : 'Download File'}
                        >
                            <Icons.Download size={13} className="shrink-0" />
                            <span className="text-[11px] font-bold leading-none">{locale === 'zh' ? '下载' : 'Export'}</span>
                        </button>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-1.5 h-7 px-3 rounded-md bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/10 transition-all active:scale-95"
                        >
                            {copied ? <Icons.Check size={13} className="shrink-0" /> : <Icons.Copy size={13} className="shrink-0" />}
                            <span className="text-[11px] font-bold leading-none">
                                {copied ? (locale === 'zh' ? '已复制' : 'Copied') : (locale === 'zh' ? '复制' : 'Copy')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div key={`${mode}-${activePlatform}`} className="flex-1 overflow-auto px-8 py-6 font-mono text-sm text-slate-300 animate-preview no-scrollbar">
                    <pre><code className="whitespace-pre-wrap">{previewContent}</code></pre>
                </div>
            </div>
        </div>
    );
}

export default Editor;
