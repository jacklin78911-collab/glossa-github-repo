// Glossa content script.
// Shows a small capture button near selected text and sends the selection to the extension.

const BUTTON_ID = "glossa-selection-button-host";
const PENDING_PROMPTS_KEY = "glossa.pendingPrompts";
const PROMPT_MAX_AGE_MS = 10 * 60 * 1000;
const AUTOFILL_TIMEOUT_MS = 45 * 1000;
const MODEL_INPUT_SELECTORS = [
  "textarea[data-testid='prompt-textarea']",
  "textarea[name='prompt']",
  "textarea[placeholder]",
  "#prompt-textarea",
  "[contenteditable='true'][role='textbox']",
  "[contenteditable='true']",
  "[role='textbox']",
  ".ProseMirror",
  "textarea"
].join(",");
let latestSelectionText = "";
let hideTimer = null;

const buttonHost = document.createElement("div");
buttonHost.id = BUTTON_ID;

const shadow = buttonHost.attachShadow({ mode: "open" });
shadow.innerHTML = `
  <style>
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      display: none;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button {
      all: initial;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 76px;
      height: 34px;
      padding: 0 12px;
      border: 1px solid rgba(24, 39, 75, 0.18);
      border-radius: 8px;
      background: #155dfc;
      color: #ffffff;
      box-shadow: 0 10px 24px rgba(21, 93, 252, 0.26), 0 4px 12px rgba(10, 20, 40, 0.16);
      cursor: pointer;
      font-size: 13px;
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0;
      user-select: none;
    }

    button:hover {
      background: #0f4fd6;
    }

    button:active {
      transform: translateY(1px);
    }
  </style>
  <button type="button" title="Save this selection to Glossa">Glossa</button>
`;

document.documentElement.appendChild(buttonHost);

const captureButton = shadow.querySelector("button");
captureButton.addEventListener("mousedown", (event) => {
  // Prevent the page from clearing the selection before the click handler runs.
  event.preventDefault();
});
captureButton.addEventListener("click", saveCurrentSelection);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GLOSSA_SCROLL_TO_SOURCE") {
    scrollToSource(message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return undefined;
});

document.addEventListener("mouseup", () => {
  window.setTimeout(showButtonForSelection, 0);
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Escape") {
    hideButton();
    return;
  }

  showButtonForSelection();
});

document.addEventListener("scroll", hideButton, true);

initModelAutofill();

function showButtonForSelection() {
  const selection = window.getSelection();
  const text = selection?.toString().trim() || "";

  if (!text || selection.rangeCount === 0 || isSelectionInsideGlossaButton(selection)) {
    hideButton();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = getUsableSelectionRect(range);
  if (!rect) {
    hideButton();
    return;
  }

  latestSelectionText = text;
  positionButton(rect);
  buttonHost.style.display = "block";

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (!window.getSelection()?.toString().trim()) {
      hideButton();
    }
  }, 7000);
}

function getUsableSelectionRect(range) {
  // getBoundingClientRect can be zero-width on multi-line selections, so prefer visible client rects.
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  return rects[0] || null;
}

function positionButton(rect) {
  const margin = 8;
  const buttonWidth = 82;
  const buttonHeight = 36;
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - buttonWidth / 2, margin),
    window.innerWidth - buttonWidth - margin
  );
  const top = rect.top > buttonHeight + margin ? rect.top - buttonHeight - margin : rect.bottom + margin;

  buttonHost.style.left = `${Math.round(left)}px`;
  buttonHost.style.top = `${Math.round(Math.min(top, window.innerHeight - buttonHeight - margin))}px`;
}

async function saveCurrentSelection() {
  const text = latestSelectionText || window.getSelection()?.toString().trim();
  if (!text) {
    hideButton();
    return;
  }

  captureButton.textContent = "Saved";
  captureButton.disabled = true;

  try {
    const sourceLocation = getCurrentSourceLocation(text);
    const response = await chrome.runtime.sendMessage({
      type: "GLOSSA_CREATE_CARD",
      payload: {
        text,
        url: window.location.href,
        title: document.title,
        sourceLocation
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Failed to save selection.");
    }
  } catch (error) {
    captureButton.textContent = "Retry";
    captureButton.title = error.message;
    captureButton.disabled = false;
    return;
  }

  window.setTimeout(() => {
    captureButton.textContent = "Glossa";
    captureButton.disabled = false;
    hideButton();
  }, 700);
}

function hideButton() {
  buttonHost.style.display = "none";
  captureButton.textContent = "Glossa";
  captureButton.disabled = false;
}

function isSelectionInsideGlossaButton(selection) {
  const node = selection.anchorNode;
  return node ? buttonHost.contains(node) : false;
}

function getCurrentSourceLocation(text) {
  const selection = window.getSelection();
  const rect = selection?.rangeCount ? getUsableSelectionRect(selection.getRangeAt(0)) : null;

  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    rectTop: rect?.top || 0,
    rectLeft: rect?.left || 0,
    textQuote: text.slice(0, 500)
  };
}

async function scrollToSource(payload) {
  const location = payload?.sourceLocation || {};
  const textQuote = payload?.textQuote || location.textQuote || "";
  const target = findElementContainingQuote(textQuote);

  if (target) {
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    highlightSourceElement(target);
    return "quote";
  }

  const top = Math.max(0, (location.scrollY || 0) + (location.rectTop || 0) - 120);
  window.scrollTo({
    left: location.scrollX || 0,
    top,
    behavior: "smooth"
  });
  return "position";
}

function findElementContainingQuote(textQuote) {
  const normalizedQuote = normalizeTextForSearch(textQuote).slice(0, 160);
  if (normalizedQuote.length < 20) {
    return null;
  }

  const prefix = normalizedQuote.slice(0, Math.min(80, normalizedQuote.length));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = normalizeTextForSearch(node.textContent || "");
      return text.includes(prefix) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const node = walker.nextNode();
  return node?.parentElement || null;
}

function normalizeTextForSearch(text) {
  return text.replace(/\s+/g, " ").trim();
}

function highlightSourceElement(element) {
  const previousOutline = element.style.outline;
  const previousBackground = element.style.backgroundColor;

  element.style.outline = "3px solid #155dfc";
  element.style.backgroundColor = "rgba(21, 93, 252, 0.12)";

  window.setTimeout(() => {
    element.style.outline = previousOutline;
    element.style.backgroundColor = previousBackground;
  }, 2800);
}

async function initModelAutofill() {
  const modelName = getModelNameFromHost(window.location.hostname);
  if (!modelName) {
    return;
  }

  try {
    const pendingPrompt = await getPendingPrompt(modelName);
    if (pendingPrompt) {
      startPromptAutofill(modelName, pendingPrompt.prompt);
    }
  } catch (error) {
    // Model pages should continue loading normally even if extension storage is unavailable.
  }
}

function getModelNameFromHost(hostname) {
  const host = hostname.replace(/^www\./, "");

  if (host === "chatgpt.com") {
    return "chatgpt";
  }

  if (host === "claude.ai") {
    return "claude";
  }

  if (host === "chat.deepseek.com" || host === "deepseek.com") {
    return "deepseek";
  }

  if (host === "doubao.com") {
    return "doubao";
  }

  if (host === "grok.com") {
    return "grok";
  }

  if (host === "qianwen.com" || host === "chat.qwen.ai" || host.endsWith(".qwen.ai")) {
    return "qianwen";
  }

  if (host === "kimi.com") {
    return "kimi";
  }

  return "";
}

async function getPendingPrompt(modelName) {
  const result = await chrome.storage.local.get(PENDING_PROMPTS_KEY);
  const pendingPrompt = result[PENDING_PROMPTS_KEY]?.[modelName];

  if (!pendingPrompt?.prompt) {
    return null;
  }

  if (Date.now() - pendingPrompt.createdAt > PROMPT_MAX_AGE_MS) {
    await removePendingPrompt(modelName);
    return null;
  }

  return pendingPrompt;
}

function startPromptAutofill(modelName, prompt) {
  let completed = false;
  let filling = false;
  const startedAt = Date.now();

  const stop = () => {
    completed = true;
    window.clearInterval(intervalId);
    observer.disconnect();
  };

  const tryFill = async () => {
    if (completed || filling) {
      return;
    }

    if (Date.now() - startedAt > AUTOFILL_TIMEOUT_MS) {
      stop();
      return;
    }

    const target = findPromptInput();
    if (!target) {
      return;
    }

    filling = true;
    const didFill = fillPromptInput(target, prompt);
    filling = false;

    if (didFill) {
      await removePendingPrompt(modelName);
      showGlossaToast("Glossa prompt filled.");
      stop();
    }
  };

  const observer = new MutationObserver(tryFill);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  const intervalId = window.setInterval(tryFill, 600);
  tryFill();
}

function findPromptInput() {
  const candidates = querySelectorAllDeep(document, MODEL_INPUT_SELECTORS);
  return candidates.find(isUsablePromptInput) || null;
}

function querySelectorAllDeep(root, selectors, found = []) {
  if (!root?.querySelectorAll) {
    return found;
  }

  const elements = Array.from(root.querySelectorAll(selectors));
  found.push(...elements);

  for (const element of root.querySelectorAll("*")) {
    if (element.shadowRoot) {
      querySelectorAllDeep(element.shadowRoot, selectors, found);
    }
  }

  return found;
}

function isUsablePromptInput(element) {
  const isTextControl = element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement;
  const isEditable = element.isContentEditable;

  if (!isTextControl && !isEditable) {
    return false;
  }

  if (isTextControl && (element.disabled || element.readOnly)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 20 && rect.height > 12 && style.display !== "none" && style.visibility !== "hidden";
}

function fillPromptInput(target, prompt) {
  target.scrollIntoView({ block: "center", inline: "nearest" });
  target.focus({ preventScroll: true });

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    setNativeInputValue(target, prompt);
    dispatchPromptInputEvents(target, prompt);
    return target.value === prompt;
  }

  if (target.isContentEditable) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);

    const inserted = document.execCommand("insertText", false, prompt);
    if (!inserted) {
      target.textContent = prompt;
    }

    dispatchPromptInputEvents(target, prompt);
    return (target.textContent || "").includes(prompt.slice(0, Math.min(prompt.length, 40)));
  }

  return false;
}

function setNativeInputValue(target, value) {
  const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(target, value);
    return;
  }

  target.value = value;
}

function dispatchPromptInputEvents(target, prompt) {
  target.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: prompt
    })
  );
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

async function removePendingPrompt(modelName) {
  const result = await chrome.storage.local.get(PENDING_PROMPTS_KEY);
  const pendingPrompts = result[PENDING_PROMPTS_KEY] || {};
  delete pendingPrompts[modelName];
  await chrome.storage.local.set({ [PENDING_PROMPTS_KEY]: pendingPrompts });
}

function showGlossaToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = [
    "position: fixed",
    "right: 16px",
    "bottom: 16px",
    "z-index: 2147483647",
    "padding: 10px 12px",
    "border-radius: 8px",
    "background: #172033",
    "color: #ffffff",
    "box-shadow: 0 10px 28px rgba(15, 23, 42, 0.24)",
    "font: 13px/1.35 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  ].join(";");

  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}
