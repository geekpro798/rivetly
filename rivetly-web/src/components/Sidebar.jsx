import React from 'react';
import * as Icons from 'lucide-react';
import ModeSwitcher from './ModeSwitcher';
import config from '../config/config.json';
import templates from '../config/templates.json';
import { UI_TEXT } from '../config/i18n';
import { generateFinalPrompt } from '../utils/adapter-engine';
import { PLATFORMS, handleExport } from '../utils/platformManager';
import { getVsCodeApi } from '../utils/vscode';

/**
 * 强制将内容转换为当前语言字符串，防止 React 渲染对象导致崩溃
 * 放在组件外，确保全局可用，不被混淆干扰
 */
const getLabel = (field, currentLocale) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    // 核心修复：根据当前 locale 提取，如果 locale 不存在则降级到英文
    return field[currentLocale] || field["en"] || field["zh"] || "";
};

const safeT = getLabel;

export default function Sidebar({ mode: activeMode, setMode, selectedIds, toggleId, locale, showToast, customConstraints, addCustomRule, removeCustomRule, isNarrow }) {
    const [isAdding, setIsAdding] = React.useState(false);
    const [activeCategory, setActiveCategory] = React.useState(null);
    const [tempLabel, setTempLabel] = React.useState('');
    const [tempPrompt, setTempPrompt] = React.useState('');
    const [deleteConfirmId, setDeleteConfirmId] = React.useState(null); // 删除确认状态
    const [copied, setCopied] = React.useState(false);
    // 防御性获取翻译对象
    const t = UI_TEXT[locale] || UI_TEXT['en'];

    const handleNarrowExport = () => {
        // Default to Cursor for quick export in narrow mode
        const platform = 'cursor';
        const currentPlatform = PLATFORMS['CURSOR'];
        
        const content = generateFinalPrompt({
            mode: activeMode,
            selectedIds,
            customConstraints,
            platform,
            locale
        });

        const vscode = getVsCodeApi();

        if (vscode) {
            vscode.postMessage({ 
                command: 'updateRules', 
                content: content, 
                fileName: currentPlatform.file 
            });
            return;
        }

        handleExport('CURSOR', { mode: activeMode, selectedIds, locale }, content, showToast);
        
        setCopied(false);
        setTimeout(() => setCopied(true), 10);
        setTimeout(() => setCopied(false), 2000);
    };

    // 动态占位符
    const dynamicPlaceholder = locale === 'zh' 
        ? '所有的 API 请求必须包含错误处理...' 
        : 'All API requests must include error handling...';

    const handleModeChange = (id) => {
        setMode(id);
        const modeConfig = config.modes[id];
        if (modeConfig && modeConfig.recommendedConstraints) {
            const recommendedNames = modeConfig.recommendedConstraints
                .map(cid => t.items?.[cid])
                .filter(Boolean)
                .join(', ');

            if (recommendedNames) {
                const hint = (t.recommendation_hint || "Tip: {constraints}").replace('{constraints}', recommendedNames);
                showToast(hint);
            }
        }
    };


    const handleCategoryClick = (catId) => {
        setActiveCategory(prev => prev === catId ? null : catId);
    };

    // 点击外部关闭删除确认对话框
    React.useEffect(() => {
        const handleClickOutside = () => {
            if (deleteConfirmId) {
                setDeleteConfirmId(null);
            }
        };

        if (deleteConfirmId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [deleteConfirmId]);

    return (
        <div className={`flex-1 flex flex-col ${isNarrow ? 'pb-24' : ''}`}>

            {/* 1. Programming Modes (Full Width with Bottom Border) */}
            <ModeSwitcher 
                activeMode={activeMode} 
                setMode={handleModeChange} 
                locale={locale} 
            />

            {/* 2. Global Constraints (Content with Padding) */}
            <div className="p-6 space-y-10">
                <section className="space-y-4">
                    <div className="flex items-center justify-between group/title mb-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            {t.constraints}
                        </h3>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="p-1 rounded-md hover:bg-orange-500/20 text-slate-500 hover:text-orange-500 transition-all active:scale-90 cursor-pointer"
                            title={locale === 'zh' ? '添加自定义约束' : 'Add Custom Constraint'}
                        >
                            <Icons.Plus size={14} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Add Form */}
                        {isAdding && (
                            <div className="p-4 bg-slate-800/40 rounded-xl border border-orange-500/30 animate-in fade-in slide-in-from-top-2 space-y-4">
                                <div>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder={locale === 'zh' ? '规则名称（例如：变量命名规范）' : 'Rule Label (e.g., Variable Naming)'}
                                        className="w-full bg-transparent border-b border-slate-700 py-1 text-sm outline-none mb-3 text-slate-200 focus:border-orange-500/50 transition-colors"
                                        value={tempLabel}
                                        onChange={(e) => setTempLabel(e.target.value)}
                                    />
                                    <textarea
                                        placeholder={`${locale === 'zh' ? '例如：' : 'e.g., '}${dynamicPlaceholder}`}
                                        className="w-full bg-slate-900/50 rounded-lg p-2 text-xs h-24 outline-none text-slate-300 focus:ring-1 focus:ring-orange-500/30 transition-all resize-none"
                                        value={tempPrompt}
                                        onChange={(e) => setTempPrompt(e.target.value)}
                                    />

                                    {/* 教育性微文案 */}
                                    <div className="mt-2 p-2 bg-slate-900/30 rounded-lg border border-slate-800/50">
                                        <p className="text-[9px] text-slate-500 leading-relaxed">
                                            {locale === 'zh' ? (
                                                <>
                                                    💡 <span className="text-slate-400 font-semibold">高质量约束包含：</span>
                                                    <span className="text-orange-400"> WHAT</span>（对象）+
                                                    <span className="text-blue-400"> HOW</span>（标准）+
                                                    <span className="text-emerald-400"> WHY</span>（理由）
                                                </>
                                            ) : (
                                                <>
                                                    💡 <span className="text-slate-400 font-semibold">Quality constraints include:</span>
                                                    <span className="text-orange-400"> WHAT</span> (target) +
                                                    <span className="text-blue-400"> HOW</span> (standard) +
                                                    <span className="text-emerald-400"> WHY</span> (reason)
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* 模板导入按钮组 (灵感来源) */}
                                <div className="mt-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 relative">
                                    <p className="text-[10px] text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                                        <Icons.Sparkles size={12} className="text-orange-500" />
                                        {locale === 'zh' ? '从大师模板快速导入' : 'Quick Import'}
                                    </p>

                                    {/* 分集标签组 - 点击切换 */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {templates.categories.map(cat => {
                                            const IconComponent = Icons[cat.icon] || Icons.HelpCircle;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleCategoryClick(cat.id)}
                                                    className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${activeCategory === cat.id
                                                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <IconComponent size={10} />
                                                    {getLabel(cat, locale)}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 子项内容展示区 - 仅在选中分类时显示 */}
                                    {activeCategory && templates.templates[activeCategory] && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 grid grid-cols-1 gap-1">
                                                {templates.templates[activeCategory].map((item, index) => {
                                                    // 检查该模板的 Prompt 是否已在 customConstraints 中
                                                    const isAdded = customConstraints.some(c => c.prompt === item.prompt);

                                                    return (
                                                        <button
                                                            key={index}
                                                            disabled={isAdded}
                                                            onClick={() => {
                                                                // 关键修复：根据当前语言环境存入对应标题
                                                                const labelText = locale === 'en' ? item.label.en : item.label.zh;
                                                                setTempLabel(labelText);
                                                                setTempPrompt(item.prompt); // Prompt 保持英文
                                                                setActiveCategory(null);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-[11px] text-slate-400 rounded-lg transition-colors group flex justify-between items-center ${isAdded
                                                                ? 'opacity-30 cursor-not-allowed'
                                                                : 'hover:bg-slate-800 hover:text-orange-500'
                                                                }`}
                                                        >
                                                            <span>{safeT(item.label, locale)}</span>
                                                            {isAdded ? (
                                                                <Icons.Check size={10} className="text-emerald-500" />
                                                            ) : (
                                                                <Icons.Plus size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-2">
                                    <button
                                        onClick={() => {
                                            setIsAdding(false);
                                            setActiveCategory(null);
                                            setTempLabel('');
                                            setTempPrompt('');
                                        }}
                                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {locale === 'zh' ? '取消' : 'Cancel'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (tempLabel && tempPrompt) {
                                                // 核心逻辑：寻找当前 Prompt 对应的模板对象
                                                let templateMatch = null;
                                                for (const category of Object.values(templates.templates)) {
                                                    const found = category.find(t => t.prompt === tempPrompt);
                                                    if (found) {
                                                        templateMatch = found;
                                                        break;
                                                    }
                                                }

                                                // 智能标签映射：如果来自模板，使用当前语言的标签；否则保留用户输入
                                                const finalLabel = templateMatch
                                                    ? (typeof templateMatch.label === 'string' ? templateMatch.label : (templateMatch.label[locale] || templateMatch.label['en']))
                                                    : tempLabel;

                                                addCustomRule(finalLabel, tempPrompt);
                                                showToast(locale === 'zh' ? '已添加自定义约束' : 'Added custom constraint');
                                                setTempLabel('');
                                                setTempPrompt('');
                                                setIsAdding(false);
                                                setActiveCategory(null);
                                            }
                                        }}
                                        className="text-xs bg-orange-500 text-slate-950 px-3 py-1 rounded-md font-bold hover:bg-orange-600 transition-colors"
                                    >
                                        {locale === 'zh' ? '保存' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Native Constraints */}
                        {Object.entries(config.constraints).map(([id, data]) => {
                                const currentModeConfig = config.modes[activeMode];
                                const isRecommended = currentModeConfig?.recommendedConstraints?.includes(id);
                                const isSelected = selectedIds.includes(id);

                                // 安全获取文本，提供回退值
                                const labelText = t.items?.[id] || safeT(data.label, locale) || id;
                                const descText = t.items?.[`${id}_desc`] || (data.prompt ? (data.prompt.length > 60 ? data.prompt.substring(0, 60) + "..." : data.prompt) : "No description");

                                return (
                                    <div
                                        key={id}
                                        onClick={() => toggleId(id)}
                                        className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 ${isRecommended && !isSelected
                                            ? 'bg-orange-500/5 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.03)]'
                                            : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-500/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-200">
                                                    {labelText}
                                                </span>
                                                {isRecommended && (
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-500 font-bold border border-orange-500/20">
                                                        {locale === 'zh' ? '推荐' : 'REC'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isSelected ? 'bg-orange-500' : 'bg-slate-700'}`}>
                                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ease-in-out ${isSelected ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed opacity-80 group-hover:opacity-100">
                                            {descText}
                                        </p>
                                        {id === 'continuity_memory' && isSelected && (
                                            <div className="flex items-center gap-1.5 mt-2">
                                                {/* 将橙色圆点改为更柔和的呼吸灯效果，不带具体品牌名 */}
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">
                                                    {locale === 'zh' ? '记忆已存入本地快照' : 'Saved to local snapshot'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                        {/* User Custom Constraints */}
                        {customConstraints.map(rule => {
                                const isSelected = selectedIds.includes(rule.id);

                                // 动态标签查找：根据 prompt 反向查找模板，实时渲染当前语言的标签
                                let displayLabel = rule.label;
                                for (const category of Object.values(templates.templates)) {
                                    const templateMatch = category.find(t => t.prompt === rule.prompt);
                                    if (templateMatch && templateMatch.label) {
                                        displayLabel = locale === 'zh' ? (templateMatch.label.zh || templateMatch.label.en) : templateMatch.label.en;
                                        break;
                                    }
                                }

                                return (
                                    <div
                                        key={rule.id}
                                        onClick={() => toggleId(rule.id)}
                                        className={`group cursor-pointer p-4 rounded-xl border border-dashed transition-all duration-200 relative ${isSelected
                                            ? 'bg-orange-500/5 border-orange-500/30'
                                            : 'bg-slate-800/20 border-slate-700/50 hover:border-slate-500/50'
                                            }`}
                                    >
                                        {/* Hover 显现的删除按钮 */}
                                        <button
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmId(rule.id);
                                            }}
                                        >
                                            <Icons.X size={10} />
                                        </button>

                                        {/* 删除确认气泡 */}
                                        {deleteConfirmId === rule.id && (
                                            <div className="absolute right-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-3 w-48 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <p className="text-[11px] text-slate-300 mb-3">
                                                    {locale === 'zh' ? '确定要删除这个约束吗？' : 'Delete this constraint?'}
                                                </p>
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirmId(null);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                                                    >
                                                        {locale === 'zh' ? '取消' : 'Cancel'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeCustomRule(rule.id);
                                                            showToast(locale === 'zh' ? '已移除自定义约束' : 'Removed custom constraint');
                                                            setDeleteConfirmId(null);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors font-bold"
                                                    >
                                                        {locale === 'zh' ? '删除' : 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-300">
                                                    {safeT(displayLabel, locale)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isSelected ? 'bg-orange-500' : 'bg-slate-700'}`}>
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ease-in-out ${isSelected ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                            "{rule.prompt.length > 50 ? rule.prompt.substring(0, 50) + '...' : rule.prompt}"
                                        </p>
                                    </div>
                                );
                            })}

                        {/* Empty State / Placeholder */}
                        {customConstraints.length === 0 && !isAdding && (
                            <div
                                onClick={() => setIsAdding(true)}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer group"
                            >
                                <Icons.Plus className="text-slate-600 group-hover:text-slate-400 mb-2 transition-colors" size={20} />
                                <span className="text-[10px] text-slate-500 font-medium">
                                    {locale === 'zh' ? '添加自定义约束' : 'Add Custom Constraint'}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sticky Export Button for Narrow Mode */}
                {isNarrow && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 border-t border-slate-800 backdrop-blur-sm z-50">
                        <button
                            onClick={handleNarrowExport}
                            className={`bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 ${isNarrow ? 'w-full py-3 text-base' : 'px-4 py-2 text-sm'}`}
                        >
                            {copied ? <Icons.Check size={18} /> : <Icons.Download size={18} />}
                            {locale === 'zh' ? '导出到 .cursorrules' : 'Export to .cursorrules'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
