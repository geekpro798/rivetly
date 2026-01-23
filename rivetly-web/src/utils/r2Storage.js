import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize R2 Client (using same env vars as s3-client.js)
const s3Client = new S3Client({
    region: "auto",
    endpoint: import.meta.env.VITE_R2_ENDPOINT,
    credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = "rivetly-context";

/**
 * Upload heavy data to R2
 * @param {string} projectName 
 * @param {object} content 
 * @returns {Promise<string>} object key
 */
export const uploadToR2 = async (projectName, content) => {
    try {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        // Create a unique key: snapshots/project/timestamp-random.json
        const key = `snapshots/${projectName}/${timestamp}-${randomId}.json`;
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(content),
            ContentType: "application/json",
        });
        
        await s3Client.send(command);
        return key;
    } catch (error) {
        console.error("R2 Upload failed:", error);
        throw error;
    }
};

/**
 * Download data from R2 by key
 * @param {string} key 
 * @returns {Promise<object>} parsed JSON content
 */
export const downloadFromR2 = async (key) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        const response = await s3Client.send(command);
        const str = await response.Body?.transformToString();
        return JSON.parse(str);
    } catch (error) {
        console.error("R2 Download failed:", error);
        throw error;
    }
};
