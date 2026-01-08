(() => {
  const html = document.documentElement;

  const canvas = document.getElementById("noise");
  const ctx = canvas.getContext("2d", { alpha: true });

  const overlay = document.getElementById("crashOverlay");
  const restartInEl = document.getElementById("restartIn");
  const crashCodeEl = document.getElementById("crashCode");
  const modeLabel = document.getElementById("modeLabel");
  const glitchText = document.getElementById("glitchText");

  // Intensité (clique pour basculer)
  const presets = [
    { name: "GLITCH", shake: 1.2, noise: 0.18, freezeMs: [250, 900], meltdownEveryMs: [4000, 9000] },
    { name: "INSANE", shake: 3.2, noise: 0.28, freezeMs: [700, 2400], meltdownEveryMs: [2500, 6000] },
  ];
  let presetIndex = 0;
  let preset = presets[presetIndex];

  // SAFE MODE toggle (ESC)
  let safe = false;

  function setMode(mode) {
    html.dataset.mode = mode;
    modeLabel.textContent = mode;
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // Bruit “sale” (scan + grains)
  function drawNoise(opacity = 0.15) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const img = ctx.createImageData(w, h);
    const data = img.data;

    // Noise brut + lignes
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() * 255) | 0;
      data[i] = n;         // r
      data[i + 1] = 255-n; // g
      data[i + 2] = (n * 0.6) | 0; // b
      data[i + 3] = (opacity * 255) | 0;
    }

    ctx.putImageData(img, 0, 0);

    // bandes horizontales “déchirées”
    for (let k = 0; k < 28; k++) {
      const y = (Math.random() * h) | 0;
      const bandH = (2 + Math.random() * 18) | 0;
      const dx = ((Math.random() - 0.5) * 40) | 0;
      ctx.drawImage(canvas, 0, y, w, bandH, dx, y, w, bandH);
    }
  }

  let raf = 0;

  function loop() {
    if (!safe) {
      // Micro “tremblement” global (CSS vars)
      const shake = preset.shake * (0.3 + Math.random() * 1.2);
      html.style.setProperty("--shake", shake.toFixed(2));

      // Bruit
      drawNoise(preset.noise);

      // Déformation ponctuelle du texte (contenu change = plus chaotique)
      if (Math.random() < 0.08) {
        const junk = ["#", "@", "!", "?", "%", "§", "—", "///", "≠", "∆"];
        const base = "GEN X? NO. HARD CRASH.";
        const sp = " ".repeat((Math.random() * 3) | 0);
        const tail = Array.from({ length: (1 + Math.random() * 6) | 0 }, () => junk[(Math.random() * junk.length) | 0]).join("");
        const txt = (Math.random() < 0.35) ? (base + sp + tail) : base;
        glitchText.textContent = txt;
        glitchText.setAttribute("data-text", txt);
      }
    } else {
      // SAFE MODE : minimal
      html.style.setProperty("--shake", "0");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    raf = requestAnimationFrame(loop);
  }

  // “Freeze” volontaire : bloque le thread JS quelques ms
  // ATTENTION : c'est volontairement désagréable mais local, sans serveur.
  function freeze(ms) {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      // spin
    }
  }

  function randInt(a, b) {
    return (a + Math.random() * (b - a)) | 0;
  }

  function randomCrashCode() {
    const parts = [
      "E_0xDEAD_BEEF",
      "SIG_GLITCH_11",
      "VRAM_LEAK_" + randInt(100, 999),
      "STACK_OVERRUN_" + randInt(10, 99),
      "NULL_PTR_" + randInt(1000, 9999),
    ];
    return parts[(Math.random() * parts.length) | 0];
  }

  // Séquence “meltdown”: overlay + blur + freeze + retour
  let meltdownTimer = 0;
  let countdownTimer = 0;

  function startMeltdown() {
    if (safe) return;

    setMode("MELTDOWN");
    overlay.classList.add("on");
    crashCodeEl.textContent = randomCrashCode();

    // augmente le blur + “sale”
    html.style.setProperty("--blur", "1.8px");

    // Freeze variable (peut geler l’onglet quelques secondes)
    const ms = randInt(preset.freezeMs[0], preset.freezeMs[1]);
    freeze(ms);

    // Countdown overlay (3..1)
    let t = 3;
    restartInEl.textContent = String(t);
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      t -= 1;
      restartInEl.textContent = String(Math.max(0, t));
      if (t <= 0) clearInterval(countdownTimer);
    }, 1000);

    // Fin meltdown + reprise
    setTimeout(() => {
      overlay.classList.remove("on");
      html.style.setProperty("--blur", "0px");
      setMode("GLITCH");
    }, 3200);
  }

  function scheduleNextMeltdown() {
    clearTimeout(meltdownTimer);
    const next = randInt(preset.meltdownEveryMs[0], preset.meltdownEveryMs[1]);
    meltdownTimer = setTimeout(() => {
      startMeltdown();
      scheduleNextMeltdown();
    }, next);
  }

  // Contrôles
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      safe = !safe;
      setMode(safe ? "SAFE" : "GLITCH");
      overlay.classList.remove("on");
      html.style.setProperty("--blur", "0px");
      if (!safe) scheduleNextMeltdown();
      else clearTimeout(meltdownTimer);
    }
  });

  window.addEventListener("click", () => {
    if (safe) return;
    presetIndex = (presetIndex + 1) % presets.length;
    preset = presets[presetIndex];
    modeLabel.textContent = presets[presetIndex].name;
  });

  // Start
  setMode("GLITCH");
  loop();
  scheduleNextMeltdown();
})();
