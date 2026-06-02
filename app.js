const STORAGE_KEY = "curious-checkins";
const checkinCard = document.querySelector("#checkin-card");
const threadsContent = document.querySelector("#threads-content");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const FLOW_VARIANTS = {
  offDeeperPrompt: [
    "Does this feel new or older?",
    "What feels stirred up from this?",
    "What in me is reacting this strongly?",
    "How old does this feeling feel?",
    "What feels activated underneath this?",
  ],
  offSpaciousPrompt: ["What else do I notice now?"],
  offGrounding: [
    "I’m here with this",
    "I can stay here a little longer",
    "I don’t need to rush this",
    "There’s room for this",
    "I can notice this without following it",
  ],
  offPerspectivePrompt: [
    "Where am I now with this?",
    "What feels most true right now?",
    "What do I notice from a little farther back?",
    "What feels a little different now?",
  ],
  offMorePrompt: ["I have more to say."],
  offClosing: [
    "I made space for this.",
    "I can come back if there’s more.",
    "This doesn’t have to be solved right now.",
    "I stayed with this for a minute.",
  ],
  offReflectionFallback: [
    "There’s room here.",
    "I can keep noticing.",
    "There may be more here.",
    "I don’t need to rush this.",
  ],
  goodValidation: [
    "Hell yeah.",
    "I want to remember this.",
    "I’m really proud of this.",
    "I want to celebrate this.",
  ],
  goodClosing: [
    "I’m celebrating this.",
    "I’m taking this with me.",
    "I want to remember this feeling.",
  ],
};

const state = {
  activeTab: "checkin",
  screen: "opening",
  pauseMessage: "",
  delayedRevealReady: false,
  selectedPatternDate: "",
  promptCopy: createPromptCopy(),
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
    entryType: "",
    id: "",
    mainResponse: "",
    bodyLocations: [],
    bodyNote: "",
    deeperReflection: "",
    spaciousReflection: "",
    perspectiveReflection: "",
    offContextReflection: "",
    continuationReflection: "",
    stayLoopCount: 0,
    rememberLine: "",
    goodContinuityReflection: "",
    loopCount: 0,
    sessionSummary: "",
    closingLine: "",
    closingAffirmation: "",
    extractedKeywords: [],
  };
}

function createPromptCopy(previous = {}) {
  return {
    offDeeperPrompt: chooseVariant(FLOW_VARIANTS.offDeeperPrompt, previous.offDeeperPrompt),
    offSpaciousPrompt: chooseVariant(FLOW_VARIANTS.offSpaciousPrompt, previous.offSpaciousPrompt),
    offGrounding: chooseVariant(FLOW_VARIANTS.offGrounding, previous.offGrounding),
    offPerspectivePrompt: chooseVariant(FLOW_VARIANTS.offPerspectivePrompt, previous.offPerspectivePrompt),
    offMorePrompt: chooseVariant(FLOW_VARIANTS.offMorePrompt, previous.offMorePrompt),
    offClosing: chooseVariant(FLOW_VARIANTS.offClosing, previous.offClosing),
    offReflectionFallback: chooseVariant(FLOW_VARIANTS.offReflectionFallback, previous.offReflectionFallback),
    goodValidation: chooseVariant(FLOW_VARIANTS.goodValidation, previous.goodValidation),
    goodClosing: chooseVariant(FLOW_VARIANTS.goodClosing, previous.goodClosing),
  };
}

function chooseVariant(options, previous = "") {
  if (options.length === 1) {
    return options[0];
  }

  const available = options.filter((option) => option !== previous);
  const pool = available.length ? available : options;
  return pool[Math.floor(Math.random() * pool.length)];
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
    case "off-intro":
      renderMessageScreen({
        label: "Notice",
        main: "Something feels off",
        buttonText: "I’m curious →",
        onContinue: () => setScreen("off-main"),
      });
      break;
    case "good-intro":
      renderMessageScreen({
        label: "Notice",
        main: "Something feels good",
        buttonText: "Stay here →",
        onContinue: () => setScreen("good-main"),
      });
      break;
    case "off-main":
      renderInputScreen({
        label: "Notice",
        main: "What’s here?",
        value: state.entry.mainResponse,
        onSubmit: (value) => {
          state.entry.mainResponse = value.trim();
          setScreen("off-body");
        },
      });
      break;
    case "off-body":
      renderBodyLocationScreen({
        label: "Notice",
        main: "Where do I notice this most?",
        subtext: "No need to explain it yet. Just notice where it shows up.",
        selections: state.entry.bodyLocations,
        note: state.entry.bodyNote,
        onSubmit: ({ selections, note }) => {
          state.entry.bodyLocations = selections;
          state.entry.bodyNote = note.trim();
          setScreen("off-deeper");
        },
      });
      break;
    case "off-deeper":
      renderInputScreen({
        label: "Listen",
        main: state.promptCopy.offDeeperPrompt,
        value: "",
        onSubmit: (value) => {
          state.entry.deeperReflection = value.trim();
          setScreen("off-spacious");
        },
      });
      break;
    case "off-spacious":
      renderStayScreen({
        label: "",
        main: state.promptCopy.offSpaciousPrompt,
        value: "",
        buttonText: "Continue",
        secondaryButtonText: "Stay here",
        supportText: "",
        inputClassName: "text-input-notice",
        onPrimary: (value) => {
          state.entry.spaciousReflection = value.trim();
          setScreen("off-grounding");
        },
        onSecondary: (value) => {
          state.entry.spaciousReflection = value.trim();
          state.entry.stayLoopCount = 1;
          setScreen("off-more");
        },
      });
      break;
    case "off-grounding":
      renderDelayedContinueScreen({
        label: "Stay Here",
        main: state.promptCopy.offGrounding,
        buttonLabel: "Continue →",
        onContinue: () => setScreen("off-perspective"),
      });
      break;
    case "off-perspective":
      renderInputScreen({
        label: "Widen",
        main: state.promptCopy.offPerspectivePrompt,
        value: "",
        onSubmit: (value) => {
          state.entry.perspectiveReflection = appendReflection(state.entry.perspectiveReflection, value.trim());
          setScreen("off-continuation");
        },
      });
      break;
    case "off-continuation":
      renderLandingScreen({
        label: "Notice",
        main: "Where am I now with this?",
        primaryLabel: "Continue →",
        secondaryLabel: "Stay here →",
        onPrimary: () => {
          state.entry.closingLine = state.promptCopy.offClosing;
          setScreen("off-connected");
        },
        onSecondary: () => setScreen("off-more"),
      });
      break;
    case "off-connected":
      renderInputScreen({
        label: "Tell Me More",
        main: "What feels connected to this?",
        value: "",
        onSubmit: (value) => {
          state.entry.offContextReflection = value.trim();
          finishCheckIn("closing", state.entry.closingLine);
        },
      });
      break;
    case "off-more":
      renderStayScreen({
        label: "",
        main: "There’s more here I’m curious about.",
        value: "",
        supportText: "",
        inputClassName: "text-input-notice",
        mainClassName: "stay-heading-quiet",
        buttonText: "Continue",
        secondaryButtonText: "Stay here",
        onPrimary: (value) => {
          state.entry.continuationReflection = appendReflection(
            state.entry.continuationReflection,
            value.trim()
          );
          setScreen("off-grounding");
        },
        onSecondary: (value) => {
          state.entry.continuationReflection = appendReflection(
            state.entry.continuationReflection,
            value.trim()
          );
          if (state.entry.stayLoopCount >= 2) {
            setScreen("off-grounding");
            return;
          }

          state.entry.stayLoopCount += 1;
          state.promptCopy = createPromptCopy(state.promptCopy);
          setScreen("off-more");
        },
      });
      break;
    case "good-main":
      renderInputScreen({
        label: "Notice",
        main: "What feels good right now?",
        value: state.entry.mainResponse,
        onSubmit: (value) => {
          state.entry.mainResponse = value.trim();
          setScreen("good-validation");
        },
      });
      break;
    case "good-validation":
      renderDelayedContinueScreen({
        label: "Notice",
        main: state.promptCopy.goodValidation,
        buttonLabel: "Continue →",
        onContinue: () => setScreen("good-body"),
      });
      break;
    case "good-body":
      renderBodyLocationScreen({
        label: "Notice",
        main: "Where do I notice this in me?",
        selections: state.entry.bodyLocations,
        note: state.entry.bodyNote,
        onSubmit: ({ selections, note }) => {
          state.entry.bodyLocations = selections;
          state.entry.bodyNote = note.trim();
          setScreen("good-remember");
        },
      });
      break;
    case "good-remember":
      renderInputScreen({
        label: "Save This",
        main: "What do I want to remember about this?",
        value: state.entry.rememberLine,
        onSubmit: (value) => {
          state.entry.rememberLine = value.trim();
          setScreen("good-continuity");
        },
      });
      break;
    case "good-continuity":
      renderInputScreen({
        label: "Notice",
        main: "When else have I felt this way?",
        subtext: "This version of me has existed before.",
        value: "",
        onSubmit: (value) => {
          state.entry.goodContinuityReflection = value.trim();
          state.entry.closingLine = state.promptCopy.goodClosing;
          finishCheckIn("closing", state.entry.closingLine);
        },
      });
      break;
    case "closing":
      renderClosing({
        main: state.entry.closingLine,
        buttonText: "Back to start",
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
  checkinCard.classList.toggle("opening-shell", screen === "opening");
  renderCheckIn();
}

function renderOpeningScreen() {
  checkinCard.innerHTML = `
    <div class="opening-screen">
      <div class="home-choice-group">
        <button class="button button-secondary home-entry-button" type="button" id="off-begin-button">
          Something feels off
        </button>
        <button class="button button-secondary home-entry-button" type="button" id="good-begin-button">
          Something feels good
        </button>
      </div>
    </div>
  `;

  document.querySelector("#off-begin-button").addEventListener("click", () => {
    state.entry.entryType = "off";
    setScreen("off-intro");
  });

  document.querySelector("#good-begin-button").addEventListener("click", () => {
    state.entry.entryType = "good";
    setScreen("good-intro");
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

function renderDelayedContinueScreen({
  label = "CHECK IN",
  main,
  subtext = "",
  buttonLabel,
  onContinue,
}) {
  renderMessageScreen({
    label,
    main,
    subtext,
    buttonText: buttonLabel,
    onContinue,
    includePulse: true,
  });
}

function renderInputScreen({
  label,
  main,
  subtext = "",
  value,
  onSubmit,
  placeholder = "",
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
        <button class="button button-primary" type="submit">Continue →</button>
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

function renderBodyLocationScreen({ label, main, subtext = "", selections, note, onSubmit }) {
  const chips = [
    "chest",
    "throat",
    "stomach",
    "jaw",
    "shoulders",
    "face",
    "hands",
    "everywhere",
    "hard to tell",
  ];

  checkinCard.innerHTML = `
    <form id="body-location-form">
      <div class="question">
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h2>${escapeHtml(main)}</h2>
        ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      </div>
      <div class="chip-group">
        ${chips
          .map(
            (chip) => `
              <button
                class="chip-button${selections.includes(chip) ? " is-selected" : ""}"
                type="button"
                data-chip-value="${escapeAttribute(chip)}"
              >
                ${escapeHtml(chip)}
              </button>
            `
          )
          .join("")}
      </div>
      <textarea
        id="body-note-input"
        class="text-input text-input-compact"
      >${escapeHtml(note)}</textarea>
      <div class="actions">
        <button class="button button-primary" type="submit">Continue</button>
      </div>
    </form>
  `;

  const selected = new Set(selections);
  document.querySelectorAll("[data-chip-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.chipValue;
      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }
      button.classList.toggle("is-selected", selected.has(value));
    });
  });

  document.querySelector("#body-location-form").addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit({
      selections: [...selected],
      note: document.querySelector("#body-note-input").value,
    });
  });
}

function renderStayScreen({
  label,
  reflectionLine = "",
  lead = "",
  main,
  supportText = "",
  value,
  inputClassName = "",
  mainClassName = "",
  buttonText,
  secondaryButtonText,
  onPrimary,
  onSecondary,
}) {
  checkinCard.innerHTML = `
    <form id="stay-form">
      <div class="question">
        ${label ? `<p class="eyebrow eyebrow-quiet">${escapeHtml(label)}</p>` : ""}
        ${reflectionLine ? `<p class="muted support-line">${escapeHtml(reflectionLine)}</p>` : ""}
        ${lead ? `<p class="muted support-line">${escapeHtml(lead)}</p>` : ""}
        <h2 class="${escapeAttribute(mainClassName)}">${escapeHtml(main)}</h2>
        ${supportText ? `<p class="muted support-line">${escapeHtml(supportText)}</p>` : ""}
      </div>
      <textarea
        id="stay-input"
        class="text-input ${escapeAttribute(inputClassName)}"
      >${escapeHtml(value)}</textarea>
      <div class="choice-group">
        <button class="button button-secondary" type="button" id="stay-secondary">
          ${escapeHtml(secondaryButtonText)}
        </button>
        <button class="button button-primary" type="submit">
          ${escapeHtml(buttonText)}
        </button>
      </div>
    </form>
  `;

  const form = document.querySelector("#stay-form");
  const input = document.querySelector("#stay-input");
  input.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onPrimary(input.value);
  });

  document.querySelector("#stay-secondary").addEventListener("click", () => {
    onSecondary(input.value);
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

function renderSilentPresenceStep({ screen, main, buttonLabel, onContinue }) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">CHECK IN</p>
      <h2>${escapeHtml(main)}</h2>
      ${renderPresenceDots()}
      <div class="actions presence-actions">
        <button class="button button-primary" type="button" id="presence-continue">${escapeHtml(buttonLabel)}</button>
      </div>
    </div>
  `;

  document.querySelector("#presence-continue").addEventListener("click", onContinue);
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

function renderClosing({ main, subtext = "", buttonText = "Finish" }) {
  checkinCard.innerHTML = `
    <div class="closing-copy">
      <p class="eyebrow">Closing</p>
      <h2>${escapeHtml(main)}</h2>
      ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      ${renderPresenceDots()}
      <div class="actions">
        <button class="button button-primary" type="button" id="finish-button">${escapeHtml(buttonText)} →</button>
      </div>
    </div>
  `;

  document.querySelector("#finish-button").addEventListener("click", resetFlow);
}

function renderThreads() {
  const entries = getEntriesNewestFirst();

  threadsContent.innerHTML = `
    ${
      entries.length
        ? `
          <div class="session-log-list">
            ${entries.map(renderSessionLogCard).join("")}
          </div>
          <div class="session-log-actions">
            <button class="button button-quiet session-log-clear" type="button" id="clear-session-log">
              Clear session log
            </button>
          </div>
        `
        : `
          <div class="session-log-empty">
            <h3>No sessions saved yet.</h3>
            <p class="muted">When I check in, a quiet record will appear here.</p>
          </div>
        `
    }
  `;

  const clearButton = document.querySelector("#clear-session-log");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (window.confirm("Clear all saved sessions?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderThreads();
      }
    });
  }
}

function finishCheckIn(closingScreen = "closing", closingLine = "") {
  const extractedKeywords = extractKeywordsForEntry(state.entry);
  state.entry.extractedKeywords = extractedKeywords;
  state.entry.closingAffirmation = "";
  state.entry.closingLine = closingLine || state.promptCopy.offClosing;
  saveEntry();
  state.screen = closingScreen;
  renderCheckIn();
  renderThreads();
}

function renderPresenceDots() {
  return `<div class="pulse-dot" aria-hidden="true"></div>`;
}

function getPulseDelay() {
  return 1500 + Math.floor(Math.random() * 1000);
}

function resetFlow() {
  state.screen = "opening";
  state.pauseMessage = "";
  state.delayedRevealReady = false;
  state.promptCopy = createPromptCopy();
  state.entry = createEmptyEntry();
  renderCheckIn();
}

function saveEntry() {
  const entries = getEntries();
  entries.push(buildSavedSession());
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

function getEntriesNewestFirst() {
  return [...getEntries()].sort((a, b) => {
    const aTime = new Date(a.timestamp || 0).getTime();
    const bTime = new Date(b.timestamp || 0).getTime();
    return bTime - aTime;
  });
}

function buildSavedSession() {
  const timestamp = new Date().toISOString();

  return {
    id: state.entry.id || createSessionId(),
    timestamp,
    entryType: state.entry.entryType,
    entryTypeLabel: getEntryTypeLabel(state.entry.entryType),
    mainResponse: state.entry.mainResponse,
    bodyLocations: state.entry.bodyLocations,
    bodyNote: state.entry.bodyNote,
    deeperReflection: state.entry.deeperReflection,
    spaciousReflection: state.entry.spaciousReflection,
    perspectiveReflection: state.entry.perspectiveReflection,
    offContextReflection: state.entry.offContextReflection,
    continuationReflection: state.entry.continuationReflection,
    rememberLine: state.entry.rememberLine,
    goodContinuityReflection: state.entry.goodContinuityReflection,
    closingLine: state.entry.closingLine,
    sessionSummary: buildSessionExcerpt(state.entry),
    extractedKeywords: state.entry.extractedKeywords,
  };
}

function renderSessionLogCard(entry) {
  const bodyLine = (entry.bodyLocations || []).length
    ? `Body: ${entry.bodyLocations.join(", ")}`
    : "";
  const finalLine =
    entry.goodContinuityReflection ||
    entry.offContextReflection ||
    entry.rememberLine ||
    entry.closingLine ||
    "";

  return `
    <article class="session-log-card" data-session-id="${escapeAttribute(entry.id || "")}">
      <p class="eyebrow">${escapeHtml(formatSessionTimestamp(entry.timestamp))}</p>
      <h3>${escapeHtml(entry.entryTypeLabel || getEntryTypeLabel(entry.entryType))}</h3>
      <p>${escapeHtml(entry.sessionSummary || buildSessionExcerpt(entry))}</p>
      ${bodyLine ? `<p class="muted">${escapeHtml(bodyLine)}</p>` : ""}
      ${finalLine ? `<p class="muted">I noticed: ${escapeHtml(shortenText(finalLine, 110))}</p>` : ""}
    </article>
  `;
}

function buildSessionExcerpt(entry) {
  const primary = getPrimarySessionText(entry);

  if (!primary) {
    return "There wasn’t much written here, and that still counts.";
  }

  return shortenText(primary, 180);
}

function getPrimarySessionText(entry) {
  if ((entry.entryType || "off") === "good") {
    return (
      entry.goodContinuityReflection ||
      entry.rememberLine ||
      entry.mainResponse ||
      entry.bodyNote ||
      entry.closingLine ||
      ""
    );
  }

  return (
    getLastReflectionChunk(entry.offContextReflection) ||
    getLastReflectionChunk(entry.continuationReflection) ||
    getLastReflectionChunk(entry.spaciousReflection) ||
    getLastReflectionChunk(entry.deeperReflection) ||
    getLastReflectionChunk(entry.perspectiveReflection) ||
    entry.mainResponse ||
    entry.bodyNote ||
    entry.closingLine ||
    ""
  );
}

function getEntryTypeLabel(entryType = "") {
  return entryType === "good" ? "Something felt good" : "Something felt off";
}

function formatSessionTimestamp(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function collectEntryTexts(entry) {
  return [
    entry.mainResponse || entry.openingReflection || entry.firstReflection,
    (entry.bodyLocations || []).join(" "),
    entry.bodyNote,
    entry.deeperReflection || entry.situationBothering,
    entry.spaciousReflection,
    entry.perspectiveReflection || entry.situationPerspective || entry.situationClearer,
    entry.offContextReflection,
    entry.continuationReflection,
    entry.rememberLine,
    entry.goodContinuityReflection,
    entry.closingLine,
  ].filter(Boolean);
}

function extractKeywordsForEntry(entry) {
  return [...new Set(normalizeTokens(collectEntryTexts(entry).join(" ")))];
}

function appendReflection(existing = "", next = "") {
  const trimmedNext = next.trim();

  if (!trimmedNext) {
    return existing;
  }

  return existing ? `${existing}\n\n${trimmedNext}` : trimmedNext;
}

function getMostRecentOffEntryText(entry) {
  const values = [
    getLastReflectionChunk(entry.continuationReflection),
    getLastReflectionChunk(entry.spaciousReflection),
    getLastReflectionChunk(entry.perspectiveReflection),
    entry.deeperReflection,
    entry.mainResponse,
  ];

  return values.find((value) => value && value.trim()) || "";
}

function getLastReflectionChunk(text = "") {
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length ? chunks[chunks.length - 1] : "";
}

function getQuietReflectionLine(sourceText = "", fallback = "There’s room here.") {
  const mirrored = buildMirroredPhrase(sourceText);
  return mirrored || fallback;
}

function buildMirroredPhrase(text = "") {
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "";
  }

  const clause = extractInitialClause(trimmed);
  const words = clause.split(/\s+/).filter(Boolean);

  if (words.length < 3) {
    return "";
  }

  const limited = words.slice(0, 8).join(" ").replace(/[,:;]+$/g, "");
  const normalized = limited.charAt(0).toUpperCase() + limited.slice(1);
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function extractInitialClause(text = "") {
  const breakPatterns = [
    /\.\s/,
    /!\s/,
    /\?\s/,
    /\n/,
    /,\s/,
    /;\s/,
    /\sand\s/i,
    /\sbut\s/i,
    /\sbecause\s/i,
  ];

  let clause = text;

  for (const pattern of breakPatterns) {
    const match = clause.match(pattern);
    if (match && match.index >= 12) {
      clause = clause.slice(0, match.index);
      break;
    }
  }

  return clause.trim();
}

function loopCheckIn() {
  state.entry.loopCount += 1;
  state.promptCopy = createPromptCopy(state.promptCopy);
  state.entry.bodyLocations = [];
  state.entry.bodyNote = "";
  state.entry.deeperReflection = "";
  state.entry.spaciousReflection = "";
  state.entry.perspectiveReflection = "";
  state.entry.offContextReflection = "";
  state.entry.continuationReflection = "";
  state.entry.goodContinuityReflection = "";
  state.entry.stayLoopCount = 0;
  if (state.entry.loopCount % 2 === 1) {
    setScreen("off-body");
    return;
  }

  state.entry.mainResponse = "";
  setScreen("off-main");
}

function buildCalendar(entries, referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const marks = getEntryCountByDay(entries, year, month);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push({ empty: true, key: `empty-start-${i}` });
  }

  for (let dayNumber = 1; dayNumber <= lastDay.getDate(); dayNumber += 1) {
    const dayInfo = marks.get(dayNumber) || { count: 0, markerType: "" };
    const dateKey = formatDateKey(year, month, dayNumber);
    days.push({
      empty: false,
      key: `day-${dayNumber}`,
      label: String(dayNumber),
      dateKey,
      count: dayInfo.count,
      markerType: dayInfo.markerType,
      marked: dayInfo.count > 0,
      selected: state.selectedPatternDate === dateKey,
      isToday:
        dayNumber === referenceDate.getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear(),
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ empty: true, key: `empty-end-${days.length}` });
  }

  return {
    monthLabel: referenceDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    weekdays: CALENDAR_WEEKDAYS,
    days,
  };
}

function renderCalendarDay(day) {
  if (day.empty) {
    return `<div class="calendar-day calendar-day-empty" aria-hidden="true"></div>`;
  }

  return `
    <button
      class="calendar-day-button${day.marked ? " is-marked" : ""}${day.selected ? " is-selected" : ""}${day.isToday ? " is-today" : ""}${day.markerType ? ` is-${day.markerType}` : ""}"
      type="button"
      data-pattern-date="${escapeAttribute(day.dateKey)}"
      aria-label="${escapeAttribute(buildCalendarDayLabel(day))}"
    >
      <span class="calendar-day-label">${escapeHtml(day.label)}</span>
      <span class="calendar-day-dot" aria-hidden="true"></span>
    </button>
  `;
}

function buildCalendarDayLabel(day) {
  if (!day.marked) {
    return `${day.label}`;
  }

  if (day.count === 1) {
    return `${day.label}, one check-in`;
  }

  return `${day.label}, ${day.count} check-ins`;
}

function getEntryCountByDay(entries, year, month) {
  const counts = new Map();

  entries.forEach((entry) => {
    if (!entry.timestamp) {
      return;
    }

    const date = new Date(entry.timestamp);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    if (date.getFullYear() !== year || date.getMonth() !== month) {
      return;
    }

    const day = date.getDate();
    const current = counts.get(day) || { count: 0, types: new Set() };
    current.count += 1;
    current.types.add(entry.entryType || "off");
    counts.set(day, current);
  });

  return new Map(
    [...counts.entries()].map(([day, info]) => {
      const markerType =
        info.types.size > 1 ? "mixed" : info.types.has("good") ? "good" : "off";
      return [day, { count: info.count, markerType }];
    })
  );
}

function resolveSelectedPatternDate(entries, calendar) {
  if (state.selectedPatternDate && calendar.days.some((day) => !day.empty && day.dateKey === state.selectedPatternDate)) {
    return state.selectedPatternDate;
  }

  const firstMarkedDay = calendar.days.find((day) => !day.empty && day.marked);
  const fallbackDay = calendar.days.find((day) => !day.empty && day.isToday) || calendar.days.find((day) => !day.empty);
  const selected = (firstMarkedDay || fallbackDay)?.dateKey || "";
  state.selectedPatternDate = selected;
  return selected;
}

function getEntriesForDate(entries, dateKey) {
  return entries.filter((entry) => entry.timestamp && toDateKey(new Date(entry.timestamp)) === dateKey);
}

function renderPatternDayCard(selectedDate, entries) {
  if (!selectedDate) {
    return `
      <div class="pattern-day-card">
        <h3>Nothing saved here.</h3>
        <p class="muted">That doesn’t mean nothing was happening. There just isn’t a note from this day.</p>
      </div>
    `;
  }

  const dayLabel = formatReadableDate(selectedDate);

  if (!entries.length) {
    return `
      <div class="pattern-day-card">
        <p class="eyebrow">${escapeHtml(dayLabel)}</p>
        <h3>Nothing saved here.</h3>
        <p class="muted">That doesn’t mean nothing was happening. There just isn’t a note from this day.</p>
      </div>
    `;
  }

  const summary = buildDaySummary(entries, selectedDate);

  return `
    <div class="pattern-day-card">
      <p class="eyebrow">${escapeHtml(dayLabel)}</p>
      <h3>${escapeHtml(summary.entryTypeLabel)}</h3>
      <div class="pattern-day-sections">
        <div class="pattern-day-section">
          <p>${escapeHtml(summary.mainResponse)}</p>
        </div>
        ${
          summary.bodyLine
            ? `
              <div class="pattern-day-section">
                <p class="muted">I noticed this in ${escapeHtml(summary.bodyLine)}.</p>
              </div>
            `
            : ""
        }
        ${
          summary.noticedLine
            ? `
              <div class="pattern-day-section">
                <p class="muted">I noticed: ${escapeHtml(summary.noticedLine)}</p>
              </div>
            `
            : ""
        }
      </div>
    </div>
  `;
}

function buildDaySummary(entries, selectedDate) {
  const latestEntry = entries[0];
  const bodyBits = (latestEntry.bodyLocations || []).filter(Boolean);
  const noticedLine = getPatternNoticedLine(latestEntry);

  return {
    entryTypeLabel: latestEntry.entryType === "good" ? "Something felt good" : "Something felt off",
    mainResponse: shortenText(latestEntry.mainResponse || "There wasn’t much written here, and that still counts."),
    bodyLine: bodyBits.length ? shortenText(bodyBits.join(", "), 80) : "",
    noticedLine,
  };
}

function buildInnerPatternLines(entries, selectedEntries) {
  if (entries.length < 3) {
    return ["Patterns will appear gently as more check-ins are saved."];
  }

  const bodyCounts = getBodyLocationCounts(entries);
  const repeatedBody = [...bodyCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const hasOlderLanguage = entries.some((entry) =>
    [entry.deeperReflection, entry.spaciousReflection, entry.continuationReflection]
      .filter(Boolean)
      .some((text) => /\b(older|old|familiar)\b/i.test(text))
  );
  const hasGood = entries.some((entry) => entry.entryType === "good");
  const hasOff = entries.some((entry) => (entry.entryType || "off") === "off");
  const repeatedWords = getRepeatedKeywords(entries, 2);
  const lines = [];

  if (repeatedBody && repeatedBody[1] > 1) {
    lines.push(`${capitalize(repeatedBody[0])} has come up more than once.`);
  }

  if (hasOlderLanguage) {
    lines.push("Older or familiar has shown up recently.");
  }

  if (hasGood && hasOff) {
    lines.push("Good moments are being recorded too.");
  }

  if (!lines.length && selectedEntries.length && repeatedWords[0]) {
    lines.push("This feeling has visited before.");
  }

  if (!lines.length && repeatedWords[0]) {
    lines.push("Something here has come around before.");
  }

  return lines.length ? lines.slice(0, 3) : ["Patterns will appear gently as more check-ins are saved."];
}

function getPatternNoticedLine(entry) {
  const value =
    getLastReflectionChunk(entry.rememberLine) ||
    getLastReflectionChunk(entry.perspectiveReflection) ||
    getLastReflectionChunk(entry.continuationReflection) ||
    getLastReflectionChunk(entry.spaciousReflection) ||
    getLastReflectionChunk(entry.deeperReflection) ||
    "";

  return value ? shortenText(value, 100) : "";
}

function getBodyLocationCounts(entries) {
  const counts = new Map();

  entries.forEach((entry) => {
    (entry.bodyLocations || []).forEach((location) => {
      const normalized = location.trim().toLowerCase();
      if (!normalized) {
        return;
      }

      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
  });

  return counts;
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDateKey(date) {
  return formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatReadableDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shortenText(text = "", limit = 90) {
  const trimmed = text.trim();

  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit).trimEnd()}...`;
}

function hashString(value = "") {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
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
    "why",
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
