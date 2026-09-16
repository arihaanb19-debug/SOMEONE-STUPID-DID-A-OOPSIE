const BUTTON_SIZE = 150; // px, must match the width/height in style.css
const SPEED = 5; // px per animation frame
const WAVE_SIZE = 5;

const buttons = [];

// Picks a random direction and converts it into x/y speed components.
function randomVelocity() {
  const angle = Math.random() * 2 * Math.PI;
  return { vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED };
}

function getBounds() {
  return {
    maxLeft: window.innerWidth - BUTTON_SIZE,
    maxTop: window.innerHeight - BUTTON_SIZE,
  };
}

function createButton() {
  const el = document.createElement('button');
  el.className = 'do-not-press';
  el.textContent = 'Do not press';
  document.body.appendChild(el);

  const { maxLeft, maxTop } = getBounds();
  const { vx, vy } = randomVelocity();

  const btn = {
    el,
    x: Math.random() * maxLeft,
    y: Math.random() * maxTop,
    vx,
    vy,
  };

  el.addEventListener('click', () => onPress(btn));
  buttons.push(btn);
}

function spawnWave(count) {
  for (let i = 0; i < count; i++) createButton();
}

function onPress(btn) {
  const rect = btn.el.getBoundingClientRect();
  explode(rect.left + rect.width / 2, rect.top + rect.height / 2);
  btn.el.remove();
  buttons.splice(buttons.indexOf(btn), 1);

  // Once the last button is gone, wait for the explosion to finish, then refill.
  if (buttons.length === 0) {
    setTimeout(() => spawnWave(WAVE_SIZE), 800);
  }
}

// Reflects a button off the screen edges, picking a fresh random angle
// (biased back into the screen) rather than a plain mirror bounce, so it
// doesn't retrace the same path every time.
function bounceOffWalls(btn) {
  const { maxLeft, maxTop } = getBounds();

  const hitLeft = btn.x <= 0;
  const hitRight = btn.x >= maxLeft;
  const hitTop = btn.y <= 0;
  const hitBottom = btn.y >= maxTop;

  if (hitLeft || hitRight || hitTop || hitBottom) {
    let { vx, vy } = randomVelocity();
    // Force the component to point back inward on whichever edge was hit.
    if (hitLeft) vx = Math.abs(vx);
    if (hitRight) vx = -Math.abs(vx);
    if (hitTop) vy = Math.abs(vy);
    if (hitBottom) vy = -Math.abs(vy);
    btn.vx = vx;
    btn.vy = vy;
  }

  btn.x = Math.min(Math.max(btn.x, 0), maxLeft);
  btn.y = Math.min(Math.max(btn.y, 0), maxTop);
}

// Checks every pair of buttons for overlap and, on collision, pushes them
// apart and reflects their velocity along the line connecting their centers
// (a standard equal-mass elastic collision).
function resolveCollisions() {
  for (let i = 0; i < buttons.length; i++) {
    for (let j = i + 1; j < buttons.length; j++) {
      const a = buttons[i];
      const b = buttons[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01; // avoid divide-by-zero
      const minDist = BUTTON_SIZE; // sum of both radii (equal-size circles)

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Separate the two so they don't stay stuck overlapping.
        const overlap = (minDist - dist) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // Swap the velocity components along the collision normal.
        const avn = a.vx * nx + a.vy * ny;
        const bvn = b.vx * nx + b.vy * ny;

        a.vx += (bvn - avn) * nx;
        a.vy += (bvn - avn) * ny;
        b.vx += (avn - bvn) * nx;
        b.vy += (avn - bvn) * ny;
      }
    }
  }
}

// Main animation loop: advance positions, resolve bounces/collisions, repaint.
function tick() {
  buttons.forEach((btn) => {
    btn.x += btn.vx;
    btn.y += btn.vy;
    bounceOffWalls(btn);
  });

  resolveCollisions();

  buttons.forEach((btn) => {
    btn.el.style.left = `${btn.x}px`;
    btn.el.style.top = `${btn.y}px`;
  });

  requestAnimationFrame(tick);
}

// Spawns a burst of fading, outward-flying particles at the given point.
function explode(centerX, centerY) {
  const colors = ['#ff4500', '#ff8c00', '#ffd700', '#ff0000'];
  const particleCount = 40;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const angle = Math.random() * 2 * Math.PI;
    const distance = 100 + Math.random() * 200;
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

spawnWave(WAVE_SIZE);
requestAnimationFrame(tick);