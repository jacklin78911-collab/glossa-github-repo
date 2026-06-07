# Glossa Vision

## The Reading Problem

Long-form technical reading is no longer only paper versus reader. It is now paper plus LLM plus follow-up questions plus multiple model subscriptions.

A typical workflow looks like this:

1. You read a paper.
2. You ask a strong model to explain a section.
3. The model generates a long explanation.
4. The explanation contains unknown concepts, such as RDMA, CXL, disaggregated memory, KV cache, or Mooncake.
5. You ask follow-up questions.
6. Each follow-up creates another long answer.
7. You scroll between the paper, the original answer, and several sub-answers.

The problem is not simply "the paper is hard." The problem is that the interface is linear while the thinking is branching.

Glossa exists to make branching questions manageable.

## Product Thesis

Serious reading should be card-indexed and model-parallel.

Instead of one huge chat thread, Glossa treats every confusion point as a small job:

- What does RDMA mean here?
- Why does this paper need disaggregated memory?
- What assumption is hidden in this claim?
- How does Mooncake compare with vLLM or DistServe?
- What should I verify in the evaluation section?

Each question becomes a card. Each card can be sent to one or more models. The card remains attached to the source text and URL, so the reader can return to the exact context later.

Follow-up cards turn the reading process into a graph. If a model explanation mentions RDMA, that follow-up can become a child card under the original passage instead of disappearing into a long chat thread.

## The Multi-GPU Analogy

Glossa borrows its mental model from parallel compute:

- A selected passage is a task payload.
- A question card is a scheduled job.
- ChatGPT, Claude, DeepSeek, Kimi, Qwen, Doubao, and Grok are worker lanes.
- The side panel is the scheduler.
- Future answer collection is the result buffer.
- The paper session is the full computation graph of your reading.

In a normal chat workflow, your attention is single-threaded. You wait, scroll, ask, wait, scroll again.

In Glossa, your questions can run in parallel. While one model explains RDMA, another can compare the paper's architecture, and another can critique the evaluation.

## What Glossa Is

Glossa is:

- A Chrome extension.
- A side-panel question index.
- A local-first reading companion.
- A bridge between source text and multiple web LLMs.
- A framework for model adapters and reading workflows.

## What Glossa Is Not

Glossa is not:

- A replacement for careful reading.
- A generic web clipper.
- A model provider.
- A hidden server that uploads your notes.
- A promise that every model website can be automated perfectly.

## Target Users

Glossa is for:

- Graduate students reading papers.
- Engineers reading systems papers and RFCs.
- Researchers comparing model interpretations.
- Builders who already pay for several model subscriptions.
- Readers who ask many small questions instead of one huge prompt.

## V0 Workflow

1. Select text.
2. Save a question card.
3. Add follow-up cards when new concepts appear.
4. Jump back to source when context is needed.
5. Click Ask Models.
6. Choose a prompt preset.
7. Choose one or more model websites.
8. Glossa copies and tries to autofill the prompt.
9. The user reviews and sends the prompt.

## Future Workflow

1. Select a paper section.
2. Glossa suggests question cards automatically.
3. The user sends cards to several model lanes.
4. Glossa collects model answers.
5. The reader compares answers by card.
6. Cards can jump back to source anchors.
7. A paper session can be exported to Markdown, Obsidian, Notion, or a literature-review notebook.

## Why This Can Become Real

The project is feasible because the first useful version does not require owning model APIs or building a full research platform. A Chrome extension can already deliver value by combining:

- Source-aware capture.
- Local card storage.
- Prompt generation.
- Multi-model web routing.
- Best-effort autofill.
- Clipboard fallback.

The hard parts are also clear:

- Chrome PDF viewer restrictions.
- Fragile web model UI selectors.
- Answer collection from third-party pages.
- Keeping the UX fast enough that it reduces work rather than adding work.

This makes Glossa a good open-source project. Contributors can improve adapters, prompts, exports, and reading-session design independently.
