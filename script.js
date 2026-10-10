/**
 * KING - Royal Liquid Motion Design Engine
 * Implements fluid wave physics, SVG displacement animation,
 * interactive canvas liquid particles, 3D tilt, and Web Audio API synthesis.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. STATE & REFERENCES
  // =========================================================================
  const state = {
    isAnimating: false,
    soundEnabled: false,
    audioCtx: null,
    liquidMode: 'molten', // 'molten' | 'chrome' | 'imperial'
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: 0, targetY: 0, isMoving: false },
    crownLevel: 0, // 0 to 1
    textLevel: 0,  // 0 to 1
    time: 0,
    shockwave: 0
  };

  // DOM Elements
  const canvas = document.getElementById('fluid-canvas');
  const ctx = canvas.getContext('2d');
  const logoWrapper = document.getElementById('logo-wrapper');
  const dropContainer = document.getElementById('drop-container');
  const liquidDrop = dropContainer.querySelector('.liquid-drop');
  
  // SVG Elements
  const crownContour = document.getElementById('crown-contour');
  const crownFiligree = document.getElementById('crown-filigree');
  const textContour = document.getElementById('text-contour');
  const crownWavePath = document.getElementById('crown-liquid-wave');
  const textWavePath = document.getElementById('text-liquid-wave');
  const streams = document.querySelectorAll('.liquid-stream');
  const drips = document.querySelectorAll('.drip-drop');
  const feTurbulence = document.getElementById('fe-turb');
  const feDispMap = document.getElementById('fe-disp');

  // Controls
  const btnReplay = document.getElementById('btn-replay');
  const btnSound = document.getElementById('btn-sound');
  const btnSplash = document.getElementById('btn-splash');
  const iconSoundOff = document.getElementById('icon-sound-off');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const soundLabel = document.getElementById('sound-label');
  const chips = document.querySelectorAll('.chip');

  // =========================================================================
  // 2. CANVAS FLUID PARTICLES & RIPPLES SYSTEM
  // =========================================================================
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const ripples = [];
  const PARTICLE_COUNT = 45;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2.5 + 0.8;
      this.speedY = -(Math.random() * 0.7 + 0.3);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.baseAlpha = this.alpha;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
      this.wobbleOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * 0.35;
      
      // Interaction with mouse
      const dx = this.x - state.mouse.x;
      const dy = this.y - state.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const force = (100 - dist) / 100;
        this.x += (dx / dist) * force * 3;
        this.y += (dy / dist) * force * 3;
      }

      if (this.y < -10) this.reset();
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = state.liquidMode === 'chrome' 
        ? `rgba(226, 232, 240, ${this.alpha})`
        : `rgba(245, 158, 11, ${this.alpha})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = this.size * 4;
      ctx.fill();
      ctx.restore();
    }
  }

  class Ripple {
    constructor(x, y, maxRadius = 90, color = 'rgba(245, 158, 11, ') {
      this.x = x;
      this.y = y;
      this.radius = 2;
      this.maxRadius = maxRadius;
      this.alpha = 0.8;
      this.color = color;
      this.speed = 2.5;
    }

    update() {
      this.radius += this.speed;
      this.alpha = Math.max(0, 0.8 * (1 - this.radius / this.maxRadius));
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.color}${this.alpha})`;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function spawnSplash(x, y, count = 22) {
    ripples.push(new Ripple(x, y, 140));
    ripples.push(new Ripple(x, y, 90));
    for (let i = 0; i < count; i++) {
      const p = new Particle();
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 6 + 2;
      p.speedX = Math.cos(angle) * velocity;
      p.speedY = Math.sin(angle) * velocity;
      p.alpha = 1;
      p.size = Math.random() * 3 + 1.5;
      particles.push(p);
    }
    // Remove extra splash particles after 3 seconds
    if (particles.length > PARTICLE_COUNT + 60) {
      particles.splice(PARTICLE_COUNT, particles.length - (PARTICLE_COUNT + 40));
    }
  }

  // =========================================================================
  // 3. SYNTHESIZED WEB AUDIO API (Harmonics & Liquid Drops)
  // =========================================================================
  function initAudio() {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioContext();
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playDropSound(freq = 640) {
    if (!state.soundEnabled) return;
    initAudio();
    const ctx = state.audioCtx;
    const now = ctx.currentTime;

    // Water droplet "plop": rapid pitch swoop up then down
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  function playRoyalChord() {
    if (!state.soundEnabled) return;
    initAudio();
    const ctx = state.audioCtx;
    const now = ctx.currentTime;

    // Royal harmonic chime: warm major chords (D, F#, A, D)
    const freqs = [146.83, 220.00, 293.66, 440.00, 587.33];
    freqs.forEach((f, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      const delay = index * 0.04;
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.12 / freqs.length, now + delay + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 3.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 3.4);
    });
  }

  // =========================================================================
  // 4. LIQUID WAVE GENERATOR FOR SVG CLIPPING
  // =========================================================================
  /**
   * Generates a sinusoidal fluid wave path at a given fill progress (0 to 1).
   * @param {number} progress - 0 (empty) to 1 (full)
   * @param {number} topY - target top limit of shape in SVG coords
   * @param {number} botY - target bottom limit of shape in SVG coords
   * @param {number} time - frame time
   * @param {number} amplitude - height of liquid waves
   * @param {number} frequency - wave frequency
   */
  function createLiquidWavePath(progress, topY, botY, time, amplitude = 12, frequency = 0.015) {
    if (progress <= 0.001) {
      // Empty clip: a zero-height line at the bottom
      return `M 0,${botY + 10} L 1000,${botY + 10} L 1000,${botY + 20} L 0,${botY + 20} Z`;
    }
    if (progress >= 0.999) {
      // Fully filled clip: covering entire bounding box
      return `M 0,0 L 1000,0 L 1000,680 L 0,680 Z`;
    }

    const currentY = botY - (botY - topY) * progress;
    const wavePoints = [];
    const step = 25;

    // Generate sinusoidal wavy surface
    for (let x = 0; x <= 1000; x += step) {
      const yOffset = 
        Math.sin(x * frequency + time * 3) * amplitude * (1 - progress * 0.4) +
        Math.cos(x * frequency * 1.5 - time * 2) * (amplitude * 0.4);
      wavePoints.push(`${x},${(currentY + yOffset).toFixed(1)}`);
    }

    return `M 0,${botY + 10} L ${wavePoints.join(' L ')} L 1000,${botY + 10} Z`;
  }

  // =========================================================================
  // 5. MOTION DESIGN TIMELINE (POUR, REVEAL, FILL)
  // =========================================================================
  function runLiquidRevealSequence() {
    if (state.isAnimating) return;
    state.isAnimating = true;

    // Reset visual elements
    state.crownLevel = 0;
    state.textLevel = 0;
    crownContour.classList.remove('drawn');
    crownFiligree.classList.remove('drawn');
    textContour.classList.remove('drawn');
    streams.forEach(s => s.classList.remove('flowing'));
    drips.forEach(d => d.classList.remove('dripping'));

    // Reset drop
    liquidDrop.classList.remove('falling');
    void liquidDrop.offsetWidth; // trigger reflow
    liquidDrop.classList.add('falling');

    // 1. Drop impact after 1.25s
    setTimeout(() => {
      playDropSound(780);
      playRoyalChord();

      // Spawn splash at crown top center (approx coordinates)
      const rect = logoWrapper.getBoundingClientRect();
      const crownTopX = rect.left + rect.width / 2;
      const crownTopY = rect.top + rect.height * 0.08;
      spawnSplash(crownTopX, crownTopY, 28);
      triggerShockwave(25);

      // 2. Crown contour outline draws
      crownContour.classList.add('drawn');
      crownFiligree.classList.add('drawn');

      // 3. Liquid rises in Crown from 0 to 1 over 1.6s
      const startTime = performance.now();
      const fillCrownDuration = 1600;

      function fillCrown(now) {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / fillCrownDuration);
        // Smooth easing: easeOutCubic
        state.crownLevel = 1 - Math.pow(1 - p, 3);

        if (p < 1) {
          requestAnimationFrame(fillCrown);
        } else {
          state.crownLevel = 1;
          onCrownFilled();
        }
      }
      requestAnimationFrame(fillCrown);

    }, 1250);

    function onCrownFilled() {
      // 4. Cascade streams flow down to KING
      streams.forEach(s => s.classList.add('flowing'));
      textContour.classList.add('drawn');

      // Sound accent
      playDropSound(520);

      // 5. Liquid rises in KING text after a brief stream delay
      setTimeout(() => {
        const textStartTime = performance.now();
        const fillTextDuration = 2000;

        function fillText(now) {
          const elapsed = now - textStartTime;
          const p = Math.min(1, elapsed / fillTextDuration);
          // Easing: easeOutQuart for majestic viscosity
          state.textLevel = 1 - Math.pow(1 - p, 4);

          if (p < 1) {
            requestAnimationFrame(fillText);
          } else {
            state.textLevel = 1;
            onTextFilled();
          }
        }
        requestAnimationFrame(fillText);
      }, 500);
    }

    function onTextFilled() {
      // 6. Complete: Turn on drips and ambient settle
      drips.forEach(d => d.classList.add('dripping'));
      playDropSound(880);
      state.isAnimating = false;
    }
  }

  function triggerShockwave(intensity = 30) {
    state.shockwave = intensity;
  }

  // =========================================================================
  // 6. ANIMATION LOOP (Physics, Wave Updates, SVG Filter Breath)
  // =========================================================================
  let lastTime = 0;

  function render(currentTime) {
    const delta = (currentTime - lastTime) * 0.001;
    lastTime = currentTime;
    state.time += 0.03;

    // --- A. Canvas particles and ripples ---
    ctx.clearRect(0, 0, width, height);

    // Update ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].update();
      ripples[i].draw(ctx);
      if (ripples[i].alpha <= 0) ripples.splice(i, 1);
    }

    // Update particles
    particles.forEach(p => {
      p.update(state.time);
      p.draw(ctx);
    });

    // --- B. Update SVG Liquid Wave Clipping Paths ---
    // Crown wave bounds: topY = 20, botY = 280
    crownWavePath.setAttribute(
      'd',
      createLiquidWavePath(state.crownLevel, 20, 280, state.time, 14, 0.02)
    );

    // Text wave bounds: topY = 360, botY = 560
    textWavePath.setAttribute(
      'd',
      createLiquidWavePath(state.textLevel, 360, 560, state.time, 18, 0.012)
    );

    // --- C. Dynamic SVG Turbulence Filter breathing ---
    if (feTurbulence) {
      const baseFreqX = (0.014 + Math.sin(state.time * 0.3) * 0.003).toFixed(4);
      const baseFreqY = (0.020 + Math.cos(state.time * 0.25) * 0.004).toFixed(4);
      feTurbulence.setAttribute('baseFrequency', `${baseFreqX} ${baseFreqY}`);
    }

    // --- D. Shockwave Dampening ---
    if (feDispMap) {
      const baseScale = 12;
      const currentScale = baseScale + state.shockwave;
      feDispMap.setAttribute('scale', currentScale.toFixed(1));
      if (state.shockwave > 0.05) {
        state.shockwave *= 0.92; // exponential damping
      } else {
        state.shockwave = 0;
      }
    }

    // --- E. 3D Tilt of Logo on Mouse Move ---
    state.mouse.targetX += (state.mouse.x - state.mouse.targetX) * 0.06;
    state.mouse.targetY += (state.mouse.y - state.mouse.targetY) * 0.06;

    const rotY = ((state.mouse.targetX / width) - 0.5) * 16;
    const rotX = -((state.mouse.targetY / height) - 0.5) * 14;
    logoWrapper.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // Initial reveal on load
  runLiquidRevealSequence();

  // =========================================================================
  // 7. USER INTERACTIONS & EVENT LISTENERS
  // =========================================================================

  // Mouse & Touch Tracking
  function handlePointerMove(e) {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    if (x === undefined || y === undefined) return;

    state.mouse.x = x;
    state.mouse.y = y;

    // Emit subtle micro-ripple every few pixels
    if (Math.random() < 0.12) {
      ripples.push(new Ripple(x, y, 45));
    }
  }

  window.addEventListener('mousemove', handlePointerMove, { passive: true });
  window.addEventListener('touchmove', handlePointerMove, { passive: true });

  // Click on stage / logo to trigger liquid shockwave
  window.addEventListener('click', (e) => {
    // Avoid triggering if clicking controls panel buttons
    if (e.target.closest('.controls-panel')) return;

    spawnSplash(e.clientX, e.clientY, 18);
    triggerShockwave(22);
    playDropSound(600 + Math.random() * 300);
  });

  // Replay Button
  btnReplay.addEventListener('click', () => {
    runLiquidRevealSequence();
  });

  // Splash Button (Vague d'Or)
  btnSplash.addEventListener('click', (e) => {
    const rect = logoWrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnSplash(cx, cy, 35);
    triggerShockwave(35);
    playDropSound(750);
  });

  // Sound Button Toggle
  btnSound.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      initAudio();
      iconSoundOff.classList.add('hidden');
      iconSoundOn.classList.remove('hidden');
      soundLabel.textContent = 'Son: Actif';
      playDropSound(700);
      playRoyalChord();
    } else {
      iconSoundOff.classList.remove('hidden');
      iconSoundOn.classList.add('hidden');
      soundLabel.textContent = 'Son: Muet';
    }
  });

  // Style Mode Selector
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const mode = chip.dataset.mode;
      state.liquidMode = mode;

      document.body.classList.remove('mode-chrome', 'mode-imperial');
      if (mode === 'chrome') {
        document.body.classList.add('mode-chrome');
        updateGradients('#FFFFFF', '#F8FAFC', '#E2E8F0', '#94A3B8', '#475569');
      } else if (mode === 'imperial') {
        document.body.classList.add('mode-imperial');
        updateGradients('#FEF9C3', '#FDE047', '#EAB308', '#CA8A04', '#854D0E');
      } else {
        // molten 24k
        updateGradients('#FFF8D6', '#FCE182', '#F59E0B', '#D97706', '#78350F');
      }

      triggerShockwave(20);
      playDropSound(640);
    });
  });

  function updateGradients(c0, c1, c2, c3, c4) {
    const grad = document.getElementById('liquidGoldGrad');
    if (!grad) return;
    const stops = grad.querySelectorAll('stop');
    if (stops.length >= 5) {
      stops[0].setAttribute('stop-color', c0);
      stops[1].setAttribute('stop-color', c1);
      stops[2].setAttribute('stop-color', c2);
      stops[3].setAttribute('stop-color', c3);
      stops[4].setAttribute('stop-color', c4);
    }
  }
});
