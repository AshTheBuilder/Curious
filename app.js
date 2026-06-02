const STORAGE_KEY = "curious-checkins";
const checkinCard = document.querySelector("#checkin-card");
const threadsContent = document.querySelector("#threads-content");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const supportOverlay = document.querySelector("#support-overlay");
const supportClose = document.querySelector("#support-close");
const supportTrigger = document.querySelector("#support-trigger");

const FLOW_VARIANTS = {
  offArrive: [
    "Feet on the floor. One slow breath. The room is still here.",
    "I can feel where I’m sitting. I have a minute.",
    "Nothing has to happen fast. I’m only arriving.",
  ],
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
  offSteady: [
    "I can let this be big and still be okay.",
    "I don’t have to carry all of it right now.",
    "It makes sense that this is a lot.",
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
  promptCopy: createPromptCopy(),
  entry: createEmptyEntry(),
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

if (supportTrigger) {
  supportTrigger.addEventListener("click", openResources);
}
if (supportClose) {
  supportClose.addEventListener("click", closeResources);
}
if (supportOverlay) {
  supportOverlay.addEventListener("click", (event) => {
    if (event.target === supportOverlay) {
      closeResources();
    }
  });
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeResources();
  }
});

renderCheckIn();
renderThreads();
updateChromeState();

function createEmptyEntry() {
  return {
    entryType: "",
    id: "",
    mainResponse: "",
    bodyLocations: [],
    bodyNote: "",
    intensity: "",
    deeperReflection: "",
    spaciousReflection: "",
    perspectiveReflection: "",
    offContextReflection: "",
    continuationReflection: "",
    stayLoopCount: 0,
    wantsReturnLater: false,
    returnLine: "",
    rememberLine: "",
    goodContinuityReflection: "",
    bringToTherapy: false,
    bringToTherapyLine: "",
    sessionSummary: "",
    closingLine: "",
  };
}

function createPromptCopy(previous = {}) {
  return {
    offArrive: chooseVariant(FLOW_VARIANTS.offArrive, previous.offArrive),
    offDeeperPrompt: chooseVariant(FLOW_VARIANTS.offDeeperPrompt, previous.offDeeperPrompt),
    offSpaciousPrompt: chooseVariant(FLOW_VARIANTS.offSpaciousPrompt, previous.offSpaciousPrompt),
    offGrounding: chooseVariant(FLOW_VARIANTS.offGrounding, previous.offGrounding),
    offSteady: chooseVariant(FLOW_VARIANTS.offSteady, previous.offSteady),
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

  updateChromeState();
}

function renderCheckIn() {
  checkinCard.classList.toggle("opening-shell", state.screen === "opening");
  updateChromeState();

  switch (state.screen) {
    case "opening":
      renderOpeningScreen();
      break;

    /* ---------- OFF PATH ---------- */
    case "off-intro":
      renderMessageScreen({
        label: "Notice",
        main: "Something feels off",
        buttonText: "I’m curious →",
        onContinue: () => setScreen("off-arrive"),
      });
      break;
    case "off-arrive":
      // Ground first. Establish a floor before looking at anything.
      renderDelayedContinueScreen({
        label: "Arrive",
        main: "Let me land before I look.",
        subtext: state.promptCopy.offArrive,
        buttonLabel: "I’m here →",
        onContinue: () => setScreen("off-main"),
      });
      break;
    case "off-main":
      renderInputScreen({
        label: "Notice",
        main: "What’s here?",
        value: state.entry.mainResponse,
        onEscape: () => setScreen("off-too-much"),
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
        onEscape: () => setScreen("off-too-much"),
        onSubmit: ({ selections, note }) => {
          state.entry.bodyLocations = selections;
          state.entry.bodyNote = note.trim();
          setScreen("off-intensity");
        },
      });
      break;
    case "off-intensity":
      // Titration gate. Read the size before choosing how far to go.
      renderChoiceScreen({
        label: "Notice",
        main: "How big does this feel right now?",
        subtext: "No wrong answer. Just a read.",
        options: [
          { label: "A flicker", value: "low" },
          { label: "Noticeable", value: "mid" },
          { label: "A lot", value: "high" },
        ],
        onEscape: () => setScreen("off-too-much"),
        onSelect: (value) => {
          state.entry.intensity = value;
          if (value === "high") {
            setScreen("off-stabilize");
          } else {
            setScreen("off-capacity");
          }
        },
      });
      break;
    case "off-capacity":
      // Explicit readiness check before any deepening.
      renderLandingScreen({
        label: "Listen",
        main: "Do I have space to look a little closer — right now?",
        primaryLabel: "Yes, I’m curious →",
        secondaryLabel: "Not right now",
        onEscape: () => setScreen("off-too-much"),
        onPrimary: () => setScreen("off-deeper"),
        onSecondary: () => setScreen("off-carry"),
      });
      break;
    case "off-deeper":
      renderInputScreen({
        label: "Listen",
        main: state.promptCopy.offDeeperPrompt,
        value: "",
        onEscape: () => setScreen("off-too-much"),
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
        onEscape: () => setScreen("off-too-much"),
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
        onEscape: () => setScreen("off-too-much"),
        onContinue: () => setScreen("off-perspective"),
      });
      break;
    case "off-perspective":
      renderInputScreen({
        label: "Widen",
        main: state.promptCopy.offPerspectivePrompt,
        value: "",
        onEscape: () => setScreen("off-too-much"),
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
        onEscape: () => setScreen("off-too-much"),
        onPrimary: () => setScreen("off-connected"),
        onSecondary: () => setScreen("off-more"),
      });
      break;
    case "off-connected":
      renderInputScreen({
        label: "Tell Me More",
        main: "What feels connected to this?",
        value: "",
        onEscape: () => setScreen("off-too-much"),
        onSubmit: (value) => {
          state.entry.offContextReflection = value.trim();
          setScreen("off-carry");
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
        onEscape: () => setScreen("off-too-much"),
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

    /* ---------- HIGH-INTENSITY STABILIZING PATH ---------- */
    case "off-stabilize":
      renderMessageScreen({
        label: "Steady",
        main: "This is a lot. I don’t have to go further right now.",
        subtext: state.promptCopy.offSteady,
        buttonText: "Stay with me →",
        includePulse: true,
        showSupportLink: true,
        onContinue: () => setScreen("off-stabilize-ground"),
      });
      break;
    case "off-stabilize-ground":
      renderDelayedContinueScreen({
        label: "Steady",
        main: state.promptCopy.offGrounding,
        subtext: "Slow breath out. I’m still here. The hard part can wait for the room.",
        buttonLabel: "Continue →",
        showSupportLink: true,
        onContinue: () => setScreen("off-carry"),
      });
      break;

    /* ---------- INTEGRATION / BRIDGE TO THERAPY ---------- */
    case "off-carry":
      renderInputScreen({
        label: "Carry",
        main: "Is there anything here I want to bring to my next session?",
        subtext: "A sentence is enough. It’ll be waiting in your log. (You can leave this blank.)",
        value: state.entry.bringToTherapyLine,
        placeholder: "",
        onSubmit: (value) => {
          const line = value.trim();
          state.entry.bringToTherapyLine = line;
          state.entry.bringToTherapy = Boolean(line);
          state.entry.closingLine = state.promptCopy.offClosing;
          finishCheckIn("closing", state.entry.closingLine);
        },
      });
      break;
    case "off-too-much":
      renderTooMuchScreen();
      break;

    /* ---------- GOOD PATH ---------- */
    case "good-intro":
      renderMessageScreen({
        label: "Notice",
        main: "Something feels good",
        buttonText: "Stay here →",
        onContinue: () => setScreen("good-main"),
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
  checkinCard.classList.toggle("opening-shell", screen === "opening");
  updateChromeState();
  renderCheckIn();
}

function updateChromeState() {
  const shouldCompact = !(state.activeTab === "checkin" && state.screen === "opening");
  document.body.classList.toggle("is-compact-brand", shouldCompact);
}

/* ---------- SCREENS ---------- */

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
  onEscape = null,
  includePulse = false,
  showSupportLink = false,
}) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${label}</p>
      ${main ? `<h2>${escapeHtml(main)}</h2>` : ""}
      ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      ${includePulse ? renderPresenceDots() : ""}
      ${showSupportLink ? renderInlineSupportLink() : ""}
      ${renderTooMuchAction(onEscape)}
      <div class="actions">
        <button class="button button-primary" type="button" id="continue-button">${escapeHtml(buttonText)}</button>
      </div>
    </div>
  `;

  document.querySelector("#continue-button").addEventListener("click", onContinue);
  bindTooMuchAction(onEscape);
  bindInlineSupportLink();
}

function renderDelayedContinueScreen({
  label = "CHECK IN",
  main,
  subtext = "",
  buttonLabel,
  onContinue,
  onEscape = null,
  showSupportLink = false,
}) {
  renderMessageScreen({
    label,
    main,
    subtext,
    buttonText: buttonLabel,
    onContinue,
    onEscape,
    includePulse: true,
    showSupportLink,
  });
}

function renderInputScreen({
  label,
  main,
  subtext = "",
  value,
  onSubmit,
  onEscape = null,
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
      ${renderTooMuchAction(onEscape)}
      <div class="actions">
        <button class="button button-primary" type="submit">Continue →</button>
      </div>
    </form>
  `;

  const form = document.querySelector("#prompt-form");
  const input = document.querySelector("#response-input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(input.value);
  });

  bindTooMuchAction(onEscape);
  safeFocus(input);
}

function renderChoiceScreen({ label, main, subtext = "", options, onSelect, onEscape = null }) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <h2>${escapeHtml(main)}</h2>
      ${subtext ? `<p class="muted support-line">${escapeHtml(subtext)}</p>` : ""}
      ${renderTooMuchAction(onEscape)}
      <div class="choice-stack">
        ${options
          .map(
            (option) => `
              <button class="button button-secondary choice-stack-button" type="button" data-choice-value="${escapeAttribute(option.value)}">
                ${escapeHtml(option.label)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  document.querySelectorAll("[data-choice-value]").forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(button.dataset.choiceValue);
    });
  });

  bindTooMuchAction(onEscape);
}

function renderBodyLocationScreen({ label, main, subtext = "", selections, note, onSubmit, onEscape = null }) {
  const chips = [
    "chest",
    "throat",
    "stomach",
    "jaw",
    "shoulders",
    "face",
    "hands",
    "all over",
    "not sure",
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
      ${renderTooMuchAction(onEscape)}
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

  bindTooMuchAction(onEscape);
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
  onEscape = null,
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
      ${renderTooMuchAction(onEscape)}
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onPrimary(input.value);
  });

  document.querySelector("#stay-secondary").addEventListener("click", () => {
    onSecondary(input.value);
  });

  bindTooMuchAction(onEscape);
  safeFocus(input);
}

function renderLandingScreen({ label, main, primaryLabel, secondaryLabel, onPrimary, onSecondary, onEscape = null }) {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <h2>${escapeHtml(main)}</h2>
      ${renderTooMuchAction(onEscape)}
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
  bindTooMuchAction(onEscape);
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

function renderTooMuchScreen() {
  checkinCard.innerHTML = `
    <div class="support-copy">
      <p class="eyebrow">Pause</p>
      <h2>I can stop here.</h2>
      <p class="muted support-line">Slow breath. Nothing else has to happen right now. I can come back to this later — or reach a person if I want one.</p>
      ${renderPresenceDots()}
      <div class="choice-stack">
        <button class="button button-secondary" type="button" id="talk-person-button">
          I want to talk to a person →
        </button>
        <button class="button button-secondary" type="button" id="save-later-button">
          Save for later →
        </button>
        <button class="button button-secondary" type="button" id="return-home-button">
          Back to start
        </button>
      </div>
    </div>
  `;

  document.querySelector("#talk-person-button").addEventListener("click", openResources);
  document.querySelector("#return-home-button").addEventListener("click", resetFlow);
  document.querySelector("#save-later-button").addEventListener("click", () => {
    state.entry.wantsReturnLater = true;
    state.entry.returnLine = "I can come back to this later.";
    state.entry.closingLine = "I can come back to this later.";
    finishCheckIn("closing", state.entry.closingLine);
  });
}

function renderTooMuchAction(onEscape) {
  if (!onEscape) {
    return "";
  }

  return `
    <div class="soft-escape">
      <button class="inline-link soft-escape-button" type="button" id="too-much-action">
        This is too much
      </button>
    </div>
  `;
}

function bindTooMuchAction(onEscape) {
  const escapeButton = document.querySelector("#too-much-action");

  if (escapeButton && onEscape) {
    escapeButton.addEventListener("click", onEscape);
  }
}

function renderInlineSupportLink() {
  return `
    <div class="soft-escape">
      <button class="inline-link soft-escape-button" type="button" id="inline-support-action">
        If I need a person, support is here →
      </button>
    </div>
  `;
}

function bindInlineSupportLink() {
  const link = document.querySelector("#inline-support-action");
  if (link) {
    link.addEventListener("click", openResources);
  }
}

function renderPresenceDots() {
  return `<div class="pulse-dot" aria-hidden="true"></div>`;
}

/* ---------- SUPPORT / RESOURCES OVERLAY ---------- */

function openResources() {
  if (supportOverlay) {
    supportOverlay.classList.add("is-open");
    document.body.classList.add("support-open");
    if (supportClose) {
      supportClose.focus();
    }
  }
}

function closeResources() {
  if (supportOverlay) {
    supportOverlay.classList.remove("is-open");
    document.body.classList.remove("support-open");
  }
}

/* ---------- SESSION LOG ---------- */

function renderThreads() {
  const entries = getEntriesNewestFirst();

  threadsContent.innerHTML = `
    ${
      entries.length
        ? `
          <p class="muted support-line session-log-hint">A quiet record I can open and read on my own — or bring into a session.</p>
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

  document.querySelectorAll("[data-copy-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = entries.find((item) => (item.id || "") === button.dataset.copyId);
      if (entry) {
        copySessionText(entry, button);
      }
    });
  });

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

function renderSessionLogCard(entry) {
  const bodyLine = (entry.bodyLocations || []).length
    ? `Body: ${entry.bodyLocations.join(", ")}`
    : "";
  const finalLine =
    entry.returnLine ||
    entry.goodContinuityReflection ||
    entry.offContextReflection ||
    entry.rememberLine ||
    entry.closingLine ||
    "";
  const returnMarker = entry.wantsReturnLater ? "Saved to come back to." : "";
  const carryMarker = entry.bringToTherapy && entry.bringToTherapyLine
    ? `For my next session: ${shortenText(entry.bringToTherapyLine, 140)}`
    : "";

  return `
    <article class="session-log-card" data-session-id="${escapeAttribute(entry.id || "")}">
      <p class="eyebrow">${escapeHtml(formatSessionTimestamp(entry.timestamp))}</p>
      <h3>${escapeHtml(entry.entryTypeLabel || getEntryTypeLabel(entry.entryType))}</h3>
      <p>${escapeHtml(entry.sessionSummary || buildSessionExcerpt(entry))}</p>
      ${bodyLine ? `<p class="muted">${escapeHtml(bodyLine)}</p>` : ""}
      ${returnMarker ? `<p class="muted return-marker">${escapeHtml(returnMarker)}</p>` : ""}
      ${carryMarker ? `<p class="muted carry-marker">${escapeHtml(carryMarker)}</p>` : ""}
      ${finalLine ? `<p class="muted">I noticed: ${escapeHtml(shortenText(finalLine, 110))}</p>` : ""}
      <div class="session-log-card-actions">
        <button class="inline-link session-log-copy" type="button" data-copy-id="${escapeAttribute(entry.id || "")}">
          Copy for my session
        </button>
      </div>
    </article>
  `;
}

function copySessionText(entry, button) {
  const text = buildSessionCopyText(entry);
  const restore = () => {
    button.textContent = "Copy for my session";
  };

  const succeed = () => {
    button.textContent = "Copied ✓";
    window.setTimeout(restore, 1800);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(succeed).catch(() => fallbackCopy(text, succeed));
  } else {
    fallbackCopy(text, succeed);
  }
}

function fallbackCopy(text, onDone) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "absolute";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
    onDone();
  } catch (error) {
    window.prompt("Copy this:", text);
  }
  document.body.removeChild(area);
}

function buildSessionCopyText(entry) {
  const lines = [];
  const when = formatSessionTimestamp(entry.timestamp);
  lines.push(`${entry.entryTypeLabel || getEntryTypeLabel(entry.entryType)}${when ? ` — ${when}` : ""}`);

  if (entry.mainResponse) {
    lines.push(`What was here: ${entry.mainResponse}`);
  }
  if ((entry.bodyLocations || []).length) {
    lines.push(`In the body: ${entry.bodyLocations.join(", ")}`);
  }
  if (entry.bodyNote) {
    lines.push(`Body note: ${entry.bodyNote}`);
  }
  if (entry.deeperReflection) {
    lines.push(`Underneath: ${entry.deeperReflection}`);
  }
  if (entry.spaciousReflection) {
    lines.push(`Also noticed: ${entry.spaciousReflection}`);
  }
  if (entry.perspectiveReflection) {
    lines.push(`From farther back: ${entry.perspectiveReflection}`);
  }
  if (entry.offContextReflection) {
    lines.push(`Felt connected to: ${entry.offContextReflection}`);
  }
  if (entry.rememberLine) {
    lines.push(`Wanted to remember: ${entry.rememberLine}`);
  }
  if (entry.goodContinuityReflection) {
    lines.push(`Felt this before: ${entry.goodContinuityReflection}`);
  }
  if (entry.bringToTherapy && entry.bringToTherapyLine) {
    lines.push(`To bring to session: ${entry.bringToTherapyLine}`);
  }

  return lines.join("\n");
}

function finishCheckIn(closingScreen = "closing", closingLine = "") {
  state.entry.closingLine = closingLine || state.promptCopy.offClosing;
  try {
    saveEntry();
  } catch (error) {
    console.warn("Curious could not finish saving this session.", error);
  }
  state.screen = closingScreen;
  renderCheckIn();
  renderThreads();
}

function resetFlow() {
  state.screen = "opening";
  state.promptCopy = createPromptCopy();
  state.entry = createEmptyEntry();
  checkinCard.classList.toggle("opening-shell", true);
  updateChromeState();
  renderCheckIn();
}

function saveEntry() {
  const entries = getEntries();
  entries.push(buildSavedSession());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("Curious could not save this session.", error);
  }
}

function getEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && Array.isArray(parsed.entries)) {
      return parsed.entries;
    }

    if (parsed && Array.isArray(parsed.sessions)) {
      return parsed.sessions;
    }

    return [];
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
    intensity: state.entry.intensity,
    deeperReflection: state.entry.deeperReflection,
    spaciousReflection: state.entry.spaciousReflection,
    perspectiveReflection: state.entry.perspectiveReflection,
    offContextReflection: state.entry.offContextReflection,
    continuationReflection: state.entry.continuationReflection,
    wantsReturnLater: state.entry.wantsReturnLater,
    returnLine: state.entry.returnLine,
    rememberLine: state.entry.rememberLine,
    goodContinuityReflection: state.entry.goodContinuityReflection,
    bringToTherapy: state.entry.bringToTherapy,
    bringToTherapyLine: state.entry.bringToTherapyLine,
    closingLine: state.entry.closingLine,
    sessionSummary: buildSessionExcerpt(state.entry),
  };
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
    entry.mainResponse ||
    getLastReflectionChunk(entry.offContextReflection) ||
    getLastReflectionChunk(entry.continuationReflection) ||
    getLastReflectionChunk(entry.spaciousReflection) ||
    getLastReflectionChunk(entry.deeperReflection) ||
    getLastReflectionChunk(entry.perspectiveReflection) ||
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

function appendReflection(existing = "", next = "") {
  const trimmedNext = next.trim();

  if (!trimmedNext) {
    return existing;
  }

  return existing ? `${existing}\n\n${trimmedNext}` : trimmedNext;
}

function getLastReflectionChunk(text = "") {
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length ? chunks[chunks.length - 1] : "";
}

function shortenText(text = "", limit = 90) {
  const trimmed = text.trim();

  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit).trimEnd()}...`;
}

function safeFocus(element) {
  if (!element) {
    return;
  }
  try {
    element.focus({ preventScroll: true });
  } catch (error) {
    /* Some sandboxed/preview frames disallow programmatic focus; ignore. */
  }
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
