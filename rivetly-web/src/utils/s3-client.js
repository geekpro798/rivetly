import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// 1. 初始化客户端
// 注意：在前端项目中直接暴露密钥存在安全风险。
// 建议仅在受信任的内部工具或本地环境中使用，生产环境建议使用 Presigned URL 或后端代理。
const s3Client = new S3Client({
    region: "auto", // R2 必须设为 auto
    endpoint: import.meta.env.VITE_R2_ENDPOINT,
    credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    },
});

// 2. 上传当前上下文快照
export const uploadContext = async (projectId, content) => {
    try {
        const command = new PutObjectCommand({
            Bucket: "rivetly-context",
            Key: `snapshots/${projectId}/latest.json`,
            Body: content,
            ContentType: "application/json",
        });
        return await s3Client.send(command);
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};

// 3. 下载上下文
export const downloadContext = async (projectId) => {
    try {
        const command = new GetObjectCommand({
            Bucket: "rivetly-context",
            Key: `snapshots/${projectId}/latest.json`,
        });
        const response = await s3Client.send(command);
        return await response.Body?.transformToString();
    } catch (error) {
        console.error("Download failed:", error);
        throw error;
    }
};
