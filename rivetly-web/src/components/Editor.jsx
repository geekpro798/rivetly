import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { handleDownload, handleExport, PLATFORMS } from '../utils/platformManager';
import { getVsCodeApi } from '../utils/vscode';
import { syncToCloud } from '../utils/cloudSync';
import { smartSync, smartLoad } from '../utils/dataGateway';
import { supabase } from '../utils/supabaseClient';

// 新增：IDE 上下文展示组件
const IdeContextPanel = ({ ideContext, locale }) => {
    if (!ideContext) return null;

    return (
        <div className="mx-4 mt-2 p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <span className="flex items-center gap-1">
                    <Icons.FileCode size={12} /> {locale === 'zh' ? '当前上下文' : 'Active Context'}
                </span>
                <span className="text-orange-500/80">● Live</span>
            </div>
            
            {/* 文件名路径 */}
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                <Icons.FolderOpen size={12} className="text-blue-400" />
                <span className="truncate font-mono">{ideContext.fileName || 'No file active'}</span>
            </div>

            {/* 报错快照 (如果有) */}
            {ideContext.lastError && (
                <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 flex gap-2 italic">
                    <Icons.AlertCircle size={12} className="shrink-0" />
                    <span className="truncate">{ideContext.lastError}</span>
                </div>
            )}
        </div>
    );
};

function Editor({ 
    mode, 
    selectedIds, 
    locale, 
    showToast,
    customConstraints,
    user,
    // Sync Props
    activePlatform,
    setActivePlatform,
    previewContent,
    isFileExist,
    isDifferent,
    currentPlatform,
    isCloudSyncEnabled,
    ideContext // 👈 New prop
}) {
    // State for sync status
    const [lastSyncedContent, setLastSyncedContent] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatusText, setSyncStatusText] = useState('Syncing...'); // 👈 New: Custom sync status text
    const [isInitializing, setIsInitializing] = useState(true); // 👈 新增：默认为初始化中
    const [copied, setCopied] = useState(false);

    // Initial Fetch from Cloud
    React.useEffect(() => {
        const fetchCloudConfig = async () => {
            // 如果没登录或没开同步，直接解锁
            if (!user || !isCloudSyncEnabled) {
                setIsInitializing(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('user_contexts')
                    .select('context_snapshot')
                    .eq('project_name', 'Rivetly-Web-Config')
                    .single();

                if (data?.context_snapshot) {
                    // ✅ Smart Load: Resolve R2 references if any
                    const resolvedSnapshot = await smartLoad(data.context_snapshot);
                    // 设置基准线
                    setLastSyncedContent(JSON.stringify(resolvedSnapshot));
                }
            } catch (err) {
                console.error("Init fetch error:", err);
            } finally {
                // ✅ 无论结果如何，数据请求结束，解锁
                setIsInitializing(false);
            }
        };
        fetchCloudConfig();
    }, [user, isCloudSyncEnabled]);

    // Calculate hasChanges for cloud sync
    // We construct the contextData object locally to compare
    const currentContextData = React.useMemo(() => ({ 
        mode, 
        selectedIds, 
        customConstraints: customConstraints || [], 
    }), [mode, selectedIds, customConstraints]);

    const hasChanges = React.useMemo(() => {
        if (!lastSyncedContent) return true; // Treat as changed if never synced
        return JSON.stringify(currentContextData) !== lastSyncedContent;
    }, [currentContextData, lastSyncedContent]);

    // Determine sync button status
    const getSyncButtonState = () => {
        // 1. 最高优先级：如果正在初始化，显示中立状态
        if (isInitializing) return 'initializing';

        // Cloud Sync Mode
        if (isCloudSyncEnabled && user) {
            if (isSyncing) return 'loading';
            // Force re-render on sync success by checking lastSyncedContent
            return hasChanges ? 'update' : 'synced';
        }
        
        // Local Mode
        // If VS Code (isFileExist), use isDifferent
        if (isFileExist) {
            return isDifferent ? 'update' : 'synced';
        }
        
        // Browser Local Mode (Always active for download)
        return 'update'; 
    };

    const syncStatus = getSyncButtonState();
    const isCloudMode = isCloudSyncEnabled && user;

    const getButtonClass = () => {
        if (syncStatus === 'loading') return 'loading';
        if (syncStatus === 'initializing') return 'gray'; // 灰色中立状态
        
        if (isCloudMode) {
            return syncStatus === 'synced' ? 'gray' : 'blue';
        }
        
        if (!isFileExist) return 'orange'; // Save Local
        return syncStatus === 'synced' ? 'gray' : 'blue';
    };

    const handleAction = async (type, content, fileName) => {
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
                    // In VS Code, we might want to check user status for cloud sync too?
                    // But current logic for VS Code 'sync' is 'syncToRoot' (Local Sync).
                    // The cloud sync logic is currently browser-centric or "Sync Cloud" button centric.
                    // The button calls 'sync'.
                    
                    // If we want the button to do Cloud Sync in VS Code, we need to change this.
                    // But the original code for VS Code 'sync' was 'syncToRoot'.
                    // Let's keep VS Code behavior as is for now unless requested.
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
                if (isCloudSyncEnabled && user) {
                    setIsSyncing(true); // Start loading immediately
                    try {
                        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

                        if (authError || !currentUser) {
                            showToast(locale === 'zh' ? '请先登录再同步' : 'Please login first', 'error');
                            setIsSyncing(false);
                            return;
                        }
                        console.log("正在为用户同步数据:", currentUser.id);
                        
                        // 2. 核心修复点：确保 customConstraints 不为 undefined，且与 currentContextData 逻辑一致
                        const currentConstraints = customConstraints || [];

                        // 剔除 locale，保持与 currentContextData 一致
                        // ✅ 核心：将物理上下文一起打包上云
                        const contextData = { 
                            mode, 
                            selectedIds, 
                            customConstraints: currentConstraints,
                            ideContext: ideContext
                        };
                        
                        // ✅ Use smartSync instead of syncToCloud
                        const result = await smartSync('Rivetly-Web-Config', contextData, (status) => {
                            if (status === 'optimizing') {
                                setSyncStatusText(locale === 'zh' ? '正在优化上传...' : 'Optimizing...');
                            } else {
                                setSyncStatusText(locale === 'zh' ? '同步中...' : 'Syncing...');
                            }
                        });
                        
                        if (result.success) {
                            showToast(locale === 'zh' ? '✅ 同步成功' : '✅ Synced', 'success');
                            // ✅ 核心修复：将刚才同步的对象标准化后存入快照
                            // Note: We store the "heavy" local version as lastSyncedContent
                            // because that's what we compare against locally.
                            // The "slim" version is only for cloud storage.
                            setLastSyncedContent(JSON.stringify(contextData));
                        } else {
                            throw new Error(result.error || 'Unknown error');
                        }
                    } catch (error) {
                        console.error('Sync Error:', error);
                        
                        // 优雅降级：网络错误处理
                        const isNetworkError = error.message && (
                            error.message.includes('Failed to fetch') || 
                            error.message.includes('NetworkError') ||
                            error.message.includes('The user aborted a request')
                        );
                        
                        const errorMsg = isNetworkError 
                            ? (locale === 'zh' ? '网络连接失败，规则已暂存本地 (请检查 VPN)' : 'Network Error: Saved locally (Check VPN)')
                            : (locale === 'zh' ? `同步失败: ${error.message}` : `Sync Failed: ${error.message}`);
                            
                        showToast(errorMsg, 'error');
                        
                        // 如果是网络错误，我们也许可以标记状态为“待同步”或者保持当前状态
                        // 目前保持原样，用户下次点击会重试
                    } finally {
                        setIsSyncing(false);
                    }
                } else {
                    // Fallback to Save Local (Download) when sync is disabled OR not logged in
                    handleDownload(content, { mode, selectedIds, locale }, activePlatform, showToast);
                }
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
                            className={`compact-sync-btn ${getButtonClass()}`}
                            onClick={() => handleAction('sync', previewContent, currentPlatform.file)}
                            disabled={(syncStatus === 'synced' && (isFileExist || isCloudMode)) || syncStatus === 'disabled' || syncStatus === 'initializing'}
                        >
                            {syncStatus === 'initializing' ? (
                                <>
                                    <Icons.Loader2 size={12} className="shrink-0 animate-spin opacity-40" />
                                    <span className="opacity-40">{locale === 'zh' ? '正在连接...' : 'Connecting...'}</span>
                                </>
                            ) : syncStatus === 'loading' ? (
                                <>
                                    <Icons.Loader2 size={14} className="shrink-0 animate-spin" />
                                    <span>
                                        {syncStatusText}
                                    </span>
                                </>
                            ) : syncStatus === 'synced' ? (
                                <>
                                    <Icons.Check size={14} className="shrink-0 text-[#4ec9b0]" />
                                    <span>
                                        {locale === 'zh' ? '已同步' : 'Synced'}
                                    </span>
                                </>
                            ) : !isFileExist ? (
                                <>
                                    <Icons.Zap size={14} className="shrink-0" />
                                    <span>
                                        {locale === 'zh' 
                                            ? (isCloudSyncEnabled && user ? '云同步' : '保存本地') 
                                            : (isCloudSyncEnabled && user ? 'Sync Cloud' : 'Save Local')}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Icons.CloudUpload size={14} className="shrink-0" />
                                    <span>
                                        {locale === 'zh' ? '更新到云端' : 'Update Cloud'}
                                    </span>
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

                {/* IDE Context Panel */}
                <IdeContextPanel ideContext={ideContext} locale={locale} />

                {/* 代码预览区域 */}
                <div key={`${mode}-${activePlatform}`} className="code-view animate-preview no-scrollbar">
                    <pre><code className="whitespace-pre-wrap">{previewContent}</code></pre>
                </div>
            </div>
        </div>
    );
}

export default Editor;