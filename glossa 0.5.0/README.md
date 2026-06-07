# Glossa

Parallel question cards for long-form reading with multiple web LLMs.

Glossa is a local-first Chrome extension for researchers, students, and engineers who read dense papers, technical posts, and documentation. Highlight a confusing paragraph, save it as a question card, then route that question to ChatGPT, Claude, DeepSeek, Kimi, Qwen, Doubao, Grok, or other web LLMs.

Glossa is not just another summarizer. It is a question manager for serious reading.

## Why Glossa

Modern LLMs can produce very long answers. That is useful, but it creates a new reading problem:

- You ask GPT to explain a paper.
- The answer mentions a concept such as RDMA, KV cache, CXL, or Mooncake.
- You do not understand that term, so you ask a follow-up question.
- The model generates another long answer.
- Now you scroll back and forth between the paper, the original explanation, and the follow-up explanation.

This "scroll tax" breaks attention. Glossa turns that workflow into indexed, parallel question cards.

## The Core Idea

Think of Glossa like GPU-style parallelism for reading:

- A selected passage is a job.
- A question card is the job record.
- Each model is a worker lane.
- The side panel is the scheduler and index.
- Future answer collection lets you compare outputs without losing your place.

Instead of forcing all thinking through one long chat thread, Glossa lets you split confusion into smaller jobs and run them across multiple LLMs.

## Current Features

- Capture selected web text as question cards.
- Save source title and URL with every card.
- Manage cards in the Chrome side panel.
- Ask multiple model websites from one card.
- Generate a reusable research-reading prompt.
- Switch between prompt presets for different reading tasks.
- Edit and save your own prompt template.
- Build a question graph with follow-up cards.
- Jump back to the source page from a card when possible.
- Copy prompts automatically.
- Best-effort autofill into model input boxes.
- Clipboard capture for Chrome PDF viewer workflows.
- Local-first storage with `chrome.storage.local`.

## Supported Model Links

Glossa currently opens and attempts prompt autofill for:

- ChatGPT
- Claude
- DeepSeek
- Doubao
- Grok
- Qwen / Qianwen
- Kimi

Autofill is best-effort because web LLM interfaces change often. The prompt is always copied to your clipboard as a fallback.

## Installation

1. Clone this repository.
2. Open Chrome and visit `chrome://extensions`.
3. Enable Developer Mode.
4. Click Load unpacked.
5. Select the repository folder that contains `manifest.json`.

For this prototype, no build step is required.

## How To Use

### Normal Web Pages

1. Select text on any regular web page.
2. Click the floating Glossa button.
3. Open the side panel and find the saved card.
4. Use Source to jump back to the original passage when possible.
5. Use Follow-up to attach child questions to the current card.
6. Click Ask Models.
7. Choose a prompt preset or edit the prompt template.
8. Choose a model.
9. Glossa copies the prompt, opens the model page, and tries to fill the input box.

### Chrome PDF Viewer

Chrome's built-in PDF viewer does not expose normal page DOM to extension content scripts. For PDFs:

1. Select text in the PDF.
2. Press `Cmd+C` or `Ctrl+C`.
3. Open Glossa's side panel.
4. Click Save Clipboard.

## Product Vision

Glossa aims to reduce context switching in deep reading:

- Keep your place in the paper.
- Turn unknown concepts into reusable cards.
- Send different questions to different models.
- Compare model answers by card instead of by endless chat scrolling.
- Build a paper-level reading session from many small questions.

See [docs/vision.md](docs/vision.md) for the full vision.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

Short version:

- More reliable model adapters.
- Better PDF capture workflow.
- Answer collection from model pages.
- More reliable source anchors that jump back to exact source text.
- Tags, search, and paper sessions.
- Export to Markdown, Obsidian, and Notion.
- A plugin-style adapter API for new model websites.

## Architecture

Glossa is a Manifest V3 Chrome extension:

- `content.js` handles selection capture and best-effort model autofill.
- `background.js` stores cards and manages context menus.
- `sidebar.html`, `sidebar.js`, and `sidebar.css` implement the side panel.

See [docs/architecture.md](docs/architecture.md).

## Privacy

Glossa is local-first:

- Cards are stored in your browser via `chrome.storage.local`.
- The extension does not run a server.
- The extension does not send your cards to Glossa-owned infrastructure.
- When you open a model website, that website receives whatever prompt you paste or submit.

See [PRIVACY.md](PRIVACY.md).

## Known Limitations

- Chrome PDF viewer blocks normal floating button capture.
- Model page autofill is fragile because web LLM UIs change.
- Glossa currently opens web model pages rather than using official APIs.
- The prototype does not yet collect model answers back into cards.

## Contributing

Contributions are welcome, especially around model adapters, PDF capture, exports, and reading-session design.

Start with [CONTRIBUTING.md](CONTRIBUTING.md).

Good first issues:

- Add a model adapter.
- Improve prompt templates.
- Add card search.
- Add Markdown export.
- Create demo screenshots or GIFs.

## License

MIT. See [LICENSE](LICENSE).
