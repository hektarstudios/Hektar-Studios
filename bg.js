/* ══════════════════════════════════════════════════════════════════════
   STUDIO BACKGROUND — scroll parallax + breathing motion graphics
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  const photo = document.getElementById('sbgPhoto');
  const neon  = document.getElementById('sbgNeon');
  const flow  = document.getElementById('sbgFlow');
  const spot  = document.getElementById('sbgSpotlight');
  const waves = document.querySelector('.sbg-waves');
  if (!photo || !flow) return;

  /* Swap in full-res studio photo once loaded */
  const fullImg = new Image();
  fullImg.onload = () => {
    photo.style.backgroundImage = "url('assets/studio.jpg')";
    photo.classList.add('is-loaded');
  };
  fullImg.src = 'assets/studio.jpg';

  /* ── docH cached — NEVER read scrollHeight inside the rAF loop ──────
     Reading scrollHeight forces a synchronous layout flush every frame.
     Cache it here and refresh only on resize/load/font-ready.          */
  let cachedDocH = 1;
  function updateDocH() {
    cachedDocH = Math.max(1,
      (document.documentElement.scrollHeight || 1) - window.innerHeight);
  }

  /* Size the blob flow layer to document height */
  function sizeFlow() {
    const docH = Math.max(
      document.documentElement.scrollHeight, document.body.scrollHeight);
    flow.style.height = docH + 'px';
    updateDocH(); /* refresh cache at the same time */
  }
  sizeFlow();
  window.addEventListener('resize', sizeFlow);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeFlow);
  window.addEventListener('load', sizeFlow);
  setTimeout(sizeFlow, 600);
  setTimeout(sizeFlow, 2000);

  /* Inactivity breathing — photo breathes only after 20s with no user activity */
  let breathingActive = false;
  let inactivityTimer = null;

  function startBreathing() {
    breathingActive = true;
    photo.style.animationPlayState = 'running';
  }
  function stopBreathing() {
    breathingActive = false;
    photo.style.animationPlayState = 'paused';
  }
  function resetInactivity() {
    stopBreathing();
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(startBreathing, 20000);
  }
  ['scroll','mousemove','click','keydown','touchstart','wheel'].forEach(evt => {
    window.addEventListener(evt, resetInactivity, { passive: true });
  });
  resetInactivity();

  /* Scroll state */
  let targetY  = window.scrollY || 0;
  let currentY = targetY;
  let lastY    = targetY;
  window.addEventListener('scroll', () => { targetY = window.scrollY; }, { passive: true });

  /* Pause loop when tab is hidden */
  let rafPaused = false;
  document.addEventListener('visibilitychange', () => { rafPaused = document.hidden; });

  /* Change-detection — skip DOM writes when value hasn't meaningfully changed */
  let lastPhotoX = -999, lastPhotoTY = -999, lastPhotoScale = -999, lastFlowY = -999;
  let frameCount = 0;
  let t0 = 0;

  /* ── Time-based smooth scroll ────────────────────────────────────────
     Uses frame delta (dt) so easing is identical at 60 / 90 / 120 Hz.
     k=4.5 → reaches ~99% of target in ~1 second (matches old 0.07/frame
     feel at 60 Hz).                                                     */
  let prevTime = 0;

  function tick(now) {
    if (rafPaused) { requestAnimationFrame(tick); return; }

    const dt = prevTime ? Math.min((now - prevTime) * 0.001, 0.05) : 0.016;
    prevTime  = now;
    frameCount++;

    const t  = now * 0.001;
    if (!t0) t0 = t;
    const tt = t - t0;

    /* Time-based easing — framerate-independent */
    currentY += (targetY - currentY) * (1 - Math.exp(-4.5 * dt));
    lastY = currentY;

    const progress = Math.min(1, Math.max(0, currentY / cachedDocH));

    /* PHOTO — parallax + horizontal pan. Scale static unless breathing. */
    const breathT      = tt * (2 * Math.PI / 8);
    const breath       = Math.sin(breathT);
    const breathScale  = breathingActive ? (0.030 * breath) : 0;
    const breathDriftY = breathingActive ? (4 * Math.sin(breathT)) : 0;
    const photoTY      = -currentY * 0.18 + breathDriftY;
    const photoScale   = 1.18 + breathScale;
    const photoX       = 70 - progress * 40;

    if (Math.abs(photoTY    - lastPhotoTY)    > 0.05)   { photo.style.setProperty('--photoTY',    photoTY.toFixed(2)   + 'px'); lastPhotoTY    = photoTY;    }
    if (Math.abs(photoScale - lastPhotoScale) > 0.0002) { photo.style.setProperty('--photoScale', photoScale.toFixed(4));       lastPhotoScale = photoScale; }
    if (Math.abs(photoX     - lastPhotoX)     > 0.05)   { photo.style.setProperty('--photoX',     photoX.toFixed(2)    + '%'); lastPhotoX     = photoX;     }

    /* BLOB FLOW + WAVES — only write when scroll has actually moved */
    if (Math.abs(currentY - lastFlowY) > 0.15) {
      flow.style.setProperty('--flowY',  (-currentY * 0.82).toFixed(1) + 'px');
      if (waves) waves.style.setProperty('--wavesY', (-currentY * 0.45).toFixed(1) + 'px');
      lastFlowY = currentY;
    }

    /* SPOTLIGHT — throttled to 10 fps (every 6th frame at 60 Hz) */
    if (frameCount % 6 === 0) {
      const sX  = 50 + Math.sin(tt * 0.30) * 25;
      const sY  = 30 + Math.sin(tt * 0.45) * 18 + Math.sin(tt * 0.18) * 8;
      const sX2 = 50 + Math.cos(tt * 0.22) * 30;
      const sY2 = 70 + Math.cos(tt * 0.38) * 16;
      spot.style.setProperty('--spotX',  sX.toFixed(1)  + '%');
      spot.style.setProperty('--spotY',  sY.toFixed(1)  + '%');
      spot.style.setProperty('--spotX2', sX2.toFixed(1) + '%');
      spot.style.setProperty('--spotY2', sY2.toFixed(1) + '%');
      spot.style.opacity = (0.85 + breath * 0.10).toFixed(3);
    }

    /* NEON ghost — only near hero, simple scroll lift */
    if (neon && currentY < window.innerHeight * 1.8) {
      neon.style.transform =
        `translate3d(0px, ${(-currentY * 0.55).toFixed(2)}px, 0) rotate(-1deg)`;
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
