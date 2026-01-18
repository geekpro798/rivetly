const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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

function activate(context) {
    const provider = {
        resolveWebviewView: (webviewView) => {
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [context.extensionUri]
            };

            webviewView.webview.html = getHtmlContent(context, webviewView.webview);

            // 核心交互：监听 Webview 消息
            webviewView.webview.onDidReceiveMessage(message => {
                if (message.command === 'webviewReady') {
                    // 网页加载完了，现在扫描并发送旧规则
                    syncLocalRulesToWebview(webviewView);
                    return;
                }

                if (message.command === 'updateRules') {
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        const filePath = path.join(workspaceFolder.uri.fsPath, message.fileName);
                        fs.writeFileSync(filePath, message.content);
                        vscode.window.showInformationMessage(`✅ ${message.fileName} updated!`);
                    }
                }
            });
        }
    };

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('rivetly.webviewView', provider)
    );
}

exports.activate = activate;
