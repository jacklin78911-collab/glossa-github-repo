// Glossa background service worker.
// It centralizes storage writes so content scripts and the sidebar use one card format.

const STORAGE_KEY = "glossa.cards";
const SAVE_SELECTION_MENU_ID = "glossa.save-selection";

chrome.runtime.onInstalled.addListener(() => {
  // Clicking the toolbar icon opens the side panel when Chrome supports this API.
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
      // Some Chrome variants may reject this during installation; the action click still remains harmless.
    });
  }

  createSelectionContextMenu();
});

chrome.action.onClicked.addListener(async (tab) => {
  // Give users a direct way to open Glossa even if the page has no selected text.
  if (chrome.sidePanel?.open && tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== SAVE_SELECTION_MENU_ID) {
    return;
  }

  saveCard(
    {
      text: info.selectionText,
      url: info.pageUrl || tab?.url,
      title: tab?.title
    },
    tab
  )
    .then(() => openSidePanelForTab(tab?.id))
    .catch(() => {
      // The side panel manual paste box remains available if Chrome cannot expose the selection.
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GLOSSA_CREATE_CARD") {
    saveCard(message.payload, sender.tab)
      .then((card) => {
        sendResponse({ ok: true, card });
        openSidePanelForTab(sender.tab?.id);
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message });
      });

    // Returning true keeps the message channel open for the async storage call.
    return true;
  }

  if (message?.type === "GLOSSA_GET_CARDS") {
    getCards()
      .then((cards) => sendResponse({ ok: true, cards }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.type === "GLOSSA_DELETE_CARD") {
    deleteCard(message.cardId)
      .then((cards) => sendResponse({ ok: true, cards }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  return undefined;
});

async function getCards() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
}

async function saveCard(payload, tab) {
  if (!payload?.text?.trim()) {
    throw new Error("Cannot save an empty selection.");
  }

  const cards = await getCards();
  const now = new Date().toISOString();
  const card = {
    id: crypto.randomUUID(),
    text: payload.text.trim(),
    url: payload.url || tab?.url || "",
    title: payload.title || tab?.title || "Untitled page",
    parentId: payload.parentId || "",
    sourceLocation: normalizeSourceLocation(payload.sourceLocation),
    createdAt: now
  };

  await chrome.storage.local.set({
    [STORAGE_KEY]: [card, ...cards]
  });

  return card;
}

async function deleteCard(cardId) {
  if (!cardId) {
    throw new Error("Missing card id.");
  }

  const cards = await getCards();
  const idsToDelete = collectDescendantIds(cards, cardId);
  const nextCards = cards.filter((card) => !idsToDelete.has(card.id));
  await chrome.storage.local.set({ [STORAGE_KEY]: nextCards });
  return nextCards;
}

function normalizeSourceLocation(sourceLocation) {
  if (!sourceLocation || typeof sourceLocation !== "object") {
    return null;
  }

  return {
    scrollX: Number.isFinite(sourceLocation.scrollX) ? sourceLocation.scrollX : 0,
    scrollY: Number.isFinite(sourceLocation.scrollY) ? sourceLocation.scrollY : 0,
    rectTop: Number.isFinite(sourceLocation.rectTop) ? sourceLocation.rectTop : 0,
    rectLeft: Number.isFinite(sourceLocation.rectLeft) ? sourceLocation.rectLeft : 0,
    textQuote: typeof sourceLocation.textQuote === "string" ? sourceLocation.textQuote.slice(0, 500) : ""
  };
}

function collectDescendantIds(cards, rootId) {
  const ids = new Set([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const card of cards) {
      if (card.parentId && ids.has(card.parentId) && !ids.has(card.id)) {
        ids.add(card.id);
        changed = true;
      }
    }
  }

  return ids;
}

function openSidePanelForTab(tabId) {
  // Opening the side panel is best-effort because Chrome requires a user gesture in some contexts.
  if (chrome.sidePanel?.open && tabId) {
    chrome.sidePanel.open({ tabId }).catch(() => {});
  }
}

function createSelectionContextMenu() {
  // A right-click entry gives normal pages another capture path and helps where floating UI is blocked.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: SAVE_SELECTION_MENU_ID,
      title: "Save selection to Glossa",
      contexts: ["selection"]
    });
  });
}
