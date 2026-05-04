const STORAGE_KEY = "curious-checkins";
const checkinCard = document.querySelector("#checkin-card");
const threadsContent = document.querySelector("#threads-content");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AFFIRMATIONS = [
  {
    keywords: ["alone", "abandoned", "left"],
    text: "I am here with myself right now.",
  },
  {
    keywords: ["much", "burden", "pressure", "responsible", "carrying", "carry"],
    text: "I do not have to carry all of this at once.",
  },
  {
    keywords: ["rejected", "chosen", "replaced", "unwanted"],
    text: "This hurt, and I do not have to make it bigger than it is.",
  },
  {
    keywords: ["scared", "unsafe", "afraid"],
    text: "I can go slowly with this.",
  },
  {
    keywords: ["shame", "bad", "wrong", "enough"],
    text: "I can stay kind with what I am noticing.",
  },
  {
    keywords: ["control", "manage", "fix"],
    text: "I do not have to solve everything right now.",
  },
];

const PROMPT_VARIANTS = {
  firstReflection: [
    "What’s going on here?",
    "What am I feeling right now?",
    "What feels off right now?",
  ],
  situationGoingOn: [
    "What’s going on here?",
    "What happened here?",
    "What am I reacting to?",
  ],
  situationBothering: [
    "Why is this bothering me?",
    "What about this is getting to me?",
    "What feels hard about this?",
  ],
  situationPerspective: [
    "Is there another way I can see this?",
    "What else might be true here?",
    "What am I missing right now?",
  ],
};

const PART_VALIDATION_VARIANTS = {
  default: [
    "I hear you. That makes sense.",
    "That makes sense. I hear you.",
    "I hear you. I get it.",
    "I hear you. I understand.",
    "I can see why this is here.",
    "I can see why you feel this way.",
    "I can see this.",
    "I hear what you’re saying.",
    "I’m with you in this.",
    "I hear you. This makes sense to me.",
    "I’m here. I hear you.",
  ],
  quiet: [
    "I’m here with you. You don’t have to say anything yet.",
    "I’m here. You can take your time.",
    "I’m right here. It’s okay if nothing’s coming up yet.",
  ],
  anger: [
    "I hear you. That makes sense.",
    "I hear you. Of course this is coming up.",
    "Of course. I hear you.",
    "I’m here. I hear you.",
  ],
  hurt: [
    "I hear you. I understand.",
    "I can see why you feel this way.",
    "I can see why this is here.",
    "I’m sorry. I hear you.",
    "I’m sorry. I understand.",
    "I’m sorry you’re feeling this. I hear you.",
    "I’m with you in this.",
  ],
  overwhelm: [
    "I hear you. That makes sense.",
    "I hear you. This feels like a lot.",
    "I hear you. This makes sense to me.",
    "I’m here. I hear you.",
  ],
};

const state = {
  activeTab: "checkin",
  screen: "opening",
  pauseMessage: "",
  delayedRevealReady: false,
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
    firstReflection: "",
    branch: "",
    partMessage: "",
    partHasMessage: false,
    partValidationText: "",
    situationGoingOn: "",
    situationBothering: "",
    situationPerspective: "",
    situationClearer: "",
    closingAffirmation: "",
    extractedKeywords: [],
  };
}

function createPromptCopy() {
  return {
    firstReflection: chooseVariant(PROMPT_VARIANTS.firstReflection),
    situationGoingOn: chooseVariant(PROMPT_VARIANTS.situationGoingOn),
    situationBothering: chooseVariant(PROMPT_VARIANTS.situationBothering),
    situationPerspective: chooseVariant(PROMPT_VARIANTS.situationPerspective),
  };
}

function chooseVariant(options) {
  return options[Math.floor(Math.random() * options.length)];
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
        main: "Something is here.",
        subtext: "I want to understand it.",
        buttonText: "Continue",
        onContinue: () => setScreen("first-reflection"),
      });
      break;
    case "first-reflection":
      renderInputScreen({
        label: "CHECK IN",
        main: state.promptCopy.firstReflection,
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
        main: "I’m noticing this.",
        buttonText: "Continue",
        onContinue: () => setScreen("branch"),
        includePulse: true,
      });
      break;
    case "branch":
      renderBranchScreen();
      break;
    case "part-open":
      renderSilentPresenceStep({
        screen: "part-open",
        main: "I’m going to get still and listen for the part that’s here.",
        buttonLabel: "Continue",
        onContinue: () => setScreen("part-message"),
        delayMs: 2600,
      });
      break;
    case "part-message":
      renderPartMessageScreen();
      break;
    case "part-more":
      renderPartMoreScreen();
      break;
    case "part-validate":
      renderMessageScreen({
        label: "CHECK IN",
        main: state.entry.partValidationText,
        buttonText: "Continue",
        onContinue: () => setScreen("part-settled"),
      });
      break;
    case "part-settled":
      renderLandingScreen({
        label: "CHECK IN",
        main: "Does this feel more settled, or is there more you want me to hear?",
        primaryLabel: "More settled",
        secondaryLabel: "There’s more",
        onPrimary: () => finishCheckIn("part-closing"),
        onSecondary: () => setScreen("part-more"),
      });
      break;
    case "part-closing":
      renderClosing({
        main: "I stayed with this.",
        subtext: "I can come back anytime.",
      });
      break;
    case "situation-going-on":
      renderInputScreen({
        label: "CHECK IN",
        main: state.promptCopy.situationGoingOn,
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
        main: state.promptCopy.situationBothering,
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
        main: "That makes sense to me.",
        buttonText: "Continue",
        onContinue: () => setScreen("situation-perspective"),
        includePulse: true,
      });
      break;
    case "situation-perspective":
      renderInputScreen({
        label: "CHECK IN",
        main: state.promptCopy.situationPerspective,
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
        main: "There’s a reason this hit me.",
        subtext: "I’m seeing a little more of it.",
        buttonText: "Continue",
        onContinue: () => setScreen("situation-clearer"),
      });
      break;
    case "situation-clearer":
      renderLandingScreen({
        label: "CHECK IN",
        main: "Does this feel a little clearer now?",
        primaryLabel: "Yes, it does",
        secondaryLabel: "There’s more to say",
        onPrimary: () => finishCheckIn("situation-closing"),
        onSecondary: () => setScreen("situation-going-on"),
      });
      break;
    case "situation-closing":
      renderClosing({
        main: "I see it more clearly.",
        subtext: "I’m glad I checked in. I can come back if this shows up again.",
      });
      break;
    case "closing":
      renderClosing({
        main: "I’m here with myself.",
        subtext: "I can come back anytime.",
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
      <p class="muted support-line">I want to check in.</p>
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
  placeholder = "I can start anywhere.",
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
      <h2>What kind of thing is this?</h2>
      <p class="muted support-line">I can go with what fits best.</p>
      <div class="choice-group">
        <button class="button button-secondary" type="button" id="part-branch">
          A part of me is reacting
        </button>
        <button class="button button-secondary" type="button" id="situation-branch">
          I’m trying to understand a situation
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
      <div class="question">
        <p class="eyebrow">CHECK IN</p>
        <h2>What is this part trying to tell me?</h2>
      </div>
      <textarea
        id="part-message-input"
        class="text-input"
        placeholder="I’m listening."
      >${escapeHtml(state.entry.partMessage)}</textarea>
      <div class="actions">
        <button class="button button-primary" type="submit">Continue</button>
        <button class="button button-secondary" type="button" id="part-message-skip">Nothing yet</button>
      </div>
    </form>
  `;

  const form = document.querySelector("#part-message-form");
  const input = document.querySelector("#part-message-input");
  input.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.entry.partMessage = input.value.trim();
    state.entry.partHasMessage = Boolean(state.entry.partMessage);
    state.entry.partValidationText = getPartValidationText(state.entry.partMessage);
    setScreen("part-validate");
  });

  document.querySelector("#part-message-skip").addEventListener("click", () => {
    state.entry.partMessage = input.value.trim();
    state.entry.partHasMessage = Boolean(state.entry.partMessage);
    state.entry.partValidationText = getPartValidationText(state.entry.partMessage);
    setScreen("part-validate");
  });
}

function renderPartMoreScreen() {
  renderInputScreen({
    label: "CHECK IN",
    main: "What else does this part want me to know?",
    value: "",
    onSubmit: (value) => {
      const nextNote = value.trim();

      if (nextNote) {
        state.entry.partMessage = state.entry.partMessage
          ? `${state.entry.partMessage}\n\n${nextNote}`
          : nextNote;
      }

      state.entry.partHasMessage = Boolean(state.entry.partMessage.trim());
      state.entry.partValidationText = getPartValidationText(state.entry.partMessage);
      setScreen("part-validate");
    },
    placeholder: "There may be a little more here.",
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
  const calendar = buildCalendar(entries, new Date());
  const patternLines = buildRecentPatterns(entries);

  threadsContent.innerHTML = `
    <div class="insight-card">
      <div
        class="calendar-shell"
        role="img"
        aria-label="A simple calendar view of recent check-ins"
        style="display:grid; gap:0.75rem;"
      >
        <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
          <h3 style="margin:0;">${escapeHtml(calendar.monthLabel)}</h3>
          <p class="muted" style="margin:0;">A few days stand out.</p>
        </div>
        <div
          class="calendar-weekdays"
          style="display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:0.35rem;"
        >
          ${calendar.weekdays
            .map(
              (day) => `
                <span class="muted" style="font-size:0.75rem; text-align:center;">${escapeHtml(day)}</span>
              `
            )
            .join("")}
        </div>
        <div
          class="calendar-grid"
          style="display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:0.35rem;"
        >
          ${calendar.days.map(renderCalendarDay).join("")}
        </div>
      </div>
    </div>
    <div class="insight-card">
      <h3>Recent patterns</h3>
      <div style="display:grid; gap:0.5rem;">
        ${patternLines
          .map((line) => `<p class="muted" style="margin:0;">${escapeHtml(line)}</p>`)
          .join("")}
      </div>
    </div>
  `;
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
  state.promptCopy = createPromptCopy();
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

  return "I checked in. That matters.";
}

function getPartValidationText(message = "") {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return chooseVariant(PART_VALIDATION_VARIANTS.quiet);
  }

  const normalizedMessage = trimmedMessage.toLowerCase();

  if (matchesAnyKeyword(normalizedMessage, ["mad", "angry", "furious", "rage", "pissed"])) {
    return chooseVariant(PART_VALIDATION_VARIANTS.anger);
  }

  if (matchesAnyKeyword(normalizedMessage, ["sad", "hurt", "alone", "rejected", "unlovable"])) {
    return chooseVariant(PART_VALIDATION_VARIANTS.hurt);
  }

  if (
    matchesAnyKeyword(normalizedMessage, [
      "overwhelmed",
      "too much",
      "anxious",
      "stress",
      "can t handle",
      "can't handle",
    ])
  ) {
    return chooseVariant(PART_VALIDATION_VARIANTS.overwhelm);
  }

  return chooseVariant(PART_VALIDATION_VARIANTS.default);
}

function matchesAnyKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
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
    const count = marks.get(dayNumber) || 0;
    days.push({
      empty: false,
      key: `day-${dayNumber}`,
      label: String(dayNumber),
      count,
      marked: count > 0,
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
    return `<div aria-hidden="true" style="min-height:3.5rem;"></div>`;
  }

  const borderColor = day.marked ? "rgba(209, 160, 120, 0.55)" : "rgba(255, 255, 255, 0.08)";
  const background = day.marked ? "rgba(209, 160, 120, 0.12)" : "rgba(255, 255, 255, 0.03)";
  const ring = day.isToday ? "box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);" : "";

  return `
    <div
      style="
        min-height:3.5rem;
        border-radius:0.9rem;
        border:1px solid ${borderColor};
        background:${background};
        padding:0.45rem;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        ${ring}
      "
      aria-label="${escapeAttribute(buildCalendarDayLabel(day))}"
    >
      <span style="font-size:0.85rem;">${escapeHtml(day.label)}</span>
      <span
        aria-hidden="true"
        style="
          width:0.4rem;
          height:0.4rem;
          border-radius:999px;
          background:${day.marked ? "currentColor" : "transparent"};
          opacity:${day.marked ? "0.75" : "0"};
        "
      ></span>
    </div>
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
    counts.set(day, (counts.get(day) || 0) + 1);
  });

  return counts;
}

function buildRecentPatterns(entries) {
  const repeatedWords = getRepeatedKeywords(entries, 2);
  const recentThemes = getTopTerms(entries.flatMap((entry) => collectEntryTexts(entry)), 2);
  const lines = [];

  lines.push("This has come up a few times.");

  if (repeatedWords[0]) {
    lines.push(`Similar feeling: ${capitalize(repeatedWords[0])}`);
  } else if (recentThemes[0]) {
    lines.push(`Similar feeling: ${capitalize(recentThemes[0])}`);
  } else {
    lines.push("Similar feeling: overwhelm");
  }

  lines.push("Usually passes in a few days.");

  return lines;
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
