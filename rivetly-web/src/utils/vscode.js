
let vscodeApi = null;

/**
 * Singleton to get the VS Code API instance.
 * Ensures acquireVsCodeApi() is called only once.
 */
export const getVsCodeApi = () => {
    // If we already acquired it, return the cached instance
    if (vscodeApi) {
        return vscodeApi;
    }

    // If we are in the VS Code webview environment
    if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
        try {
            vscodeApi = window.acquireVsCodeApi();
            return vscodeApi;
        } catch (e) {
            // If it was already acquired elsewhere but not via this utility
            // (unlikely if we use this utility everywhere, but good for safety)
            console.warn("VS Code API already acquired or error acquiring:", e);
            return null;
        }
    }

    return null;
};
