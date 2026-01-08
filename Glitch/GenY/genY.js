let root;

const IMAGE_BASE_PATH = "./GenY/images/";

export function initGenY(container) {
  root = container.querySelector(".genY");
  console.log("initGenY OK");
}

let glitchInterval;

export function renderGenY(period) {
  if (!root || !period) return;

  root.querySelector(".year").textContent = period.year;
  root.querySelector(".label").textContent = period.label;

  root.querySelector(
    ".bg.base"
  ).style.backgroundImage = `url(${IMAGE_BASE_PATH}${period.image})`;

  clearInterval(glitchInterval);

  glitchInterval = setInterval(() => {
    applyGlitch(period);
  }, 60 + (1 - period.speed) * 100);
}

function applyGlitch(p) {
  const base = root.querySelector(".bg.base");
  const red = root.querySelector(".bg.red");
  const blue = root.querySelector(".bg.blue");

  // background blur
  base.style.filter = `blur(${p.blur}px)`;

  // RGB offset
  red.style.transform = `
      translate(${p.rgbStrength}px, 0)
      scale(${p.zoom || 1})
    `;

  blue.style.transform = `
      translate(${-p.rgbStrength}px, 0)
      scale(${p.zoom || 1})
    `;
  const t = root.querySelector(".glitch-text");
  const o = p.textGlitch * 3;

  t.style.setProperty("--tx1", `${rand(-o, o)}px`);
  t.style.setProperty("--ty1", `${rand(-o, o)}px`);
  t.style.setProperty("--tx2", `${rand(-o, o)}px`);
  t.style.setProperty("--ty2", `${rand(-o, o)}px`);

  // text glitch
  text.style.setProperty("--dx1", `${rand(-offset, offset)}px`);
  text.style.setProperty("--dy1", `${rand(-offset, offset)}px`);
  text.style.setProperty("--dx2", `${rand(-offset, offset)}px`);
  text.style.setProperty("--dy2", `${rand(-offset, offset)}px`);
}
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
