# MDWX 排版全能指南

欢迎使用 **MDWX**，这是一款专为微信公众号打造的沉浸式 Markdown 编辑器。本文档将展示所有支持的排版样式，助您创作出完美的公众号文章。

## 1. 基础排版 (Typography)

我们精心调校了中英文混排的间距与行高，确保阅读体验舒适。

- **粗体强调**：使用 `**` 包裹，例如 **重点内容**。
- *斜体样式*：虽然微信对斜体支持有限，但我们依然为你保留（建议尽量少用）。
- ~~删除线~~：用于表示已过时或修正的内容。
- `行内代码`：用于高亮关键术语，如 `Variables` 或 `Function`。
- [链接样式](https://mp.weixin.qq.com)：外部链接在公众号中会自动转换为文末的**参考文献**脚注，而公众号文章链接则可以直接点击跳转。

---

## 2. 列表与嵌套 (Lists)

MDWX 完美支持多层级列表嵌套，逻辑清晰，层次分明。

### 无序列表
- 一级列表项：核心观点
  - 二级列表项：补充说明
  - 二级列表项：细节描述
    - 三级列表项：深入挖掘

### 有序列表
1. **准备阶段**：整理素材与大纲。
2. **撰写阶段**：
   1. 使用 Markdown 专注内容创作。
   2. 随时预览实际渲染效果。
3. **发布阶段**：点击右上角复制，粘贴至公众号后台。

---

## 3. 引用样式 (Blockquotes)

引用块非常适合用于摘录名言、强调警句或作为文章的导语。

> **“设计不仅仅是外观，更是运作方式。”**
> 
> —— Steve Jobs

多级引用演示：
> 一级引用：这是外层
> > 二级引用：这是内层嵌套，用于对话或深层引用。

---

## 4. 代码高亮 (Code Highlighting)

这是 MDWX 的强项。我们采用了**微信官方风格**的深色代码块，支持 100+ 种语言高亮，并优化了 Padding 与圆角，手机端阅读体验极佳。

**JavaScript / TypeScript**
```javascript
// 现代 JS 语法高亮演示
const greeting = (name) => {
  const date = new Date();
  return `Hello ${name}, it's ${date.getHours()} o'clock.`;
};

// 异步操作
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Data loaded:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**CSS / Styling**
```css
/* 优美的 CSS 样式 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
```

**Python / Data**
```python
# Python 数据处理示例
def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        next_val = sequence[-1] + sequence[-2]
        sequence.append(next_val)
    return sequence

print(f"Fib(10): {fibonacci(10)}")
```

**Bash / Terminal**
```bash
# 终端命令示例
$ npm install mdwx-cli -g
$ mdwx init my-project
$ cd my-project && npm start
> Server running at http://localhost:8080...
```

---

## 5. 表格样式 (Tables)

表格自动居中，带有优雅的边框与斑马纹，适合展示参数或对比数据。

| 功能 | 状态 | 说明 | 级别 |
| :--- | :---: | :--- | ---: |
| 实时预览 | ✅ | 双向同步 | High |
| 自动保存 | ✅ | 本地存储 | High |
| 代码高亮 | ✅ | 多语言 | Med |
| 外部图床 | ⏳ | 开发中 | Low |

---

## 6. 特殊元素

### 图片排版
支持图片自适应宽度，如果是高清大图，会自动缩放至屏幕宽度。
![MDWX 实时预览效果](https://s2.loli.net/2024/09/15/Tr3a218Zlpe4PjL.png)

### 分割线
用于分隔不同章节，增加呼吸感。

---

## 7. 脚注系统 (Footnotes)

当您在文中引用外部链接时，例如 [MDWX Github](https://github.com/tickmao) 或 [Markdown 指南](https://www.markdownguide.org)，MDWX 会自动将它们提取并生成如下的参考文献列表，符合微信公众号的规范。

愿 MDWX 成为您写作路上的得力助手。
**Happy Writing!**
