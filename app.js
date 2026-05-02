const STORAGE_KEY = "curious-checkins";
const checkinCard = document.querySelector("#checkin-card");
const threadsContent = document.querySelector("#threads-content");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

const AFFIRMATIONS = [
  {
    keywords: ["alone", "abandoned", "left"],
    text: "I am here now. I don't have to leave this alone.",
  },
  {
    keywords: ["much", "burden", "pressure", "responsible", "carrying", "carry"],
    text: "This does not have to be carried all at once.",
  },
  {
    keywords: ["rejected", "chosen", "replaced", "unwanted"],
    text: "I can believe this hurt without making it my whole truth.",
  },
  {
    keywords: ["scared", "unsafe", "afraid"],
    text: "I can go slowly with this.",
  },
  {
    keywords: ["shame", "bad", "wrong", "enough"],
    text: "I can stay kind with what I'm noticing.",
  },
  {
    keywords: ["control", "manage", "fix"],
    text: "I do not have to solve everything right now.",
  },
];

const state = {
  activeTab: "checkin",
  screen: "opening",
  pauseMessage: "",
  delayedRevealReady: false,
  entry: createEmptyEntry(),
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

renderCheckIn();
renderThreads();

function createEmptyEntry() {
  return {
    firstReflection: "",
    branch: "",
    partMessage: "",
    situationGoingOn: "",
    situationBothering: "",
    situationPerspective: "",
    situationClearer: "",
    closingAffirmation: "",
    extractedKeywords: [],
  };
}

function setActiveTab(tabName) {
  state.activeTab = tabName;

  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabName);
  });

  if (tabName === "threads") {
    renderThreads();
  }
}

function renderCheckIn() {
  switch (state.screen) {
    case "opening":
      renderOpeningScreen();
      break;
    case "intro":
      renderMessageScreen({
        label: "CHECK IN",
        main: "I feel something here.",
        subtext: "I'm listening.",
        buttonText: "Continue",
        onContinue: () => setScreen("first-reflection"),
      });
      break;
    case "first-reflection":
      renderInputScreen({
        label: "CHECK IN",
        main: "What's coming up right now?",
        value: state.entry.firstReflection,
        onSubmit: (value) => {
          state.entry.firstReflection = value.trim();
          setScreen("first-pause");
        },
      });
      break;
    case "first-pause":
      renderMessageScreen({
        label: "CHECK IN",
        main: "I hear you.",
        buttonText: "Continue",
        onContinue: () => setScreen("branch"),
        includePulse: true,
      });
      break;
    case "branch":
      renderBranchScreen();
      break;
    case "part-open":
      renderMessageScreen({
        label: "CHECK IN",
        main: "I sense a part of me is here, and I’m going to turn towards this part.",
        buttonText: "Stay",
        onContinue: () => setScreen("part-connect"),
      });
      break;
    case "part-connect":
      renderSilentPresenceStep({
        screen: "part-connect",
        main: "I’m going to close my eyes and connect with this part.",
        buttonLabel: "I’m ready",
        onContinue: () => setScreen("part-arrive"),
        delayMs: 3000,
      });
      break;
    case "part-arrive":
      renderMessageScreen({
        label: "CHECK IN",
        main: "I can take all the time I need just noticing this part.",
        buttonText: "Continue",
        onContinue: () => setScreen("part-message"),
      });
      break;
    case "part-message":
      renderPartMessageScreen();
      break;
    case "part-validate":
      renderMessageScreen({
        label: "CHECK IN",
        main: "It makes sense to me why this part feels this way.",
        subtext: "I’m glad I checked in.",
        buttonText: "Continue",
        onContinue: () => setScreen("part-settled"),
      });
      break;
    case "part-settled":
      renderLandingScreen({
        label: "CHECK IN",
        main: "Does this part feel more settled?",
        primaryLabel: "Yes, more settled",
        secondaryLabel: "There’s more to hear",
        onPrimary: () => finishCheckIn("part-closing"),
        onSecondary: () => setScreen("part-open"),
      });
      break;
    case "part-closing":
      renderClosing({
        main: "I’m here. I’ve got you.",
        subtext: "You don’t have to carry this alone anymore.",
      });
      break;
    case "situation-going-on":
      renderInputScreen({
        label: "CHECK IN",
        main: "What’s going on?",
        value: state.entry.situationGoingOn,
        onSubmit: (value) => {
          state.entry.situationGoingOn = value.trim();
          setScreen("situation-bothering");
        },
      });
      break;
    case "situation-bothering":
      renderInputScreen({
        label: "CHECK IN",
        main: "Why is this bothering me?",
        value: state.entry.situationBothering,
        onSubmit: (value) => {
          state.entry.situationBothering = value.trim();
          setScreen("situation-validation");
        },
      });
      break;
    case "situation-validation":
      renderMessageScreen({
        label: "CHECK IN",
        main: "That makes sense.",
        buttonText: "Continue",
        onContinue: () => setScreen("situation-perspective"),
        includePulse: true,
      });
      break;
    case "situation-perspective":
      renderInputScreen({
        label: "CHECK IN",
        main: "Is there another way to see this?",
        value: state.entry.situationPerspective,
        onSubmit: (value) => {
          state.entry.situationPerspective = value.trim();
          setScreen("situation-validation-2");
        },
      });
      break;
    case "situation-validation-2":
      renderMessageScreen({
        label: "CHECK IN",
        main: "This makes sense.",
        subtext: "There’s a reason this bothered me.",
        buttonText: "Continue",
        onContinue: () => setScreen("situation-clearer"),
      });
      break;
    case "situation-clearer":
      renderLandingScreen({
        label: "CHECK IN",
        main: "Does this feel clearer now?",
        primaryLabel: "Yes, it does",
        secondaryLabel: "There’s more I want to say",
        onPrimary: () => finishCheckIn("situation-closing"),
        onSecondary: () => setScreen("situation-going-on"),
      });
      break;
    case "situation-closing":
      renderClosing({
        main: "I see it more clearly.",
        subtext: "I’m glad I checked in. I can come back to this if it comes up again.",
      });
      break;
    case "closing":
      renderClosing({
        main: "I’m here with you.",
        subtext: "We can come back anytime.",
      });
      break;
    default:
      setScreen("opening");
  }
}

function setScreen(screen) {
  state.screen = screen;
  state.pauseMessage = "";
  state.delayedRevealReady = false;
  renderCheckIn();
}

function renderOpeningScreen() {
  checkinCard.innerHTML = `
    <div class="opening-screen">
      <h2 class="opening-title">Curious</h2>
      <p class="tagline">No spiraling. Stay curious.</p>
      <div class="actions">
        <button class="button button-primary" type="button" id="begin-button">Begin</button>
      </div>
    </div>
  `;

  document.querySelector("#begin-button").addEventListener("click", () => {
    setScreen("intro");
  });
}

function renderMessageScreen({
  label,
  main = "",
  subtext = "",
  buttonText,
  onContinue,
  includePulse = false,
}) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${label}</p>
      ${main ? `<h2>${escapeHtml(main)}</h2>` : ""}
      ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      ${includePulse ? renderPresenceDots() : ""}
      <div class="actions">
        <button class="button button-primary" type="button" id="continue-button">${escapeHtml(buttonText)}</button>
      </div>
    </div>
  `;

  document.querySelector("#continue-button").addEventListener("click", onContinue);
}

function renderInputScreen({
  label,
  main,
  subtext = "",
  value,
  onSubmit,
  placeholder = "You can start anywhere...",
}) {
  checkinCard.innerHTML = `
    <form id="prompt-form">
      <div class="question">
        <p class="eyebrow">${label}</p>
        <h2>${escapeHtml(main)}</h2>
        ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      </div>
      <textarea
        id="response-input"
        class="text-input"
        placeholder="${escapeAttribute(placeholder)}"
      >${escapeHtml(value)}</textarea>
      <div class="actions">
        <button class="button button-primary" type="submit">Continue</button>
      </div>
    </form>
  `;

  const form = document.querySelector("#prompt-form");
  const input = document.querySelector("#response-input");
  input.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(input.value);
  });
}

function renderPauseScreen({
  label,
  main = "",
  subtext = "",
  pauseMessage = "",
  stayLabel,
  moreLabel,
  continueLabel,
  auxiliaryLinkLabel = "",
  auxiliaryExpanded = false,
  auxiliaryValue = "",
  auxiliaryLabel = "",
  auxiliaryPlaceholder = "",
  onToggleAuxiliary = null,
  onAuxiliaryChange = null,
  onStay,
  onMore,
  onContinue,
}) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${label}</p>
      ${main ? `<h2>${escapeHtml(main)}</h2>` : ""}
      ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      ${renderPresenceDots()}
      ${pauseMessage ? `<p class="stillness">${escapeHtml(pauseMessage)}</p>` : ""}
      ${
        auxiliaryLinkLabel
          ? `
            <div class="optional-note">
              <button
                class="inline-link"
                type="button"
                id="auxiliary-toggle"
                aria-expanded="${auxiliaryExpanded ? "true" : "false"}"
              >
                ${escapeHtml(auxiliaryLinkLabel)}
              </button>
              ${
                auxiliaryExpanded
                  ? `
                    <label class="field-label" for="auxiliary-input">${escapeHtml(auxiliaryLabel)}</label>
                    <textarea
                      id="auxiliary-input"
                      class="text-input text-input-compact"
                      placeholder="${escapeAttribute(auxiliaryPlaceholder)}"
                    >${escapeHtml(auxiliaryValue)}</textarea>
                  `
                  : ""
              }
            </div>
          `
          : ""
      }
      <div class="choice-group">
        <button class="button button-secondary" type="button" id="stay-action">
          ${escapeHtml(stayLabel)}
        </button>
        <button class="button button-secondary" type="button" id="more-action">
          ${escapeHtml(moreLabel)}
        </button>
        <button class="button button-primary" type="button" id="continue-action">
          ${escapeHtml(continueLabel)}
        </button>
      </div>
    </div>
  `;

  document.querySelector("#stay-action").addEventListener("click", () => {
    onStay();
  });
  document.querySelector("#more-action").addEventListener("click", () => {
    onMore();
  });
  document.querySelector("#continue-action").addEventListener("click", () => {
    onContinue();
  });

  const auxiliaryToggle = document.querySelector("#auxiliary-toggle");
  if (auxiliaryToggle && onToggleAuxiliary) {
    auxiliaryToggle.addEventListener("click", () => {
      onToggleAuxiliary();
    });
  }
}

function renderBranchScreen() {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">CHECK IN</p>
      <h2>What does this feel like?</h2>
      <p class="muted support-line">Go with what fits best.</p>
      <div class="choice-group">
        <button class="button button-secondary" type="button" id="part-branch">
          A part of me is reacting
        </button>
        <button class="button button-secondary" type="button" id="situation-branch">
          I’m thinking through a situation
        </button>
      </div>
    </div>
  `;

  document.querySelector("#part-branch").addEventListener("click", () => {
    state.entry.branch = "part";
    setScreen("part-open");
  });

  document.querySelector("#situation-branch").addEventListener("click", () => {
    state.entry.branch = "situation";
    setScreen("situation-going-on");
  });
}

function renderPresenceStep({ screen, main, reveal, buttonLabel, onContinue, delayMs = 2400 }) {
  if (!state.delayedRevealReady) {
    scheduleReveal(screen, delayMs);
  }

  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">CHECK IN</p>
      <h2>${escapeHtml(main)}</h2>
      ${renderPresenceDots()}
      ${
        state.delayedRevealReady
          ? `
            <p class="muted support-line">${escapeHtml(reveal)}</p>
            <div class="actions">
              <button class="button button-primary" type="button" id="presence-continue">${escapeHtml(buttonLabel)}</button>
            </div>
          `
          : ""
      }
    </div>
  `;

  if (state.delayedRevealReady) {
    document.querySelector("#presence-continue").addEventListener("click", onContinue);
  }
}

function renderSilentPresenceStep({ screen, main, buttonLabel, onContinue, delayMs = 3000 }) {
  if (!state.delayedRevealReady) {
    scheduleReveal(screen, delayMs);
  }

  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">CHECK IN</p>
      <h2>${escapeHtml(main)}</h2>
      ${renderPresenceDots()}
      ${
        state.delayedRevealReady
          ? `
            <div class="actions">
              <button class="button button-primary" type="button" id="presence-continue">${escapeHtml(buttonLabel)}</button>
            </div>
          `
          : ""
      }
    </div>
  `;

  if (state.delayedRevealReady) {
    document.querySelector("#presence-continue").addEventListener("click", onContinue);
  }
}

function renderPartMessageScreen() {
  checkinCard.innerHTML = `
    <form id="part-message-form">
      <textarea
        id="part-message-input"
        class="text-input"
        placeholder="I’m here… I hear you…"
      >${escapeHtml(state.entry.partMessage)}</textarea>
      <div class="actions">
        <button class="button button-primary" type="submit">Continue</button>
        <button class="button button-secondary" type="button" id="part-message-skip">Nothing to add</button>
      </div>
    </form>
  `;

  const form = document.querySelector("#part-message-form");
  const input = document.querySelector("#part-message-input");
  input.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.entry.partMessage = input.value.trim();
    setScreen("part-validate");
  });

  document.querySelector("#part-message-skip").addEventListener("click", () => {
    state.entry.partMessage = input.value.trim();
    setScreen("part-validate");
  });
}

function renderLandingScreen({ label, main, primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <h2>${escapeHtml(main)}</h2>
      <div class="choice-group">
        <button class="button button-secondary" type="button" id="secondary-action">
          ${escapeHtml(secondaryLabel)}
        </button>
        <button class="button button-primary" type="button" id="primary-action">
          ${escapeHtml(primaryLabel)}
        </button>
      </div>
    </div>
  `;

  document.querySelector("#secondary-action").addEventListener("click", onSecondary);
  document.querySelector("#primary-action").addEventListener("click", onPrimary);
}

function renderClosing({ main, subtext }) {
  checkinCard.innerHTML = `
    <div class="closing-copy">
      <p class="eyebrow">CHECK IN</p>
      <h2>${escapeHtml(main)}</h2>
      <p class="muted support-line">${escapeHtml(subtext)}</p>
      ${renderPresenceDots()}
      <div class="actions">
        <button class="button button-primary" type="button" id="finish-button">Finish</button>
      </div>
    </div>
  `;

  document.querySelector("#finish-button").addEventListener("click", resetFlow);
}

function renderThreads() {
  const entries = getEntries();

  if (!entries.length) {
    threadsContent.innerHTML = `
      <div class="insight-card">
        <h3>Nothing to sort through right now</h3>
        <p class="muted">When a few check-ins gather here, this space will quietly reflect them back.</p>
      </div>
    `;
    return;
  }

  const repeatedWords = formatList(getRepeatedKeywords(entries, 5));
  const recentThemes = formatList(
    getTopTerms(entries.flatMap((entry) => collectEntryTexts(entry)), 4)
  );
  const breadcrumbs = buildBreadcrumbs(entries);

  threadsContent.innerHTML = `
    <div class="insight-card">
      <h3>What keeps asking for care</h3>
      <p>${buildPresenceLine(entries)}</p>
    </div>
    <div class="insight-card">
      <h3>Words that keep returning</h3>
      <p>${repeatedWords || "A few threads may need more time to repeat."}</p>
    </div>
    <div class="insight-card">
      <h3>What feels close lately</h3>
      <p>${recentThemes || "Nothing clear yet."}</p>
    </div>
    <div class="insight-card">
      <h3>Breadcrumbs for later</h3>
      <p>${breadcrumbs}</p>
    </div>
  `;
}

function buildPresenceLine(entries) {
  if (entries.length === 1) {
    return "A first thread has started to take shape.";
  }

  const repeatedWords = getRepeatedKeywords(entries, 2);

  if (repeatedWords.length) {
    return `${capitalize(repeatedWords.join(" and "))} ${repeatedWords.length > 1 ? "have" : "has"} been showing up more than once.`;
  }

  return "Some threads seem to return, even when they use different words.";
}

function buildBreadcrumbs(entries) {
  const keywords = getRepeatedKeywords(entries, 3);

  if (keywords.length) {
    return `Words like ${keywords.map((word) => `"${word}"`).join(", ")} keep circling back.`;
  }

  return "A few quiet breadcrumbs are gathering here for later.";
}

function finishCheckIn(closingScreen = "closing") {
  const extractedKeywords = extractKeywordsForEntry(state.entry);
  state.entry.extractedKeywords = extractedKeywords;
  state.entry.closingAffirmation = selectAffirmation(extractedKeywords);
  saveEntry();
  state.screen = closingScreen;
  renderCheckIn();
  renderThreads();
}

function renderPresenceDots() {
  return `<div class="pulse-dot" aria-hidden="true"></div>`;
}

function resetFlow() {
  state.screen = "opening";
  state.pauseMessage = "";
  state.delayedRevealReady = false;
  state.entry = createEmptyEntry();
  renderCheckIn();
}

function saveEntry() {
  const entries = getEntries();
  entries.unshift({
    timestamp: new Date().toISOString(),
    firstReflection: state.entry.firstReflection,
    branch: state.entry.branch,
    partMessage: state.entry.partMessage,
    situationGoingOn: state.entry.situationGoingOn,
    situationBothering: state.entry.situationBothering,
    situationPerspective: state.entry.situationPerspective,
    situationClearer: state.entry.situationClearer,
    closingAffirmation: state.entry.closingAffirmation,
    extractedKeywords: state.entry.extractedKeywords,
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function collectEntryTexts(entry) {
  return [
    entry.firstReflection,
    entry.partMessage,
    entry.situationGoingOn || entry.situationImportant,
    entry.situationBothering,
    entry.situationPerspective,
    entry.situationClearer,
  ].filter(Boolean);
}

function extractKeywordsForEntry(entry) {
  return [...new Set(normalizeTokens(collectEntryTexts(entry).join(" ")))];
}

function selectAffirmation(keywords) {
  const keywordSet = new Set(keywords);

  for (const affirmation of AFFIRMATIONS) {
    if (affirmation.keywords.some((keyword) => keywordSet.has(keyword))) {
      return affirmation.text;
    }
  }

  return "I listened. That matters.";
}

function getTopTerms(values, limit) {
  const counts = new Map();

  values
    .flatMap((value) => normalizeTokens(value))
    .forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function getRepeatedKeywords(entries, limit) {
  const counts = new Map();

  entries.forEach((entry) => {
    const tokens = new Set([
      ...(entry.extractedKeywords || []),
      ...normalizeTokens(collectEntryTexts(entry).join(" ")),
    ]);

    tokens.forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function scheduleReveal(screen, delayMs = 2400) {
  window.setTimeout(() => {
    if (state.screen !== screen || state.delayedRevealReady) {
      return;
    }

    state.delayedRevealReady = true;
    renderCheckIn();
  }, delayMs);
}

function normalizeTokens(text = "") {
  const stopWords = new Set([
    "and",
    "the",
    "that",
    "this",
    "with",
    "from",
    "have",
    "been",
    "just",
    "into",
    "there",
    "they",
    "them",
    "about",
    "what",
    "feel",
    "feels",
    "feeling",
    "here",
    "right",
    "want",
    "hear",
    "stay",
    "self",
    "after",
    "more",
    "little",
    "really",
    "still",
    "very",
    "like",
    "know",
    "need",
    "will",
    "could",
    "would",
    "should",
    "while",
    "where",
    "when",
    "because",
    "then",
    "than",
    "thing",
    "things",
    "part",
    "listening",
    "true",
    "think",
    "through",
    "steady",
    "most",
    "actually",
    "clearer",
    "start",
    "anywhere",
    "stands",
    "standsout",
    "fits",
    "best",
    "my",
    "our",
    "me",
    "can",
    "now",
    "got",
    "am",
    "are",
    "too",
    "i",
    "im",
    "you",
    "your",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function formatList(items) {
  if (!items.length) {
    return "";
  }

  return items.map(capitalize).join(", ");
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
