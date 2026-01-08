let root;

export function initGenZ(container) {
  root = container.querySelector(".genZ");

  if (!root) {
    console.error("❌ .genZ not found");
    return;
  }

  console.log("✅ GenZ initialized (CSS mode)");
}

export function renderGenZ(period) {
  if (!root || !period) return;

  // texte
  root.querySelector(".year").textContent = period.year;
  root.querySelector(".label").textContent = period.label;

  // IMAGE DE FOND
  const bg = root.querySelector(".bg-image");
  if (period.image) {
    bg.style.backgroundImage = `url(${period.image})`;
  }

  const tv = root.querySelector(".tv");

  // reset modes
  root.classList.remove("mode-tv", "mode-transition", "mode-digital");

  switch (period.mode) {
    case "tv":
      root.classList.add("mode-tv");
      tv.style.display = "block";
      break;

    case "transition":
      root.classList.add("mode-transition");
      tv.style.display = "block";
      break;

    case "digital":
    default:
      root.classList.add("mode-digital");
      tv.style.display = "none";
      break;
  }
}
