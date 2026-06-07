# Contributing to Glossa

Thanks for considering a contribution. Glossa is early, so small focused improvements are especially valuable.

## Development Setup

1. Clone the repository.
2. Open `chrome://extensions`.
3. Enable Developer Mode.
4. Click Load unpacked.
5. Select the repository folder containing `manifest.json`.
6. After editing files, click the reload button on the extension card.

No build step is required for the current prototype.

## Useful Test Cases

Before opening a pull request, test:

- Capture selected text on a normal web page.
- Save clipboard text from Chrome PDF viewer.
- Open the side panel and render saved cards.
- Click Ask Models and verify prompt generation.
- Open at least one model page and verify prompt copy/autofill fallback.
- Delete a card.

## Contribution Areas

Good areas to work on:

- Model adapters.
- PDF capture workflow.
- Prompt templates.
- Card search and tags.
- Markdown or Obsidian export.
- UI polish.
- Documentation and demo assets.

## Model Adapter Guidelines

Model websites change frequently. Any adapter should:

- Keep selectors narrow and readable.
- Provide clipboard fallback.
- Avoid automatic submit.
- Fail silently on the model page and keep the website usable.
- Avoid collecting private answer text unless the user explicitly asks for it.

## Code Style

- Keep the extension dependency-free unless a dependency clearly pays for itself.
- Prefer small functions and explicit message names.
- Add comments only where behavior is not obvious.
- Avoid unrelated refactors in focused pull requests.

## Privacy Principles

Glossa should remain local-first by default. Do not add network calls, telemetry, or sync behavior without a clear design discussion.
