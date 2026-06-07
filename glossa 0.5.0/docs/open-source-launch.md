# Open Source Launch Notes

This document collects positioning ideas for launching Glossa on GitHub and social platforms.

## One-Line Pitch

Glossa turns confusing passages into parallel question cards for multiple LLMs.

## Longer Pitch

Glossa is a local-first Chrome extension for paper reading. Highlight a dense passage, save it as a question card, and send it to ChatGPT, Claude, DeepSeek, Kimi, Qwen, Doubao, or Grok.

The goal is to reduce the scroll tax of long papers and long model answers. Instead of one endless chat thread, Glossa gives you a side-panel index of questions and model lanes.

## Strong Framing

Do not present Glossa as "another AI summarizer." Present it as:

- A question manager for serious reading.
- A side-panel scheduler for multi-model thinking.
- A local-first workflow for researchers who already use several LLMs.
- A way to turn confusion into indexed, parallel jobs.

## Demo Ideas

Create a short GIF with four moments:

1. Select a paper passage.
2. Save it as a Glossa card.
3. Click Ask Models.
4. Open two model lanes with the same prompt.

Optional second GIF:

1. Read a long model explanation.
2. Highlight an unknown term such as RDMA.
3. Save a follow-up question card.
4. Send it to another model while keeping the original reading context.

## Suggested GitHub Topics

- chrome-extension
- llm
- research-tools
- paper-reading
- productivity
- ai-tools
- local-first
- knowledge-management
- web-llm

## Launch Post

I am building Glossa, a local-first Chrome extension for paper reading.

The pain point: reading with LLMs creates too much scrolling. You ask for an explanation, the answer gets long, then one unknown term creates another long thread. Soon you are jumping between the paper, the original answer, and several follow-up answers.

Glossa turns those confusion points into question cards. Each card stays attached to the source text and can be sent to multiple web LLMs like ChatGPT, Claude, DeepSeek, Kimi, Qwen, Doubao, and Grok.

The mental model is GPU-style parallelism for reading: cards are jobs, models are worker lanes, and the side panel is the scheduler.

The project is early, open source, and focused on serious reading rather than generic summarization.
