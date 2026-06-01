const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const timeEl = document.querySelector("#time");
const followersEl = document.querySelector("#followers");
const sentEl = document.querySelector("#sent");
const windEl = document.querySelector("#wind");
const toastEl = document.querySelector("#toast");

const W = 1024;
const H = 640;
const keys = new Set();
const rng = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const buildings = [
  { x: 64, y: 78, w: 132, h: 94 },
  { x: 275, y: 52, w: 145, h: 92 },
  { x: 560, y: 68, w: 176, h: 96 },
  { x: 806, y: 74, w: 144, h: 110 },
  { x: 90, y: 382, w: 155, h: 116 },
  { x: 335, y: 414, w: 144, h: 96 },
  { x: 598, y: 388, w: 152, h: 116 },
  { x: 818, y: 396, w: 136, h: 110 },
];

const state = {
  player: { x: 502, y: 310, r: 13, speed: 222 },
  path: [],
  followers: [],
  npcs: [],
  hazards: [],
  smoke: [],
  score: 0,
  sent: 0,
  timeLeft: 60,
  gameOver: false,
  nextNpc: 0.7,
  nextHazard: 1.6,
  windTimer: 0,
  paradeTimer: 14,
  parades: [],
  dashEffects: [],
  convertEffects: [],
  shake: { timer: 0, intensity: 0 },
  toastTimer: 0,
  message: "",
  wind: { x: 1, y: 0, icon: "→" },
  facing: { x: 1, y: 0 },
  dash: { active: false, timer: 0, cooldown: 0, x: 1, y: 0 },
};

const winds = [
  { x: 1, y: 0, icon: "→" },
  { x: -1, y: 0, icon: "←" },
  { x: 0, y: 1, icon: "↓" },
  { x: 0, y: -1, icon: "↑" },
  { x: 0.7, y: 0.7, icon: "↘" },
  { x: -0.7, y: 0.7, icon: "↙" },
  { x: 0.7, y: -0.7, icon: "↗" },
  { x: -0.7, y: -0.7, icon: "↖" },
];

function announce(message) {
  state.message = message;
  state.toastTimer = 1.8;
  toastEl.textContent = message;
  toastEl.classList.add("show");
}

function randomRoadPoint() {
  for (let i = 0; i < 80; i += 1) {
    const p = { x: rng(34, W - 34), y: rng(42, H - 42) };
    if (!collidesBuilding(p.x, p.y, 24)) return p;
  }
  return { x: W / 2, y: H / 2 };
}

function collidesBuilding(x, y, margin = 0) {
  return buildings.some(
    (b) =>
      x > b.x - margin &&
      x < b.x + b.w + margin &&
      y > b.y - margin &&
      y < b.y + b.h + margin,
  );
}

function spawnNpc() {
  const b = buildings[Math.floor(Math.random() * buildings.length)];
  const side = Math.floor(Math.random() * 4);
  const point = [
    { x: b.x + b.w / 2, y: b.y - 18 },
    { x: b.x + b.w + 18, y: b.y + b.h / 2 },
    { x: b.x + b.w / 2, y: b.y + b.h + 18 },
    { x: b.x - 18, y: b.y + b.h / 2 },
  ][side];

  const isSmoker = Math.random() < 0.42;
  state.npcs.push({
    ...point,
    vx: rng(-38, 38),
    vy: rng(-38, 38),
    r: 11,
    kind: isSmoker ? "smoker" : "citizen",
    lightTimer: isSmoker ? 1.2 : 0,
    smoking: false,
    smokeTimer: 0.5,
    life: 16,
  });
}

function spawnHazard() {
  const p = randomRoadPoint();
  state.hazards.push({
    ...p,
    r: Math.random() < 0.42 ? 16 : 8,
    kind: Math.random() < 0.42 ? "bin" : "butt",
    heat: 0,
    smokeTimer: 0,
    fire: false,
  });
}

function emitSmoke(x, y, intensity = 1) {
  state.smoke.push({
    x: x + rng(-5, 5),
    y: y + rng(-5, 5),
    r: rng(12, 20) * intensity,
    alpha: clamp(0.26 * intensity, 0.16, 0.64),
    life: rng(2.2, 3.8) * intensity,
    vx: state.wind.x * rng(18, 44) + rng(-7, 7),
    vy: state.wind.y * rng(18, 44) + rng(-7, 7),
  });
}

function addFollower(x, y) {
  state.followers.push({
    x,
    y,
    r: 10,
    patience: 100,
    joinedAt: performance.now(),
  });
}

function triggerShake(intensity = 8, duration = 0.22) {
  state.shake.intensity = Math.max(state.shake.intensity, intensity);
  state.shake.timer = Math.max(state.shake.timer, duration);
}

function spawnConvertEffect(x, y) {
  state.convertEffects.push({
    x,
    y,
    r: 10,
    life: 0.42,
    maxLife: 0.42,
  });

  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16 + rng(-0.18, 0.18);
    const speed = rng(80, 190);
    state.convertEffects.push({
      x,
      y,
      r: rng(3, 6),
      life: rng(0.32, 0.58),
      maxLife: rng(0.5, 0.65),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      particle: true,
    });
  }
}

function loseFollowers(count, reason) {
  if (state.followers.length === 0) return;
  const lost = Math.min(count, state.followers.length);
  state.followers.splice(-lost, lost);
  announce(`${reason}: ${lost}명이 떠났습니다`);
}

function sendFollowers(parade) {
  const count = state.followers.length;
  if (!count) {
    return;
  }
  const previousDelivered = parade?.delivered ?? 0;
  const multiplier = 1 + previousDelivered * 0.12 + Math.max(0, count - 1) * 0.08;
  const gained = Math.round(count * 45 * multiplier);
  if (parade) {
    parade.members += count;
    parade.delivered = previousDelivered + count;
  }
  state.followers = [];
  state.sent += count;
  state.score += gained;
  announce(`${count}명을 행사 행렬에 합류시켜 ${gained}점을 얻었습니다`);
}

function spawnParade() {
  const horizontal = Math.random() < 0.5;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const lane = horizontal ? rng(110, H - 110) : rng(130, W - 130);
  const start = dir > 0 ? -80 : horizontal ? W + 80 : H + 80;
  const parade = {
    horizontal,
    dir,
    x: horizontal ? start : lane,
    y: horizontal ? lane : start,
    speed: rng(88, 118),
    members: 7 + Math.floor(Math.random() * 4),
    spacing: 24,
    delivered: 0,
  };
  state.parades.push(parade);
  state.paradeTimer = rng(25, 32);
  announce("금연 행사 행렬이 지나갑니다");
}

function updatePlayer(dt) {
  if (state.gameOver) return;
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  if (dx !== 0 || dy !== 0) {
    state.facing.x = dx / len;
    state.facing.y = dy / len;
  }

  state.dash.cooldown = Math.max(0, state.dash.cooldown - dt);
  state.dash.timer = Math.max(0, state.dash.timer - dt);
  if (state.dash.timer <= 0) state.dash.active = false;

  const dashSpeed = state.dash.active ? 560 : 0;
  const moveX = (dx / len) * state.player.speed + state.dash.x * dashSpeed;
  const moveY = (dy / len) * state.player.speed + state.dash.y * dashSpeed;
  const nx = state.player.x + moveX * dt;
  const ny = state.player.y + moveY * dt;
  if (!collidesBuilding(nx, state.player.y, state.player.r + 3)) state.player.x = clamp(nx, 18, W - 18);
  if (!collidesBuilding(state.player.x, ny, state.player.r + 3)) state.player.y = clamp(ny, 18, H - 18);

  state.path.unshift({ x: state.player.x, y: state.player.y, t: performance.now() / 1000 });
  state.path = state.path.filter((p) => performance.now() / 1000 - p.t < 18);
}

function startDash() {
  if (state.gameOver || state.dash.cooldown > 0) return;
  state.dash.active = true;
  state.dash.timer = 0.16;
  state.dash.cooldown = 0.72;
  state.dash.x = state.facing.x;
  state.dash.y = state.facing.y;
  spawnDashEffect();
}

function spawnDashEffect() {
  const p = state.player;
  const fx = state.facing.x;
  const fy = state.facing.y;
  for (let i = 0; i < 7; i += 1) {
    const life = 0.44 - i * 0.024;
    state.dashEffects.push({
      x: p.x - fx * i * 10,
      y: p.y - fy * i * 10,
      r: 12 + i * 3,
      life,
      maxLife: life,
      vx: -fx * rng(42, 92) + rng(-14, 14),
      vy: -fy * rng(42, 92) + rng(-14, 14),
    });
  }
}

function updateFollowers(dt) {
  const now = performance.now() / 1000;
  for (let i = state.followers.length - 1; i >= 0; i -= 1) {
    const follower = state.followers[i];
    const targetDelay = 0.1 * (i + 1);
    const targetDistance = 25 * (i + 1);
    const target = findFollowerTarget(now, targetDelay, targetDistance);
    if (target) {
      follower.x += (target.x - follower.x) * clamp(dt * 11, 0, 1);
      follower.y += (target.y - follower.y) * clamp(dt * 11, 0, 1);
    }

    let smokePressure = 0;
    for (const puff of state.smoke) {
      if (dist(follower, puff) < puff.r + follower.r) smokePressure += puff.alpha;
    }
    if (smokePressure > 0) {
      const distanceTax = clamp(dist(follower, state.player) / 185, 0.7, 2.4);
      follower.patience -= smokePressure * distanceTax * 20 * dt;
    } else {
      follower.patience = Math.min(100, follower.patience + 5 * dt);
    }
    if (follower.patience <= 0) {
      state.followers.splice(i, 1);
      announce("연기 때문에 동행자가 인내심을 잃었습니다");
    }
  }
}

function findFollowerTarget(now, minDelay, targetDistance) {
  if (state.path.length === 0) return null;
  let traveled = 0;
  for (let i = 1; i < state.path.length; i += 1) {
    const recent = state.path[i - 1];
    const older = state.path[i];
    traveled += Math.hypot(recent.x - older.x, recent.y - older.y);
    if (now - older.t >= minDelay && traveled >= targetDistance) return older;
  }
  return state.path[state.path.length - 1];
}

function updateNpcs(dt) {
  for (let i = state.npcs.length - 1; i >= 0; i -= 1) {
    const npc = state.npcs[i];
    npc.life -= dt;
    npc.x += npc.vx * dt;
    npc.y += npc.vy * dt;
    if (npc.x < 18 || npc.x > W - 18) npc.vx *= -1;
    if (npc.y < 18 || npc.y > H - 18) npc.vy *= -1;
    if (collidesBuilding(npc.x, npc.y, npc.r)) {
      npc.vx *= -1;
      npc.vy *= -1;
      npc.x += npc.vx * dt * 2;
      npc.y += npc.vy * dt * 2;
    }

    if (npc.kind === "smoker") {
      npc.lightTimer -= dt;
      if (npc.lightTimer <= 0) npc.smoking = true;
      if (npc.smoking) {
        npc.smokeTimer -= dt;
        if (npc.smokeTimer <= 0) {
          emitSmoke(npc.x, npc.y, 0.9);
          npc.smokeTimer = 0.45;
        }
      }
    }

    if (dist(npc, state.player) < npc.r + state.player.r + 5) {
      if (npc.kind === "smoker") {
        addFollower(npc.x, npc.y);
        spawnConvertEffect(npc.x, npc.y);
        triggerShake(9, 0.24);
        state.score += 100;
        announce("흡연충이 개과천선했습니다");
      } else {
        loseFollowers(2 + Math.floor(Math.random() * 2), "시민과 충돌");
      }
      state.npcs.splice(i, 1);
    } else if (npc.life <= 0) {
      state.npcs.splice(i, 1);
    }
  }
}

function updateHazards(dt) {
  for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
    const h = state.hazards[i];
    h.heat += dt * (h.kind === "bin" ? 9 : 13);
    h.smokeTimer -= dt;
    if (h.smokeTimer <= 0) {
      emitSmoke(h.x, h.y, h.fire ? 2.2 : 0.75);
      h.smokeTimer = h.fire ? 0.12 : 0.68;
    }
    if (!h.fire && h.heat > 100) {
      h.fire = true;
      announce("담배꽁초가 화재로 번졌습니다");
    }
    if (dist(h, state.player) < h.r + state.player.r + 8) {
      state.score += h.fire ? 65 : 35;
      state.hazards.splice(i, 1);
      announce(h.kind === "bin" ? "쓰레기통 연기를 처리했습니다" : "담배꽁초를 치웠습니다");
    }
  }
}

function updateSmoke(dt) {
  for (let i = state.smoke.length - 1; i >= 0; i -= 1) {
    const s = state.smoke[i];
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.r += 7 * dt;
    s.alpha *= 1 - 0.18 * dt;
    if (s.life <= 0 || s.alpha < 0.025) state.smoke.splice(i, 1);
  }
}

function updateDashEffects(dt) {
  for (let i = state.dashEffects.length - 1; i >= 0; i -= 1) {
    const effect = state.dashEffects[i];
    effect.life -= dt;
    effect.x += effect.vx * dt;
    effect.y += effect.vy * dt;
    effect.r += 38 * dt;
    if (effect.life <= 0) state.dashEffects.splice(i, 1);
  }
}

function updateConvertEffects(dt) {
  state.shake.timer = Math.max(0, state.shake.timer - dt);
  if (state.shake.timer <= 0) state.shake.intensity = 0;

  for (let i = state.convertEffects.length - 1; i >= 0; i -= 1) {
    const effect = state.convertEffects[i];
    effect.life -= dt;
    if (effect.particle) {
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vx *= 1 - 3.2 * dt;
      effect.vy *= 1 - 3.2 * dt;
      effect.vy += 50 * dt;
    } else {
      effect.r += 150 * dt;
    }
    if (effect.life <= 0) state.convertEffects.splice(i, 1);
  }
}

function updateWorld(dt) {
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (!state.gameOver && state.timeLeft <= 0) {
    state.gameOver = true;
    announce(`시간 종료! 최종 점수 ${state.score}점`);
  }
  if (state.gameOver) return;

  state.nextNpc -= dt;
  state.nextHazard -= dt;
  state.windTimer -= dt;
  state.paradeTimer -= dt;
  state.toastTimer -= dt;

  if (state.nextNpc <= 0) {
    spawnNpc();
    state.nextNpc = rng(1.0, 2.2);
  }
  if (state.nextHazard <= 0) {
    spawnHazard();
    state.nextHazard = rng(3.0, 5.4);
  }
  if (state.windTimer <= 0) {
    state.wind = winds[Math.floor(Math.random() * winds.length)];
    state.windTimer = rng(6, 10);
  }
  if (state.paradeTimer <= 0) spawnParade();
  if (state.toastTimer <= 0) toastEl.classList.remove("show");
}

function updateParades(dt) {
  for (let i = state.parades.length - 1; i >= 0; i -= 1) {
    const parade = state.parades[i];
    const movement = parade.dir * parade.speed * dt;
    if (parade.horizontal) parade.x += movement;
    else parade.y += movement;

    if (paradeTouchesConverted(parade)) sendFollowers(parade);

    const lead = parade.horizontal ? parade.x : parade.y;
    const tailOffset = parade.members * parade.spacing + 120;
    if ((parade.dir > 0 && lead > (parade.horizontal ? W : H) + tailOffset) || (parade.dir < 0 && lead < -tailOffset)) {
      state.parades.splice(i, 1);
    }
  }
}

function paradeTouchesConverted(parade) {
  if (state.followers.length === 0) return false;
  const points = paradePoints(parade);
  const candidates = [state.player, ...state.followers];
  return points.some((p) => candidates.some((c) => Math.hypot(p.x - c.x, p.y - c.y) < 24));
}

function paradePoints(parade) {
  const points = [];
  for (let i = 0; i < parade.members; i += 1) {
    const offset = i * parade.spacing * -parade.dir;
    points.push({
      x: parade.x + (parade.horizontal ? offset : 0),
      y: parade.y + (parade.horizontal ? 0 : offset),
    });
  }
  return points;
}

function drawRoads() {
  ctx.fillStyle = "#2f3b35";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#44474d";
  for (let y = 214; y <= 338; y += 62) ctx.fillRect(0, y, W, 35);
  for (let x = 224; x <= 778; x += 178) ctx.fillRect(x, 0, 35, H);
  ctx.strokeStyle = "rgba(247,239,220,0.16)";
  ctx.setLineDash([18, 18]);
  ctx.lineWidth = 2;
  for (let y = 231; y <= 355; y += 62) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 241; x <= 795; x += 178) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawBuildings() {
  for (const b of buildings) {
    ctx.fillStyle = "#27272f";
    ctx.strokeStyle = "#51535b";
    ctx.lineWidth = 2;
    roundRect(b.x, b.y, b.w, b.h, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#6e7d8c";
    for (let wx = b.x + 18; wx < b.x + b.w - 10; wx += 34) {
      for (let wy = b.y + 18; wy < b.y + b.h - 12; wy += 28) {
        ctx.fillRect(wx, wy, 15, 10);
      }
    }
  }
}

function drawHazards() {
  for (const h of state.hazards) {
    if (h.kind === "bin") {
      ctx.fillStyle = h.fire ? "#d94837" : "#4e6974";
      ctx.fillRect(h.x - 12, h.y - 13, 24, 28);
      ctx.fillStyle = "#8fa9b4";
      ctx.fillRect(h.x - 15, h.y - 17, 30, 5);
    } else {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(-0.5);
      ctx.fillStyle = "#e6d8b6";
      ctx.fillRect(-10, -3, 16, 6);
      ctx.fillStyle = h.fire ? "#ff593d" : "#e38d43";
      ctx.fillRect(5, -3, 7, 6);
      ctx.restore();
    }
    if (h.fire) drawFlame(h.x, h.y - 16, 1);
  }
}

function drawSmoke() {
  for (const s of state.smoke) {
    const gradient = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, s.r);
    gradient.addColorStop(0, `rgba(218, 225, 229, ${s.alpha})`);
    gradient.addColorStop(1, "rgba(104, 113, 122, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNpcs() {
  for (const npc of state.npcs) {
    ctx.fillStyle = npc.kind === "smoker" ? "#ff6b5e" : "#f3d06f";
    circle(npc.x, npc.y, npc.r);
    ctx.fillStyle = "#111820";
    circle(npc.x - 3, npc.y - 3, 1.5);
    circle(npc.x + 4, npc.y - 3, 1.5);
    if (npc.kind === "smoker") {
      ctx.strokeStyle = npc.smoking ? "#f2eee5" : "#ffb547";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(npc.x + 8, npc.y + 2);
      ctx.lineTo(npc.x + 18, npc.y + 5);
      ctx.stroke();
      if (!npc.smoking) {
        ctx.fillStyle = "#ffca4f";
        ctx.font = "700 12px sans-serif";
        ctx.fillText("칙칙", npc.x - 13, npc.y - 16);
      }
    }
  }
}

function drawFollowers() {
  for (let i = state.followers.length - 1; i >= 0; i -= 1) {
    const f = state.followers[i];
    const hue = f.patience > 55 ? "#69d18f" : f.patience > 25 ? "#f4b84e" : "#ff6b5e";
    ctx.fillStyle = hue;
    circle(f.x, f.y, f.r);
    ctx.fillStyle = "rgba(8,12,16,0.42)";
    ctx.fillRect(f.x - 9, f.y + 13, 18 * (f.patience / 100), 3);
  }
}

function drawDashEffects() {
  for (const effect of state.dashEffects) {
    const alpha = clamp(effect.life / effect.maxLife, 0, 1);
    ctx.strokeStyle = `rgba(103, 183, 255, ${0.5 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(211, 240, 255, ${0.18 * alpha})`;
    circle(effect.x, effect.y, effect.r * 0.42);
  }
}

function drawConvertEffects() {
  for (const effect of state.convertEffects) {
    const alpha = clamp(effect.life / effect.maxLife, 0, 1);
    if (effect.particle) {
      ctx.fillStyle = `rgba(105, 209, 143, ${alpha})`;
      circle(effect.x, effect.y, effect.r);
      ctx.fillStyle = `rgba(255, 235, 137, ${0.8 * alpha})`;
      circle(effect.x, effect.y, effect.r * 0.45);
    } else {
      ctx.strokeStyle = `rgba(105, 209, 143, ${0.7 * alpha})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.38 * alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function applyScreenShake() {
  if (state.shake.timer <= 0) return;
  const fade = state.shake.timer / 0.24;
  const power = state.shake.intensity * fade;
  ctx.translate(rng(-power, power), rng(-power, power));
}

function drawParades() {
  for (const parade of state.parades) {
    const points = paradePoints(parade);
    if (points.length > 1) {
      ctx.strokeStyle = "rgba(196, 184, 255, 0.55)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    for (const p of points) {
      ctx.fillStyle = "#9f8cff";
      circle(p.x, p.y, 11);
      ctx.fillStyle = "#f7f4ff";
      ctx.fillRect(p.x - 5, p.y - 17, 10, 6);
    }

    const head = points[0];
    if (head) {
      ctx.fillStyle = "rgba(16, 12, 28, 0.76)";
      roundRect(head.x - 42, head.y - 46, 84, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("금연 행사", head.x, head.y - 30);
    }
  }
}

function drawPlayer() {
  const p = state.player;
  if (state.dash.active) {
    const gradient = ctx.createLinearGradient(
      p.x - state.dash.x * 78,
      p.y - state.dash.y * 78,
      p.x,
      p.y,
    );
    gradient.addColorStop(0, "rgba(103, 183, 255, 0)");
    gradient.addColorStop(1, "rgba(211, 240, 255, 0.42)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x - state.dash.x * 78, p.y - state.dash.y * 78);
    ctx.lineTo(p.x - state.dash.x * 12, p.y - state.dash.y * 12);
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  ctx.fillStyle = "#67b7ff";
  circle(p.x, p.y, p.r);
  ctx.fillStyle = "#eaf6ff";
  circle(p.x - 4, p.y - 3, 2);
  circle(p.x + 5, p.y - 3, 2);
  ctx.strokeStyle = "#d3f0ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 2, 6, 0.1, Math.PI - 0.1);
  ctx.stroke();

}

function drawWind() {
  ctx.fillStyle = "rgba(9,14,19,0.58)";
  roundRect(W - 132, 18, 104, 42, 8);
  ctx.fill();
  ctx.fillStyle = "#dfe8f2";
  ctx.font = "700 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`바람 ${state.wind.icon}`, W - 80, 46);
}

function drawGameOver() {
  if (!state.gameOver) return;
  ctx.fillStyle = "rgba(9, 13, 18, 0.62)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "800 50px sans-serif";
  ctx.fillText("시간 종료", W / 2, H / 2 - 22);
  ctx.font = "700 25px sans-serif";
  ctx.fillText(`최종 점수 ${state.score}점`, W / 2, H / 2 + 24);
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  applyScreenShake();
  drawRoads();
  drawBuildings();
  drawHazards();
  drawSmoke();
  drawNpcs();
  drawFollowers();
  drawDashEffects();
  drawConvertEffects();
  drawParades();
  drawPlayer();
  drawWind();
  drawGameOver();
  ctx.restore();
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFlame(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ff6b35";
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(15, -4, 6, 12);
  ctx.quadraticCurveTo(0, 21, -8, 12);
  ctx.quadraticCurveTo(-17, -4, 0, -18);
  ctx.fill();
  ctx.fillStyle = "#ffd66b";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(8, 0, 3, 9);
  ctx.quadraticCurveTo(0, 13, -4, 9);
  ctx.quadraticCurveTo(-9, 0, 0, -10);
  ctx.fill();
  ctx.restore();
}

function syncHud() {
  scoreEl.textContent = state.score;
  timeEl.textContent = Math.ceil(state.timeLeft);
  followersEl.textContent = state.followers.length;
  sentEl.textContent = state.sent;
  windEl.textContent = state.wind.icon;
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  updatePlayer(dt);
  updateDashEffects(dt);
  updateConvertEffects(dt);
  if (!state.gameOver) {
    updateFollowers(dt);
    updateNpcs(dt);
    updateHazards(dt);
    updateSmoke(dt);
    updateParades(dt);
  }
  updateWorld(dt);
  syncHud();
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "space", "spacebar"].includes(key)) {
    event.preventDefault();
    if (key === " " || key === "space" || key === "spacebar") startDash();
    else keys.add(key);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

for (let i = 0; i < 4; i += 1) spawnHazard();
requestAnimationFrame(tick);
