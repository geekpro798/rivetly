import React, { useEffect, useState } from 'react';

const AuthSuccess = () => {
  const [status, setStatus] = useState('authenticating');

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    // Ensure we capture refresh_token as well if available
    const refreshToken = params.get('refresh_token');

    // Capture env from query params for cross-IDE support
    const queryParams = new URLSearchParams(window.location.search);
    const targetScheme = queryParams.get('env') || 'vscode';

    if (accessToken) {
      setStatus('redirecting');
      // Dynamic URI construction based on targetScheme
      const vscodeUri = `${targetScheme}://geekpro798.rivetly/auth-callback?access_token=${accessToken}&refresh_token=${refreshToken || ''}`;

      console.log(`Detected target environment: ${targetScheme}, preparing redirect...`);

      const timer = setTimeout(() => {
        window.location.href = vscodeUri;
        setTimeout(() => setStatus('manual'), 3000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* 品牌橙色 Loading 动画 */}
        <div style={styles.loaderContainer}>
          <div style={status === 'redirecting' ? styles.loaderPulse : styles.loaderStatic}></div>
        </div>

        <h1 style={styles.title}>
          {status === 'redirecting' ? 'Authorization Successful!' : 'Authentication'}
        </h1>
        
        <p style={styles.text}>
          {status === 'redirecting'
            ? 'Returning to VS Code to sync your AI progress...'
            : 'Processing your security credentials...'}
        </p>

        {/* 适配 Rivetly 风格的橙色按钮 */}
        {status === 'manual' && (
          <button
            onClick={() => window.location.reload()}
            style={styles.button}
          >
            Return to VS Code
          </button>
        )}

        <div style={styles.footer}>Rivetly AI • Secure Connection</div>
      </div>
      <style>{`
        @keyframes pulse-orange {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

// --- Rivetly 品牌视觉定义 ---
const styles = {
  container: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0d1117', color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    textAlign: 'center', padding: '3.5rem 2.5rem', borderRadius: '1.25rem',
    backgroundColor: '#161b22', border: '1px solid #30363d',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)', maxWidth: '420px', width: '90%'
  },
  loaderContainer: {
    width: '70px', height: '70px', border: '2px solid #30363d', borderRadius: '50%',
    margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  loaderStatic: {
    width: '35px', height: '35px', backgroundColor: '#ff8235', borderRadius: '50%', opacity: 0.5
  },
  loaderPulse: {
    width: '35px', height: '35px', backgroundColor: '#ff8235', borderRadius: '50%',
    boxShadow: '0 0 20px rgba(255, 130, 53, 0.6)',
    animation: 'pulse-orange 1.8s infinite ease-in-out'
  },
  title: { fontSize: '1.6rem', marginBottom: '1rem', fontWeight: '600', color: '#f0f6fc' },
  text: { color: '#8b949e', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem' },
  button: {
    backgroundColor: '#ff8235', color: '#ffffff', border: 'none', padding: '0.8rem 2rem',
    borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem',
    transition: 'transform 0.2s, background-color 0.2s',
    ':hover': { backgroundColor: '#ff9a5a' }
  },
  footer: { marginTop: '2.5rem', fontSize: '0.75rem', color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.15em' }
};

export default AuthSuccess;