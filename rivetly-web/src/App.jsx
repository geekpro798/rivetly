import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import RivetlyFooter from './components/RivetlyFooter';
import { useResponsiveWidth } from './hooks/useResponsiveWidth';
import { getVsCodeApi } from './utils/vscode';
import { generateFinalPrompt } from './utils/adapter-engine';
import { PLATFORMS } from './utils/platformManager';
import { supabase } from './utils/supabaseClient';
import AuthSuccess from './AuthSuccess';

// Callback component for Supabase OAuth popup
const AuthCallback = () => {
  const [status, setStatus] = useState('authenticating'); // authenticating | redirecting | manual

  useEffect(() => {
    // 1. 从 Hash 中提取 Token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      setStatus('redirecting');
      
      // 2. 构造你的插件协议地址
      const vscodeUri = `vscode://geekpro798.rivetly/auth-callback?access_token=${accessToken}&refresh_token=${refreshToken || ''}`;

      // 3. 2秒后自动尝试唤起 VS Code（给用户一点看动画的时间）
      const timer = setTimeout(() => {
        window.location.href = vscodeUri;
        // 如果3秒后还没跳走，说明可能被浏览器拦截，显示手动按钮
        setTimeout(() => setStatus('manual'), 3000);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setStatus('error');
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* 动态加载动画 */}
        <div style={styles.loader}>
          <div style={status === 'redirecting' ? styles.innerLoaderPulse : styles.innerLoader}></div>
        </div>

        <h1 style={styles.title}>
          {status === 'redirecting' ? 'Authorization Successful!' : 'Authentication'}
        </h1>
        
        <p style={styles.text}>
          {status === 'redirecting'
            ? 'We are taking you back to VS Code to sync your AI rules...'
            : 'Processing your security credentials...'}
        </p>

        {/* 手动兜底按钮 */}
        {status === 'manual' && (
          <button
            onClick={() => window.location.reload()}
            style={styles.button}
          >
            Click here to return to VS Code
          </button>
        )}

        <div style={styles.footer}>Rivetly AI • Secure Connection</div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
      `}</style>
    </div>
  );
};

// --- 样式定义 (你可以根据你的品牌色调整) ---
const styles = {
  container: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif'
  },
  card: {
    textAlign: 'center', padding: '3rem', borderRadius: '1.5rem',
    backgroundColor: '#1e293b', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    maxWidth: '400px', width: '90%'
  },
  loader: {
    width: '60px', height: '60px', border: '3px solid #334155', borderRadius: '50%',
    margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  innerLoader: {
    width: '30px', height: '30px', backgroundColor: '#38bdf8', borderRadius: '50%',
  },
  innerLoaderPulse: {
    width: '30px', height: '30px', backgroundColor: '#38bdf8', borderRadius: '50%',
    animation: 'pulse 1.5s infinite ease-in-out'
  },
  title: { fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' },
  text: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '2rem' },
  button: {
    backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
  },
  footer: { marginTop: '2rem', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.1em' }
};

function App() {
  // Simple routing for auth callback
  if (window.location.pathname === '/auth/callback') {
    return <AuthSuccess />;
  }

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
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(() => getInitialState('rivetly_cloud_sync_enabled', true));
  const [hasRestored, setHasRestored] = useState(false);
  const [user, setUser] = useState(null);

  // Auth State Listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Check for persisted session in VS Code
    const vscode = getVsCodeApi();
    if (vscode) {
      vscode.postMessage({ command: 'CHECK_AUTH_STATUS' });
    }

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Listen for VS Code auth messages
    const handleAuthMessage = async (event) => {
      const message = event.data;
      
      if (message.command === 'AUTH_LOGIN_SUCCESS') {
        const { token, refreshToken } = message.payload.user;
        if (token && refreshToken) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken
          });
          // Note: onAuthStateChange will update the user state
        }
      }
      
      if (message.command === 'AUTH_LOGOUT_SUCCESS') {
        await supabase.auth.signOut();
        setUser(null);
      }
    };
    window.addEventListener('message', handleAuthMessage);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);
  
  // Hoisted state for synchronization
  const [activePlatform, setActivePlatform] = useState('CURSOR');
  const [localFileContent, setLocalFileContent] = useState('');
  const [isFileExist, setIsFileExist] = useState(false);
  const [ideContext, setIdeContext] = useState(null); // 👈 新增：IDE 上下文状态

  const [toast, setToast] = useState({ message: '', visible: false });

  // 监听 IDE 消息 (物理上下文)
  useEffect(() => {
    const handleIdeMessage = (event) => {
      const message = event.data;
      if (message.command === 'updateIdeContext') {
        // 实时捕获 IDE 传来的物理上下文
        setIdeContext(message.data);
      }
    };
    window.addEventListener('message', handleIdeMessage);
    return () => window.removeEventListener('message', handleIdeMessage);
  }, []);

  // Derived state
  const currentPlatform = PLATFORMS[activePlatform];

  // Use useMemo for declarative rule generation (moved from Editor)
  const previewContent = React.useMemo(() => {
      return generateFinalPrompt({
          mode,
          selectedIds,
          customConstraints,
          platform: activePlatform.toLowerCase(),
          locale
      });
  }, [mode, selectedIds, customConstraints, activePlatform, locale]);

  // Core logic: Compare content
  const isDifferent = localFileContent.trim() !== previewContent.trim();

  // Trigger checkFile when platform changes
  useEffect(() => {
      const vscode = getVsCodeApi();
      if (vscode) {
          vscode.postMessage({
              command: 'checkFile',
              fileName: currentPlatform.file
          });
      }
  }, [activePlatform, currentPlatform.file]);

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
      } else if (message.command === 'localFileContent') {
          // Only update if the message corresponds to the current platform's file
          if (message.fileName === currentPlatform.file) {
              setIsFileExist(message.exists);
              setLocalFileContent(message.content || '');
          }
      } else if (message.command === 'AUTH_LOGIN_SUCCESS') {
          // 插件告诉我们：有持久化的 Token，恢复登录状态
          if (message.payload?.user?.token) {
              // 模拟一个 Supabase User 对象结构，或者直接存 Token
              // 这里我们尽量复用现有的 user 结构
              // 如果只是为了显示头像和名字，我们需要把这些信息也存下来，或者只存 Token 然后去 fetchProfile
              // 简单起见，我们假设 payload.user 里有我们需要的信息，或者我们只标记已登录
              
              // 注意：Supabase JS 客户端可能需要 setSession
              const { token, refreshToken } = message.payload.user;
              if (token && refreshToken) {
                  supabase.auth.setSession({
                      access_token: token,
                      refresh_token: refreshToken
                  }).then(({ data, error }) => {
                      if (data.session) {
                          setUser(data.session.user);
                      }
                  });
              }
          }
      } else if (message.command === 'AUTH_LOGOUT_SUCCESS') {
          // 插件确认已清除持久化 Token
          supabase.auth.signOut().then(() => {
              setUser(null);
              showToast(locale === 'zh' ? '已退出登录' : 'Logged out');
          });
      }
    };

    // 2. 只有在浏览器窗口环境下才挂载监听
    window.addEventListener('message', handleMessage);

    // 3. 如果是在插件环境下，主动告诉插件“我准备好了，请把数据发给我”
    const vscode = getVsCodeApi();
    if (vscode) {
      vscode.postMessage({ command: 'webviewReady' });
      // 主动询问登录状态 (持久化检查)
      vscode.postMessage({ command: 'CHECK_AUTH_STATUS' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [locale, currentPlatform.file]); // Add currentPlatform.file dependency

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
            // Sync Props
            isFileExist={isFileExist}
            isDifferent={isDifferent}
            previewContent={previewContent}
            currentPlatform={currentPlatform}
            // Cloud Sync Prop
            isCloudSyncEnabled={isCloudSyncEnabled}
          />
        </div>
        {/* 底部状态栏 */}
        <RivetlyFooter 
          version="v0.1.0-beta" 
          isEngineActive={true} 
          isCloudSyncEnabled={isCloudSyncEnabled}
          setIsCloudSyncEnabled={setIsCloudSyncEnabled}
          user={user}
        />
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
                user={user}
                // Sync Props
                activePlatform={activePlatform}
                setActivePlatform={setActivePlatform}
                previewContent={previewContent}
                isFileExist={isFileExist}
                isDifferent={isDifferent}
                currentPlatform={currentPlatform}
                isCloudSyncEnabled={isCloudSyncEnabled}
                ideContext={ideContext} // 👈 传递给 Editor
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
