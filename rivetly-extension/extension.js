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

            // 核心交互：监听 Webview 消息
            webviewView.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'webviewReady':
                        // 网页加载完了，现在扫描并发送旧规则
                        syncLocalRulesToWebview(webviewView);
                        // 初始化时发送一次状态
                        updateFileStatus('.cursorrules');
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
                }
            });
        }
    };

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('rivetly.webviewView', provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('rivetly.syncRules', () => {
            // 这里可以触发同步逻辑
        })
    );
}

exports.activate = activate;
