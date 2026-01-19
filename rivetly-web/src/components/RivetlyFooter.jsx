import React from 'react';
import { getVsCodeApi } from '../utils/vscode';

const RivetlyFooter = ({ version = "v0.1.0-beta", isEngineActive = true }) => {
    // 自动识别 VS Code API 环境 (使用单例工具函数)
    const vscode = getVsCodeApi();

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
            <div className="footer-left">
                <span className="version-tag">Rivetly {version}</span>
                {/* 状态圆点，根据 props 切换呼吸感 */}
                <span className={`status-dot ${isEngineActive ? 'active' : ''}`}></span>
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
