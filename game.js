const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const fade = document.getElementById("fade");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* UI */
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const gameoverUI = document.getElementById("gameover");
const restartBtn = document.getElementById("restartBtn");
const finalText = document.getElementById("finalText");

const dayUI = document.getElementById("day");
const archiveUI = document.getElementById("archives");
const terminal = document.getElementById("terminal");

let particles = [];
let timeScale = 1;
let memory = [];

/* GAME STATE */
let state = "menu"; // menu | playing | gameover

let keys = {};

document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

/* PLAYER */
const player = {
  x: 100,
  y: 300,
  w: 40,
  h: 60,
  vx: 0,
  vy: 0,
  speed: 6,
  jump: -15,
  grounded: false,
};

const groundY = canvas.height - 100;

/* GAME VARS */
let archives = 0;
let day = 1;
let maxDays = 10;

let dayDuration = 60000;
let dayStart = Date.now();

let sunSize = 40;
let backgroundOffset = 0;

let collapseMode = false;
let flicker = 0;

/* KNOWLEDGE */
const knowledge = [
  { title: "Linux Kernel", desc: "Core of millions of systems." },
  { title: "Apollo Missions", desc: "First steps beyond Earth." },
  { title: "Internet Archive", desc: "Digital memory of civilization." },
  { title: "AI Systems", desc: "Machines learning to think." },
];

let capsules = [];

/* TERMINAL */
function log(msg) {
  let glitch = msg;

  if (collapseMode) {
    glitch = msg
      .split("")
      .map((c) => (Math.random() > 0.9 ? "#" : c))
      .join("");
  }

  terminal.innerHTML += glitch + "<br>";
  terminal.scrollTop = terminal.scrollHeight;
}

/* START / RESTART */
startBtn.onclick = () => {
  menu.style.display = "none";
  state = "playing";

  fade.style.opacity = 0;
};

restartBtn.onclick = () => {
  //location.reload();
  //bunun yerine ekledim
  state = "playing";
  gameoverUI.style.display = "none";

  archives = 0;
  day = 1;
  sunSize = 40;
  capsules = [];
  memory = [];

  dayStart = Date.now();

  for (let i = 0; i < 5; i++) spawnCapsule();
};

/* SPAWN */
function spawnParticles(x, y, color = "#00ff88") {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 40,
      color,
    });
  }
}

function spawnCapsule() {
  capsules.push({
    x: Math.random() * (canvas.width - 100) + 50,
    y: groundY - 40,
    size: 25,
    data: knowledge[Math.floor(Math.random() * knowledge.length)],
  });
}

for (let i = 0; i < 5; i++) spawnCapsule();

/* UPDATE PLAYER */
function updatePlayer() {
  player.vx = 0;

  if (keys["KeyA"]) player.vx = -player.speed;
  if (keys["KeyD"]) player.vx = player.speed;

  if (keys["Space"] && player.grounded) {
    player.vy = player.jump;
    player.grounded = false;
  }

  player.vy += 0.8 * timeScale;

  player.x += player.vx;
  player.y += player.vy;

  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
}

/* COLLISION */
function checkCapsules() {
  for (let i = capsules.length - 1; i >= 0; i--) {
    const c = capsules[i];

    if (
      player.x < c.x + c.size &&
      player.x + player.w > c.x &&
      player.y < c.y + c.size &&
      player.y + player.h > c.y
    ) {
      archives++;

      spawnParticles(c.x, c.y);
      memory.push(c.data.title);
      burstTerminal("ARCHIVED >> " + c.data.title);
      log(c.data.desc);

      timeScale = 0.2;

      setTimeout(() => {
        timeScale = 1;
      }, 120);

      capsules.splice(i, 1);
      spawnCapsule();
    }
  }
}

/* DAY SYSTEM */
function updateDay() {
  const elapsed = Date.now() - dayStart;

  if (elapsed > dayDuration) {
    day++;
    sunSize -= 3;
    if (sunSize < 5) sunSize = 5;

    dayDuration -= 5000;
    if (dayDuration < 15000) dayDuration = 15000;

    dayStart = Date.now();

    if (day >= 7) {
      collapseMode = true;
    }

    if (day > maxDays) endGame();
  }
}

/* END GAME */
function endGame() {
  state = "gameover";

  gameoverUI.style.display = "flex";

  let msg = "";
  if (archives >= 40) msg = "Civilization Preserved";
  else if (archives >= 20) msg = "Partial Archive Saved";
  else msg = "Knowledge Lost Forever";

  const finalMemory = synthesizeMemory();
  finalText.textContent = `Archives: ${archives} — ${msg}\n\nMemory State: ${finalMemory}`;
}

/* DRAW WORLD */
function drawSky() {
  if (collapseMode) {
    flicker = Math.random() * 30;
    ctx.fillStyle = `rgb(${255 - flicker}, ${50 - flicker}, ${50 - flicker})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const progress = (Date.now() - dayStart) / dayDuration;

    const r = 255;
    const g = Math.max(30, 180 - progress * 150);
    const b = Math.max(40, 120 - progress * 100);

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sunX = canvas.width * 0.8;
    const sunY = 120 + progress * 300;

    const jitter = collapseMode ? Math.random() * 10 - 5 : 0;

    ctx.beginPath();
    ctx.arc(sunX + jitter, sunY + jitter, sunSize, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
  }
}

function drawMountains() {
  backgroundOffset += 0.2;

  ctx.fillStyle = "#3a2f45";

  for (let i = 0; i < 10; i++) {
    const x = i * 250 - (backgroundOffset % 250);

    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + 120, groundY - 160);
    ctx.lineTo(x + 240, groundY);
    ctx.fill();
  }
}

function drawGround() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
}

function drawPlayerOld() {
  ctx.fillStyle = "#8df";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}
function drawPlayer() {
  const centerX = player.x + player.w / 2;
  const centerY = player.y + player.h / 2;

  // Glow
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 15;

  // Core
  ctx.beginPath();
  ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#00ffff";
  ctx.fill();

  // Inner core
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Orbit ring
  ctx.strokeStyle = "#66ffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

function drawCapsulesOld() {
  capsules.forEach((c) => {
    ctx.fillStyle = "#00ff88";
    ctx.fillRect(c.x, c.y, c.size, c.size);
  });
}

function drawCapsules() {
  capsules.forEach((c) => {
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("💾", c.x + 12, c.y + 12);
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.globalAlpha = p.life / 40;

    ctx.fillRect(p.x, p.y, 3, 3);

    ctx.restore();
  });
}

function updateParticles() {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  particles = particles.filter((p) => p.life > 0);
}
function synthesizeMemory() {
  if (memory.length === 0) {
    return "No memories were preserved.";
  }

  const unique = [...new Set(memory)];

  if (unique.length > 6) {
    return "Civilization formed a complete digital consciousness through preserved knowledge.";
  }

  if (unique.length > 3) {
    return "Fragments of humanity were preserved in an unstable archive network.";
  }

  return "Only scattered memories remain in the collapsing system.";
}

function burstTerminal(msg) {
  terminal.innerHTML += `<span style="color:#fff">${msg}</span><br>`;
  terminal.scrollTop = terminal.scrollHeight;

  terminal.style.boxShadow = "0 0 20px #00ff88";

  setTimeout(() => {
    terminal.style.boxShadow = "none";
  }, 150);
}

/* UI */
function updateUI() {
  dayUI.textContent = "Day " + day;
  archiveUI.textContent = "Archives: " + archives;
}

/* LOOP */
function loop() {
  if (state !== "playing") {
    requestAnimationFrame(loop);
    return;
  }

  updatePlayer();
  checkCapsules();
  updateParticles();
  updateDay();

  drawSky();
  drawMountains();
  drawGround();
  drawCapsules();
  drawPlayer();
  drawParticles();

  updateUI();

  requestAnimationFrame(loop);
}

loop();
