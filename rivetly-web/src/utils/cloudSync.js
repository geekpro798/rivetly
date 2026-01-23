import { supabase } from './supabaseClient';

/**
 * 将项目上下文同步至 Supabase 云端
 * @param {string} projectName - 项目名称 (如 'Rivetly-v1')
 * @param {object} contextData - 从 Trae 扫描到的规则和记忆摘要
 */
export const syncToCloud = async (projectName, contextData) => {
  try {
    // 1. 获取当前登录用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('未登录，无法同步');
      return { success: false, message: 'Auth session missing' };
    }

    // 2. 执行 upsert 操作
    // upsert 会根据 project_name 和 user_id 判断是新增还是更新
    const { data, error } = await supabase
      .from('user_contexts')
      .upsert({
        user_id: user.id, // 对应你设置的 auth.uid()
        project_name: projectName,
        context_snapshot: contextData, // 存入你的 jsonb 字段
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, project_name' // 确保同一个用户同一个项目只存一条
      });

    if (error) throw error;

    console.log('☁️ 同步成功:', data);
    return { success: true };

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    return { success: false, error: error.message };
  }
};
