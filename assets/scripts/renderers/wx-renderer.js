/**
 * 微信公众号 Markdown 渲染器
 * 核心逻辑：将 Markdown 转换为带有内联样式（Inline Styles）的 HTML，
 * 以便直接复制粘贴到微信公众号后台。
 */
class WxRenderer {
    /**
     * 构造函数
     * @param {Object} opts - 配置选项
     * @param {Object} opts.theme - 主题配置对象
     * @param {string} opts.fonts - 字体设置
     * @param {string} opts.size - 字体大小
     */
    constructor(opts) {
        this.opts = opts;
        // 环境变量配置
        this.ENV_USE_REFERENCES = true; // 是否使用文末参考文献形式
        this.ENV_STRETCH_IMAGE = true;  // 是否拉伸图片以适应宽度

        this.footnotes = []; // 存储注脚信息
        this.footnoteIndex = 0; // 注脚计数器
        this.styleMapping = null; // 样式映射表

        // 等宽字体列表，用于代码块
        this.FONT_FAMILY_MONO = "Operator Mono, Consolas, Monaco, Menlo, monospace";
    }

    /**
     * 对象合并辅助函数 (Shallow Copy)
     * @param {Object} base - 基础对象
     * @param {Object} extend - 覆盖对象
     */
    copy(base, extend) {
        return Object.assign({}, base, extend);
    }

    /**
     * 构建页面主题样式
     * 将主题配置转换为实际的 CSS 样式对象
     * @param {Object} themeTpl - 主题模板
     */
    buildTheme(themeTpl) {
        const mapping = {};
        // 基础样式
        const base = this.copy(themeTpl.BASE, {
            'font-family': this.opts.fonts,
            'font-size': this.opts.size
        });
        // 块级元素基础样式
        const baseBlock = this.copy(base, {
            'margin': '20px 10px'
        });

        // 处理行内元素样式 (Inline Elements)
        for (const ele in themeTpl.inline) {
            if (themeTpl.inline.hasOwnProperty(ele)) {
                const style = themeTpl.inline[ele];
                if (ele === 'codespan') {
                    style['font-family'] = this.FONT_FAMILY_MONO;
                }
                mapping[ele] = this.copy(base, style);
            }
        }

        // 处理块级元素样式 (Block Elements)
        for (const ele in themeTpl.block) {
            if (themeTpl.block.hasOwnProperty(ele)) {
                const style = themeTpl.block[ele];
                if (ele === 'code') {
                    style['font-family'] = this.FONT_FAMILY_MONO;
                }
                mapping[ele] = this.copy(baseBlock, style);
            }
        }
        return mapping;
    }

    /**
     * 获取内联样式字符串
     * @param {string} tokenName - 元素名称 (如 h1, p, link)
     * @returns {string} - 生成的 style 属性字符串
     */
    getStyleString(tokenName) { // 重命名简写 S -> getStyleString 提高可读性
        const dict = this.styleMapping[tokenName];
        if (!dict) return '';

        const styles = [];
        for (const key in dict) {
            styles.push(`${key}:${dict[key]}`);
        }
        return `style="${styles.join(';')}"`;
    }

    /**
     * 添加注脚
     * @param {string} title - 链接标题
     * @param {string} link - 链接地址
     * @returns {number} - 注脚序号
     */
    addFootnote(title, link) {
        this.footnoteIndex += 1;
        this.footnotes.push([this.footnoteIndex, title, link]);
        return this.footnoteIndex;
    }

    /**
     * 构建文末注脚列表 HTML
     */
    buildFootnotes() {
        if (this.footnotes.length === 0) return '';

        const footnoteArray = this.footnotes.map(x => {
            if (x[1] === x[2]) {
                // 链接内容本身就是 URL
                return `<code style="font-size: 90%; opacity: 0.6;">[${x[0]}]</code>: <i>${x[1]}</i><br/>`;
            }
            return `<code style="font-size: 90%; opacity: 0.6;">[${x[0]}]</code> ${x[1]}: <i>${x[2]}</i><br/>`;
        });

        // Ensure footnotes inherit the global font settings
        const style = `font-family: ${this.opts.fonts}; font-size: ${this.opts.size}; line-height: 1.6; margin: 1em 0;`;
        return `<h3 ${this.getStyleString('h3')}>References</h3><p style="${style}">${footnoteArray.join('\n')}</p>`;
    }

    /**
     * 更新选项
     * @param {Object} newOpts 
     */
    setOptions(newOpts) {
        this.opts = this.copy(this.opts, newOpts);
    }

    /**
     * 检查是否存在注脚
     */
    hasFootnotes() {
        return this.footnotes.length !== 0;
    }

    /**
     * 获取 marked.js 渲染器实例
     * 此方法重写了 marked 的渲染方法以注入内联样式
     */
    getRenderer() {
        // 重置状态
        this.footnotes = [];
        this.footnoteIndex = 0;

        // 初始化样式映射
        this.styleMapping = this.buildTheme(this.opts.theme);

        const renderer = new marked.Renderer();

        // 注册各种自定义渲染函数

        // 标题
        renderer.heading = (text, level) => {
            const tagName = level < 3 ? 'h2' : 'h3';
            const style = this.getStyleString(tagName);
            return `<${tagName} ${style}>${text}</${tagName}>`;
        };

        // 段落
        renderer.paragraph = (text) => {
            return `<p ${this.getStyleString('p')}>${text}</p>`;
        };

        // 引用块
        renderer.blockquote = (text) => {
            return `<blockquote ${this.getStyleString('blockquote')}>${text}</blockquote>`;
        };

        // 代码块 (移动端优化 + 微信兼容 + 行内样式注入)
        renderer.code = (text, infostring) => {
            // text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // STOP double escaping! hljs does this.

            // 语法高亮
            let highlighted = '';
            let lang = infostring || '';

            if (window.hljs) {
                try {
                    if (lang && hljs.getLanguage(lang)) {
                        highlighted = hljs.highlight(text, { language: lang }).value;
                    } else {
                        const auto = hljs.highlightAuto(text);
                        highlighted = auto.value;
                        lang = lang || auto.language;
                    }
                } catch (e) {
                    console.warn('Highlight extraction failed', e);
                }
            }

            // Fallback: 如果没有高亮 (hljs失败或不存在), 则需手动转义
            if (!highlighted) {
                highlighted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }

            // Vibrant Mac / Dracula Hybrid 颜色映射 (高饱和度，拒绝单调)
            // 修复: 必须包含 'color:' 前缀，否则 style 属性无效
            const colorMap = {
                // Basis
                'hljs-comment': 'color: #6272a4; font-style: italic;', // Gray-Blue
                'hljs-quote': 'color: #6272a4; font-style: italic;',

                // Keywords -> Pink/Magenta (Mac Style)
                'hljs-keyword': 'color: #ff79c6; font-weight: bold;',
                'hljs-selector-tag': 'color: #ff79c6; font-weight: bold;',
                'hljs-addition': 'color: #ff79c6;',
                'hljs-literal': 'color: #bd93f9;', // Purple
                'hljs-section': 'color: #bd93f9;',
                'hljs-type': 'color: #8be9fd;', // Cyan
                'hljs-name': 'color: #50fa7b;', // Green (Function names usually)
                'hljs-selector-id': 'color: #ff79c6;',
                'hljs-selector-class': 'color: #8be9fd;',

                // Strings -> Yellow/Cream
                'hljs-string': 'color: #f1fa8c;',
                'hljs-meta-string': 'color: #f1fa8c;',
                'hljs-regexp': 'color: #ffb86c;', // Orange
                'hljs-attr': 'color: #50fa7b; font-weight: bold;', // Attributes Green
                'hljs-attribute': 'color: #50fa7b; font-weight: bold;',
                'hljs-variable': 'color: #f8f8f2;', // Default Text White
                'hljs-template-variable': 'color: #f8f8f2;',
                'hljs-class': 'color: #8be9fd;', // Cyan
                'hljs-title': 'color: #50fa7b; font-weight: bold;', // Function Def Green
                'hljs-symbol': 'color: #bd93f9;',
                'hljs-bullet': 'color: #bd93f9;',
                'hljs-link': 'color: #8be9fd; text-decoration: underline;',

                // Functions & Params
                'hljs-function': 'color: #ff79c6;', // function keyword should be pink, title is green
                'hljs-params': 'color: #ffb86c; font-style: italic;', // Orange Italic
                'hljs-built_in': 'color: #8be9fd; font-style: italic;', // Cyan Italic

                // Numbers -> Purple
                'hljs-number': 'color: #bd93f9;',

                // Meta
                'hljs-meta': 'color: #ff79c6;',
                'hljs-meta-keyword': 'color: #ff79c6;',

                // Tags
                'hljs-tag': 'color: #ff79c6;',

                // Specifics
                'hljs-emphasis': 'font-style: italic;',
                'hljs-strong': 'font-weight: bold; color: #ffb86c;',
                'hljs-formula': 'color: #bd93f9;',

                // Modern JS/TS specific
                'hljs-property': 'color: #66d9ef;', // Sky Blue
                'hljs-operator': 'color: #ff79c6;', // Pink operators
                'hljs-punctuation': 'color: #f8f8f2;',
            };

            // 增强的正则：兼容带有其他属性的 span 标签 (例如 class="hljs-keyword" data-v-xxx)
            highlighted = highlighted.replace(/<span class="([^"]+)"[^>]*>/g, (match, classNames) => {
                const classes = classNames.split(' ');
                let css = '';
                classes.forEach(c => {
                    if (colorMap[c]) {
                        css += colorMap[c] + ' ';
                    }
                });
                if (css) {
                    return `<span style="${css.trim()}">`;
                }
                return match; // 没有匹配到颜色，保持原样
            });

            // 容器样式 (完美复刻微信官方代码块风格)
            // 1. 背景色: #1F1F1F (Deep Dark)
            // 2. Padding: 15px (Breathable)
            // 3. Radius: 6px (Modern)
            // 4. LineHeight: 1.6 (Readable)
            // 5. FontSize: 13px (Compact)
            const languageLabel = lang ? `<div style="position: absolute; top: 8px; right: 12px; font-size: 12px; color: rgba(255,255,255,0.4); pointer-events: none; user-select: none;">${lang}</div>` : '';

            const body = `<section style="position: relative; margin: 10px 0; padding: 16px; background: #282c34; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow-x: auto; -webkit-overflow-scrolling: touch;">
                ${languageLabel}
                <code style="display: block; font-family: 'Operator Mono', 'Consolas', 'Menlo', 'Monaco', monospace; font-size: 14px; line-height: 1.6; color: #abb2bf; white-space: pre; background: transparent; border: none; padding: 0; margin: 0;">${highlighted}</code>
            </section>`;

            return body;
        };

        // 行内代码
        renderer.codespan = (text, infostring) => {
            return `<code ${this.getStyleString('codespan')}>${text}</code>`;
        };

        // 列表项
        renderer.listitem = (text) => {
            return `<li ${this.getStyleString('listitem')}>${text}</li>`;
        };

        // 列表
        renderer.list = (text, ordered, start) => {
            const tagName = ordered ? 'ol' : 'ul';
            const style = this.getStyleString(tagName);
            return `<${tagName} ${style}>${text}</${tagName}>`;
        };

        // 链接
        renderer.link = (href, title, text) => {
            const isMpLink = href.match(/^https?:\/\/mp\.weixin\.qq\.com/);
            const style = isMpLink ? this.getStyleString('link') : this.getStyleString('link') + '; cursor: default; opacity: 0.8;';
            const titleAttr = title ? `title="${title}"` : '';
            return `<a href="${href}" ${titleAttr} ${style}>${text}</a>`;
        };

        // 水平分割线
        renderer.hr = () => {
            const style = this.getStyleString('hr');
            // Default style if not provided by theme
            const defaultStyle = 'border: 0; border-top: 1px solid #eee; margin: 32px 0;';
            const finalStyle = style ? style : `style="${defaultStyle}"`;
            return `<hr ${finalStyle} />`;
        };

        // 图片
        renderer.image = (href, title, text) => {
            const styleKey = this.ENV_STRETCH_IMAGE ? 'image' : 'image_org';
            return `<img ${this.getStyleString(styleKey)} src="${href}" title="${title || ''}" alt="${text || ''}"/>`;
        };

        // 链接
        renderer.link = (href, title, text) => {
            // 微信文章链接直接跳转
            if (href.indexOf('https://mp.weixin.qq.com') === 0) {
                return `<a href="${href}" title="${title || text}" ${this.getStyleString('wx_link')}>${text}</a>`;
            }
            // 锚点链接等不做处理
            else if (href === text) {
                return text;
            }
            // 外部链接转注脚
            else {
                if (this.ENV_USE_REFERENCES) {
                    const ref = this.addFootnote(title || text, href);
                    return `<span ${this.getStyleString('link')}>${text}<sup>[${ref}]</sup></span>`;
                } else {
                    return `<a href="${href}" title="${title || text}" ${this.getStyleString('link')}>${text}</a>`;
                }
            }
        };

        // 强调 (Bold)
        renderer.strong = (text) => {
            return `<strong ${this.getStyleString('strong')}>${text}</strong>`;
        };

        // 强调 (Italic) - 映射到 strong 样式，因为微信对斜体支持不稳定且不美观
        renderer.em = (text) => {
            return `<strong ${this.getStyleString('strong')}>${text}</strong>`;
        };

        // 表格
        renderer.table = (header, body) => {
            return `<table ${this.getStyleString('table')}><thead ${this.getStyleString('thead')}>${header}</thead><tbody>${body}</tbody></table>`;
        };

        // 表格单元
        renderer.tablecell = (text, flags) => {
            const tagName = flags.header ? 'th' : 'td';
            // 获取对应标签的样式 (th 或 td)
            let style = this.getStyleString(tagName);

            // 处理对齐方式
            // 如果是表头 (flags.header)，强制居中，忽略 markdown 的对齐标记
            if (flags.header) {
                const alignStyle = `text-align: center;`;
                if (style.includes('style="')) {
                    style = style.replace('style="', `style="${alignStyle}`);
                } else {
                    style = `style="${alignStyle}"`;
                }
            } else if (flags.align) {
                // 表身 (td) 遵循 markdown 对齐
                const alignStyle = `text-align:${flags.align};`;
                if (style.includes('style="')) {
                    style = style.replace('style="', `style="${alignStyle}`);
                } else {
                    style = `style="${alignStyle}"`;
                }
            }
            return `<${tagName} ${style}>${text}</${tagName}>`;
        };

        // 分割线
        renderer.hr = () => {
            return `<hr style="border-style: solid;border-width: 1px 0 0;border-color: rgba(0,0,0,0.1);-webkit-transform-origin: 0 0;-webkit-transform: scale(1, 0.5);transform-origin: 0 0;transform: scale(1, 0.5);">`;
        };

        // 注册拼音/注音插件
        if (typeof FuriganaMD !== 'undefined' && FuriganaMD.register) {
            FuriganaMD.register(renderer);
        }

        return renderer;
    }
}
