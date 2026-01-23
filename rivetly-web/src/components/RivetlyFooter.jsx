import React, { useState, useEffect } from 'react';
import { getVsCodeApi } from '../utils/vscode';
import { supabase } from '../utils/supabaseClient';
import Switch from './Switch';

const RivetlyFooter = ({ 
    version = "v0.1.0", 
    isEngineActive = true,
    isCloudSyncEnabled,
    setIsCloudSyncEnabled
}) => {
    // 自动识别 VS Code API 环境 (使用单例工具函数)
    const vscode = getVsCodeApi();
    
    // Login easter egg state
    const [clickCount, setClickCount] = useState(0);
    const [showLogin, setShowLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [confirmLogout, setConfirmLogout] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            if (data.user) setShowLogin(true); // If logged in, show UI
        });

        // Listen for auth changes (e.g. login from popup)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) setShowLogin(true);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Auto-reset logout confirmation
    useEffect(() => {
        if (confirmLogout) {
            const timer = setTimeout(() => setConfirmLogout(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirmLogout]);

    const handleVersionClick = () => {
        const newCount = clickCount + 1;
        if (newCount >= 5) {
            setShowLogin(true); // Activate login button
            setClickCount(0);   // Reset count
        } else {
            setClickCount(newCount);
            // Reset after 3 seconds to prevent accidental accumulation
            setTimeout(() => setClickCount(0), 3000);
        }
    };

    const handleLogin = async () => {
        // VS Code Environment
        if (vscode) {
            // 我们在 Web 端直接生成 URL，这样扩展端就不用硬编码了
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    // 核心：设置 redirect 为 Web 版的 callback 页，或者后续改为自定义协议
                    // 这里我们暂时用 Web 版的 URL 作为跳板，或者直接让扩展打开 Supabase 的 URL
                    redirectTo: 'https://rivetly.vercel.app/auth', 
                    skipBrowserRedirect: true
                }
            });

            if (data?.url) {
                vscode.postMessage({ 
                    command: 'auth-login', 
                    payload: { 
                        provider: 'github',
                        url: data.url // 直接把生成的带签名的 URL 发给插件
                    } 
                });
            }
            return;
        }

        // Browser Environment (Original Logic)
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                skipBrowserRedirect: true, // Get the URL instead of redirecting immediately
            }
        });

        if (error) {
            console.error('Login Error:', error.message);
        } else if (data?.url) {
            // Open popup for "Quality" feel
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            window.open(
                data.url, 
                'GitHub Login', 
                `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
            );
        }
    };

    const handleSignOut = async () => {
        if (vscode) {
            // VS Code 环境：请求插件清除持久化状态
            vscode.postMessage({ command: 'LOGOUT_REQUEST' });
            // 插件处理完后会发回 AUTH_LOGOUT_SUCCESS，由 App.jsx 处理状态更新
            setConfirmLogout(false);
            setShowLogin(false);
        } else {
            // 纯浏览器环境
            const { error } = await supabase.auth.signOut();
            if (!error) {
                // setUser(null); // Handled by App.jsx listener
                setShowLogin(false); // Hide UI after logout
                window.location.reload();
            }
        }
    };

    const handleAction = (url) => {
        if (vscode) {
            // 在 VS Code 中，通知扩展打开外部浏览器
            vscode.postMessage({
                command: 'openLink',
                url: url
            });
        } else {
            // 在普通网页端，直接打开新窗口
            window.open(url, '_blank');
        }
    };

    const GITHUB_ISSUES_URL = "https://github.com/geekpro798/rivetly/issues";
    const SUPPORT_URL = "https://buymeacoffee.com/geekpro798";

    return (
        <footer className="rivetly-footer">
            <div className="footer-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 1. Status Group: Version + Plugin Status */}
                <div className="status-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                        className="version-tag" 
                        onClick={handleVersionClick} 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Version Info"
                    >
                        Rivetly {version}
                    </span>
                    <span 
                        className={`status-dot ${isEngineActive ? 'green' : 'red'}`} 
                        title={isEngineActive ? 'Plugin is running' : 'Plugin inactive'}
                    ></span>
                </div>

                {/* 2. User Area & Cloud Sync */}
                <div className="user-area ml-4 flex items-center gap-3">
                    {user ? (
                        <>
                            {/* User Profile */}
                            {!confirmLogout ? (
                                <div 
                                    className="avatar-wrapper flex items-center gap-2 group cursor-pointer" 
                                    onClick={() => setConfirmLogout(true)}
                                    title={`Logged in as ${user.email}`}
                                >
                                    <img 
                                        src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`} 
                                        alt="User" 
                                        className="user-avatar w-5 h-5 rounded-full border border-white/10 group-hover:brightness-125 transition-all" 
                                    />
                                    <span className="text-[10px] text-slate-400 max-w-[80px] truncate hidden group-hover:block transition-all duration-300 ease-in-out">
                                        {user.user_metadata.full_name || user.email?.split('@')[0]}
                                    </span>
                                </div>
                            ) : (
                                <div className="logout-confirm-group flex gap-2 items-center px-2 py-0.5 bg-slate-800/50 rounded border border-slate-700">
                                    <span style={{ fontSize: '10px', color: '#ff6b00', fontWeight: 'bold' }}>Logout?</span>
                                    <button 
                                        onClick={handleSignOut} 
                                        className="confirm-btn" 
                                        style={{ background: '#ff6b00', color: '#fff', border: 'none', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', cursor: 'pointer' }}
                                    >
                                        Yes
                                    </button>
                                    <button 
                                        onClick={() => setConfirmLogout(false)} 
                                        style={{ background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', cursor: 'pointer' }}
                                    >
                                        No
                                    </button>
                                </div>
                            )}

                            {/* Cloud Sync Toggle */}
                            {!confirmLogout && (
                                <div className="sync-control flex items-center gap-2">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => setIsCloudSyncEnabled(!isCloudSyncEnabled)}>
                                        Cloud
                                    </label>
                                    <Switch 
                                        checked={isCloudSyncEnabled} 
                                        onChange={setIsCloudSyncEnabled} 
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        showLogin && (
                            <button 
                                className="minimal-login-btn px-2 py-0.5 text-[10px] font-medium text-orange-500 hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded transition-all" 
                                onClick={handleLogin}
                            >
                                Login
                            </button>
                        )
                    )}
                </div>
            </div>
            
            <div className="footer-right">
                <button 
                    className="minimal-link" 
                    onClick={() => handleAction(GITHUB_ISSUES_URL)} 
                > 
                    Feedback 
                </button> 
                <span className="separator">|</span> 
                <button 
                    className="minimal-link" 
                    onClick={() => handleAction(SUPPORT_URL)} 
                > 
                    Support 
                </button> 
            </div> 
        </footer>
    );
};

export default RivetlyFooter;
