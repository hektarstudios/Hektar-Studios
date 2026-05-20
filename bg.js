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

  /* Size the flowing blob layer to match document height */
  function sizeFlow() {
    const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    flow.style.height = docH + 'px';
  }
  sizeFlow();
  window.addEventListener('resize', sizeFlow);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeFlow);
  window.addEventListener('load', sizeFlow);
  setTimeout(sizeFlow, 600);
  setTimeout(sizeFlow, 2000);

  /* Scroll state */
  let targetY = window.scrollY || 0;
  let currentY = targetY;
  let lastY = targetY;
  let velocitySmooth = 0;
  window.addEventListener('scroll', () => { targetY = window.scrollY; }, { passive: true });

  /* Pause loop when tab is hidden — saves CPU/GPU entirely */
  let rafPaused = false;
  document.addEventListener('visibilitychange', () => { rafPaused = document.hidden; });

  /* Skip DOM writes when value hasn't meaningfully changed */
  let lastPhotoX = -999, lastPhotoTY = -999, lastPhotoScale = -999;
  let frameCount = 0;
  let t0 = 0;

  function tick(now) {
    if (rafPaused) { requestAnimationFrame(tick); return; }

    const t = (now || 0) * 0.001;
    if (!t0) t0 = t;
    const tt = t - t0;
    frameCount++;

    /* Smooth scroll position */
    currentY += (targetY - currentY) * 0.12;
    const v = currentY - lastY;
    velocitySmooth += (v - velocitySmooth) * 0.16;
    lastY = currentY;

    const docH = Math.max(1, (document.documentElement.scrollHeight || 1) - window.innerHeight);
    const progress = Math.min(1, Math.max(0, currentY / docH));

    /* PHOTO — 8s breathing zoom + vertical parallax + horizontal pan */
    const breathT      = tt * (2 * Math.PI / 8);
    const breath       = Math.sin(breathT);
    const breathScale  = 0.030 * breath;
    const breathDriftY = 4 * Math.sin(breathT);
    const photoTY      = -currentY * 0.18 + breathDriftY;
    const photoScale   = 1.18 + progress * 0.05 + breathScale;
    const photoX       = 70 - progress * 40;

    /* Only write to DOM when value has actually changed — avoids redundant repaints */
    if (Math.abs(photoTY    - lastPhotoTY)    > 0.05)   { photo.style.setProperty('--photoTY',    photoTY.toFixed(2) + 'px');  lastPhotoTY    = photoTY; }
    if (Math.abs(photoScale - lastPhotoScale) > 0.0002) { photo.style.setProperty('--photoScale', photoScale.toFixed(4));       lastPhotoScale = photoScale; }
    if (Math.abs(photoX     - lastPhotoX)     > 0.05)   { photo.style.setProperty('--photoX',     photoX.toFixed(2) + '%');    lastPhotoX     = photoX; }

    /* BLOB FLOW — composited transform, safe to run every frame */
    flow.style.setProperty('--flowY', (-currentY * 0.82).toFixed(2) + 'px');

    /* SPOTLIGHT — throttled to ~20fps; slow drift is imperceptible at lower rate */
    if (frameCount % 3 === 0) {
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

    /* WAVES — composited transform */
    if (waves) waves.style.setProperty('--wavesY', (-currentY * 0.45).toFixed(2) + 'px');

    /* NEON ghost — composited transform */
    if (neon) {
      const jitter = Math.min(Math.abs(velocitySmooth) * 0.3, 6);
      const ny = -currentY * 0.55;
      neon.style.transform =
        `translate3d(${(Math.sin(tt * 9) * jitter).toFixed(2)}px, ${ny.toFixed(2)}px, 0) rotate(-1deg)`;
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick); /* ← start the loop */
})();
