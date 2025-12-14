/**
 * 应用程序主逻辑 (Vue 实例)
 * 负责管理编辑器状态、UI 交互以及与 WxRenderer 的通信
 */
const app = new Vue({
  el: '#app',
  data: function () {
    return {
      title: 'MDWX', // 页面标题
      aboutOutput: '', // 关于页面的渲染内容
      output: '', // 渲染后的 HTML 输出
      source: '', // Markdown 源码

      // 编辑器主题列表
      editorThemes: [
        { label: 'base16-light', value: 'base16-light' },
        { label: 'duotone-light', value: 'duotone-light' },
        { label: 'monokai', value: 'monokai' }
      ],
      currentEditorTheme: 'base16-light', // 当前编辑器主题
      editor: null, // CodeMirror 编辑器实例

      // 内置字体选项 (按衬线和无衬线分类)
      // 内置字体选项 (按衬线和无衬线分类)
      builtinFonts: [
        { label: '衬线体 (Serif)', value: "'PT Serif', 'Songti SC', 'Source Han Serif CN', 'Noto Serif SC', 'SimSun', serif" },
        { label: '无衬线体 (Sans-serif)', value: "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', sans-serif" }
      ],
      currentFont: 'serif',

      // 字体大小选项 (User Customized)
      currentSize: '15px', // Default to 15px
      sizeOption: [
        { label: '14px', value: '14px', desc: '极小' },
        { label: '15px', value: '15px', desc: '小号' },
        { label: '16px', value: '16px', desc: '标准' },
        { label: '18px', value: '18px', desc: '大号' },
        { label: '20px', value: '20px', desc: '特大' }
      ],

      // 排版主题选项
      currentTheme: 'tickmao',
      themeOption: [
        { label: 'Default', value: 'tickmao', author: 'Lyle' },
        { label: 'Tickmao', value: 'default', author: 'Lyric' },
        { label: 'Medium', value: 'medium', author: 'Focus' },
        { label: 'Instapaper', value: 'instapaper', author: 'Focus' },
        { label: 'Shimo', value: 'shimo', author: 'Focus' },
        { label: 'Orange', value: 'orange', author: 'Focus' }
      ],
      // 主题对象映射
      styleThemes: {
        tickmao: tickmaoTheme,
        default: defaultTheme,
        medium: focusMediumTheme,
        instapaper: focusInstapaperTheme,
        shimo: focusShimoTheme,
        orange: focusOrangeTheme
      },

      aboutDialogVisible: false, // 关于弹窗可见性
      currentDate: '', // Current formatted date for preview

      // Mobile Adaptation State
      isMobile: false,
      activeView: 'editor', // 'editor' | 'preview'
      mobileMenuVisible: false // Bottom Sheet visibility
    };
  },

  /**
   * Vue 生命周期：挂载后
   * 初始化编辑器和渲染器
   */
  mounted: function () {
    var self = this;

    // Set Current Date (WeChat Format: 2024年5月1日 12:00)
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.currentDate = `${dateStr} ${timeStr}`;

    // 初始化 CodeMirror 编辑器
    this.editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
      lineNumbers: false, // 不显示行号，保持界面简洁
      lineWrapping: true, // 自动换行
      styleActiveLine: true, // 高亮当前行
      theme: this.currentEditorTheme,
      mode: 'text/x-markdown',
      viewportMargin: Infinity, // CRITICAL: Disable virtualization, render all content. Solves "Blank on Scroll".
    });

    // Strategy Change: Auto-Height
    // We let CodeMirror grow naturally and let the parent container handle scrolling.
    // This removes the need for complex height calculations and manual refresh.
    setTimeout(() => {
      self.editor.refresh();
    }, 100);

    // 工具函数：防抖 (提升性能的核心)
    function debounce(func, wait) {
      let timeout;
      return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          func.apply(context, args);
        }, wait);
      };
    }

    // 监听编辑器变化，实时刷新预览 (加入 300ms 防抖)
    // 之前是每次击键都渲染，现在改为停止输入 300ms 后再渲染，大幅降低 CPU 占用
    this.editor.on("change", debounce(function (cm, change) {
      // SSOT Pattern: Sync data immediately
      self.source = self.editor.getValue();
      self.refresh();
    }, 300));

    // 初始化微信渲染器
    this.wxRenderer = new WxRenderer({
      theme: this.styleThemes.tickmao,
      fonts: this.currentFont,
      size: this.currentSize
    });

    // 加载默认示例文档
    axios({
      method: 'get',
      url: './assets/default-content.md',
    }).then(function (resp) {
      self.source = resp.data; // Init source
      self.editor.setValue(resp.data);
      // refresh() will be called by 'change' event or manually
    }).catch(function (error) {
      console.error('Failed to load default content:', error);
      const errorMsg = '# 欢迎使用 MDWX\n\n编辑器加载失败，请检查网络连接。';
      self.source = errorMsg;
      self.editor.setValue(errorMsg);
    });

    // Reliable Sync Scroll (Mouseover Lock)
    // Avoids circular loops and jitter by ensuring only the hovered element drives the scroll.
    this.$nextTick(() => {
      const leftCol = document.querySelector('.editor-col');

      // Fix: Select correct preview wrapper based on visibility (Desktop vs Mobile)
      // Since desktop-preview is always first in DOM, querySelector('.preview-wrapper') picks it even if hidden.
      let rightCol = document.querySelector('.preview-wrapper.mobile-view .preview');
      if (!rightCol || rightCol.offsetParent === null) {
        rightCol = document.querySelector('.preview-wrapper.desktop-preview .preview');
      }

      // Fallback if neither standard class works (robustness)
      if (!rightCol) rightCol = document.querySelector('.preview-wrapper');

      let activeSide = null; // 'left' or 'right'

      if (leftCol && rightCol) {
        // Detect which side is active
        leftCol.addEventListener('mouseenter', () => { activeSide = 'left'; });
        rightCol.addEventListener('mouseenter', () => { activeSide = 'right'; });

        // Left controls Right
        leftCol.addEventListener('scroll', () => {
          if (activeSide === 'left') {
            const percentage = leftCol.scrollTop / (leftCol.scrollHeight - leftCol.offsetHeight);
            // Direct requestAnimationFrame for smoothness could be added, but direct set is usually fine for simple sync
            rightCol.scrollTop = percentage * (rightCol.scrollHeight - rightCol.offsetHeight);
          }
        });

        // Right controls Left
        rightCol.addEventListener('scroll', () => {
          if (activeSide === 'right') {
            const percentage = rightCol.scrollTop / (rightCol.scrollHeight - rightCol.offsetHeight);
            leftCol.scrollTop = percentage * (leftCol.scrollHeight - leftCol.offsetHeight);
          }
        });
      }

      // Initial scroll check for themes (Legacy)
      const themeGroup = document.getElementById('themeScroll');
      if (themeGroup) {
        this.checkScroll({ target: themeGroup });
        themeGroup.addEventListener('scroll', this.checkScroll);
      }
    });
  },

  methods: {
    /**
     * 核心渲染逻辑
     * @param {string} source - Markdown 源码
     * @returns {string} - 渲染后的 HTML
     */
    renderWeChat: function (source) {
      // Extract Title (First occurrence of # H1)
      const titleMatch = source.match(/^#\s+(.*)/m);
      if (titleMatch) {
        this.title = titleMatch[1];
        // Remove the extracted title from the body content to prevent duplication
        source = source.replace(titleMatch[0], '');
      } else {
        this.title = 'MDWX，我也可以优雅的写作'; // Default fallback
      }

      try {
        let output = marked(source, { renderer: this.wxRenderer.getRenderer() });

        // 如果存在外部链接引用，追加注脚部分
        if (this.wxRenderer.hasFootnotes()) {
          output += this.wxRenderer.buildFootnotes();
        }
        return output;
      } catch (e) {
        console.error('Rendering Error:', e);
        return `<div style="color:red; padding:20px;">
          <h3>渲染错误</h3>
          <p>很抱歉，渲染文档时发生错误。</p>
          <pre>${e.message}</pre>
          <pre>${e.stack}</pre>
        </div>`;
      }
    },

    /**
     * 编辑器主题切换处理
     */
    editorThemeChanged: function (editorTheme) {
      this.editor.setOption('theme', editorTheme);
    },

    /**
     * 字体切换处理
     */
    fontChanged: function (fontKey) {
      const fontMap = {
        'serif': "'PT Serif', 'Songti SC', 'Source Han Serif CN', 'Noto Serif SC', 'SimSun', serif",
        'sans': "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', sans-serif"
      };
      const fontStack = fontMap[fontKey] || fontKey;
      this.wxRenderer.setOptions({
        fonts: fontStack
      });
      this.refresh();
    },

    /**
     * 字号切换处理
     */
    sizeChanged: function (size) {
      this.wxRenderer.setOptions({
        size: size
      });
      this.refresh();
    },

    /**
     * 排版主题切换处理
     */
    themeChanged: function (themeName) {
      const themeObject = this.styleThemes[themeName];
      this.wxRenderer.setOptions({
        theme: themeObject
      });
      this.refresh();
    },

    /**
     * 刷新预览区域
     */
    refresh: function () {
      // Logic: Use SSOT 'source' if available, fallback to editor.getValue() if source is empty (init edge case)
      const content = this.source || (this.editor ? this.editor.getValue() : '');
      this.output = this.renderWeChat(content);
    },

    /**
     * 复制功能
     * 将渲染区的内容复制到剪贴板，带有样式
     */
    copy: function () {
      let clipboardDiv = document.getElementById('output-mobile');
      if (!clipboardDiv || clipboardDiv.offsetParent === null) {
        clipboardDiv = document.getElementById('output-desktop');
      }

      if (!clipboardDiv) {
        this.$message({ message: '无法获取内容', type: 'warning' });
        return;
      }

      clipboardDiv.focus();
      window.getSelection().removeAllRanges();
      let range = document.createRange();
      range.setStartBefore(clipboardDiv.firstChild);
      range.setEndAfter(clipboardDiv.lastChild);
      window.getSelection().addRange(range);

      try {
        if (document.execCommand('copy')) {
          this.$message({ message: '已复制到剪贴板', type: 'success', customClass: 'about-dialog' });
        } else {
          this.$message({ message: '复制失败，请手动复制', type: 'warning' });
        }
      } catch (err) {
        console.error(err);
        this.$message({ message: '复制失败，请手动复制', type: 'warning' });
      }
      window.getSelection().removeAllRanges();
    },

    /**
     * Popover 显示时初始化滚动状态
     * 使用轮询机制确保在弹窗动画完成后准确计算
     */
    initScrollState: function () {
      this.showRightArrow = true; // 默认预显，避免闪烁

      const themeGroup = document.getElementById('themeScroll');
      if (!themeGroup) return;

      let attempts = 0;
      const maxAttempts = 10; // 50ms * 10 = 500ms

      const timer = setInterval(() => {
        attempts++;
        // 只有当元素真正可见且有宽度时才计算
        if (themeGroup.clientWidth > 0) {
          this.checkScroll({ target: themeGroup });
          // 如果已经成功获取宽度并计算，可以停止轮询吗？
          // 建议多检查几次以防动画过程中宽度变化，或者直接清除
          if (attempts > 5) clearInterval(timer);
        }

        if (attempts >= maxAttempts) clearInterval(timer);
      }, 50);
    },

    /**
     * 检查滚动状态 (For Themes)
     */
    checkScroll: function (event) {
      const el = event.target;
      if (!el || el.clientWidth === 0) return;

      // 容差值，避免高分屏下的浮点数问题
      const tolerance = 2;

      this.showLeftArrow = el.scrollLeft > tolerance;

      // 只有当 剩余可滚动距离 > 容差 时才显示右侧按钮
      // scrollWidth - (scrollLeft + clientWidth) > tolerance
      const remaining = el.scrollWidth - (el.scrollLeft + el.clientWidth);
      this.showRightArrow = remaining > tolerance;
    },

    scrollContainer: function (event, offset) {
      // Find wrapper then find the group inside it
      const wrapper = event.target.closest('.scroll-wrapper');
      if (wrapper) {
        const group = wrapper.querySelector('.scroll-group');
        if (group) {
          group.scrollBy({ left: offset, behavior: 'smooth' });
          // Note: The 'scroll' event listener on the group will trigger checkScroll
        }
      }
    },

    /**
     * Mobile Logic
     */
    checkMobile: function () {
      this.isMobile = window.innerWidth <= 768;
      // Reset menu if switching to desktop
      if (!this.isMobile) {
        this.mobileMenuVisible = false;
        this.activeView = 'editor'; // Default reset
      }
    }
  },

  created: function () {
    // Initial check
    this.checkMobile();
    window.addEventListener('resize', () => {
      this.checkMobile();
    });
  },

  watch: {
    // Fix: CodeMirror display bug when switching from hidden to visible
    activeView: function (newVal) {
      if (newVal === 'editor' && this.editor) {
        this.$nextTick(() => {
          this.editor.refresh();
        });
      } else if (newVal === 'preview') {
        // Critical Fix: Flux State immediately before render (SSOT)
        // Ensures that even if debounce hasn't fired, we capture the latest edits.
        if (this.editor) {
          this.source = this.editor.getValue();
        }
        // Force re-render when switching to preview to prevent blank screen
        this.refresh();
      }
    }
  }
});
