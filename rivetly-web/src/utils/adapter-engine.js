import config from '../config/config.json';

/**
 * 增强用户输入的 Prompt
 */
function wrapUserPrompt(input) {
  if (input.length < 10) {
    return `Instruction: ${input}. (Strictly follow this during code generation)`;
  }
  if (input.length < 30) {
    return `${input} (Important: strictly enforce this rule)`;
  }
  return input;
}

export function generateFinalPrompt({ mode: activeModeId, selectedIds, customConstraints = [], platform, locale }) {
  // 1. 基础数据准备
  const modeData = config.modes[activeModeId] || config.modes.feature;
  const date = new Date().toISOString().split('T')[0];
  const modeLabel = modeData.label || activeModeId.toUpperCase();

  // 2. 生成动态描述信息
  const dynamicDesc = locale === 'zh'
    ? `模式: ${modeLabel} | 规则: ${selectedIds.length}项 | 日期: ${date}`
    : `Mode: ${modeLabel} | Rules: ${selectedIds.length} | Date: ${date}`;

  // A. 语义权重：定义角色与任务模式
  let prompt = `# ROLE: Full-stack Senior Architect (Efficiency & Quality Focus) [!] \n`;
  prompt += `## PRIMARY GOAL: ${activeModeId.toUpperCase()} MODE ACTIVE \n\n`;

  // B. 结构化格式：核心原则
  prompt += `<rules>\n`;
  prompt += `- [CRITICAL] Prioritize clean architecture and DRY principles.\n`;
  prompt += `- Always ensure new features include error handling and basic logging.\n`;
  prompt += `</rules>\n\n`;

  // C. 负向约束集成
  prompt += `<constraints>\n`;
  
  // 1. 处理系统预设约束（包括 zh_response）
  selectedIds.forEach(id => {
      const constraint = config.constraints[id];
      if (constraint) {
          // 这里是逻辑解耦的关键：不再判断 locale，而是直接根据勾选的 ID 注入指令
          const negativePart = constraint.negative_prompt ? ` [NEGATIVE: ${constraint.negative_prompt}]` : '';
          prompt += `- ${constraint.label}: ${constraint.prompt}${negativePart}\n`;
      }
  });

  // 2. 注入自定义约束
  customConstraints.forEach(rule => {
      if (selectedIds.includes(rule.id)) {
          prompt += `- Custom Rule: ${wrapUserPrompt(rule.prompt)}\n`;
      }
  });

  // 3. 自动行为触发逻辑
  if (selectedIds.includes('continuity_memory')) {
    prompt += `\n### 🤖 AUTOMATED BEHAVIORS\n<automation>\n  1. **On Startup**: Check for 'CONTEXT.md' or R2 snapshot. If found, ask: "Detected Continuity Memory. Sync latest progress from R2?"\n  2. **On Task Completion**: When user says "done" or "thanks", suggest: "Task complete. Run 'Sync Progress' to save snapshot to R2?"\n</automation>\n`;
  }

  prompt += `</constraints>\n`;

  // 3. 多平台统一输出处理
  
  // A. Windsurf 特殊处理
  if (platform === 'windsurf') {
    const windsurfHeader = `# Windsurf AI Rules\n# ${dynamicDesc}`;
    return `${windsurfHeader}\n\n<memories>\n  <instruction_set>\n${prompt.split('\n').map(l => `    ${l}`).join('\n')}\n  </instruction_set>\n</memories>`;
  }

  // B. Cursor / Trae / 通用预览
  // 使用标准的 Markdown 注释或首行标题
  const universalHeader = `# Rivetly AI Config\n# ${dynamicDesc}\n\n`;
  return universalHeader + prompt;
}
