(() => {
  const canvas = document.getElementById("gl");
  const modeEl = document.getElementById("mode");

  // ERROR overlay canvas (2D)
  const hudFx = document.getElementById("hudFx");
  const fx = hudFx.getContext("2d", { alpha: true });

  // BSOD elements
  const bsod = document.getElementById("bsod");
  const bsodPct = document.getElementById("bsodPct");
  const bsodStop = document.getElementById("bsodStop");
  const bsodWhat = document.getElementById("bsodWhat");
  const bsodRestart = document.getElementById("bsodRestart");

  let safe = false;
  let isMelting = false;

  // ===== Presets =====
  const presets = [
    {
      name: "GLITCH",
      intensity: 1.05,
      autoEvery: [4500, 9500],
      meltDur: [1200, 2200],
      bsodDur: [1800, 3200],
      freezeMs: [120, 520],
      overlayOpacity: 0.55,
    },
    {
      name: "INSANE",
      intensity: 2.15,
      autoEvery: [2400, 6200],
      meltDur: [1600, 3200],
      bsodDur: [2200, 4200],
      freezeMs: [300, 1400],
      overlayOpacity: 0.72,
    },
  ];
  let p = 0;
  let preset = presets[p];

  // ===== Utils =====
  function randi(a, b) { return (a + Math.random() * (b - a)) | 0; }

  function randomStop() {
    const list = [
      "VIDEO_TDR_FAILURE",
      "SYSTEM_SERVICE_EXCEPTION",
      "IRQL_NOT_LESS_OR_EQUAL",
      "KERNEL_SECURITY_CHECK_FAILURE",
      "MEMORY_MANAGEMENT",
      "PAGE_FAULT_IN_NONPAGED_AREA",
    ];
    return list[(Math.random() * list.length) | 0];
  }

  function randomFailed() {
    const list = [
      "glitch_shader.sys",
      "webgl_driver.sys",
      "framebuffer.dll",
      "render_pipeline.sys",
      "vram_allocator.sys",
    ];
    return list[(Math.random() * list.length) | 0];
  }

  // Freeze volontaire (illusion “ça répond plus”), local, non destructif.
  function microFreeze(ms) {
    const end = performance.now() + ms;
    while (performance.now() < end) {}
  }

  // ===== Resize canvases =====
  function resizeGl() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function resizeFx() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    hudFx.width = Math.floor(window.innerWidth * dpr);
    hudFx.height = Math.floor(window.innerHeight * dpr);
    hudFx.style.width = "100%";
    hudFx.style.height = "100%";
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", () => {
    resizeGl();
    resizeFx();
  });

  // ===== WebGL setup =====
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) {
    modeEl.textContent = "NO WEBGL";
    return;
  }

  const vsrc = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main(){
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const fsrc = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uCrash;

    float hash(vec2 p){
      p = fract(p*vec2(123.34,456.21));
      p += dot(p,p+45.32);
      return fract(p.x*p.y);
    }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i+vec2(1.0,0.0));
      float c = hash(i+vec2(0.0,1.0));
      float d = hash(i+vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }
    vec3 pal(float t){
      return 0.55 + 0.45*cos(6.2831*(vec3(0.0,0.33,0.67)+t));
    }

    void main(){
      vec2 uv = vUv;
      float t = uTime;

      // tearing horizontal
      float band = step(0.86, noise(vec2(t*2.0, uv.y*50.0)));
      float tear = (noise(vec2(uv.y*30.0, t*6.0))-0.5) * 0.25 * (0.2 + uIntensity);
      uv.x += tear * band;

      // block artifacts
      float grid = mix(60.0, 280.0, clamp(uIntensity/2.0, 0.0, 1.0));
      vec2 q = floor(uv*grid)/grid;
      float n = noise(q*vec2(8.0,12.0) + t*vec2(0.6, 1.2));

      // RGB split
      float split = (noise(vec2(t*3.0, uv.y*80.0))-0.5) * 0.02 * (1.0 + uIntensity*1.2);
      vec2 uvR = uv + vec2(split, 0.0);
      vec2 uvB = uv - vec2(split, 0.0);

      float a = noise(uv*vec2(4.0,3.0) + t*0.25);
      float b = noise(uv*vec2(12.0,10.0) - t*0.55);
      float c = noise(uv*vec2(24.0,18.0) + t*1.2);

      float crash = uCrash;
      float spike = smoothstep(0.2, 1.0, crash) * (0.5 + 0.5*sin(t*40.0));
      float burn  = smoothstep(0.0, 1.0, crash) * (0.6 + 0.4*noise(vec2(t*8.0, uv.y*120.0)));

      float v = (a*0.55 + b*0.35 + c*0.25);
      v = pow(v, 1.2);

      vec3 col = pal(v + t*0.03);
      col *= 0.9 + 0.8 * (n-0.5) * (0.6 + uIntensity);

      float r = noise(uvR*vec2(10.0,8.0) + t*0.4);
      float g = noise(uv *vec2(10.0,8.0) + t*0.4);
      float bl= noise(uvB*vec2(10.0,8.0) + t*0.4);

      col.r += (r-0.5) * 0.45 * (0.4 + uIntensity);
      col.g += (g-0.5) * 0.45 * (0.4 + uIntensity);
      col.b += (bl-0.5)* 0.45 * (0.4 + uIntensity);

      float scan = 0.92 + 0.08*sin((uv.y*uRes.y)*0.8);
      float flicker = 0.9 + 0.2*noise(vec2(t*10.0, 0.0));
      col *= scan * flicker;

      // crash = bleach / blackout + contrast
      col = mix(col, vec3(1.0), burn*0.70);
      col = mix(col, vec3(0.0), spike*0.62);
      col = pow(max(col, 0.0), vec3(0.60 + 0.65*crash));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function link(vs, fs) {
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(pr));
      gl.deleteProgram(pr);
      return null;
    }
    return pr;
  }

  const vs = compile(gl.VERTEX_SHADER, vsrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsrc);
  const prog = link(vs, fs);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1, -1,  1,
    -1,  1,  1, -1,  1,  1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uIntensity = gl.getUniformLocation(prog, "uIntensity");
  const uCrash = gl.getUniformLocation(prog, "uCrash");

  // Initial resize
  resizeGl();
  resizeFx();

  // ===== ERROR overlay drawing =====
  const errorWords = [
    "ERROR", "FATAL", "PANIC", "CORRUPT", "INVALID", "NULL", "OVERFLOW",
    "FRAME DROP", "SYNC LOST", "MEM LEAK", "GPU TIMEOUT", "BAD SIGNAL"
  ];

  function hexLine(len = 24) {
    const h = "0123456789ABCDEF";
    let s = "";
    for (let i = 0; i < len; i++) s += h[(Math.random() * 16) | 0];
    return s;
  }

  function drawErrorOverlay(timeSec) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    fx.clearRect(0, 0, w, h);

    // scanlines / noise
    for (let y = 0; y < h; y += 3) {
      fx.globalAlpha = 0.04 + Math.random() * 0.10;
      fx.fillRect(0, y, w, 1);
    }

    // compression blocks
    fx.globalAlpha = 0.22;
    for (let i = 0; i < 45; i++) {
      const bw = (40 + Math.random() * 220) | 0;
      const bh = (8 + Math.random() * 60) | 0;
      const x = (Math.random() * (w - bw)) | 0;
      const y = (Math.random() * (h - bh)) | 0;
      fx.fillRect(x, y, bw, bh);
    }

    // error text stream
    fx.globalAlpha = 0.85;
    fx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    const lines = 26;
    for (let i = 0; i < lines; i++) {
      const yy = 20 + i * 18 + ((Math.random() - 0.5) * 6);
      const left = `${errorWords[(Math.random() * errorWords.length) | 0]} :: ${hexLine(8)}-${hexLine(4)} :: t=${timeSec.toFixed(2)}`;
      const right = `0x${hexLine(8)}  ${hexLine(16)}`;

      const jx = (Math.random() < 0.25) ? ((Math.random() - 0.5) * 80) : ((Math.random() - 0.5) * 20);

      fx.fillText(left, 18 + jx, yy);
      if (Math.random() < 0.45) fx.fillText(right, w * 0.55 + jx, yy);
    }

    // flash overlay
    if (Math.random() < 0.08) {
      fx.globalAlpha = 0.18;
      fx.fillRect(0, 0, w, h);
    }

    // tearing recopy (cheap datamosh)
    if (Math.random() < 0.35) {
      fx.globalAlpha = 0.65;
      for (let k = 0; k < 10; k++) {
        const y = (Math.random() * h) | 0;
        const hh = (2 + Math.random() * 22) | 0;
        const dx = ((Math.random() - 0.5) * 120) | 0;
        fx.drawImage(hudFx, 0, y, w, hh, dx, y, w, hh);
      }
    }
  }

  // ===== BSOD handling =====
  let bsodInterval = 0;
  let bsodCountdown = 0;

  function showBSOD(durationMs) {
    bsod.classList.add("on");
    bsodPct.textContent = "0";
    bsodStop.textContent = randomStop();
    bsodWhat.textContent = randomFailed();

    let pct = 0;
    clearInterval(bsodInterval);
    bsodInterval = setInterval(() => {
      pct += randi(3, 17);
      pct = Math.min(100, pct);
      bsodPct.textContent = String(pct);
    }, 110);

    let s = 3;
    bsodRestart.textContent = String(s);
    clearInterval(bsodCountdown);
    bsodCountdown = setInterval(() => {
      s -= 1;
      bsodRestart.textContent = String(Math.max(0, s));
      if (s <= 0) clearInterval(bsodCountdown);
    }, 1000);

    setTimeout(() => {
      bsod.classList.remove("on");
      clearInterval(bsodInterval);
      clearInterval(bsodCountdown);
    }, durationMs);
  }

  // ===== Meltdown scheduling =====
  let crash = 0.0;
  let autoTimer = 0;

  function scheduleAuto() {
    clearTimeout(autoTimer);
    const next = randi(preset.autoEvery[0], preset.autoEvery[1]);
    autoTimer = setTimeout(() => {
      meltdown("AUTO");
      scheduleAuto();
    }, next);
  }

  function meltdown(trigger = "AUTO") {
    if (safe || isMelting) return;
    isMelting = true;

    modeEl.textContent = trigger === "CLICK" ? "MELTDOWN (CLICK)" : "MELTDOWN";
    crash = 1.0;

    const meltDur = randi(preset.meltDur[0], preset.meltDur[1]);
    const bsodDur = randi(preset.bsodDur[0], preset.bsodDur[1]);

    // illusion “plantage”
    microFreeze(randi(preset.freezeMs[0], preset.freezeMs[1]));

    // écran bleu
    showBSOD(bsodDur);

    // shader returns
    setTimeout(() => { crash = 0.0; }, meltDur);

    // reboot
    setTimeout(() => {
      isMelting = false;
      if (!safe) modeEl.textContent = preset.name;
    }, Math.max(meltDur, bsodDur));
  }

  // ===== SAFE mode =====
  function setSafe(state) {
    safe = state;
    document.documentElement.dataset.safe = safe ? "1" : "0";
    isMelting = false;

    clearTimeout(autoTimer);
    clearInterval(bsodInterval);
    clearInterval(bsodCountdown);

    bsod.classList.remove("on");
    crash = 0.0;

    // stop overlay
    fx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    hudFx.style.opacity = "0";

    modeEl.textContent = safe ? "SAFE" : preset.name;
    if (!safe) scheduleAuto();
  }

  // ===== Render loop =====
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;

    if (safe) {
      gl.clearColor(0.03, 0.03, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      requestAnimationFrame(frame);
      return;
    }

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uIntensity, preset.intensity);
    gl.uniform1f(uCrash, crash);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ERROR overlay: visible only when BSOD is not shown
    if (!bsod.classList.contains("on")) {
      drawErrorOverlay(t);
      hudFx.style.opacity = String(preset.overlayOpacity);
    } else {
      fx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      hudFx.style.opacity = "0";
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Start
  modeEl.textContent = preset.name;
  scheduleAuto();

  // Controls
  window.addEventListener("click", () => meltdown("CLICK"));

  window.addEventListener("dblclick", () => {
    if (safe) return;
    p = (p + 1) % presets.length;
    preset = presets[p];
    modeEl.textContent = preset.name;
    scheduleAuto();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setSafe(!safe);
  });
})();
