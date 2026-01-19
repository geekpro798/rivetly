import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { handleDownload, handleExport, PLATFORMS } from '../utils/platformManager';
import { getVsCodeApi } from '../utils/vscode';

function Editor({ 
    mode, 
    selectedIds, 
    locale, 
    showToast,
    // Sync Props
    activePlatform,
    setActivePlatform,
    previewContent,
    isFileExist,
    isDifferent,
    currentPlatform
}) {
    const [copied, setCopied] = useState(false);

    const handleAction = (type, content, fileName) => {
        const vscode = getVsCodeApi();

        if (vscode) {
            switch (type) {
                case 'copy':
                    vscode.postMessage({ command: 'copyText', text: content });
                    break;
                case 'download':
                    vscode.postMessage({ command: 'saveFile', text: content, fileName: fileName });
                    break;
                case 'sync':
                    vscode.postMessage({ command: 'syncToRoot', text: content, fileName: fileName });
                    break;
                default:
                    console.warn('Unknown action type:', type);
            }
            return;
        }

        // Fallback for browser environment
        switch (type) {
            case 'copy':
                handleExport(activePlatform, { mode, selectedIds, locale }, content, showToast);
                setCopied(false);
                setTimeout(() => setCopied(true), 10);
                setTimeout(() => setCopied(false), 2000);
                break;
            case 'download':
                handleDownload(content, { mode, selectedIds, locale }, activePlatform, showToast);
                break;
            case 'sync':
                showToast(locale === 'zh' ? '浏览器环境不支持同步' : 'Sync not supported in browser', 'error');
                break;
        }
    };

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
            <div className="flex-1 bg-slate-950 border-t border-slate-800 flex flex-col relative preview-container">
                {/* 顶部工具条：文件名 + 操作按钮 */}
                <div className="preview-toolbar">
                    <span className="file-label">{currentPlatform.file}</span>

                    <div className="action-group">
                        {/* 核心同步按钮：根据状态切换 橙色(Sync)/蓝色(Update)/灰色(Synced) */}
                        <button
                            className={`compact-sync-btn ${!isFileExist ? 'orange' : isDifferent ? 'blue' : 'gray'}`}
                            onClick={() => handleAction('sync', previewContent, currentPlatform.file)}
                            disabled={isFileExist && !isDifferent}
                        >
                            {!isFileExist ? (
                                <>
                                    <Icons.Zap size={14} className="shrink-0" />
                                    <span>{locale === 'zh' ? '同步' : 'Sync'}</span>
                                </>
                            ) : isDifferent ? (
                                <>
                                    <Icons.RefreshCw size={14} className="shrink-0 spin-icon" />
                                    <span>{locale === 'zh' ? '更新' : 'Update'}</span>
                                </>
                            ) : (
                                <>
                                    <Icons.Check size={14} className="shrink-0 text-[#4ec9b0]" />
                                    <span>{locale === 'zh' ? '已同步' : 'Synced'}</span>
                                </>
                            )}
                        </button>

                        {/* 导出按钮 (添加 Export 按钮以保持功能完整性，使用 secondary 样式) */}
                        <button
                            className="secondary-icon-btn"
                            onClick={() => handleAction('download', previewContent, currentPlatform.file)}
                            title={locale === 'zh' ? '下载文件' : 'Download File'}
                        >
                            <Icons.Download size={14} className="shrink-0" />
                        </button>

                        {/* 复制按钮：不强调，次级样式 */}
                        <button
                            className="secondary-icon-btn"
                            onClick={() => handleAction('copy', previewContent, currentPlatform.file)}
                            title={locale === 'zh' ? '复制' : 'Copy Code'}
                        >
                            {copied ? <Icons.Check size={14} className="shrink-0" /> : <Icons.Copy size={14} className="shrink-0" />}
                        </button>
                    </div>
                </div>

                {/* 代码预览区域 */}
                <div key={`${mode}-${activePlatform}`} className="code-view animate-preview no-scrollbar">
                    <pre><code className="whitespace-pre-wrap">{previewContent}</code></pre>
                </div>
            </div>
        </div>
    );
}

export default Editor;