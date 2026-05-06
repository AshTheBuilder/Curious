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

const FLOW_VARIANTS = {
  validationOne: [
    "That makes sense to me",
    "I can see why that would feel this way to me",
    "Of course that would bother me",
    "That makes a lot of sense to me",
    "I understand why that feels important to me",
    "It makes sense that this is coming up for me",
    "I’m really glad I noticed that",
  ],
  validationOneLight: ["Heard", "I hear that", "I see that"],
  deeperPrompt: [
    "What about that feels the hardest?",
    "What about that is bothering me the most?",
    "What about that doesn’t sit right with me?",
    "What about that feels most real to me right now?",
  ],
  deeperPromptLight: ["What about that?", "What feels off about that?", "What’s going on there?"],
  validationTwo: [
    "That makes sense to me too",
    "I can see why that would feel true to me",
    "Of course that would feel this way to me",
    "That feels really real to me right now",
    "I understand why that would land that way for me",
    "That makes a lot of sense from where I am",
    "I’m really glad I noticed that",
  ],
  grounding: [
    "I’m here with this",
    "I don’t need to push this away",
    "I can stay with this for a second",
    "This can be here, and I’m still okay",
    "I’m noticing this, not becoming it",
  ],
  perspectivePrompt: [
    "Is this the whole picture, or just part of it?",
    "Is there anything in me that feels different?",
    "What do I think about this from a steadier place?",
    "Is there another side to this at all?",
  ],
  closing: [
    "I see this a little more clearly",
    "I’m glad I checked in",
    "That helped",
    "I can come back to this anytime",
    "I don’t have to figure it all out right now",
  ],
  lightExit: [
    "That’s all I have right now, and that’s okay",
    "I can just sit with this",
    "I don’t have to go deeper right now",
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
    openingReflection: "",
    mainConcern: "",
    deeperReflection: "",
    perspectiveReflection: "",
    lightMode: false,
    lightExitChoice: "",
    loopCount: 0,
    closingAffirmation: "",
    extractedKeywords: [],
  };
}

function createPromptCopy(previous = {}) {
  const validationOne = chooseVariant(FLOW_VARIANTS.validationOne, previous.validationOne);
  const validationTwo = chooseVariant(
    FLOW_VARIANTS.validationTwo.filter((option) => option !== validationOne),
    previous.validationTwo
  );
  const lightExitOptions = chooseMultipleVariants(FLOW_VARIANTS.lightExit, 3, previous.lightExitOptions);

  return {
    validationOne,
    validationOneLight: chooseVariant(FLOW_VARIANTS.validationOneLight, previous.validationOneLight),
    deeperPrompt: chooseVariant(FLOW_VARIANTS.deeperPrompt, previous.deeperPrompt),
    deeperPromptLight: chooseVariant(FLOW_VARIANTS.deeperPromptLight, previous.deeperPromptLight),
    validationTwo,
    grounding: chooseVariant(FLOW_VARIANTS.grounding, previous.grounding),
    perspectivePrompt: chooseVariant(FLOW_VARIANTS.perspectivePrompt, previous.perspectivePrompt),
    closing: chooseVariant(FLOW_VARIANTS.closing, previous.closing),
    lightExit: lightExitOptions[0],
    lightExitOptions,
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

function chooseMultipleVariants(options, count, previous = []) {
  const previousSet = new Set(previous);
  const prioritized = options
    .filter((option) => !previousSet.has(option))
    .concat(options.filter((option) => previousSet.has(option)));

  return prioritized.slice(0, Math.min(count, options.length));
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
        main: "Something feels off",
        buttonText: "Let me pause for a second",
        onContinue: () => setScreen("first-reflection"),
      });
      break;
    case "first-reflection":
      renderInputScreen({
        label: "CHECK IN",
        main: "I’m checking in",
        subtext: "What’s going on with me?",
        value: state.entry.openingReflection,
        onSubmit: (value) => {
          state.entry.openingReflection = value.trim();
          setScreen("second-reflection");
        },
      });
      break;
    case "second-reflection":
      renderInputScreen({
        label: "CHECK IN",
        main: "What’s really getting to me?",
        value: state.entry.mainConcern,
        onSubmit: (value) => {
          state.entry.mainConcern = value.trim();
          state.entry.lightMode = state.entry.mainConcern.length < 25;
          setScreen("validation-one");
        },
      });
      break;
    case "validation-one":
      renderDelayedContinueScreen({
        screen: "validation-one",
        main: state.entry.lightMode ? state.promptCopy.validationOneLight : state.promptCopy.validationOne,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("third-reflection"),
      });
      break;
    case "third-reflection":
      renderInputScreen({
        label: "CHECK IN",
        main: state.entry.lightMode ? state.promptCopy.deeperPromptLight : state.promptCopy.deeperPrompt,
        value: state.entry.deeperReflection,
        onSubmit: (value) => {
          state.entry.deeperReflection = value.trim();
          if (state.entry.lightMode && state.entry.deeperReflection.length < 25) {
            setScreen("light-exit");
            return;
          }

          setScreen("validation-two");
        },
      });
      break;
    case "light-exit":
      renderChoiceScreen({
        label: "CHECK IN",
        main: state.promptCopy.lightExit,
        choices: state.promptCopy.lightExitOptions,
        onChoose: (choice) => {
          state.entry.lightExitChoice = choice;
          setScreen("grounding");
        },
      });
      break;
    case "validation-two":
      renderDelayedContinueScreen({
        screen: "validation-two",
        main: state.promptCopy.validationTwo,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("grounding"),
      });
      break;
    case "grounding":
      renderDelayedContinueScreen({
        screen: "grounding",
        main: state.promptCopy.grounding,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("perspective"),
      });
      break;
    case "perspective":
      renderInputScreen({
        label: "CHECK IN",
        main: state.promptCopy.perspectivePrompt,
        value: state.entry.perspectiveReflection,
        onSubmit: (value) => {
          state.entry.perspectiveReflection = value.trim();
          setScreen("clearer");
        },
      });
      break;
    case "clearer":
      renderLandingScreen({
        label: "CHECK IN",
        main: "Does this feel a little clearer, or is there more here?",
        primaryLabel: "This feels clearer",
        secondaryLabel: "There’s more",
        onPrimary: () => finishCheckIn("closing"),
        onSecondary: loopCheckIn,
      });
      break;
    case "closing":
      renderClosing({
        main: state.promptCopy.closing,
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

function renderDelayedContinueScreen({
  screen,
  main,
  subtext = "",
  buttonLabel,
  onContinue,
  delayMs = getPulseDelay(),
}) {
  renderSilentPresenceStep({
    screen,
    main,
    buttonLabel,
    onContinue,
    delayMs,
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

function renderChoiceScreen({ label, main, choices, onChoose }) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <h2>${escapeHtml(main)}</h2>
      <div class="choice-group">
        ${choices
          .map(
            (choice, index) => `
              <button class="button button-secondary" type="button" data-choice-index="${index}">
                ${escapeHtml(choice)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  document.querySelectorAll("[data-choice-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = choices[Number(button.dataset.choiceIndex)];
      onChoose(choice);
    });
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
      <p class="eyebrow">CHECK IN</p>
      <h2>${escapeHtml(main)}</h2>
      ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      ${renderPresenceDots()}
      <div class="actions">
        <button class="button button-primary" type="button" id="finish-button">${escapeHtml(buttonText)}</button>
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
  entries.unshift({
    timestamp: new Date().toISOString(),
    openingReflection: state.entry.openingReflection,
    mainConcern: state.entry.mainConcern,
    deeperReflection: state.entry.deeperReflection,
    perspectiveReflection: state.entry.perspectiveReflection,
    lightExitChoice: state.entry.lightExitChoice,
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
    entry.openingReflection || entry.firstReflection,
    entry.mainConcern || entry.partMessage || entry.situationGoingOn || entry.situationImportant,
    entry.deeperReflection || entry.situationBothering,
    entry.perspectiveReflection || entry.situationPerspective || entry.situationClearer,
    entry.lightExitChoice,
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

function loopCheckIn() {
  state.entry.loopCount += 1;
  state.promptCopy = createPromptCopy(state.promptCopy);
  state.entry.deeperReflection = "";
  state.entry.perspectiveReflection = "";
  state.entry.lightExitChoice = "";
  if (state.entry.loopCount % 2 === 1) {
    setScreen("third-reflection");
    return;
  }

  state.entry.mainConcern = "";
  setScreen("second-reflection");
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
