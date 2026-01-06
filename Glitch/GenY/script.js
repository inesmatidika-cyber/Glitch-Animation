import p1980 from "./periods/1980.js";
import p1983 from "./periods/1983.js";
import p1986 from "./periods/1986.js";
import p1987 from "./periods/1987.js";
import p1989 from "./periods/1989.js";

import p1990 from "./periods/1990.js";
import p1991 from "./periods/1991.js";
import p1992 from "./periods/1992.js";
import p1993 from "./periods/1993.js";
import p1994 from "./periods/1994.js";
import p1995 from "./periods/1995.js";
import p1996 from "./periods/1996.js";

const presets = [p1980, p1983, p1986, p1987, p1989, p1990, p1991, p1992, p1993, p1994, p1995, p1996];

const root = document.querySelector("#genY");
const bgLayers = root.querySelectorAll(".bg");
const text = root.querySelector(".glitch-text");
const yearEl = root.querySelector(".year");
const labelEl = root.querySelector(".label");
const scanlines = root.querySelector(".scanlines");
const buttons = root.querySelectorAll(".controls button");

let current = presets[0];
let t = 0;

function applyPreset(p) {
  current = p;
  yearEl.textContent = p.year;
  labelEl.textContent = p.label;

  bgLayers.forEach(bg => {
    bg.style.backgroundImage = `url(${p.image})`;
  });

  scanlines.style.opacity = p.scanlinesOpacity;
}

function animate() {
  t += current.speed;

  /* ===== ANALOGIQUE (1980) ===== */
  if (current.type === "analog") {
    bgLayers.forEach(bg => {
      bg.style.transform =
        `translateX(${Math.sin(t) * current.offset}px)
         scale(${current.zoom})`;
    });
  }

  /* ===== CALCUL / NUMÉRIQUE (1983) ===== */
  if (current.type === "compute") {
    if (Math.random() < 0.08) {
      bgLayers.forEach(bg => {
        bg.style.transform =
          `translateX(${(Math.random() - 0.5) * current.offset}px)
           scale(${current.zoom})`;
      });
    }
  }

  /* ===== GÉOMÉTRIQUE (1986+) ===== */
  if (current.type === "geometry") {
    bgLayers.forEach((bg, i) => {
      bg.style.transform =
        `translate(${i * current.rgbStrength}px, 0)
         scale(${current.zoom})`;
    });
  }

  /* ===== HYBRIDE (1990, 1992) ===== */
  if (current.type === "hybrid") {
    const x = Math.sin(t * 900) * current.offset * 0.35;
    const y = (Math.random() < (current.tearChance ?? 0))
      ? (Math.random() - 0.5) * 14
      : 0;

    bgLayers.forEach((bg, i) => {
      bg.style.transform = `translate(${x + i * current.rgbStrength}px, ${y}px) scale(${current.zoom})`;
    });
  }

  /* ===== COMPRESSION (1993, 1996) ===== */
  if (current.type === "compression") {
    const x = (Math.random() < 0.12)
      ? (Math.random() - 0.5) * current.offset
      : 0;

    bgLayers.forEach((bg, i) => {
      bg.style.transform = `translate(${x + i * current.rgbStrength}px, 0) scale(${current.zoom})`;
    });

    // macroblocks simples via clip-path
    if (Math.random() < (current.macroBlocks ?? 0)) {
      const top = Math.random() * 70;
      const height = 8 + Math.random() * 18;

      bgLayers.forEach(bg => {
        bg.style.clipPath = `inset(${top}% 0 ${100 - top - height}% 0)`;
      });

      setTimeout(() => {
        bgLayers.forEach(bg => (bg.style.clipPath = "inset(0)"));
      }, 140);
    }
  }

  /* ===== CRASH (1995) ===== */
  if (current.type === "crash") {
    bgLayers.forEach(bg => {
      bg.style.transform = `scale(${current.zoom})`;
    });
  }

  /* ===== TEXTE (COMMUN) ===== */
  text.style.textShadow = `
    ${current.rgbStrength}px 0 magenta,
    ${-current.rgbStrength}px 0 cyan
  `;

  requestAnimationFrame(animate);
}

  /* ===== TEXTE (COMMUN) ===== */
  text.style.textShadow = `
    ${current.rgbStrength}px 0 magenta,
    ${-current.rgbStrength}px 0 cyan
  `;

  requestAnimationFrame(animate);

/* Pixel sorting analogique */
setInterval(() => {
  if (!current.pixelSort) return;

  const slice = Math.random() * 60;
  bgLayers.forEach(bg => {
    bg.style.clipPath =
      `inset(${slice}% 0 ${100 - slice - 10}% 0)`;
  });

  setTimeout(() => {
    bgLayers.forEach(bg => bg.style.clipPath = "inset(0)");
  }, 400);
}, 2200);

/* Text micro-glitch */
setInterval(() => {
  if (Math.random() > current.textGlitch) return;

  text.style.transform =
    `translateX(${(Math.random() - 0.5) * current.offset}px)`;

  setTimeout(() => {
    text.style.transform = "translateX(0)";
  }, 200);
}, 1200);

/* Preview controls */
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    applyPreset(presets[Number(btn.dataset.year)]);
  });
});


applyPreset(current);
animate();
