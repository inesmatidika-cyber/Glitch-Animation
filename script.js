// ===============================
// Spreadsheet Lock + Quiz (A–Z / 0–9) + En-têtes Excel-like
// ===============================

// ----- Configuration -----
const ROWS = 10;
const COLS = 12;
const COL_HEADERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J","K","L"]; // adapte si COLS change

// 0–9 : calcul -> réponse attendue (un chiffre)
const digitQuestions = {
  "1": { q: "5 / 5", expected: "1", proposal: "1" },
  "2": { q: "√4", expected: "2", proposal: "2" },
  "3": { q: "6 ÷ 2", expected: "3", proposal: "3" },
  "4": { q: "2 × 2", expected: "4", proposal: "4" },
  "5": { q: "15 - 10", expected: "5", proposal: "5" },
  "6": { q: "18 ÷ 3", expected: "6", proposal: "6" },
  "7": { q: "2³ − 1", expected: "7", proposal: "7" },
  "8": { q: "16 ÷ 2 / 2³", expected: "8", proposal: "8" },
  "9": { q: "3²", expected: "9", proposal: "9" },
  "0": { q: "sin(0)", expected: "0", proposal: "0" }
};

// A–Z : lettre -> symbole (réponse attendue = lettre)
const keyToSymbol = {
  "A": "∝",
  "B": "β",
  "C": "⊂",
  "D": "∆",
  "E": "≡",
  "F": "∫₀",
  "G": "φ",
  "H": "η",
  "I": "↟",
  "J": "ι",
  "K": "∴",
  "L": "lim",
  "M": "∑",
  "N": "∩",
  "O": "∅",
  "P": "π",
  "Q": "Ω",
  "R": "₹",
  "S": "∫",
  "T": "∓",
  "U": "∪",
  "V": "√",
  "W": "√²",
  "X": "∞",
  "Y": "Ψ",
  "Z": "ζ"
};

// ----- États -----
const locked = new Map(); // "r-c" => boolean
const values = new Map(); // "r-c" => content

// ----- DOM -----
const sheet = document.getElementById("sheet");
const overlay = document.getElementById("overlay");
const modalQuestion = document.getElementById("modalQuestion");
const answerInput = document.getElementById("answerInput");
const validateBtn = document.getElementById("validateBtn");
const cancelBtn = document.getElementById("cancelBtn");
const errorMsg = document.getElementById("errorMsg");

// Optionnel (si vous avez ajouté la barre formule)
const nameBox = document.getElementById("nameBox");

// cellule active
let activeCell = null;
let activeKey = null;

// quiz actif
let currentExpected = null; // "Q" ou "7"
let currentMode = null;     // "letter" ou "digit"

// Utilitaires
function keyOf(r, c) {
  return `${r}-${c}`;
}

function colLetter(c) {
  return COL_HEADERS[c - 1] || String(c);
}

// ===============================
// Construction grille avec en-têtes (coin + A..F + 1..6)
// ===============================
function buildSheet() {
  sheet.innerHTML = "";

  // Coin (en haut à gauche)
  const corner = document.createElement("div");
  corner.className = "corner";
  corner.textContent = "";
  sheet.appendChild(corner);

  // En-têtes colonnes
  for (let c = 1; c <= COLS; c++) {
    const header = document.createElement("div");
    header.className = "colHeader";
    header.textContent = colLetter(c);
    sheet.appendChild(header);
  }

  // Lignes + cellules
  for (let r = 1; r <= ROWS; r++) {
    // En-tête ligne
    const rowHeader = document.createElement("div");
    rowHeader.className = "rowHeader";
    rowHeader.textContent = String(r);
    sheet.appendChild(rowHeader);

    // Cellules
    for (let c = 1; c <= COLS; c++) {
      const key = keyOf(r, c);

      // verrouillée par défaut (si jamais pas déjà initialisé)
      if (!locked.has(key)) locked.set(key, true);

      const cell = document.createElement("div");
      cell.className = "cell locked";
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.dataset.key = key;
      cell.setAttribute("contenteditable", "false");
      cell.textContent = values.get(key) || "";

      cell.addEventListener("click", () => onCellClick(cell));
      cell.addEventListener("input", () => {
        values.set(key, cell.textContent);
      });

      sheet.appendChild(cell);
    }
  }
}

buildSheet();

// ===============================
// Gestion sélection / lock / unlock
// ===============================
function setActive(cell) {
  document.querySelectorAll(".cell.active").forEach(el => el.classList.remove("active"));
  cell.classList.add("active");

  if (nameBox) {
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    nameBox.textContent = `${colLetter(c)}${r}`;
  }
}

function lockCell(cell) {
  cell.classList.add("locked");
  cell.setAttribute("contenteditable", "false");
  locked.set(cell.dataset.key, true);
}


function unlockCell(cell) {
  cell.classList.remove("locked");
  cell.setAttribute("contenteditable", "true");
  locked.set(cell.dataset.key, false);
  cell.focus();
}

function onCellClick(cell) {
  setActive(cell);
  activeCell = cell;
  activeKey = cell.dataset.key;

  if (!locked.get(activeKey)) {
    cell.focus();
    return;
  }

  openRandomQuiz();
}

// ===============================
// Quiz : sélection aléatoire (lettre ou chiffre)
// ===============================
function openRandomQuiz() {
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
  answerInput.value = "";

  const chooseLetter = Math.random() < 0.5;

  if (chooseLetter) {
    // Lettre aléatoire A–Z
    const letters = Object.keys(keyToSymbol);
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const symbol = keyToSymbol[letter];

    currentMode = "letter";
    currentExpected = letter;

    modalQuestion.textContent =
      `Lettre : ${letter}\n` +
      `Proposition : tape le symbole correspondant au clavier.`;
  } else {
    // Chiffre aléatoire 0–9
    const digits = Object.keys(digitQuestions);
    const d = digits[Math.floor(Math.random() * digits.length)];
    const quiz = digitQuestions[d];

    currentMode = "digit";
    currentExpected = quiz.expected;

    modalQuestion.textContent =
      `Calcul : ${quiz.q}\n` +
      `Proposition : tape la réponse attendue (0–9).`;
  }

  overlay.classList.add("open");
  setTimeout(() => answerInput.focus(), 0);
}

// ===============================
// Popup : fermer / valider
// ===============================
function closeQuiz() {
  overlay.classList.remove("open");
  currentExpected = null;
  currentMode = null;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

function normalizeInput(str) {
  const s = (str ?? "").trim();
  if (currentMode === "letter") return s.toUpperCase();
  return s;
}

function validateQuiz() {
  if (!activeCell || !activeKey || !currentExpected) return;

  const typed = normalizeInput(answerInput.value);
  const expected = currentExpected;

  if (typed === expected) {
    unlockCell(activeCell);
    closeQuiz();
  } else {
    showError("Réponse incorrecte. La cellule reste verrouillée.");
    answerInput.select();
  }
}

// ===============================
// Events
// ===============================
validateBtn.addEventListener("click", validateQuiz);
cancelBtn.addEventListener("click", closeQuiz);

document.addEventListener("keydown", (e) => {
  if (!overlay.classList.contains("open")) return;

  if (e.key === "Enter") {
    e.preventDefault();
    validateQuiz();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    closeQuiz();
  }
});
function requireActiveCell() {
  if (!activeCell) return null;
  return activeCell;
}
document.getElementById("btnClear")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  cell.textContent = "";
  values.set(cell.dataset.key, "");
});

document.getElementById("btnLock")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  lockCell(cell); // si vous avez déjà lockCell()
});

document.getElementById("btnUnlock")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  // Déverrouille sans quiz (si c’est voulu). Sinon, appelez openQuiz() au lieu de unlockCell().
  unlockCell(cell);
});
document.getElementById("btnBold")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  cell.classList.toggle("fmt-bold");
});

document.getElementById("btnItalic")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  cell.classList.toggle("fmt-italic");
});

document.getElementById("btnUnderline")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  cell.classList.toggle("fmt-underline");
});
function setAlign(cell, align) {
  cell.classList.remove("align-left","align-center","align-right");
  cell.classList.add(align);
}

document.getElementById("btnAlignLeft")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  setAlign(cell, "align-left");
});

document.getElementById("btnAlignCenter")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  setAlign(cell, "align-center");
});

document.getElementById("btnAlignRight")?.addEventListener("click", () => {
  const cell = requireActiveCell();
  if (!cell) return;
  setAlign(cell, "align-right");
});
