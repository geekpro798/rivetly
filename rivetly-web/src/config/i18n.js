// src/config/i18n.js
export const UI_TEXT = {
    en: {
        prog_mode: "PROGRAMMING MODE",
        modes: {
            feature: { label: "Feature", icon: 'Zap' },
            testing: { label: "Testing", icon: 'ShieldCheck' },
            refactor: { label: "Refactor", icon: 'RotateCcw' }
        },
        lang_settings: "LANGUAGE SETTINGS",
        constraints: "GLOBAL CONSTRAINTS",
        items: {
            zh_response: "Chinese Response",
            zh_response_desc: "Force AI to reply in Chinese",
            strict_ts: "Strict TypeScript",
            strict_ts_desc: "No 'any', explicit returns",
            concise: "Concise Mode",
            concise_desc: "Code only, no talk",
            functional: "Functional Pattern",
            functional_desc: "Pure functions & immutability",
            no_deps: "No External Deps",
            no_deps_desc: "Prefer built-in modules",
            continuity_memory: "Continuity Memory",
            continuity_memory_desc: "Sync context across devices",
            continuity_memory_status: "Synced to cloud: 2m ago"
        },
        recommendation_hint: "Tip: {constraints} is suggested for this mode.",
        custom_section: "User Custom",
        label_placeholder: "Label name...",
        prompt_placeholder: "Enter prompt constraint...",
        add_btn: "Add",
        cancel_btn: "Cancel",
        sync_profile: "Sync Profile"
    },
    zh: {
        prog_mode: "编程模式",
        modes: {
            feature: { label: "功能开发", icon: 'Zap' },
            testing: { label: "测试模式", icon: 'ShieldCheck' },
            refactor: { label: "重构模式", icon: 'RotateCcw' }
        },
        lang_settings: "语言设置",
        constraints: "全局约束",
        items: {
            zh_response: "中文响应",
            zh_response_desc: "强制 AI 使用中文回覆",
            strict_ts: "严格 TypeScript",
            strict_ts_desc: "禁止 any，显式返回类型",
            concise: "极简模式",
            concise_desc: "仅出代码，减少废话",
            functional: "函数式编程",
            functional_desc: "优先纯函数与不可变数据",
            no_deps: "无外部依赖",
            no_deps_desc: "使用内置模块拒绝 bloat",
            continuity_memory: "连续记忆",
            continuity_memory_desc: "跨设备自动同步上下文",
            continuity_memory_status: "已同步至云端：2分钟前"
        },
        recommendation_hint: "该模式下建议开启: {constraints}",
        custom_section: "用户自定义",
        label_placeholder: "标签名称...",
        prompt_placeholder: "输入提示词约束...",
        add_btn: "添加",
        cancel_btn: "取消"
    }
};
