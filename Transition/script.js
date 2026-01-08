(() => {
  const boot = document.getElementById("boot");
  const pctEl = document.getElementById("pct");
  const secEl = document.getElementById("sec");
  const stopEl = document.getElementById("stop");
  const failedEl = document.getElementById("failed");

  const stopCodes = [
    "VIDEO_TDR_FAILURE",
    "SYSTEM_SERVICE_EXCEPTION",
    "IRQL_NOT_LESS_OR_EQUAL",
    "KERNEL_SECURITY_CHECK_FAILURE",
    "MEMORY_MANAGEMENT",
    "CRITICAL_PROCESS_DIED",
  ];

  const failedList = [
    "webgl_driver.sys",
    "framebuffer.dll",
    "render_pipeline.sys",
    "kernel32.dll",
  ];

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  stopEl.textContent = pick(stopCodes);
  failedEl.textContent = pick(failedList);

  /* ===== BOOT ERROR visible 1s ===== */
  setTimeout(() => {
    boot.style.display = "none";
  }, 1000);

  /* ===== % progression ===== */
  let pct = 0;
  setInterval(() => {
    if (pct < 100) {
      pct += ((Math.random() * 6) | 0) + 2; // lent
      if (pct > 100) pct = 100;
      pctEl.textContent = String(pct);
    }
  }, 200);

  /* ===== countdown bloqué à 0 ===== */
  let sec = 3;
  secEl.textContent = String(sec);
  setInterval(() => {
    sec -= 1;
    if (sec < 0) sec = 0;
    secEl.textContent = String(sec);
  }, 1400);
})();
