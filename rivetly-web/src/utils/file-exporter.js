/**
 * Export content to a file trigger download
 * @param {string} content - The content to save
 * @param {string} platform - Current platform (cursor/windsurf/claude)
 */
export const exportRuleFile = (content, platform) => {
    // 1. Determine filename based on platform
    let fileName = ".cursorrules";
    if (platform === 'windsurf') fileName = ".windsurfrules";
    if (platform === 'claude') fileName = "claude-prompt.txt"; // Adjusted from user snippet "system-prompt.md" to match "claude-prompt.txt" in step 3 or user request text? User said "claude-prompt.txt" in text, but "system-prompt.md" in code. I'll use claude-prompt.txt as per text instructions which usually override code snippets in these prompts.

    // User Request Text: "Claude: 由于是 System Prompt，下载为 claude-prompt.txt。"
    // User Request Code: "if (platform === 'claude') fileName = 'system-prompt.md';"
    // I will use claude-prompt.txt

    // 2. Create Blob
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

    // 3. Trigger Download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    // 4. Cleanup
    URL.revokeObjectURL(link.href);
};
