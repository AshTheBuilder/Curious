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
  offValidationOneShort: [
    "Heard.",
    "Of course.",
    "I’m listening.",
    "I can see that.",
    "Something feels stirred up.",
    "That’s here right now.",
  ],
  offValidationOneLong: [
    "It makes sense this is coming up for me.",
    "No wonder this feels heavy.",
    "Of course this feels big.",
    "This makes sense.",
  ],
  offDeeperPrompt: [
    "Does this feel new or older?",
    "What feels stirred up from this?",
    "What in me is reacting this strongly?",
    "How old does this feeling feel?",
    "What feels activated underneath this?",
  ],
  offValidationTwo: [
    "That makes sense to me too",
    "I can see why that would feel true to me",
    "Of course that would feel this way to me",
    "That feels really real to me right now",
    "I understand why that would land that way for me",
    "That makes a lot of sense from where I am",
    "I’m really glad I noticed that",
  ],
  offGrounding: [
    "I’m here with this",
    "I don’t need to push this away",
    "I can stay with this for a second",
    "This can be here, and I’m still okay",
    "I’m noticing this, not becoming it",
  ],
  offPerspectivePrompt: [
    "Is this the whole picture, or just part of it?",
    "Is there anything in me that feels different?",
    "What do I think about this from a steadier place?",
    "Is there another side to this at all?",
  ],
  offClosing: [
    "I see this a little more clearly",
    "I’m glad I checked in",
    "That helped",
    "I can come back to this anytime",
    "I don’t have to figure it all out right now",
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
    mainResponse: "",
    offIsBrief: false,
    bodyLocations: [],
    bodyNote: "",
    deeperReflection: "",
    perspectiveReflection: "",
    rememberLine: "",
    loopCount: 0,
    closingLine: "",
    closingAffirmation: "",
    extractedKeywords: [],
  };
}

function createPromptCopy(previous = {}) {
  const offValidationOneShort = chooseVariant(
    FLOW_VARIANTS.offValidationOneShort,
    previous.offValidationOneShort
  );
  const offValidationOneLong = chooseVariant(
    FLOW_VARIANTS.offValidationOneLong,
    previous.offValidationOneLong
  );
  const offValidationTwo = chooseVariant(
    FLOW_VARIANTS.offValidationTwo.filter(
      (option) => option !== offValidationOneShort && option !== offValidationOneLong
    ),
    previous.offValidationTwo
  );

  return {
    offValidationOneShort,
    offValidationOneLong,
    offDeeperPrompt: chooseVariant(FLOW_VARIANTS.offDeeperPrompt, previous.offDeeperPrompt),
    offValidationTwo,
    offGrounding: chooseVariant(FLOW_VARIANTS.offGrounding, previous.offGrounding),
    offPerspectivePrompt: chooseVariant(FLOW_VARIANTS.offPerspectivePrompt, previous.offPerspectivePrompt),
    offClosing: chooseVariant(FLOW_VARIANTS.offClosing, previous.offClosing),
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
        label: "CHECK IN",
        main: "Something feels off",
        buttonText: "Let me pause for a second",
        onContinue: () => setScreen("off-main"),
      });
      break;
    case "good-intro":
      renderMessageScreen({
        label: "CHECK IN",
        main: "Something feels good",
        buttonText: "Let me stay with that",
        onContinue: () => setScreen("good-main"),
      });
      break;
    case "off-main":
      renderInputScreen({
        label: "CHECK IN",
        main: "What’s going on?",
        value: state.entry.mainResponse,
        onSubmit: (value) => {
          state.entry.mainResponse = value.trim();
          state.entry.offIsBrief = state.entry.mainResponse.length > 0 && state.entry.mainResponse.length < 25;
          setScreen("off-validation-one");
        },
      });
      break;
    case "off-validation-one":
      renderDelayedContinueScreen({
        label: "CHECK IN",
        main: state.entry.offIsBrief
          ? state.promptCopy.offValidationOneShort
          : state.promptCopy.offValidationOneLong,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("off-body"),
      });
      break;
    case "off-body":
      renderBodyLocationScreen({
        label: "CHECK IN",
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
        label: "CHECK IN",
        main: state.promptCopy.offDeeperPrompt,
        value: state.entry.deeperReflection,
        onSubmit: (value) => {
          state.entry.deeperReflection = value.trim();
          setScreen("off-validation-two");
        },
      });
      break;
    case "off-validation-two":
      renderDelayedContinueScreen({
        label: "CHECK IN",
        main: state.promptCopy.offValidationTwo,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("off-grounding"),
      });
      break;
    case "off-grounding":
      renderDelayedContinueScreen({
        label: "CHECK IN",
        main: state.promptCopy.offGrounding,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("off-perspective"),
      });
      break;
    case "off-perspective":
      renderInputScreen({
        label: "CHECK IN",
        main: state.promptCopy.offPerspectivePrompt,
        value: state.entry.perspectiveReflection,
        onSubmit: (value) => {
          state.entry.perspectiveReflection = value.trim();
          setScreen("off-clearer");
        },
      });
      break;
    case "off-clearer":
      renderLandingScreen({
        label: "CHECK IN",
        main: "Does this feel a little clearer, or is there more here?",
        primaryLabel: "This feels clearer",
        secondaryLabel: "There’s more",
        onPrimary: () => finishCheckIn("closing", state.promptCopy.offClosing),
        onSecondary: loopCheckIn,
      });
      break;
    case "good-main":
      renderInputScreen({
        label: "CHECK IN",
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
        label: "CHECK IN",
        main: state.promptCopy.goodValidation,
        buttonLabel: "Keep going",
        onContinue: () => setScreen("good-body"),
      });
      break;
    case "good-body":
      renderBodyLocationScreen({
        label: "CHECK IN",
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
        label: "CHECK IN",
        main: "What do I want to remember about this?",
        value: state.entry.rememberLine,
        onSubmit: (value) => {
          state.entry.rememberLine = value.trim();
          finishCheckIn("closing", state.promptCopy.goodClosing);
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
  renderCheckIn();
}

function renderOpeningScreen() {
  checkinCard.innerHTML = `
    <div class="opening-screen">
      <p class="muted support-line">I want to check in.</p>
      <div class="choice-group home-choice-group">
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
  const selectedDate = resolveSelectedPatternDate(entries, calendar);
  const selectedEntries = getEntriesForDate(entries, selectedDate);
  const patternLines = buildInnerPatternLines(entries, selectedEntries);

  threadsContent.innerHTML = `
    <div class="insight-card">
      <div class="calendar-shell" aria-label="A simple calendar view of saved check-ins">
        <div class="calendar-header">
          <h3>${escapeHtml(calendar.monthLabel)}</h3>
          <p class="muted">A few days stand out.</p>
        </div>
        <div class="calendar-weekdays">
          ${calendar.weekdays
            .map(
              (day) => `
                <span class="muted calendar-weekday">${escapeHtml(day)}</span>
              `
            )
            .join("")}
        </div>
        <div class="calendar-grid">
          ${calendar.days.map(renderCalendarDay).join("")}
        </div>
      </div>
    </div>
    <div class="insight-card">
      ${renderPatternDayCard(selectedDate, selectedEntries)}
    </div>
    <div class="insight-card">
      <h3>This shows up in me</h3>
      <div class="pattern-lines">
        ${patternLines
          .map((line) => `<p class="muted">${escapeHtml(line)}</p>`)
          .join("")}
      </div>
    </div>
  `;

  document.querySelectorAll("[data-pattern-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPatternDate = button.dataset.patternDate;
      renderThreads();
    });
  });
}

function finishCheckIn(closingScreen = "closing", closingLine = "") {
  const extractedKeywords = extractKeywordsForEntry(state.entry);
  state.entry.extractedKeywords = extractedKeywords;
  state.entry.closingAffirmation = selectAffirmation(extractedKeywords);
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
  entries.unshift({
    timestamp: new Date().toISOString(),
    entryType: state.entry.entryType,
    mainResponse: state.entry.mainResponse,
    bodyLocations: state.entry.bodyLocations,
    bodyNote: state.entry.bodyNote,
    deeperReflection: state.entry.deeperReflection,
    perspectiveReflection: state.entry.perspectiveReflection,
    rememberLine: state.entry.rememberLine,
    closingLine: state.entry.closingLine,
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
    entry.mainResponse || entry.openingReflection || entry.firstReflection,
    (entry.bodyLocations || []).join(" "),
    entry.bodyNote,
    entry.deeperReflection || entry.situationBothering,
    entry.perspectiveReflection || entry.situationPerspective || entry.situationClearer,
    entry.rememberLine,
    entry.closingLine,
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
  state.entry.bodyLocations = [];
  state.entry.bodyNote = "";
  state.entry.deeperReflection = "";
  state.entry.perspectiveReflection = "";
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
      <h3>${escapeHtml(summary.topLine)}</h3>
      <div class="pattern-day-sections">
        <div class="pattern-day-section">
          <p class="eyebrow">${escapeHtml(summary.entryTypeLabel)}</p>
          <p>${escapeHtml(summary.mainResponse)}</p>
        </div>
        <div class="pattern-day-section">
          <p class="eyebrow">Where I Noticed It</p>
          <p>${escapeHtml(summary.bodyLine)}</p>
        </div>
        ${
          summary.remembered
            ? `
              <div class="pattern-day-section">
                <p class="eyebrow">${escapeHtml(summary.rememberedLabel)}</p>
                <p>${escapeHtml(summary.remembered)}</p>
              </div>
            `
            : ""
        }
      </div>
    </div>
  `;
}

function buildDaySummary(entries, selectedDate) {
  const topLines = [
    "Something in me was active here.",
    "I noticed something in me on this day.",
    "I had something worth listening to here.",
    "There was something here worth noticing.",
  ];
  const topLine = topLines[hashString(selectedDate) % topLines.length];
  const latestEntry = entries[0];
  const bodyBits = [
    ...(latestEntry.bodyLocations || []),
    latestEntry.bodyNote,
  ].filter(Boolean);
  const remembered = latestEntry.rememberLine || latestEntry.perspectiveReflection || latestEntry.closingLine;

  return {
    topLine,
    entryTypeLabel: latestEntry.entryType === "good" ? "Something Felt Good" : "Something Felt Off",
    mainResponse: shortenText(latestEntry.mainResponse || "There wasn’t much written here, and that still counts."),
    bodyLine: bodyBits.length ? shortenText(bodyBits.join(", "), 110) : "I didn’t name a place here, but something was still there.",
    remembered,
    rememberedLabel: latestEntry.entryType === "good" ? "What I Want To Remember" : "What Shifted",
  };
}

function buildInnerPatternLines(entries, selectedEntries) {
  if (entries.length < 3) {
    return ["Patterns will appear gently as more check-ins are saved."];
  }

  const repeatedWords = getRepeatedKeywords(entries, 3);
  const recentThemes = getTopTerms(entries.flatMap((entry) => collectEntryTexts(entry)), 4);
  const lines = [];

  if (repeatedWords[0] || recentThemes[0]) {
    lines.push("This feeling has shown up more than once.");
  }

  if (repeatedWords[1]) {
    lines.push(`This seems connected to ${repeatedWords[1]}.`);
  } else if (recentThemes[0]) {
    lines.push(`I’ve met something like this around ${recentThemes[0]} before.`);
  }

  if (selectedEntries.length && repeatedWords[0]) {
    lines.push("This isn’t the first time this has come up.");
  } else if (recentThemes[1]) {
    lines.push(`Something in me tends to get louder around ${recentThemes[1]}.`);
  }

  return lines.length ? lines.slice(0, 3) : ["Patterns will appear gently as more check-ins are saved."];
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
