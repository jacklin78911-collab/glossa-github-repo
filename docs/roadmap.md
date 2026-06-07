# Roadmap

Glossa is early. The roadmap is organized around making the project useful first, then powerful.

## P0: Reliable Prototype

- [x] Chrome Manifest V3 extension.
- [x] Floating capture button on normal web pages.
- [x] Question cards in side panel.
- [x] Local card storage.
- [x] Manual PDF clipboard capture.
- [x] Prompt generation for cards.
- [x] Editable prompt template.
- [x] Prompt presets.
- [x] Follow-up cards for a basic question graph.
- [x] Source jump fallback for normal web pages.
- [x] Multi-model website links.
- [x] Best-effort prompt autofill.
- [ ] Fix capture retry failures on more websites.
- [ ] Add visible error messages for failed card creation.
- [ ] Add keyboard shortcut for saving selected text.

## P1: Better Reading Workflow

- [ ] Card search.
- [ ] Tags and paper/session grouping.
- [ ] More exact source anchors across complex pages and PDFs.
- [ ] Per-card prompt templates.
- [ ] Chinese and English prompt presets.
- [ ] Markdown export.
- [ ] Obsidian export.
- [ ] Better PDF workflow.

## P2: Parallel Model Lanes

- [ ] Model adapter registry.
- [ ] Choose several models at once.
- [ ] Open model lanes in a controlled tab group.
- [ ] Track which card was sent to which model.
- [ ] Collect answers back into cards where browser policy allows.
- [ ] Compare answers side by side.
- [ ] Mark an answer as best explanation, critique, or follow-up.

## P3: Research Session Layer

- [ ] Paper-level reading session.
- [ ] Question graph.
- [ ] Automatic question suggestions.
- [ ] Related-card clustering.
- [ ] Export a session as a literature-review note.
- [ ] Optional sync layer.

## Design Principles

- Reduce scrolling and context switching.
- Keep the reader in control.
- Prefer local-first storage.
- Make failure recoverable with clipboard fallbacks.
- Treat each model website as an adapter, not as a stable platform.
- Optimize for serious reading, not generic chat.
