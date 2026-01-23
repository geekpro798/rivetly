import React, { useEffect, useState } from 'react';

const AuthSuccess = () => {
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
      // We include refresh_token to ensure long-lived sessions in the extension
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

export default AuthSuccess;
