/**
 * 平台配置常量
 */
export const PLATFORMS = {
  CURSOR: {
    id: 'CURSOR',
    label: 'Cursor',
    file: '.cursorrules',
  },
  TRAE: {
    id: 'TRAE',
    label: 'Trae',
    file: '.traerules',
  },
  WINDSURF: {
    id: 'WINDSURF',
    label: 'Windsurf',
    file: '.windsurfrules',
  },
  VSCODE: {
    id: 'VSCODE',
    label: 'VS Code',
    file: '.github/copilot-instructions.md',
  },
  OTHERS: {
    id: 'OTHERS',
    label: 'Others',
    file: 'instructions.md',
  }
};

/**
 * 导出与复制的核心处理函数
 */
export const processRulesOutput = (baseContent, state, platformId) => {
  const { mode, selectedIds, locale, lastAction } = state;
  const platform = PLATFORMS[platformId] || PLATFORMS.OTHERS;
  
  // 构造轻量快照
  const snapshot = {
    m: mode,
    ids: selectedIds,
    ts: Date.now(),
    p: platformId // 记录来源平台
  };
  const b64 = btoa(encodeURIComponent(JSON.stringify(snapshot)));
  const isZh = locale === 'zh';

  let finalContent = "";

  switch (platformId) {
    case 'CURSOR':
    case 'TRAE':
      // 独立 IDE 方案：末尾隐藏注释
      finalContent = `${baseContent}\n\n${isZh ? '### 🧠 连续记忆' : '### 🧠 Continuity'}\n<!-- RIVETLY_SNAPSHOT_START\n${b64}\nRIVETLY_SNAPSHOT_END -->\n`;
      break;

    case 'WINDSURF':
      // Windsurf 方案：置顶任务摘要，引导 Flow 模式
      const wsHeader = isZh
        ? `# 任务上下文\n- 模式: ${mode}\n- 快照: ${JSON.stringify(snapshot)}\n\n`
        : `# TASK CONTEXT\n- Mode: ${mode}\n- Snapshot: ${JSON.stringify(snapshot)}\n\n`;
      finalContent = `${wsHeader}${baseContent}`;
      break;

    case 'VSCODE':
      // VS Code 方案：适配 Copilot 规范
      finalContent = `## 🧠 Session Context\n\n\n${baseContent}`;
      break;

    default:
      // 通用方案：Claude / Antigravity 等
      const header = isZh ? `[记忆恢复: ${mode}]\n` : `[RESUME: ${mode}]\n`;
      finalContent = `${header}${baseContent}`;
  }

  return {
    content: finalContent,
    fileName: platform.file
  };
};

/**
 * 简化的导出逻辑（去掉了云端同步代码）
 * 包含复制到剪贴板和本地记录
 */
export const handleExport = (platformId, state, baseContent, showToast) => {
  const { content, fileName } = processRulesOutput(baseContent, state, platformId);
  
  // 1. 执行复制
  navigator.clipboard.writeText(content);
  
  // 2. 本地记录（作为最后的保险）
  localStorage.setItem('last_exported_snapshot', JSON.stringify({
    platform: platformId,
    timestamp: Date.now()
  }));

  // 3. 提示用户（不提同步，只提快照）
  if (showToast) {
    showToast(state.locale === 'zh' ? "已包含记忆快照" : "Snapshot included");
  }

  return { content, fileName };
};

/**
 * 自动化下载函数
 */
export const handleDownload = (baseContent, state, platformId, showToast) => {
  const { content, fileName } = processRulesOutput(baseContent, state, platformId);
  
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  // 自动对齐文件名：如 .traerules 或 .cursorrules
  link.download = fileName.includes('/') ? fileName.split('/').pop() : fileName;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // 增加本地记录和提示，保持与 handleExport 逻辑一致
  localStorage.setItem('last_exported_snapshot', JSON.stringify({
    platform: platformId,
    timestamp: Date.now()
  }));
  
  if (showToast) {
    showToast(state.locale === 'zh' ? "文件已包含快照" : "File includes snapshot");
  }
};
