const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const AUTH_TOKEN_KEY = 'rivetly_auth_session';

function getHtmlContent(context, webview) {
    const distPath = path.join(context.extensionPath, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf-8');

    // 获取 Webview 可用的资源基准 URI
    const baseUri = webview.asWebviewUri(vscode.Uri.file(distPath));

    // 1. 修复所有以 / 开头的资源路径 (Vite 默认输出)
    // 2. 修复所有以 ./ 开头的相对路径
    html = html.replace(
        /(href|src|poster)="(?!https?:\/\/)\/?([^"]*)"/g,
        (match, p1, p2) => `${p1}="${baseUri}/${p2}"`
    );

    // 注入配置到 Head
    const configScript = `
    <script>
      window.RIVETLY_CONFIG = {
        supabaseUrl: "${process.env.SUPABASE_URL || 'https://tnjvadqapmogcsmzsokg.supabase.co'}",
        supabaseAnonKey: "${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuanZhZHFhcG1vZ2NzbXpzb2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzQxNDUsImV4cCI6MjA1MjYxMDE0NX0.D_9a95_4t3-vL-wD_5w7-z_4r3-sL-2D_5w7-z_4r3-s'}"
      };
    </script>
    `;
    
    // 插入到 <head> 标签中，如果没有 head 则插入到 <html> 之后
    if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${configScript}`);
    } else {
        html = html.replace('<html>', `<html><head>${configScript}</head>`);
    }

    return html;
}

// 核心函数：读取本地规则并发送给 Webview
function syncLocalRulesToWebview(webviewView) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    // 检查常见规则文件
    const ruleFiles = ['.cursorrules', '.traerules', '.windsurfrules'];
    
    for (const fileName of ruleFiles) {
        const filePath = path.join(workspaceFolder.uri.fsPath, fileName);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            // 正则提取 Base64 记忆标签
            const match = content.match(/<rivetly-snapshot>(.*?)<\/rivetly-snapshot>/);
            
            if (match && match[1]) {
                // 将快照数据发送给 Webview 里的 React
                webviewView.webview.postMessage({
                    command: 'restoreState',
                    payload: match[1], // Base64 字符串
                    sourceFile: fileName
                });
                break; // 找到一个有效的就停止
            }
        }
    }
}

// Uri Handler for vscode://geekpro798.rivetly/...
class RivetlyUriHandler {
    constructor(provider, context) {
        this.provider = provider;
        this.context = context;
    }

    async handleUri(uri) {
        // 1. 检查路径是否是我们的回调地址
        if (uri.path === '/auth-callback') {
            const query = new URLSearchParams(uri.query);
            const accessToken = query.get('access_token');
            const refreshToken = query.get('refresh_token');

            // 获取当前的 Webview (通过 Provider)
            const webviewView = this.provider.webviewView;

            if (accessToken && webviewView) {
                // 2. 将 Token 传递给 Webview
                webviewView.webview.postMessage({
                    command: 'AUTH_LOGIN_SUCCESS',
                    payload: {
                        user: {
                            token: accessToken,
                            refreshToken: refreshToken
                        }
                    }
                });

                // 3. 持久化存储 Token
                await this.context.globalState.update(AUTH_TOKEN_KEY, { accessToken, refreshToken });

                // 4. 提示用户并把 Webview 拉到前台
                vscode.window.showInformationMessage('✅ Rivetly: 登录成功，云端记忆已开启！');
                webviewView.show?.(true); // 尝试聚焦 Webview
            }
        }
    }
}

function activate(context) {
    // 存储 webviewView 引用以便 Handler 访问
    let currentWebviewView = null;

    const provider = {
        resolveWebviewView: (webviewView) => {
            currentWebviewView = webviewView; // 捕获引用
            // 将引用暴露给 Provider 对象本身，以便 Handler 访问
            provider.webviewView = webviewView;

            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [context.extensionUri]
            };

            webviewView.webview.html = getHtmlContent(context, webviewView.webview);

            const updateFileStatus = (fileName) => {
                const folders = vscode.workspace.workspaceFolders;
                if (!folders) return;

                const filePath = path.join(folders[0].uri.fsPath, fileName);
                const exists = fs.existsSync(filePath);
                let content = '';
                
                if (exists) {
                    content = fs.readFileSync(filePath, 'utf-8');
                }
                
                // 将结果推送到前端
                webviewView.webview.postMessage({
                    command: 'localFileContent',
                    exists: exists,
                    content: content,
                    fileName: fileName
                });
            };

            // 监听文件变化（新增、删除、修改），实时更新按钮状态
            const watcher = vscode.workspace.createFileSystemWatcher('**/*');
            watcher.onDidCreate(() => updateFileStatus('.cursorrules'));
            watcher.onDidDelete(() => updateFileStatus('.cursorrules'));
            watcher.onDidChange(() => updateFileStatus('.cursorrules'));

            // --- 新增：实时上下文捕获逻辑 ---
            const sendIdeContext = () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    webviewView.webview.postMessage({
                        command: 'updateIdeContext',
                        data: { fileName: null, lastError: null, selection: null }
                    });
                    return;
                }

                // 1. 获取相对路径
                const uri = editor.document.uri;
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                const relativePath = workspaceFolder 
                    ? path.relative(workspaceFolder.uri.fsPath, uri.fsPath) 
                    : path.basename(uri.fsPath);

                // 2. 获取选中代码片段 (前 100 字符)
                const selection = editor.document.getText(editor.selection).slice(0, 100).trim();

                // 3. 获取当前文件的第一个报错
                const diagnostics = vscode.languages.getDiagnostics(uri);
                const error = diagnostics.find(d => d.severity === vscode.DiagnosticSeverity.Error);
                const lastError = error ? error.message : null;

                webviewView.webview.postMessage({
                    command: 'updateIdeContext',
                    data: {
                        fileName: relativePath,
                        lastError: lastError,
                        selection: selection || null
                    }
                });
            };

            // 注册 IDE 事件监听
            const debounce = (func, wait) => {
                let timeout;
                return (...args) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func(...args), wait);
                };
            };
            const debouncedSend = debounce(sendIdeContext, 500);

            // 监听编辑器激活、选区变化、报错变化
            context.subscriptions.push(
                vscode.window.onDidChangeActiveTextEditor(sendIdeContext),
                vscode.window.onDidChangeTextEditorSelection(debouncedSend),
                vscode.languages.onDidChangeDiagnostics(debouncedSend)
            );
            // --- 结束 ---

            // 核心交互：监听 Webview 消息
            webviewView.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'webviewReady':
                        // 网页加载完了，现在扫描并发送旧规则
                        syncLocalRulesToWebview(webviewView);
                        // 初始化时发送一次状态
                        updateFileStatus('.cursorrules');
                        // 初始化发送 IDE 上下文
                        sendIdeContext();
                        break;
                    
                    case 'checkFile':
                        updateFileStatus(message.fileName);
                        break;

                    case 'updateRules':
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (workspaceFolder) {
                            const filePath = path.join(workspaceFolder.uri.fsPath, message.fileName);
                            fs.writeFileSync(filePath, message.content);
                            vscode.window.showInformationMessage(`✅ ${message.fileName} updated!`);
                        }
                        break;

                    case 'copyText':
                        await vscode.env.clipboard.writeText(message.text);
                        vscode.window.showInformationMessage('📋 Rules copied to clipboard!');
                        break;

                    case 'saveFile':
                        // 检查文件名是否已经包含点号，避免双重后缀
                        const baseName = message.fileName; // 例如 ".cursorrules"
                        
                        const saveUri = await vscode.window.showSaveDialog({
                            defaultUri: vscode.Uri.file(path.join(
                                vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                                baseName
                            )),
                            // 如果文件名本身已经包含了完整的扩展名，可以考虑置空 filters
                            // 或者只保留一个不带点的后缀名
                            filters: baseName.startsWith('.') ? {} : { 'AI Rules': [baseName.split('.').pop()] }
                        });

                        if (saveUri) {
                            fs.writeFileSync(saveUri.fsPath, message.text);
                            vscode.window.showInformationMessage(`💾 Saved to ${path.basename(saveUri.fsPath)}`);
                        }
                        break;

                    case 'syncToRoot':
                        const folders = vscode.workspace.workspaceFolders;
                        if (!folders) {
                            vscode.window.showErrorMessage('❌ No workspace folder found. Please open a project first.');
                            return;
                        }
                        const rootPath = folders[0].uri.fsPath;
                        const targetPath = path.join(rootPath, message.fileName);
                        try {
                            fs.writeFileSync(targetPath, message.text, 'utf8');
                            vscode.window.showInformationMessage(`✅ Synced: ${message.fileName} is now active in your project.`);
                            const doc = await vscode.workspace.openTextDocument(targetPath);
                            await vscode.window.showTextDocument(doc, { preview: true });
                        } catch (err) {
                            vscode.window.showErrorMessage(`Sync failed: ${err.message}`);
                        }
                        break;

                    case 'openLink':
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        break;

                    case 'auth-login':
                        // ... (keep existing logic)
                        if (message.payload && message.payload.url) {
                            vscode.env.openExternal(vscode.Uri.parse(message.payload.url));
                        } else {
                            const projectUrl = 'https://tnjvadqapmogcsmzsokg.supabase.co';
                            const provider = message.payload.provider || 'github';
                            
                            // 1. 自动识别当前 IDE 的协议头
                            const currentScheme = vscode.env.uriScheme;
                            console.log(`检测到当前 IDE 协议: ${currentScheme}`);
                            
                            // 2. 构造重定向到 Vercel 的地址，并带上 env 参数
                            const redirectTo = `https://rivetly.vercel.app/auth?env=${currentScheme}`;
                            
                            const authUrl = `${projectUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}&skip_browser_redirect=true`;
                            vscode.env.openExternal(vscode.Uri.parse(authUrl));
                        }
                        break;

                    case 'CHECK_AUTH_STATUS':
                        const savedSession = context.globalState.get(AUTH_TOKEN_KEY);
                        if (savedSession && savedSession.accessToken) {
                            webviewView.webview.postMessage({
                                command: 'AUTH_LOGIN_SUCCESS',
                                payload: {
                                    user: {
                                        token: savedSession.accessToken,
                                        refreshToken: savedSession.refreshToken
                                    }
                                }
                            });
                        }
                        break;

                    case 'LOGOUT_REQUEST':
                        await context.globalState.update(AUTH_TOKEN_KEY, undefined);
                        webviewView.webview.postMessage({ command: 'AUTH_LOGOUT_SUCCESS' });
                        vscode.window.showInformationMessage('已退出 Rivetly 云端连接');
                        break;
                }
            });
        }
    };

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('rivetly.webviewView', provider)
    );

    // 注册 UriHandler
    const uriHandler = new RivetlyUriHandler(provider);
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

    context.subscriptions.push(
        vscode.commands.registerCommand('rivetly.syncRules', () => {
            // 这里可以触发同步逻辑
        })
    );
}

exports.activate = activate;
