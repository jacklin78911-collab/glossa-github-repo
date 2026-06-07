# Glossa

Glossa 是一个面向论文阅读和长文本精读的 Chrome 扩展。它可以把你在网页中选中的文本保存成“问题卡片”，再把这些卡片发送到 ChatGPT、Claude、DeepSeek、Kimi、千问、豆包、Grok 等多个网页版 LLM。

Glossa 的目标不是再做一个“AI 总结器”，而是做一个严肃阅读时使用的**问题管理器**。

## 为什么做 Glossa

用 LLM 读论文时，一个很常见的问题是：模型回答太长，阅读过程变成了不停滚动。

比如你让 GPT 解读一篇论文。它解释得很详细，但中间突然提到 RDMA、CXL、Mooncake、KV Cache、disaggregated memory 这些概念。你又去追问“RDMA 是什么意思”，模型又生成一大段。然后你要在论文原文、第一段解释、子问题解释之间来回翻。

这种来回翻阅会打断注意力。Glossa 想解决的就是这个“滚动税”。

## 核心想法

Glossa 把长文本阅读变成一种并行的问题工作流：

- 选中的论文片段是一个任务。
- 问题卡片是任务记录。
- ChatGPT、Claude、DeepSeek、Kimi、千问、豆包、Grok 是不同的模型通道。
- 侧边栏是调度器和索引。
- 子问题卡片组成一张阅读问题图。

你不需要把所有问题塞进同一个超长聊天线程里。你可以把不同困惑拆成多个卡片，让多个模型并行回答，再回到卡片里整理理解路径。

## 当前功能

- 在普通网页中选中文字，显示 Glossa 浮动按钮。
- 点击按钮后保存选中文本、页面标题和来源信息。
- 在 Chrome 侧边栏中管理问题卡片。
- 支持 Follow-up 子问题，形成基础 Question Graph。
- 每张卡片支持 Source 按钮，尽量跳回原网页对应位置。
- 每张卡片支持 Ask Models。
- 支持多种 Prompt Presets：
  - Deep Read
  - Concept
  - Critique
  - Experiment
  - Formula
  - Compare
  - Follow-up
- 支持自定义 Prompt Template。
- 默认 Prompt 不包含来源 URL，避免不必要的信息暴露。
- 支持打开多个网页版模型并尝试自动填入 Prompt。
- 支持 Chrome PDF 阅读器中的剪贴板保存流程。
- 本地优先，卡片保存在 `chrome.storage.local`。

## 支持的模型入口

Glossa 当前支持打开并尝试自动填入 Prompt：

- ChatGPT
- Claude
- DeepSeek
- Doubao / 豆包
- Grok
- Qwen / 千问
- Kimi

模型网页经常改版，因此自动填入是 best-effort。即使自动填入失败，Prompt 也会被复制到剪贴板，可以直接粘贴。

## 安装方式

当前版本不需要构建步骤。

1. 下载或克隆本仓库。
2. 打开 Chrome。
3. 进入 `chrome://extensions`。
4. 打开右上角“开发者模式”。
5. 点击“加载已解压的扩展程序”。
6. 选择包含 `manifest.json` 的 `glossa` 目录。

更新代码后，需要在 `chrome://extensions` 里点击 Glossa 的刷新按钮。

## 使用方法

### 普通网页

1. 在网页中选中一段文字。
2. 点击出现的 `Glossa` 浮动按钮。
3. 打开右侧 Glossa 侧边栏。
4. 你会看到刚刚保存的问题卡片。
5. 点击 `Follow-up` 可以给当前卡片添加子问题。
6. 点击 `Source` 可以尽量跳回原网页对应位置。
7. 点击 `Ask Models`。
8. 选择 Prompt Preset，或手动编辑 Prompt Template。
9. 点击 ChatGPT / Claude / DeepSeek / Kimi 等模型按钮。
10. Glossa 会复制 Prompt，打开模型网页，并尝试自动填入输入框。

### Chrome PDF 阅读器

Chrome 内置 PDF 阅读器不允许普通扩展脚本进入 PDF 内部 DOM，所以无法像普通网页一样弹出 Glossa 浮动按钮。

PDF 中推荐这样使用：

1. 在 PDF 中选中文字。
2. 按 `Cmd+C` 或 `Ctrl+C`。
3. 打开 Glossa 侧边栏。
4. 点击 `Save Clipboard`。
5. 剪贴板内容会保存成问题卡片。

## Prompt Template

Glossa 的 Prompt 模板支持占位符：

```text
{{text}}   当前卡片文本
{{title}}  来源页面标题，可选
{{url}}    来源页面 URL，可选
```

默认模板只包含 `{{text}}`，不包含来源标题和 URL。

默认模板：

```text
You are my research reading assistant.

Please analyze the following excerpt from a paper or technical page.

Tasks:
1. Explain the key idea in clear Chinese.
2. Identify important terms, assumptions, and claims.
3. Point out what I should verify in the original paper.
4. Suggest 3 follow-up questions I can ask next.

Excerpt:
{{text}}
```

## 产品愿景

Glossa 想减少长文本阅读中的上下文切换：

- 不再因为模型长回答而反复滚动。
- 把“不懂的地方”变成可索引的问题卡片。
- 把子问题挂到原问题下面，形成 Question Graph。
- 同一个问题可以发送给多个模型比较回答。
- 每张卡片都尽量保留回到原文的路径。
- 最终形成一篇论文的阅读 Session。

更完整的愿景见 [docs/vision.md](docs/vision.md)。

## 架构

Glossa 是一个 Manifest V3 Chrome 扩展：

- `manifest.json`：扩展声明、权限、侧边栏和内容脚本配置。
- `content.js`：网页选区按钮、模型页面自动填入、Source 跳转。
- `background.js`：卡片存储、右键菜单、消息处理。
- `sidebar.html`：侧边栏结构。
- `sidebar.js`：卡片列表、问题图、Prompt、模型入口。
- `sidebar.css`：侧边栏样式。

详细说明见 [docs/architecture.md](docs/architecture.md)。

## 路线图

短期计划：

- 更稳定的网页选区保存。
- 更精确的 Source 定位。
- 卡片搜索和标签。
- 多模型回答状态记录。
- Markdown / Obsidian 导出。
- 更好的 PDF 工作流。
- 模型适配器系统。
- 多模型回答收集与对比。

完整路线图见 [docs/roadmap.md](docs/roadmap.md)。

## 已知限制

- Chrome 内置 PDF 阅读器限制较多，目前不能直接显示浮动按钮。
- 模型网页自动填入依赖网页结构，可能因各家改版而失效。
- 当前版本只打开网页版模型，不调用官方 API。
- 目前还没有把模型回答自动收集回卡片。
- Source 跳转在普通网页上是 best-effort，在复杂页面和 PDF 中不保证精确。

## 隐私

Glossa 是本地优先的扩展：

- 卡片存储在浏览器本地的 `chrome.storage.local`。
- Glossa 不运行自己的服务器。
- Glossa 不会把卡片上传到项目方服务器。
- 当你把 Prompt 发给某个模型网站时，该内容会由对应模型服务处理。

更多说明见 [PRIVACY.md](PRIVACY.md)。

## 适合谁

Glossa 适合：

- 读论文的研究生和科研人员。
- 阅读系统论文、技术博客、RFC 的工程师。
- 同时订阅多个 LLM，希望并行比较回答的用户。
- 不想在长回答里来回滚动的人。
- 想把“困惑”整理成结构化问题图的人。

## 贡献

欢迎贡献，尤其是：

- 新模型适配器。
- 更好的 PDF 捕获方式。
- Prompt Presets。
- 卡片搜索和标签。
- Markdown / Obsidian 导出。
- Demo 截图和 GIF。
- UI 改进。

贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

MIT. See [LICENSE](LICENSE).
