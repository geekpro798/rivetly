import { syncToCloud } from './cloudSync';
import { uploadToR2, downloadFromR2 } from './r2Storage';

const HEAVY_DATA_THRESHOLD = 50 * 1024; // 50KB

/**
 * Smart Sync: Offload heavy data to R2 before syncing to Supabase
 * @param {string} projectName 
 * @param {object} rawContextData 
 * @param {function} onProgress - (status: 'optimizing' | 'syncing') => void
 */
export const smartSync = async (projectName, rawContextData, onProgress) => {
    let finalContext = { ...rawContextData };
    
    // 1. Check for "heavy data" field (idePhysicalContext)
    if (rawContextData.idePhysicalContext) {
        const payloadStr = JSON.stringify(rawContextData.idePhysicalContext);
        
        if (payloadStr.length > HEAVY_DATA_THRESHOLD) {
            console.log("📦 Detected heavy data, starting R2 offload...");
            if (onProgress) onProgress('optimizing');
            
            // 2. Upload to R2
            const r2Key = await uploadToR2(projectName, rawContextData.idePhysicalContext);
            
            // 3. Core Transformation: Replace heavy data with R2 reference
            finalContext.idePhysicalContext = {
                storageType: 'R2',
                ref: r2Key,
                size: payloadStr.length,
                timestamp: Date.now()
            };
        }
    }

    if (onProgress) onProgress('syncing');
    
    // 4. Sync final "slim" data to Supabase
    return await syncToCloud(projectName, finalContext);
};

/**
 * Smart Load: Automatically fetch actual data from R2 if reference exists
 * @param {object} contextData 
 */
export const smartLoad = async (contextData) => {
    if (!contextData) return contextData;
    
    let resolvedContext = { ...contextData };
    
    // Check if idePhysicalContext is an R2 reference
    if (resolvedContext.idePhysicalContext && 
        resolvedContext.idePhysicalContext.storageType === 'R2' && 
        resolvedContext.idePhysicalContext.ref) {
            
        console.log("📦 Detected R2 reference, fetching actual data...");
        try {
            const actualData = await downloadFromR2(resolvedContext.idePhysicalContext.ref);
            resolvedContext.idePhysicalContext = actualData;
        } catch (error) {
            console.error("Failed to load R2 data:", error);
            // In case of error, we might want to keep the reference or mark error
            // For now, let's keep it as is or add an error flag if needed
            // resolvedContext.idePhysicalContext = { ...resolvedContext.idePhysicalContext, _error: 'Load failed' };
        }
    }
    
    return resolvedContext;
};
