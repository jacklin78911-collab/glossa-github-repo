// Glossa sidebar UI.
// Reads saved cards, renders them, and exposes the future multi-model workflow entry point.

const cardList = document.querySelector("#cardList");
const emptyState = document.querySelector("#emptyState");
const cardTemplate = document.querySelector("#cardTemplate");
const refreshButton = document.querySelector("#refreshButton");
const manualText = document.querySelector("#manualText");
const saveManualButton = document.querySelector("#saveManualButton");
const saveClipboardButton = document.querySelector("#saveClipboardButton");
const captureStatus = document.querySelector("#captureStatus");
const modelDialog = document.querySelector("#modelDialog");
const closeModelDialog = document.querySelector("#closeModelDialog");
const modelPrompt = document.querySelector("#modelPrompt");
const promptTemplate = document.querySelector("#promptTemplate");
const presetList = document.querySelector("#presetList");
const saveTemplateButton = document.querySelector("#saveTemplateButton");
const resetTemplateButton = document.querySelector("#resetTemplateButton");
const templateStatus = document.querySelector("#templateStatus");
const copyPromptButton = document.querySelector("#copyPromptButton");
const modelStatus = document.querySelector("#modelStatus");
const modelButtons = document.querySelectorAll(".model-button");

const PENDING_PROMPTS_KEY = "glossa.pendingPrompts";
const PROMPT_TEMPLATE_KEY = "glossa.promptTemplate";
const DEFAULT_PROMPT_TEMPLATE = [
  "You are my research reading assistant.",
  "",
  "Please analyze the following excerpt from a paper or technical page.",
  "",
  "Tasks:",
  "1. Explain the key idea in clear Chinese.",
  "2. Identify important terms, assumptions, and claims.",
  "3. Point out what I should verify in the original paper.",
  "4. Suggest 3 follow-up questions I can ask next.",
  "",
  "Excerpt:",
  "{{text}}"
].join("\n");
const PROMPT_PRESETS = [
  {
    id: "deep-read",
    label: "Deep Read",
    template: DEFAULT_PROMPT_TEMPLATE
  },
  {
    id: "concept",
    label: "Concept",
    template: [
      "Explain the following concept or passage in clear Chinese.",
      "",
      "Focus on:",
      "1. What it means.",
      "2. Why it matters in this paper.",
      "3. A simple analogy.",
      "4. One concrete example.",
      "",
      "{{text}}"
    ].join("\n")
  },
  {
    id: "critique",
    label: "Critique",
    template: [
      "Act as a careful paper reviewer.",
      "",
      "Analyze this excerpt in Chinese:",
      "1. What claim is being made?",
      "2. What assumptions does it rely on?",
      "3. What evidence would make it convincing?",
      "4. What could be weak, missing, or misleading?",
      "",
      "{{text}}"
    ].join("\n")
  },
  {
    id: "experiment",
    label: "Experiment",
    template: [
      "Help me understand this paper's experimental or evaluation logic.",
      "",
      "Explain in Chinese:",
      "1. What is being measured?",
      "2. What baseline or comparison matters?",
      "3. What result should I look for in the figures or tables?",
      "4. What hidden variable could affect the conclusion?",
      "",
      "{{text}}"
    ].join("\n")
  },
  {
    id: "formula",
    label: "Formula",
    template: [
      "Explain the following formula, algorithm, or technical mechanism in Chinese.",
      "",
      "Break it down step by step:",
      "1. Define every symbol or term.",
      "2. Explain the intuition.",
      "3. Give a tiny example.",
      "4. Say where mistakes in understanding often happen.",
      "",
      "{{text}}"
    ].join("\n")
  },
  {
    id: "compare",
    label: "Compare",
    template: [
      "Compare the idea in this excerpt with related systems, methods, or alternatives.",
      "",
      "Answer in Chinese:",
      "1. What is the core idea here?",
      "2. What is it similar to?",
      "3. What is different or novel?",
      "4. What comparison should I search for next?",
      "",
      "{{text}}"
    ].join("\n")
  },
  {
    id: "follow-up",
    label: "Follow-up",
    template: [
      "Turn this reading note into better follow-up questions.",
      "",
      "Create:",
      "1. Three clarification questions.",
      "2. Two verification questions for the original paper.",
      "3. One question that could reveal a deeper connection.",
      "",
      "{{text}}"
    ].join("\n")
  }
];
let activeCard = null;

const MODEL_TARGETS = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
  deepseek: "https://chat.deepseek.com/",
  doubao: "https://www.doubao.com/chat/",
  grok: "https://grok.com/",
  qianwen: "https://www.qianwen.com/",
  kimi: "https://www.kimi.com/"
};

refreshButton.addEventListener("click", renderCards);
saveManualButton.addEventListener("click", saveManualCard);
saveClipboardButton.addEventListener("click", saveClipboardCard);
closeModelDialog.addEventListener("click", closeAskModelsDialog);
copyPromptButton.addEventListener("click", copyCurrentPrompt);
promptTemplate.addEventListener("input", updatePromptPreviewFromTemplate);
saveTemplateButton.addEventListener("click", savePromptTemplate);
resetTemplateButton.addEventListener("click", resetPromptTemplate);
modelDialog.addEventListener("click", (event) => {
  if (event.target === modelDialog) {
    closeAskModelsDialog();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modelDialog.hidden) {
    closeAskModelsDialog();
  }
});
document.addEventListener("DOMContentLoaded", renderCards);
renderPromptPresets();

for (const button of modelButtons) {
  button.addEventListener("click", () => openModel(button.dataset.model));
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  // Keep the side panel live when cards are created from the current page.
  if (areaName === "local" && changes["glossa.cards"]) {
    renderCards();
  }
});

async function renderCards() {
  cardList.replaceChildren();

  const cards = await getCards();
  emptyState.hidden = cards.length > 0;
  const { roots, childrenByParent } = buildCardGraph(cards);

  for (const card of roots) {
    cardList.appendChild(createCardNode(card, childrenByParent, 0));
  }
}

async function getCards() {
  const response = await chrome.runtime.sendMessage({ type: "GLOSSA_GET_CARDS" });
  if (!response?.ok) {
    throw new Error(response?.error || "Unable to load Glossa cards.");
  }

  return response.cards;
}

async function saveManualCard() {
  const text = manualText.value.trim();
  if (!text) {
    setCaptureStatus("Paste text first.", "error");
    manualText.focus();
    return;
  }

  saveManualButton.disabled = true;
  setCaptureStatus("Saving...", "");

  try {
    await saveTextAsCard(text);
    manualText.value = "";
    setCaptureStatus("Saved.", "success");
    await renderCards();
  } catch (error) {
    setCaptureStatus(error.message, "error");
  } finally {
    saveManualButton.disabled = false;
  }
}

async function saveClipboardCard() {
  saveClipboardButton.disabled = true;
  setCaptureStatus("Reading clipboard...", "");

  try {
    const text = (await navigator.clipboard.readText()).trim();
    if (!text) {
      throw new Error("Clipboard is empty.");
    }

    await saveTextAsCard(text);
    setCaptureStatus("Clipboard saved.", "success");
    await renderCards();
  } catch (error) {
    setCaptureStatus(error.message, "error");
  } finally {
    saveClipboardButton.disabled = false;
  }
}

async function saveTextAsCard(text) {
  const tab = await getActiveTab();
  const response = await chrome.runtime.sendMessage({
    type: "GLOSSA_CREATE_CARD",
    payload: {
      text,
      url: tab?.url || "",
      title: tab?.title || "Untitled page"
    }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Unable to save card.");
  }

  return response.card;
}

async function saveFollowUpCard(parentCard, text) {
  const response = await chrome.runtime.sendMessage({
    type: "GLOSSA_CREATE_CARD",
    payload: {
      text,
      url: parentCard.url || "",
      title: parentCard.title || "Untitled page",
      parentId: parentCard.id,
      sourceLocation: parentCard.sourceLocation || null
    }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Unable to save follow-up.");
  }

  return response.card;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function setCaptureStatus(message, tone) {
  captureStatus.textContent = message;
  captureStatus.dataset.tone = tone;
}

function buildCardGraph(cards) {
  const cardIds = new Set(cards.map((card) => card.id));
  const childrenByParent = new Map();
  const roots = [];

  for (const card of cards) {
    if (card.parentId && cardIds.has(card.parentId)) {
      const children = childrenByParent.get(card.parentId) || [];
      children.push(card);
      childrenByParent.set(card.parentId, children);
    } else {
      roots.push(card);
    }
  }

  return { roots, childrenByParent };
}

function createCardNode(card, childrenByParent, depth) {
  const node = document.createElement("div");
  node.className = "card-node";
  node.dataset.depth = String(Math.min(depth, 4));
  node.appendChild(createCardElement(card, depth));

  const children = childrenByParent.get(card.id) || [];
  if (children.length) {
    const childList = document.createElement("div");
    childList.className = "child-card-list";

    for (const child of children) {
      childList.appendChild(createCardNode(child, childrenByParent, depth + 1));
    }

    node.appendChild(childList);
  }

  return node;
}

function createCardElement(card, depth) {
  const fragment = cardTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".card");
  const time = fragment.querySelector(".card-time");
  const text = fragment.querySelector(".card-text");
  const link = fragment.querySelector(".card-link");
  const sourceButton = fragment.querySelector(".source-button");
  const followupButton = fragment.querySelector(".followup-button");
  const askButton = fragment.querySelector(".ask-button");
  const deleteButton = fragment.querySelector(".delete-button");
  const composer = fragment.querySelector(".followup-composer");
  const composerText = composer.querySelector("textarea");
  const cancelFollowupButton = fragment.querySelector(".cancel-followup-button");
  const saveFollowupButton = fragment.querySelector(".save-followup-button");

  article.dataset.cardId = card.id;
  article.dataset.depth = String(depth);
  time.textContent = formatDate(card.createdAt);
  text.textContent = card.text;

  link.href = card.url;
  link.textContent = card.title || card.url || "Source page";
  link.title = card.url;

  askButton.addEventListener("click", () => {
    openAskModelsDialog(card);
  });

  sourceButton.addEventListener("click", () => {
    openSourceForCard(card);
  });

  followupButton.addEventListener("click", () => {
    composer.hidden = !composer.hidden;
    if (!composer.hidden) {
      composerText.focus();
    }
  });

  cancelFollowupButton.addEventListener("click", () => {
    composer.hidden = true;
    composerText.value = "";
  });

  saveFollowupButton.addEventListener("click", async () => {
    const followupText = composerText.value.trim();
    if (!followupText) {
      composerText.focus();
      return;
    }

    saveFollowupButton.disabled = true;
    try {
      await saveFollowUpCard(card, followupText);
      composerText.value = "";
      composer.hidden = true;
      await renderCards();
    } finally {
      saveFollowupButton.disabled = false;
    }
  });

  deleteButton.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "GLOSSA_DELETE_CARD", cardId: card.id });
    renderCards();
  });

  return fragment;
}

async function openSourceForCard(card) {
  if (!card.url) {
    return;
  }

  const tab = await chrome.tabs.create({ url: card.url, active: true });
  await sendScrollToSource(tab.id, card);
}

async function sendScrollToSource(tabId, card) {
  if (!tabId) {
    return;
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    await sleep(350);
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "GLOSSA_SCROLL_TO_SOURCE",
        payload: {
          sourceLocation: card.sourceLocation || null,
          textQuote: card.text || ""
        }
      });

      if (response?.ok) {
        return;
      }
    } catch (error) {
      // Restricted pages and Chrome PDF viewer may not accept content-script messages.
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function showFutureModelsPrompt(card) {
  openAskModelsDialog(card);
}

async function openAskModelsDialog(card) {
  activeCard = card;
  promptTemplate.value = await getPromptTemplate();
  updatePromptPreviewFromTemplate();
  templateStatus.textContent = "";
  templateStatus.dataset.tone = "";
  modelStatus.textContent = "";
  modelStatus.dataset.tone = "";
  modelDialog.hidden = false;
  await copyCurrentPrompt();
}

function closeAskModelsDialog() {
  modelDialog.hidden = true;
}

async function getPromptTemplate() {
  const result = await chrome.storage.local.get(PROMPT_TEMPLATE_KEY);
  return typeof result[PROMPT_TEMPLATE_KEY] === "string" && result[PROMPT_TEMPLATE_KEY].trim()
    ? result[PROMPT_TEMPLATE_KEY]
    : DEFAULT_PROMPT_TEMPLATE;
}

function updatePromptPreviewFromTemplate() {
  if (!activeCard) {
    return;
  }

  modelPrompt.value = buildReadingPrompt(activeCard, promptTemplate.value);
}

function buildReadingPrompt(card, template) {
  const replacements = {
    text: card.text || "",
    title: card.title || "",
    url: card.url || ""
  };

  return template.replace(/\{\{(text|title|url)\}\}/g, (_match, key) => replacements[key]);
}

async function savePromptTemplate() {
  const template = promptTemplate.value.trim();
  if (!template.includes("{{text}}")) {
    setTemplateStatus("Template needs {{text}}.", "error");
    return;
  }

  await chrome.storage.local.set({ [PROMPT_TEMPLATE_KEY]: template });
  updatePromptPreviewFromTemplate();
  setTemplateStatus("Template saved.", "success");
}

async function resetPromptTemplate() {
  promptTemplate.value = DEFAULT_PROMPT_TEMPLATE;
  await chrome.storage.local.set({ [PROMPT_TEMPLATE_KEY]: DEFAULT_PROMPT_TEMPLATE });
  updatePromptPreviewFromTemplate();
  setTemplateStatus("Template reset.", "success");
}

function setTemplateStatus(message, tone) {
  templateStatus.textContent = message;
  templateStatus.dataset.tone = tone;
}

function renderPromptPresets() {
  presetList.replaceChildren();

  for (const preset of PROMPT_PRESETS) {
    const button = document.createElement("button");
    button.className = "preset-button";
    button.type = "button";
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      promptTemplate.value = preset.template;
      updatePromptPreviewFromTemplate();
      setTemplateStatus(`${preset.label} preset applied.`, "success");
    });
    presetList.appendChild(button);
  }
}

async function copyCurrentPrompt() {
  try {
    await navigator.clipboard.writeText(modelPrompt.value);
    modelStatus.textContent = "Prompt copied.";
    modelStatus.dataset.tone = "success";
  } catch (error) {
    modelStatus.textContent = "Copy failed. Select the prompt manually.";
    modelStatus.dataset.tone = "error";
  }
}

async function openModel(modelName) {
  const url = MODEL_TARGETS[modelName];
  if (!url) {
    return;
  }

  await copyCurrentPrompt();
  await queuePromptForAutofill(modelName, modelPrompt.value);
  modelStatus.textContent = "Opening model. Autofill will run if the page allows it.";
  modelStatus.dataset.tone = "success";
  await chrome.tabs.create({ url });
}

async function queuePromptForAutofill(modelName, prompt) {
  const result = await chrome.storage.local.get(PENDING_PROMPTS_KEY);
  const pendingPrompts = result[PENDING_PROMPTS_KEY] || {};

  await chrome.storage.local.set({
    [PENDING_PROMPTS_KEY]: {
      ...pendingPrompts,
      [modelName]: {
        prompt,
        createdAt: Date.now()
      }
    }
  });
}
