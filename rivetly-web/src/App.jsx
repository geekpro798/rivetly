import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import { useResponsiveWidth } from './hooks/useResponsiveWidth';
import { getVsCodeApi } from './utils/vscode';

function App() {
  const { containerRef, isNarrow } = useResponsiveWidth(380);

  // Load initial state from localStorage
  const getInitialState = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    try {
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [mode, setMode] = useState(() => getInitialState('rivetly_mode', 'feature'));
  const [locale, setLocale] = useState(() => getInitialState('rivetly_locale', 'en'));
  const [selectedIds, setSelectedIds] = useState(() => getInitialState('rivetly_selectedIds', ['strict_ts']));
  const [customConstraints, setCustomConstraints] = useState(() => getInitialState('rivetly_customConstraints', []));
  const [hasRestored, setHasRestored] = useState(false);

  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    // 1. 定义消息处理函数
    const handleMessage = (event) => {
      const message = event.data;
      if (message.command === 'restoreState') {
        try {
          // 1. 解码 Base64
          const jsonStr = decodeURIComponent(atob(message.payload));
          const snapshot = JSON.parse(jsonStr);
          
          // 2. 更新 React 状态，界面会自动变回之前的样子
          if (snapshot.ids) setSelectedIds(snapshot.ids);
          if (snapshot.m) setMode(snapshot.m); // 注意：这里是 setMode 而不是 setCurrentMode
          setHasRestored(true);
          
          console.log(`已从 ${message.sourceFile} 自动恢复配置`);
          showToast(locale === 'zh' ? `已从 ${message.sourceFile} 恢复配置` : `Restored config from ${message.sourceFile}`);
        } catch (e) {
          console.error("恢复状态失败:", e);
        }
      }
    };

    // 2. 只有在浏览器窗口环境下才挂载监听
    window.addEventListener('message', handleMessage);

    // 3. 如果是在插件环境下，主动告诉插件“我准备好了，请把数据发给我”
    const vscode = getVsCodeApi();
    if (vscode) {
      vscode.postMessage({ command: 'webviewReady' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [locale]); // 添加 locale 依赖以正确显示 toast

  // Persistence Effects
  React.useEffect(() => {
    localStorage.setItem('rivetly_mode', JSON.stringify(mode));
  }, [mode]);

  React.useEffect(() => {
    localStorage.setItem('rivetly_locale', JSON.stringify(locale));
  }, [locale]);

  React.useEffect(() => {
    localStorage.setItem('rivetly_selectedIds', JSON.stringify(selectedIds));
  }, [selectedIds]);

  React.useEffect(() => {
    localStorage.setItem('rivetly_customConstraints', JSON.stringify(customConstraints));
  }, [customConstraints]);

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const addCustomRule = (label, prompt) => {
    // 简单哈希函数：生成基于 prompt 内容的唯一 ID
    const simpleHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36);
    };

    // 标识符区分：自定义约束使用 user_ 前缀 + prompt hash + timestamp
    const newId = `user_${simpleHash(prompt)}_${Date.now()}`;
    const newRule = { id: newId, label, prompt };
    setCustomConstraints(prev => [...prev, newRule]);
    setSelectedIds(prev => [...prev, newId]); // Default to active after adding
  };

  const removeCustomRule = (id) => {
    setCustomConstraints(prev => prev.filter(r => r.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const toggleId = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div ref={containerRef} className="flex w-full h-screen bg-[#0a0a0c] text-slate-200 overflow-hidden">
      {/* 左侧 Aside：提供唯一的 border-r 线 */}
      <aside className={`flex-shrink-0 h-full border-r border-slate-800 flex flex-col bg-[#0a0a0c] z-20 ${isNarrow ? 'w-full' : 'w-[380px]'}`}>
        <Header locale={locale} setLocale={setLocale} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Sidebar 
            key={locale}
            mode={mode} 
            setMode={setMode} 
            selectedIds={selectedIds} 
            toggleId={toggleId} 
            locale={locale} 
            showToast={showToast} 
            customConstraints={customConstraints} 
            addCustomRule={addCustomRule} 
            removeCustomRule={removeCustomRule} 
            isNarrow={isNarrow} 
          />
        </div>
        {/* 底部状态栏 */}
        <div className="flex-shrink-0 p-2 border-t border-slate-800 bg-[#0a0a0c]">
           <div className="flex justify-between text-[10px] text-slate-500 px-2">
              <span>Rivetly v0.1.0-beta</span>
              <span className="flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Engine Active
              </span>
           </div>
        </div>
      </aside>

      {/* 右侧 Main：核心修复区 */}
      {!isNarrow && (
        <main className="flex-1 h-full min-w-0 bg-[#0d0d0f] flex flex-col">
          <div className="flex-1 overflow-auto">
            {/* 移除所有水平 padding (px-0)，让 Editor 组件的 border-t 直接撞在 Aside 的 border-r 上 */}
            <div className="w-full flex flex-col items-start p-0">
              <Editor 
                key={`editor-${locale}`} 
                mode={mode} 
                selectedIds={selectedIds} 
                customConstraints={customConstraints} 
                locale={locale} 
                showToast={showToast} 
              />
            </div>
          </div>
        </main>
      )}

      {/* Floating Toast Notification */}
      {toast.visible && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-800/90 border border-orange-500/30 rounded-full shadow-2xl backdrop-blur-md z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          <span className="text-sm font-medium text-slate-200">
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
