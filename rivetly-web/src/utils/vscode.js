
let vscodeApi = null;

// Safely acquire the VS Code API
const acquireApi = () => {
    if (vscodeApi) return vscodeApi;

    // Check if running in VS Code Webview environment
    if (typeof acquireVsCodeApi !== 'undefined') {
        try {
            vscodeApi = acquireVsCodeApi();
        } catch (e) {
            console.warn("VS Code API already acquired or error acquiring:", e);
        }
    } 
    // Fallback: Check window object (sometimes needed in certain bundler setups)
    else if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
        try {
            vscodeApi = window.acquireVsCodeApi();
        } catch (e) {
            console.warn("VS Code API already acquired via window:", e);
        }
    }

    return vscodeApi;
};

// Initialize the API instance immediately
const vscode = acquireApi();

// Export environment flags
export const isWebview = !!vscode;
export const isBrowser = !isWebview;

// Export singleton getter (compatible with existing code)
export const getVsCodeApi = () => vscode;

// Default export
export default vscode;
