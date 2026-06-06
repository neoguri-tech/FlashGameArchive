const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.querySelector("#scoreValue");
const comboValue = document.querySelector("#comboValue");
const maxComboValue = document.querySelector("#maxComboValue");
const wallValue = document.querySelector("#wallValue");
const timeValue = document.querySelector("#timeValue");
const bestValue = document.querySelector("#bestValue");
const messageText = document.querySelector("#messageText");
const startPanel = document.querySelector("#startPanel");
const gameOverPanel = document.querySelector("#gameOverPanel");
const resultScore = document.querySelector("#resultScore");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const padButtons = Array.from(document.querySelectorAll(".pad button"));
const backgroundButtons = Array.from(document.querySelectorAll(".background-option"));
const backgroundPreview = document.querySelector("#backgroundPreview");
const backgroundName = document.querySelector("#backgroundName");

const W = 960;
const H = 640;
const CHORD_MS = 82;
const CUT_EFFECT_SECONDS = 0.48;
const COMBO_POP_SECONDS = 0.86;
const PLAYER_SLASH_SECONDS = 0.34;
const STORAGE_KEY = "infinite-slasher-best";
const LEGACY_STORAGE_KEY = "blade-rift-best";
const BACKGROUND_STORAGE_KEY = "infinite-slasher-background";
const SOUND_ENABLED = true;
const GUIDE = {
  glow: "#ff2f92",
  core: "#fff1fb",
  deep: "rgba(44, 5, 31, 0.78)",
  arrow: "#ff2f92",
};
let audioContext = null;
const soundCache = new Map();
const SOUND_DEBUG = new URLSearchParams(window.location.search).has("debugSound");
const soundDebug = {
  accepted: 0,
  expectedSlashes: 0,
  slashCalls: 0,
  samples: [],
};
if (SOUND_DEBUG) window.infiniteSlasherSoundDebug = soundDebug;

function syncSoundDebug() {
  if (!SOUND_DEBUG) return;
  document.documentElement.dataset.infiniteSlasherSoundDebug = JSON.stringify(soundDebug);
}

const BACKGROUND_OPTIONS = [
  { id: "trial", label: "검의 시험장", src: "assets/backgrounds/trial-chamber.png" },
  { id: "arena", label: "지하 검투장", src: "assets/backgrounds/dueling-arena.png" },
  { id: "hall", label: "석벽 수련장", src: "assets/backgrounds/training-hall.png" },
  { id: "temple", label: "절벽 사원", src: "assets/backgrounds/cliff-temple.png" },
];
const DEFAULT_BACKGROUND_ID = "trial";

const ASSETS = {
  wall: loadSprite("assets/stone-wall.png"),
  swordsman: loadSprite("assets/swordsman.png"),
  swordsmanBack: loadSprite("assets/swordsman-back.png"),
  backgrounds: Object.fromEntries(BACKGROUND_OPTIONS.map((option) => [option.id, loadSprite(option.src)])),
  swing: {
    r: loadOptionalSprite("assets/swing-r.png"),
    l: loadOptionalSprite("assets/swing-l.png"),
    u: loadOptionalSprite("assets/swing-u.png"),
    d: loadOptionalSprite("assets/swing-d.png"),
    ur: loadOptionalSprite("assets/swing-ur.png"),
    ul: loadOptionalSprite("assets/swing-ul.png"),
    dr: loadOptionalSprite("assets/swing-dr.png"),
    dl: loadOptionalSprite("assets/swing-dl.png"),
  },
};

const SFX = {
  whoosh: [loadSound("assets/sounds/clean-fast-swoosh-danjocross.mp3")],
  crack: [loadSound("assets/sounds/stone-crack-1.ogg"), loadSound("assets/sounds/stone-crack-2.ogg")],
  impact: [loadSound("assets/sounds/stone-impact.ogg")],
  chip: [loadSound("assets/sounds/stone-chip.ogg")],
  destroy: [loadSound("assets/sounds/rock-destroy-bertsz.mp3")],
};

const DIRS = {
  L: { label: "←", x: -1, y: 0 },
  R: { label: "→", x: 1, y: 0 },
  U: { label: "↑", x: 0, y: -1 },
  D: { label: "↓", x: 0, y: 1 },
  UL: { label: "↖", x: -1, y: -1 },
  UR: { label: "↗", x: 1, y: -1 },
  DL: { label: "↙", x: -1, y: 1 },
  DR: { label: "↘", x: 1, y: 1 },
};

const KEY_TO_AXIS = {
  arrowleft: "L",
  a: "L",
  arrowright: "R",
  d: "R",
  arrowup: "U",
  w: "U",
  arrowdown: "D",
  s: "D",
};

function loadSprite(src) {
  const image = new Image();
  const sprite = { image, ready: false, failed: false };
  image.onload = () => {
    sprite.ready = true;
  };
  image.onerror = () => {
    sprite.failed = true;
  };
  image.src = src;
  return sprite;
}

function loadOptionalSprite(src) {
  const image = new Image();
  const sprite = { image, ready: false, failed: false };
  fetch(src, { method: "HEAD" })
    .then((response) => {
      if (!response.ok) {
        sprite.failed = true;
        return;
      }
      image.onload = () => {
        sprite.ready = true;
      };
      image.onerror = () => {
        sprite.failed = true;
      };
      image.src = src;
    })
    .catch(() => {
      sprite.failed = true;
    });
  return sprite;
}

function loadSound(src) {
  if (soundCache.has(src)) return soundCache.get(src);
  const audio = new Audio(src);
  const sound = {
    src,
    audio,
    ready: false,
    failed: false,
    bytesPromise: null,
    buffer: null,
    bufferPromise: null,
    bufferFailed: false,
  };
  audio.preload = "auto";
  audio.addEventListener("canplaythrough", () => {
    sound.ready = true;
  }, { once: true });
  audio.addEventListener("error", () => {
    sound.failed = true;
  });
  soundCache.set(src, sound);
  fetchSoundBytes(sound);
  return sound;
}

function fetchSoundBytes(sound) {
  if (sound.bytesPromise || sound.failed) return sound.bytesPromise;
  sound.bytesPromise = fetch(sound.src)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${sound.src}`);
      return response.arrayBuffer();
    })
    .catch(() => {
      sound.bufferFailed = true;
      return null;
    });
  return sound.bytesPromise;
}

function ensureAudioContext() {
  if (!SOUND_ENABLED) return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) audioContext = new AudioContextCtor();
  return audioContext;
}

function resumeAudioContext() {
  const context = ensureAudioContext();
  if (context?.state === "suspended") context.resume().catch(() => {});
  return context;
}

function loadAudioBuffer(sound) {
  if (sound.buffer || sound.bufferPromise || sound.bufferFailed) return sound.bufferPromise;
  const context = ensureAudioContext();
  if (!context) return null;

  sound.bufferPromise = fetchSoundBytes(sound)
    .then((bytes) => {
      if (!bytes) return null;
      return context.decodeAudioData(bytes.slice(0));
    })
    .then((buffer) => {
      sound.buffer = buffer;
      sound.ready = true;
      return buffer;
    })
    .catch(() => {
      sound.bufferFailed = true;
      return null;
    });
  return sound.bufferPromise;
}

function primeAudio() {
  const context = resumeAudioContext();
  if (!context) return;
  for (const sounds of Object.values(SFX)) {
    for (const sound of sounds) loadAudioBuffer(sound);
  }
}

function playHtmlSample(sound, volume, delay, rate, offset, duration) {
  const play = () => {
    const audio = sound.audio.cloneNode();
    audio.volume = volume;
    audio.playbackRate = rate;
    if (offset > 0) {
      audio.addEventListener("loadedmetadata", () => {
        try {
          audio.currentTime = offset;
        } catch {}
      }, { once: true });
      try {
        audio.currentTime = offset;
      } catch {}
    }
    const playPromise = audio.play();
    if (playPromise) playPromise.catch(() => {});
    if (duration) {
      window.setTimeout(() => {
        audio.pause();
      }, (duration / rate) * 1000);
    }
  };

  if (delay > 0) {
    window.setTimeout(play, delay * 1000);
  } else {
    play();
  }
}

function playSample(samples, volume = 0.55, delay = 0, rate = 1, label = "", offset = 0, duration = null) {
  if (!SOUND_ENABLED || samples.length === 0) return;
  const sound = samples[Math.floor(Math.random() * samples.length)];
  if (!sound || sound.failed) return;
  const context = resumeAudioContext();
  const gainValue = clamp(volume, 0, 1);
  const rateValue = clamp(rate, 0.65, 1.35);
  const offsetValue = Math.max(0, offset);
  const durationValue = duration ? Math.max(0.02, duration) : null;
  if (SOUND_DEBUG) {
    soundDebug.samples.push({
      label,
      src: sound.src,
      delayed: delay,
      buffered: Boolean(sound.buffer),
      contextState: context?.state || "none",
      offset: offsetValue,
      duration: durationValue,
      time: performance.now(),
    });
    syncSoundDebug();
  }

  if (context?.state === "running" && sound.buffer) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = sound.buffer;
    source.playbackRate.value = rateValue;
    const startAt = context.currentTime + Math.max(0, delay);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(gainValue, startAt + 0.004);
    if (durationValue) {
      const fadeAt = startAt + Math.max(0.018, durationValue - 0.022);
      gain.gain.setValueAtTime(gainValue, fadeAt);
      gain.gain.linearRampToValueAtTime(0, startAt + durationValue);
    }
    source.connect(gain);
    gain.connect(context.destination);
    source.start(startAt, Math.min(offsetValue, Math.max(0, sound.buffer.duration - 0.01)));
    if (durationValue) source.stop(startAt + durationValue + 0.01);
    return;
  }

  loadAudioBuffer(sound);
  playHtmlSample(sound, gainValue, delay, rateValue, offsetValue, durationValue);
}

function playStartSound() {
  playSample(SFX.impact, 0.2, 0, 0.86, "start-impact");
}

function playFocusSound() {
  if (SOUND_DEBUG) {
    soundDebug.samples.push({
      label: "focus-muted",
      src: "",
      delayed: 0,
      buffered: true,
      contextState: "muted",
      offset: 0,
      duration: 0,
      time: performance.now(),
    });
    syncSoundDebug();
  }
}

function playSlashSound(isFinalSlash = false) {
  if (SOUND_DEBUG) {
    soundDebug.slashCalls += 1;
    syncSoundDebug();
  }
  playSample(SFX.whoosh, 1, 0, 1, "slash-whoosh", 0.22, 0.33);
}

function playWallBreakSound(combo, delay = 0) {
  const force = 1 + Math.min(combo, 12) * 0.025;
  playSample(SFX.impact, 0.42 * force, delay, rand(0.82, 0.98), "break-impact");
  playSample(SFX.destroy, 0.5 * force, delay + 0.015, rand(0.95, 1.03), "break-destroy");
  playSample(SFX.crack, 0.24 * force, delay + 0.09, rand(0.74, 0.9), "break-crack");
  playSample(SFX.chip, 0.16, delay + 0.17, rand(0.94, 1.12), "break-chip");
}

function playMissSound() {
  playSample(SFX.impact, 0.32, 0, rand(0.7, 0.84), "miss-impact");
  playSample(SFX.chip, 0.18, 0.025, rand(0.84, 1), "miss-chip");
}

function playGameOverSound() {
  playSample(SFX.impact, 0.82, 0, 0.72, "gameover-impact");
  playSample(SFX.crack, 0.7, 0.08, 0.72, "gameover-crack");
  playSample(SFX.crack, 0.46, 0.2, 0.62, "gameover-crack");
}

const POINTS = {
  L: { x: -220, y: 0 },
  R: { x: 220, y: 0 },
  U: { x: 0, y: -138 },
  D: { x: 0, y: 138 },
  UL: { x: -174, y: -116 },
  UR: { x: 174, y: -116 },
  DL: { x: -174, y: 116 },
  DR: { x: 174, y: 116 },
};

const PATTERNS = [
  { id: "h-lr", min: 0, sequence: ["L", "R"], edges: [["L", "R"]] },
  { id: "h-rl", min: 0, sequence: ["R", "L"], edges: [["R", "L"]] },
  { id: "v-ud", min: 1, sequence: ["U", "D"], edges: [["U", "D"]] },
  { id: "v-du", min: 2, sequence: ["D", "U"], edges: [["D", "U"]] },
  { id: "diag-lu", min: 3, sequence: ["L", "U"], edges: [["L", "U"]] },
  { id: "diag-ul", min: 3, sequence: ["U", "L"], edges: [["U", "L"]] },
  { id: "diag-ur", min: 3, sequence: ["U", "R"], edges: [["U", "R"]] },
  { id: "diag-ru", min: 3, sequence: ["R", "U"], edges: [["R", "U"]] },
  { id: "diag-rd", min: 3, sequence: ["R", "D"], edges: [["R", "D"]] },
  { id: "diag-dr", min: 3, sequence: ["D", "R"], edges: [["D", "R"]] },
  { id: "diag-dl", min: 3, sequence: ["D", "L"], edges: [["D", "L"]] },
  { id: "diag-ld", min: 3, sequence: ["L", "D"], edges: [["L", "D"]] },
  { id: "corner-lur", min: 4, sequence: ["L", "U", "R"], edges: [["L", "U"], ["U", "R"]] },
  { id: "corner-urd", min: 5, sequence: ["U", "R", "D"], edges: [["U", "R"], ["R", "D"]] },
  { id: "corner-rdl", min: 6, sequence: ["R", "D", "L"], edges: [["R", "D"], ["D", "L"]] },
  { id: "corner-dlu", min: 7, sequence: ["D", "L", "U"], edges: [["D", "L"], ["L", "U"]] },
  { id: "diamond-three-lurd", min: 8, sequence: ["L", "U", "R", "D"], edges: [["L", "U"], ["U", "R"], ["R", "D"]] },
  { id: "diamond-three-ldru", min: 9, sequence: ["L", "D", "R", "U"], edges: [["L", "D"], ["D", "R"], ["R", "U"]] },
  { id: "diamond-cw-left", min: 10, sequence: ["L", "U", "R", "D", "L"], edges: [["L", "U"], ["U", "R"], ["R", "D"], ["D", "L"]] },
  { id: "diamond-ccw-left", min: 11, sequence: ["L", "D", "R", "U", "L"], edges: [["L", "D"], ["D", "R"], ["R", "U"], ["U", "L"]] },
  { id: "zigzag-ludr", min: 12, sequence: ["L", "U", "D", "R"], edges: [["L", "U"], ["U", "D"], ["D", "R"]] },
  { id: "zigzag-rdul", min: 13, sequence: ["R", "D", "U", "L"], edges: [["R", "D"], ["D", "U"], ["U", "L"]] },
  { id: "diamond-cw-top", min: 15, sequence: ["U", "R", "D", "L", "U"], edges: [["U", "R"], ["R", "D"], ["D", "L"], ["L", "U"]] },
  { id: "diamond-ccw-top", min: 17, sequence: ["U", "L", "D", "R", "U"], edges: [["U", "L"], ["L", "D"], ["D", "R"], ["R", "U"]] },
  { id: "four-ulrd", min: 19, sequence: ["U", "L", "R", "D"], edges: [["U", "L"], ["L", "R"], ["R", "D"]] },
  { id: "four-drlu", min: 20, sequence: ["D", "R", "L", "U"], edges: [["D", "R"], ["R", "L"], ["L", "U"]] },
  { id: "four-urld", min: 21, sequence: ["U", "R", "L", "D"], edges: [["U", "R"], ["R", "L"], ["L", "D"]] },
  { id: "four-dlru", min: 22, sequence: ["D", "L", "R", "U"], edges: [["D", "L"], ["L", "R"], ["R", "U"]] },
];

const OPENING_PATTERN_IDS = [
  "h-lr",
  "diag-lu",
  "v-ud",
  "diag-ur",
  "h-rl",
  "diag-rd",
  "v-du",
  "diag-dl",
  "corner-lur",
  "corner-urd",
  "diamond-three-lurd",
];

const state = {
  phase: "ready",
  score: 0,
  combo: 0,
  maxCombo: 0,
  wallsCut: 0,
  elapsedTime: 0,
  best: readBestScore(),
  backgroundId: getInitialBackgroundId(),
  current: null,
  queue: [],
  generatedWalls: 0,
  sliced: [],
  sparks: [],
  cuts: [],
  comboPops: [],
  missBursts: [],
  playerSlash: null,
  activeKeys: new Set(),
  lastAxisDown: {},
  pendingAxis: null,
  messageTimer: 0,
  shake: 0,
  lastInput: null,
};

function getBackgroundOption(id) {
  return BACKGROUND_OPTIONS.find((option) => option.id === id) || BACKGROUND_OPTIONS[0];
}

function getInitialBackgroundId() {
  const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
  return BACKGROUND_OPTIONS.some((option) => option.id === stored) ? stored : DEFAULT_BACKGROUND_ID;
}

function readBestScore() {
  const currentBest = Number(localStorage.getItem(STORAGE_KEY) || 0);
  const legacyBest = Number(localStorage.getItem(LEGACY_STORAGE_KEY) || 0);
  const best = Math.max(currentBest, legacyBest);
  if (best > currentBest) localStorage.setItem(STORAGE_KEY, String(best));
  return best;
}

function setBackground(id) {
  if (!BACKGROUND_OPTIONS.some((option) => option.id === id)) return;
  state.backgroundId = id;
  localStorage.setItem(BACKGROUND_STORAGE_KEY, id);
  syncBackgroundPicker();
}

function syncBackgroundPicker() {
  const selected = getBackgroundOption(state.backgroundId);
  if (backgroundPreview) backgroundPreview.src = selected.src;
  if (backgroundName) backgroundName.textContent = selected.label;
  for (const button of backgroundButtons) {
    const active = button.dataset.bg === selected.id;
    button.setAttribute("aria-pressed", String(active));
  }
}

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function pickPattern(generatedIndex) {
  const openingId = OPENING_PATTERN_IDS[generatedIndex];
  if (openingId) return PATTERNS.find((pattern) => pattern.id === openingId);

  const available = PATTERNS.filter((pattern) => pattern.min <= state.wallsCut);
  const pool = available.length > 0 ? available : PATTERNS.slice(0, 2);
  return pool[Math.floor(Math.random() * pool.length)];
}

function createWall() {
  const pattern = pickPattern(state.generatedWalls);
  state.generatedWalls += 1;
  const sequence = pattern.sequence.slice();
  const difficulty = Math.min(1.6, state.wallsCut * 0.025);
  const maxTime = Math.max(1.55, 3.1 + (sequence.length - 2) * 0.72 - difficulty);
  return {
    id: `${pattern.id}-${Date.now()}-${Math.random()}`,
    pattern,
    sequence,
    progress: 0,
    maxTime,
    timeLeft: maxTime,
    cracks: 0,
    age: 0,
  };
}

function resetGame() {
  if (SOUND_DEBUG) {
    soundDebug.accepted = 0;
    soundDebug.expectedSlashes = 0;
    soundDebug.slashCalls = 0;
    soundDebug.samples = [];
    syncSoundDebug();
  }
  primeAudio();
  playStartSound();
  state.phase = "playing";
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.wallsCut = 0;
  state.elapsedTime = 0;
  state.queue = [];
  state.generatedWalls = 0;
  state.sliced = [];
  state.sparks = [];
  state.cuts = [];
  state.comboPops = [];
  state.missBursts = [];
  state.playerSlash = null;
  state.pendingAxis = null;
  state.lastInput = null;
  state.shake = 0;
  for (let i = 0; i < 5; i += 1) state.queue.push(createWall());
  state.current = state.queue.shift();
  state.queue.push(createWall());
  startPanel.hidden = true;
  gameOverPanel.hidden = true;
  setMessage("첫 틈이 열렸습니다");
  syncHud();
}

function endGame() {
  if (state.phase !== "playing") return;
  playGameOverSound();
  state.phase = "over";
  state.combo = 0;
  state.pendingAxis = null;
  state.best = Math.max(state.best, state.score);
  localStorage.setItem(STORAGE_KEY, String(state.best));
  resultScore.textContent = `${state.score}점`;
  gameOverPanel.hidden = false;
  setMessage("벽이 검선을 밀어냈습니다");
  syncHud();
}

function cutCurrentWall() {
  const wall = state.current;
  const timeBonus = Math.round((wall.timeLeft / wall.maxTime) * 60);
  const gained = 120 + timeBonus + state.combo * 9 + wall.sequence.length * 18;
  state.score += gained;
  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.wallsCut += 1;
  playWallBreakSound(state.combo, 0.13);
  state.best = Math.max(state.best, state.score);
  if (state.combo >= 2) {
    state.comboPops.push({
      combo: state.combo,
      age: 0,
    });
  }
  state.sliced.push({
    wall,
    age: 0,
    fragments: createWallFragments(),
  });
  state.current = state.queue.shift();
  state.queue.push(createWall());
  state.shake = Math.min(20, 7 + state.combo * 0.4);
  setMessage(`${state.combo}연속 검선`);
  syncHud();
}

function setMessage(message) {
  messageText.textContent = message;
  state.messageTimer = 1.4;
}

function handleDirection(dirId, source = "keyboard") {
  if (state.phase !== "playing" || !state.current) return;
  const expected = state.current.sequence[state.current.progress];
  state.lastInput = { dirId, age: 0, source };

  if (dirId === expected) {
    acceptDirection(dirId);
    return;
  }

  missDirection(dirId, expected);
}

function acceptDirection(dirId) {
  const wall = state.current;
  const previous = wall.sequence[wall.progress - 1];
  wall.progress += 1;
  let didSlash = false;
  if (SOUND_DEBUG) {
    soundDebug.accepted += 1;
    if (previous) soundDebug.expectedSlashes += 1;
    syncSoundDebug();
  }
  state.sparks.push({
    point: POINTS[dirId],
    label: DIRS[dirId].label,
    age: 0,
    ok: true,
  });

  if (previous) {
    const cutScale = wallScale(wall);
    state.cuts.push({
      from: POINTS[previous],
      to: POINTS[dirId],
      fromId: previous,
      toId: dirId,
      scale: cutScale,
      age: 0,
      ok: true,
    });
    state.playerSlash = {
      from: POINTS[previous],
      to: POINTS[dirId],
      pose: slashPoseId(POINTS[previous], POINTS[dirId]),
      age: 0,
    };
    didSlash = true;
  }

  if (didSlash) {
    playSlashSound(wall.progress >= wall.sequence.length);
  } else {
    playFocusSound();
  }

  if (wall.progress >= wall.sequence.length) {
    cutCurrentWall();
  } else {
    setMessage("검끝이 틈을 탔습니다");
  }
}

function patternHasEdge(pattern, from, to) {
  return pattern.edges.some(([edgeFrom, edgeTo]) => edgeFrom === from && edgeTo === to);
}

function missDirection(dirId, expected) {
  if (!state.current) return;
  playMissSound();
  state.combo = 0;
  state.comboPops = [];
  state.playerSlash = null;
  state.current.cracks += 1;
  state.current.timeLeft -= 0.36;
  state.sparks.push({
    point: POINTS[expected],
    label: DIRS[expected].label,
    age: 0,
    ok: false,
  });
  state.missBursts.push({
    x: W / 2 + POINTS[expected].x,
    y: 252 + POINTS[expected].y,
    age: 0,
  });
  state.shake = 12;
  setMessage(`${DIRS[dirId].label} 빗나감`);
  syncHud();

  if (state.current.timeLeft <= 0) endGame();
}

function axisPairToDiagonal(a, b) {
  const horizontal = [a, b].find((dir) => dir === "L" || dir === "R");
  const vertical = [a, b].find((dir) => dir === "U" || dir === "D");
  if (!horizontal || !vertical) return null;
  if (horizontal === "L" && vertical === "U") return "UL";
  if (horizontal === "R" && vertical === "U") return "UR";
  if (horizontal === "L" && vertical === "D") return "DL";
  return "DR";
}

function axisKind(axis) {
  return axis === "L" || axis === "R" ? "horizontal" : "vertical";
}

function isCardinal(axis) {
  return axis === "L" || axis === "R" || axis === "U" || axis === "D";
}

function handleAxisDown(axis, now) {
  const oppositeKind = axis === "L" || axis === "R" ? ["U", "D"] : ["L", "R"];
  const chordAxis = oppositeKind
    .filter(
      (candidate) =>
        state.activeKeys.has(candidate) &&
        Math.abs(now - (state.lastAxisDown[candidate] || -9999)) <= CHORD_MS,
    )
    .sort((a, b) => state.lastAxisDown[b] - state.lastAxisDown[a])[0];

  state.activeKeys.add(axis);
  state.lastAxisDown[axis] = now;

  const expected = state.current?.sequence[state.current.progress];
  if (isCardinal(expected)) {
    state.pendingAxis = null;
    handleDirection(axis);
    return;
  }

  if (state.pendingAxis && axisKind(state.pendingAxis.axis) === axisKind(axis)) {
    const { axis: pendingAxis } = state.pendingAxis;
    state.pendingAxis = null;
    handleDirection(pendingAxis);
  }

  if (chordAxis) {
    if (state.pendingAxis?.axis === chordAxis) state.pendingAxis = null;
    const diagonal = axisPairToDiagonal(axis, chordAxis);
    if (diagonal) handleDirection(diagonal);
    return;
  }

  state.pendingAxis = { axis, time: now };
}

function flushPending(now) {
  if (!state.pendingAxis) return;
  if (now - state.pendingAxis.time < CHORD_MS) return;
  const { axis } = state.pendingAxis;
  state.pendingAxis = null;
  handleDirection(axis);
}

function update(dt, now) {
  flushPending(now);
  if (state.phase === "playing" && state.current) {
    state.elapsedTime += dt;
    syncTimeHud();
    state.current.age += dt;
    state.current.timeLeft -= dt;
    if (state.current.timeLeft <= 0) endGame();
  }

  state.messageTimer = Math.max(0, state.messageTimer - dt);
  state.shake = Math.max(0, state.shake - 36 * dt);
  updateEffects(state.sparks, dt, 0.46);
  updateEffects(state.cuts, dt, CUT_EFFECT_SECONDS);
  updateEffects(state.comboPops, dt, COMBO_POP_SECONDS);
  updateEffects(state.missBursts, dt, 0.48);

  for (let i = state.sliced.length - 1; i >= 0; i -= 1) {
    state.sliced[i].age += dt;
    if (state.sliced[i].age > 0.7) state.sliced.splice(i, 1);
  }

  if (state.lastInput) {
    state.lastInput.age += dt;
    if (state.lastInput.age > 0.22) state.lastInput = null;
  }

  if (state.playerSlash) {
    state.playerSlash.age += dt;
    if (state.playerSlash.age > PLAYER_SLASH_SECONDS) state.playerSlash = null;
  }
}

function updateEffects(effects, dt, maxAge) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    effects[i].age += dt;
    if (effects[i].age > maxAge) effects.splice(i, 1);
  }
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (state.shake > 0) {
    ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
  }
  drawDojo();
  drawSlicedWalls();
  if (state.current) drawWall(state.current, W / 2, 252, wallScale(state.current), 1);
  drawCutEffects();
  drawPlayer();
  drawComboPops();
  drawInputEcho();
  ctx.restore();
}

function drawDojo() {
  const background = ASSETS.backgrounds[state.backgroundId];
  if (background?.ready) {
    drawImageCover(background.image, 0, 0, W, H);
    drawBackgroundOverlay();
    return;
  }

  drawProceduralDojo();
}

function drawImageCover(image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawBackgroundOverlay() {
  const topShade = ctx.createLinearGradient(0, 0, 0, H);
  topShade.addColorStop(0, "rgba(0, 0, 0, 0.3)");
  topShade.addColorStop(0.36, "rgba(0, 0, 0, 0.08)");
  topShade.addColorStop(0.68, "rgba(0, 0, 0, 0.18)");
  topShade.addColorStop(1, "rgba(0, 0, 0, 0.46)");
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, W, H);

  const focusShade = ctx.createRadialGradient(W / 2, 248, 120, W / 2, 260, 430);
  focusShade.addColorStop(0, "rgba(0, 0, 0, 0.06)");
  focusShade.addColorStop(0.62, "rgba(0, 0, 0, 0.2)");
  focusShade.addColorStop(1, "rgba(0, 0, 0, 0.46)");
  ctx.fillStyle = focusShade;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(4, 5, 5, 0.18)";
  ctx.fillRect(0, 0, W, 58);
  ctx.fillStyle = "rgba(255, 47, 146, 0.07)";
  ctx.fillRect(0, 58, W, 3);
}

function drawProceduralDojo() {
  const wall = ctx.createLinearGradient(0, 0, 0, 340);
  wall.addColorStop(0, "#0c1014");
  wall.addColorStop(0.5, "#171018");
  wall.addColorStop(1, "#261612");
  const floor = ctx.createLinearGradient(0, 330, 0, H);
  floor.addColorStop(0, "#17130f");
  floor.addColorStop(0.56, "#223019");
  floor.addColorStop(1, "#0f2422");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = floor;
  ctx.fillRect(0, 330, W, H - 330);

  const stageLight = ctx.createLinearGradient(W / 2, 90, W / 2, 355);
  stageLight.addColorStop(0, "rgba(255, 214, 132, 0.16)");
  stageLight.addColorStop(0.44, "rgba(255, 47, 146, 0.055)");
  stageLight.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = stageLight;
  ctx.beginPath();
  ctx.moveTo(310, 72);
  ctx.lineTo(650, 72);
  ctx.lineTo(770, 360);
  ctx.lineTo(190, 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(7, 8, 8, 0.7)";
  ctx.fillRect(104, 60, 34, 370);
  ctx.fillRect(W - 138, 60, 34, 370);
  ctx.fillStyle = "rgba(63, 24, 32, 0.78)";
  ctx.fillRect(58, 86, 42, 296);
  ctx.fillRect(W - 100, 86, 42, 296);
  ctx.fillStyle = "rgba(12, 9, 8, 0.84)";
  ctx.fillRect(74, 68, W - 148, 24);
  ctx.fillStyle = "rgba(255, 185, 91, 0.18)";
  ctx.fillRect(82, 74, W - 164, 10);
  ctx.fillStyle = "rgba(5, 7, 7, 0.72)";
  ctx.fillRect(68, 92, W - 136, 12);

  ctx.strokeStyle = "rgba(247, 242, 232, 0.055)";
  ctx.lineWidth = 2;
  for (let x = 210; x < W - 180; x += 118) {
    ctx.beginPath();
    ctx.moveTo(x, 96);
    ctx.lineTo(x - 18, 326);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255, 47, 146, 0.08)";
  for (let x = 178; x < W; x += 156) {
    ctx.beginPath();
    ctx.moveTo(x, 98);
    ctx.lineTo(x + 26, 292);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(247, 242, 232, 0.085)";
  for (let x = 120; x < W; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 330);
    ctx.lineTo(x - 180, H);
    ctx.stroke();
  }
  for (let y = 390; y < H; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(8, 7, 7, 0.38)";
  ctx.fillRect(0, 0, W, 58);
  ctx.fillStyle = "rgba(255, 47, 146, 0.08)";
  ctx.fillRect(0, 58, W, 3);
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.fillRect(0, 52, W, 6);
}

function drawSlicedWalls() {
  for (const item of state.sliced) {
    const t = clamp(item.age / 0.7, 0, 1);
    const ease = 1 - (1 - t) * (1 - t);
    const scale = 1 + ease * 0.12;
    const alpha = 1 - t;
    const offset = 90 * ease;
    const angle = 0.08 * ease;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, 252);
    ctx.scale(scale, scale);
    ctx.save();
    ctx.translate(-offset, -16 * ease);
    ctx.rotate(-angle);
    drawBrokenHalf("left", item.wall);
    ctx.restore();
    ctx.save();
    ctx.translate(offset, 16 * ease);
    ctx.rotate(angle);
    drawBrokenHalf("right", item.wall);
    ctx.restore();
    drawWallFragments(item.fragments, ease, alpha);
    ctx.restore();
  }
}

function createWallFragments() {
  const fragments = [];
  const cols = 7;
  const rows = 3;
  const cellW = 660 / cols;
  const cellH = 308 / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const w = cellW * rand(0.68, 1.02);
      const h = cellH * rand(0.58, 0.95);
      const x = clamp(-330 + col * cellW + rand(-8, 8), -330, 330 - w);
      const y = clamp(-154 + row * cellH + rand(-7, 7), -154, 154 - h);
      const cx = x + w / 2;
      const cy = y + h / 2;
      const side = cx < 0 ? -1 : 1;
      const force = rand(56, 150);
      fragments.push({
        x,
        y,
        w,
        h,
        vx: side * force + rand(-24, 24),
        vy: rand(-126, 58) + Math.abs(cy) * -0.08,
        rot: rand(-0.2, 0.2),
        spin: side * rand(0.55, 1.65),
        alpha: rand(0.48, 0.86),
      });
    }
  }

  return fragments;
}

function drawWallFragments(fragments, ease, alpha) {
  if (!fragments || fragments.length === 0) return;
  const gravity = 78 * ease * ease;
  const image = ASSETS.wall.image;

  for (const piece of fragments) {
    const x = piece.x + piece.vx * ease;
    const y = piece.y + piece.vy * ease + gravity;
    const rotation = piece.rot + piece.spin * ease;

    ctx.save();
    ctx.globalAlpha = alpha * piece.alpha;
    ctx.translate(x + piece.w / 2, y + piece.h / 2);
    ctx.rotate(rotation);

    if (ASSETS.wall.ready) {
      const sx = ((piece.x + 330) / 660) * image.width;
      const sy = ((piece.y + 154) / 308) * image.height;
      const sw = (piece.w / 660) * image.width;
      const sh = (piece.h / 308) * image.height;
      ctx.drawImage(image, sx, sy, sw, sh, -piece.w / 2, -piece.h / 2, piece.w, piece.h);
    } else {
      ctx.fillStyle = "#70685a";
      roundRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(247, 242, 232, 0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawBrokenHalf(side, wall) {
  ctx.save();
  ctx.beginPath();
  if (side === "left") {
    ctx.rect(-330, -154, 330, 308);
  } else {
    ctx.rect(0, -154, 330, 308);
  }
  ctx.clip();
  drawWallBody(-330, -154, 660, 308, 1);
  drawPattern(wall, 0, 0, 1, false);
  ctx.restore();
}

function wallScale(wall) {
  const pressure = 1 - clamp(wall.timeLeft / wall.maxTime, 0, 1);
  return 0.93 + pressure * 0.13;
}

function drawWall(wall, x, y, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawWallBody(-330, -154, 660, 308, 1);
  drawPattern(wall, 0, 0, 1, true);
  drawProgress(wall);
  drawCracks(wall);
  ctx.restore();
}

function drawWallBody(x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha *= alpha;

  if (ASSETS.wall.ready) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 18;
    ctx.drawImage(ASSETS.wall.image, x, y, w, h);
    ctx.restore();
    return;
  }

  ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 20;

  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, "#9a927d");
  body.addColorStop(0.42, "#70685a");
  body.addColorStop(1, "#454b47");
  ctx.fillStyle = body;
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#211a14";
  ctx.lineWidth = 10;
  roundRect(x, y, w, h, 8);
  ctx.stroke();

  ctx.strokeStyle = "rgba(247, 242, 232, 0.24)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 18);
  ctx.lineTo(x + w - 22, y + 12);
  ctx.stroke();

  ctx.strokeStyle = "rgba(10, 12, 10, 0.34)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i += 1) {
    const xx = x + 132 + i * 122 + Math.sin(i * 2.2) * 14;
    ctx.beginPath();
    ctx.moveTo(xx, y + 28);
    ctx.bezierCurveTo(xx - 18, y + 96, xx + 22, y + 184, xx - 6, y + h - 34);
    ctx.stroke();
  }
  for (let i = 0; i < 3; i += 1) {
    const yy = y + 76 + i * 75 + Math.sin(i * 1.7) * 8;
    for (let j = 0; j < 4; j += 1) {
      const x1 = x + 42 + j * 150 + Math.sin(i + j * 2.1) * 12;
      const x2 = x1 + 84 + Math.cos(i * 1.4 + j) * 18;
      ctx.beginPath();
      ctx.moveTo(x1, yy);
      ctx.bezierCurveTo(x1 + 34, yy + 9, x2 - 28, yy - 12, x2, yy + 6);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "rgba(247, 242, 232, 0.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i += 1) {
    const chipX = x + 44 + ((i * 83) % (w - 88));
    const chipY = y + 38 + ((i * 47) % (h - 76));
    ctx.beginPath();
    ctx.moveTo(chipX, chipY);
    ctx.lineTo(chipX + 14 + Math.sin(i) * 7, chipY + 7);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(23, 18, 12, 0.48)";
  const cap = 28;
  ctx.beginPath();
  ctx.moveTo(x, y + cap);
  ctx.lineTo(x + cap, y);
  ctx.lineTo(x + 72, y);
  ctx.lineTo(x, y + 72);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w, y + cap);
  ctx.lineTo(x + w - cap, y);
  ctx.lineTo(x + w - 72, y);
  ctx.lineTo(x + w, y + 72);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + h - cap);
  ctx.lineTo(x + cap, y + h);
  ctx.lineTo(x + 72, y + h);
  ctx.lineTo(x, y + h - 72);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w, y + h - cap);
  ctx.lineTo(x + w - cap, y + h);
  ctx.lineTo(x + w - 72, y + h);
  ctx.lineTo(x + w, y + h - 72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPattern(wall, x, y, alpha, withGuides) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  const active = getActiveEdge(wall);
  for (const [from, to] of wall.pattern.edges) {
    drawRiftLine(POINTS[from], POINTS[to], {
      active: Boolean(active && active.from === from && active.to === to),
      done: isEdgeDone(wall, from, to),
    });
  }

  if (withGuides) {
    const expected = wall.sequence[wall.progress];
    const preview = getPreviewEdge(wall);
    if (expected) {
      if (active) drawEndpoint(POINTS[active.from], "#f7f2e8", 0.72, "end");
      if (preview) drawNextEdge(POINTS[preview.from], POINTS[preview.to]);
      drawStartMarker(POINTS[expected], DIRS[expected].label);
      if (active) drawFlowDots(POINTS[active.from], POINTS[active.to]);
    }
  }
  ctx.restore();
}

function getActiveEdge(wall) {
  if (wall.progress <= 0 || wall.progress >= wall.sequence.length) return null;
  const from = wall.sequence[wall.progress - 1];
  const to = wall.sequence[wall.progress];
  return patternHasEdge(wall.pattern, from, to) ? { from, to } : null;
}

function getPreviewEdge(wall) {
  if (wall.progress >= wall.sequence.length - 1) return null;
  const from = wall.sequence[wall.progress];
  const to = wall.sequence[wall.progress + 1];
  return patternHasEdge(wall.pattern, from, to) ? { from, to } : null;
}

function isEdgeDone(wall, from, to) {
  for (let i = 0; i < wall.progress - 1; i += 1) {
    if (wall.sequence[i] === from && wall.sequence[i + 1] === to) return true;
  }
  return false;
}

function drawRiftLine(from, to, { active, done }) {
  ctx.save();
  const color = done ? "#55c7b0" : active ? "#ff5b35" : "#d34e3d";

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(82, 22, 16, 0.42)";
  ctx.lineWidth = active ? 18 : 14;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.globalAlpha *= done || active ? 0.92 : 0.68;
  ctx.lineWidth = active ? 8 : 5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  if (active) {
    ctx.strokeStyle = "rgba(255, 227, 123, 0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNextEdge(from, to) {
  const now = performance.now() / 1000;
  const glow = 0.68 + Math.sin(now * Math.PI * 4) * 0.2;
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = GUIDE.glow;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = GUIDE.deep;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 47, 146, ${glow})`;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.shadowBlur = 6;
  ctx.strokeStyle = "rgba(255, 241, 251, 0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = to.x - ux * 36;
  const py = to.y - uy * 36;
  const wing = 13;
  ctx.shadowBlur = 16;
  ctx.fillStyle = "rgba(44, 5, 31, 0.94)";
  ctx.beginPath();
  ctx.moveTo(to.x + ux * 4, to.y + uy * 4);
  ctx.lineTo(px - uy * (wing + 5), py + ux * (wing + 5));
  ctx.lineTo(px + uy * (wing + 5), py - ux * (wing + 5));
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = GUIDE.arrow;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(px - uy * wing, py + ux * wing);
  ctx.lineTo(px + uy * wing, py - ux * wing);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = GUIDE.core;
  ctx.beginPath();
  ctx.moveTo(to.x - ux * 2, to.y - uy * 2);
  ctx.lineTo(px - uy * 5, py + ux * 5);
  ctx.lineTo(px + uy * 5, py - ux * 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEndpoint(point, color, scale, kind) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.strokeStyle = kind === "start" ? "#17120c" : "rgba(23, 18, 12, 0.68)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, kind === "start" ? 17 : 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStartMarker(point, label) {
  const beat = performance.now() / 1000;
  const pulse = 1 + Math.sin(beat * Math.PI * 6) * 0.07;
  const spin = beat * 1.8;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(pulse, pulse);

  ctx.fillStyle = "rgba(84, 226, 255, 0.22)";
  circle(0, 0, 36);

  ctx.strokeStyle = "rgba(247, 242, 232, 0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#54e2ff";
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i += 1) {
    const angle = spin + (Math.PI / 2) * i;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 29, Math.sin(angle) * 29);
    ctx.lineTo(Math.cos(angle) * 42, Math.sin(angle) * 42);
    ctx.stroke();
  }

  ctx.fillStyle = "#f0bd55";
  circle(0, 0, 20);

  ctx.fillStyle = "#17120c";
  ctx.font = "900 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 2);
  ctx.restore();
}

function drawFlowDots(from, to) {
  const now = performance.now() / 1000;
  for (let i = 0; i < 5; i += 1) {
    const t = (now * 1.6 + i / 5) % 1;
    const x = lerp(from.x, to.x, t);
    const y = lerp(from.y, to.y, t);
    ctx.fillStyle = `rgba(255, 47, 146, ${0.18 + t * 0.58})`;
    circle(x, y, 4 + t * 4);
  }
}

function drawProgress(wall) {
  const ratio = clamp(wall.timeLeft / wall.maxTime, 0, 1);
  ctx.fillStyle = "rgba(23, 18, 12, 0.7)";
  roundRect(-268, 184, 536, 18, 8);
  ctx.fill();
  ctx.fillStyle = ratio > 0.32 ? "#55c7b0" : "#d34e3d";
  roundRect(-260, 188, 520 * ratio, 10, 5);
  ctx.fill();
}

function drawCracks(wall) {
  if (wall.cracks === 0) return;
  ctx.strokeStyle = "rgba(91, 55, 37, 0.74)";
  ctx.lineWidth = 3;
  const visibleCracks = Math.min(wall.cracks, 4);
  for (let i = 0; i < visibleCracks; i += 1) {
    const x = -240 + i * 142 + Math.sin(i * 2.7) * 20;
    const y = -112 + i * 34;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 38, y + 28);
    ctx.lineTo(x + 12, y + 54);
    ctx.lineTo(x + 50, y + 78);
    ctx.stroke();
  }
}

function drawCutEffects() {
  for (const cut of state.cuts) {
    const t = clamp(cut.age / CUT_EFFECT_SECONDS, 0, 1);
    const a = 1 - t;
    const from = toScreen(cut.from, cut.scale);
    const to = toScreen(cut.to, cut.scale);
    drawBladeSlash(from, to, t, a);
  }

  for (const spark of state.sparks) {
    const t = clamp(spark.age / 0.46, 0, 1);
    const p = toScreen(spark.point);
    ctx.strokeStyle = spark.ok ? `rgba(240, 189, 85, ${1 - t})` : `rgba(211, 78, 61, ${1 - t})`;
    ctx.lineWidth = 5 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10 + 28 * t, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = spark.ok ? `rgba(247, 242, 232, ${0.72 * (1 - t)})` : `rgba(211, 78, 61, ${0.72 * (1 - t)})`;
    circle(p.x, p.y, 4 + 4 * (1 - t));
  }

  for (const miss of state.missBursts) {
    const t = clamp(miss.age / 0.48, 0, 1);
    ctx.strokeStyle = `rgba(211, 78, 61, ${1 - t})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(miss.x, miss.y, 18 + 48 * t, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawComboPops() {
  for (const pop of state.comboPops) {
    const t = clamp(pop.age / COMBO_POP_SECONDS, 0, 1);
    const intro = clamp(t / 0.16, 0, 1);
    const outro = clamp((1 - t) / 0.34, 0, 1);
    const alpha = Math.min(easeOutCubic(intro), outro);
    const punch = 1 + (1 - easeOutCubic(Math.min(1, t * 3))) * 0.34;
    const y = 326 - easeOutCubic(t) * 54;
    const text = `${pop.combo} COMBO`;
    const bigCombo = Math.min(pop.combo, 20);
    const size = 46 + bigCombo * 0.8;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, y);
    ctx.rotate(Math.sin(t * Math.PI) * -0.035);
    ctx.scale(punch, punch);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${size}px sans-serif`;

    const width = ctx.measureText(text).width;
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(84, 226, 255, ${0.36 * alpha})`;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-width / 2 - 44, 12);
    ctx.lineTo(width / 2 + 44, -14);
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(23, 18, 12, 0.86)";
    ctx.strokeText(text, 0, 0);
    ctx.strokeStyle = `rgba(84, 226, 255, ${0.78 * alpha})`;
    ctx.lineWidth = 4;
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = "#f7f2e8";
    ctx.fillText(text, 0, 0);

    ctx.font = "900 15px sans-serif";
    ctx.fillStyle = `rgba(240, 189, 85, ${0.95 * alpha})`;
    ctx.fillText("PERFECT CUTS", 0, 34);
    ctx.restore();
  }
}

function drawPlayer() {
  const cx = W / 2;
  if (state.phase === "playing") {
    const swingSprite = getActiveSwingSprite();
    if (swingSprite?.ready) {
      drawPlayerAsset(swingSprite.image, cx, 636, 276, {
        anchorX: 0.51,
        playing: true,
        poseSprite: true,
      });
      return;
    }

    if (ASSETS.swordsmanBack.ready) {
      drawPlayerAsset(ASSETS.swordsmanBack.image, cx, 636, 258, {
        anchorX: 0.51,
        playing: true,
        poseSprite: false,
      });
      return;
    }
  }

  if (ASSETS.swordsman.ready) {
    drawPlayerAsset(ASSETS.swordsman.image, cx, 636, 378, {
      anchorX: 0.6,
      playing: false,
      poseSprite: false,
    });
    return;
  }

  const cy = 548;
  const breathe = Math.sin(performance.now() / 260) * 1.5;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 60, 70, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "#0f1210";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(-18, 16);
  ctx.lineTo(-54, 61);
  ctx.moveTo(16, 16);
  ctx.lineTo(47, 61);
  ctx.stroke();

  ctx.fillStyle = "#17120c";
  roundRect(-62, 54, 28, 12, 5);
  ctx.fill();
  roundRect(31, 54, 30, 12, 5);
  ctx.fill();

  const gi = ctx.createLinearGradient(-44, -48, 44, 34);
  gi.addColorStop(0, "#f1eadb");
  gi.addColorStop(0.52, "#d8c9aa");
  gi.addColorStop(1, "#796750");
  ctx.fillStyle = gi;
  ctx.strokeStyle = "#111311";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-42, -44 + breathe);
  ctx.quadraticCurveTo(-55, -2, -31, 32);
  ctx.lineTo(32, 32);
  ctx.quadraticCurveTo(55, -2, 42, -44 + breathe);
  ctx.quadraticCurveTo(0, -58 + breathe, -42, -44 + breathe);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(23, 18, 12, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-24, -38);
  ctx.lineTo(4, 28);
  ctx.moveTo(26, -38);
  ctx.lineTo(-6, 28);
  ctx.stroke();

  ctx.fillStyle = "#d34e3d";
  roundRect(-42, 15, 84, 12, 5);
  ctx.fill();
  ctx.fillStyle = "#f0bd55";
  roundRect(-8, 12, 16, 18, 4);
  ctx.fill();

  ctx.strokeStyle = "#101210";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(-36, -23);
  ctx.quadraticCurveTo(-72, -46, -104, -88);
  ctx.moveTo(38, -18);
  ctx.quadraticCurveTo(74, -39, 108, -85);
  ctx.stroke();

  ctx.strokeStyle = "#d9c7a3";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-36, -23);
  ctx.quadraticCurveTo(-72, -46, -104, -88);
  ctx.moveTo(38, -18);
  ctx.quadraticCurveTo(74, -39, 108, -85);
  ctx.stroke();

  ctx.strokeStyle = "#8d755b";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-58, -3);
  ctx.lineTo(-76, -34);
  ctx.stroke();

  const blade = ctx.createLinearGradient(-126, -118, -78, -38);
  blade.addColorStop(0, "#ffffff");
  blade.addColorStop(0.5, "#dffcff");
  blade.addColorStop(1, "#8fcdd8");
  ctx.strokeStyle = blade;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-78, -39);
  ctx.lineTo(-130, -126);
  ctx.stroke();
  ctx.strokeStyle = "rgba(84, 226, 255, 0.52)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-85, -45);
  ctx.lineTo(-135, -130);
  ctx.stroke();

  ctx.strokeStyle = "#17120c";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-92, -48);
  ctx.lineTo(-59, -32);
  ctx.stroke();

  ctx.fillStyle = "#dfcfad";
  ctx.strokeStyle = "#17120c";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -82 + breathe, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#17120c";
  ctx.beginPath();
  ctx.moveTo(-35, -92 + breathe);
  ctx.quadraticCurveTo(-6, -126 + breathe, 34, -94 + breathe);
  ctx.quadraticCurveTo(14, -106 + breathe, -4, -97 + breathe);
  ctx.quadraticCurveTo(-22, -107 + breathe, -35, -92 + breathe);
  ctx.fill();

  ctx.fillStyle = "#d34e3d";
  roundRect(-37, -101 + breathe, 74, 9, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(30, -99 + breathe);
  ctx.lineTo(70, -116 + breathe);
  ctx.lineTo(40, -88 + breathe);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#17120c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-21, -88 + breathe);
  ctx.lineTo(-5, -84 + breathe);
  ctx.moveTo(21, -88 + breathe);
  ctx.lineTo(5, -84 + breathe);
  ctx.stroke();
  ctx.fillStyle = "#17120c";
  ctx.fillRect(-15, -80 + breathe, 9, 5);
  ctx.fillRect(7, -80 + breathe, 9, 5);
  ctx.strokeStyle = "#17120c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -65 + breathe);
  ctx.quadraticCurveTo(0, -62 + breathe, 11, -65 + breathe);
  ctx.stroke();
  ctx.restore();
}

function getActiveSwingSprite() {
  if (!state.playerSlash) return null;
  if (state.playerSlash.age > 0.25) return null;
  return ASSETS.swing[state.playerSlash.pose] || null;
}

function drawPlayerAsset(image, cx, floorY, height, options) {
  const width = (image.width / image.height) * height;
  const motion = options.playing ? getPlayerSlashMotion() : null;
  const motionT = motion ? motion.t : 1;
  const impulse = motion ? 1 - easeOutCubic(motionT) : 0;
  const verticalSide = motion && Math.abs(motion.x) < 0.2 ? Math.cos(motion.angle) || 1 : 0;
  const twistSide = motion ? motion.x || verticalSide || 1 : 1;
  const leanX = motion ? motion.x * 28 * impulse : 0;
  const leanY = motion ? motion.y * 15 * impulse - 5 * impulse : 0;
  const leanRot = motion ? (motion.x * 0.13 - motion.y * 0.04 * twistSide) * impulse : 0;
  const x = -width * options.anchorX;
  const y = -height;
  const breathe = Math.sin(performance.now() / 260) * 2;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(cx + leanX * 0.35, floorY - 7, options.playing ? 54 : 76, options.playing ? 13 : 18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (motion) drawPlayerMotionSlash(cx, floorY, motion);
  if (motion) {
    drawPlayerMotionAfterimage(image, cx, floorY + breathe, width, height, options.anchorX, motion, {
      leanX,
      leanY,
      leanRot,
      impulse,
    });
  }

  ctx.translate(cx + leanX, floorY + breathe + leanY);
  ctx.rotate(leanRot);
  ctx.shadowColor = "rgba(84, 226, 255, 0.2)";
  ctx.shadowBlur = 12;
  ctx.drawImage(image, x, y, width, height);
  if (motion) drawPlayerFollowThrough(width, height, options.anchorX, motion, impulse);
  ctx.restore();
}

function getPlayerSlashMotion() {
  if (!state.playerSlash) return null;
  const t = clamp(state.playerSlash.age / PLAYER_SLASH_SECONDS, 0, 1);
  const dx = state.playerSlash.to.x - state.playerSlash.from.x;
  const dy = state.playerSlash.to.y - state.playerSlash.from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    t,
    x: dx / len,
    y: dy / len,
    angle: Math.atan2(dy, dx),
  };
}

function slashPoseId(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX > absY * 2) return dx > 0 ? "r" : "l";
  if (absY > absX * 2) return dy > 0 ? "d" : "u";
  if (dx > 0 && dy < 0) return "ur";
  if (dx < 0 && dy < 0) return "ul";
  if (dx > 0 && dy > 0) return "dr";
  return "dl";
}

function slashPoseVector(pose) {
  const vectors = {
    r: { x: 1, y: 0 },
    l: { x: -1, y: 0 },
    u: { x: 0, y: -1 },
    d: { x: 0, y: 1 },
    ur: { x: 0.72, y: -0.72 },
    ul: { x: -0.72, y: -0.72 },
    dr: { x: 0.72, y: 0.72 },
    dl: { x: -0.72, y: 0.72 },
  };
  return vectors[pose] || vectors.r;
}

function drawPlayerMotionAfterimage(image, cx, floorY, width, height, anchorX, motion, transform) {
  if (transform.impulse <= 0.02) return;
  const x = -width * anchorX;
  const y = -height;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = "saturate(1.5) brightness(1.25)";
  for (let i = 2; i >= 1; i -= 1) {
    const distance = i * 18 * transform.impulse;
    ctx.save();
    ctx.globalAlpha = (0.16 - i * 0.035) * transform.impulse;
    ctx.translate(
      cx + transform.leanX - motion.x * distance,
      floorY + transform.leanY - motion.y * distance * 0.58,
    );
    ctx.rotate(transform.leanRot * (1 - i * 0.22));
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
  }
  ctx.restore();
}

function drawPlayerMotionSlash(cx, floorY, motion) {
  const localT = motion.t;
  const alpha = Math.max(0, 1 - localT);
  const grow = easeOutCubic(clamp(localT / 0.22, 0, 1));
  const length = 112 + 96 * grow;
  const centerX = cx + motion.x * 24;
  const centerY = floorY - 142 + motion.y * 18;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(centerX, centerY);
  ctx.rotate(motion.angle);
  ctx.lineCap = "round";

  ctx.strokeStyle = `rgba(84, 226, 255, ${0.5 * alpha})`;
  ctx.lineWidth = 26 * alpha + 4;
  ctx.beginPath();
  ctx.moveTo(-length * 0.52, 0);
  ctx.quadraticCurveTo(0, -38 * alpha, length * 0.52, 0);
  ctx.stroke();

  ctx.strokeStyle = `rgba(247, 242, 232, ${0.9 * alpha})`;
  ctx.lineWidth = 7 * alpha + 2;
  ctx.beginPath();
  ctx.moveTo(-length * 0.46, 0);
  ctx.quadraticCurveTo(0, -28 * alpha, length * 0.46, 0);
  ctx.stroke();

  ctx.strokeStyle = `rgba(240, 189, 85, ${0.62 * alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-length * 0.34, 16);
  ctx.lineTo(length * 0.4, -16);
  ctx.stroke();

  ctx.restore();
}

function drawPlayerFollowThrough(width, height, anchorX, motion, impulse) {
  if (impulse <= 0.03) return;
  const dirX = motion.x;
  const dirY = motion.y;
  const px = -dirY;
  const py = dirX;
  const originX = -width * anchorX;
  const chest = {
    x: originX + width * 0.54,
    y: -height * 0.57,
  };
  const shoulder = {
    x: chest.x - px * height * 0.055,
    y: chest.y - py * height * 0.055,
  };
  const elbow = {
    x: shoulder.x + dirX * height * 0.15 + px * height * 0.08,
    y: shoulder.y + dirY * height * 0.13 + py * height * 0.08,
  };
  const hand = {
    x: shoulder.x + dirX * height * 0.34 + px * height * 0.025,
    y: shoulder.y + dirY * height * 0.27 + py * height * 0.025,
  };
  const bladeTip = {
    x: hand.x + dirX * height * 0.56,
    y: hand.y + dirY * height * 0.56,
  };
  const handleEnd = {
    x: hand.x - dirX * height * 0.12,
    y: hand.y - dirY * height * 0.12,
  };
  const counterHand = {
    x: chest.x - dirX * height * 0.18 - px * height * 0.08,
    y: chest.y - dirY * height * 0.12 - py * height * 0.08,
  };

  ctx.save();
  ctx.globalAlpha = clamp(impulse * 1.35, 0, 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(16, 18, 16, 0.9)";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(chest.x, chest.y);
  ctx.quadraticCurveTo(
    (chest.x + counterHand.x) / 2,
    (chest.y + counterHand.y) / 2 - height * 0.04,
    counterHand.x,
    counterHand.y,
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(236, 222, 194, 0.96)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(chest.x, chest.y);
  ctx.quadraticCurveTo(
    (chest.x + counterHand.x) / 2,
    (chest.y + counterHand.y) / 2 - height * 0.04,
    counterHand.x,
    counterHand.y,
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(16, 18, 16, 0.96)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.quadraticCurveTo(elbow.x, elbow.y, hand.x, hand.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(241, 232, 211, 0.98)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.quadraticCurveTo(elbow.x, elbow.y, hand.x, hand.y);
  ctx.stroke();

  ctx.strokeStyle = "#17120c";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(handleEnd.x, handleEnd.y);
  ctx.lineTo(hand.x + dirX * height * 0.035, hand.y + dirY * height * 0.035);
  ctx.stroke();

  ctx.strokeStyle = "#f0bd55";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hand.x - px * height * 0.055, hand.y - py * height * 0.055);
  ctx.lineTo(hand.x + px * height * 0.055, hand.y + py * height * 0.055);
  ctx.stroke();

  ctx.fillStyle = "#c28f54";
  ctx.strokeStyle = "#17120c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, height * 0.024, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(84, 226, 255, ${0.36 + impulse * 0.34})`;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(hand.x + dirX * height * 0.02, hand.y + dirY * height * 0.02);
  ctx.lineTo(bladeTip.x, bladeTip.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(247, 252, 255, 0.96)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(hand.x + dirX * height * 0.04, hand.y + dirY * height * 0.04);
  ctx.lineTo(bladeTip.x, bladeTip.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(240, 189, 85, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bladeTip.x - dirX * height * 0.07 - px * height * 0.018, bladeTip.y - dirY * height * 0.07 - py * height * 0.018);
  ctx.lineTo(bladeTip.x, bladeTip.y);
  ctx.lineTo(bladeTip.x - dirX * height * 0.07 + px * height * 0.018, bladeTip.y - dirY * height * 0.07 + py * height * 0.018);
  ctx.stroke();

  ctx.restore();
}

function drawInputEcho() {
  if (!state.lastInput) return;
  const t = clamp(state.lastInput.age / 0.22, 0, 1);
  const dir = DIRS[state.lastInput.dirId];
  const x = W / 2 + dir.x * 56;
  const y = 514 + dir.y * 42;
  ctx.fillStyle = `rgba(240, 189, 85, ${1 - t})`;
  ctx.font = "900 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dir.label, x, y);
}

function toScreen(point, fixedScale) {
  const scale = fixedScale ?? (state.current ? wallScale(state.current) : 1);
  return {
    x: W / 2 + point.x * scale,
    y: 252 + point.y * scale,
  };
}

function drawBladeSlash(from, to, t, alpha) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const centerX = (from.x + to.x) / 2;
  const centerY = (from.y + to.y) / 2;
  const span = Math.hypot(W, H) * 1.35;
  const start = { x: centerX - ux * span, y: centerY - uy * span };
  const end = { x: centerX + ux * span, y: centerY + uy * span };
  const open = easeOutCubic(t);
  const coreAlpha = alpha * alpha;
  const glowAlpha = Math.min(1, alpha * 1.18);
  const coreWidth = 12 * alpha + 2;
  const glowWidth = 56 * alpha + 8;
  const shockWidth = 86 * alpha;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  ctx.strokeStyle = `rgba(84, 226, 255, ${0.18 * glowAlpha})`;
  ctx.lineWidth = shockWidth;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.shadowColor = `rgba(84, 226, 255, ${0.65 * glowAlpha})`;
  ctx.shadowBlur = 28 * alpha;
  ctx.strokeStyle = `rgba(85, 199, 176, ${0.48 * glowAlpha})`;
  ctx.lineWidth = glowWidth;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.shadowColor = `rgba(247, 242, 232, ${0.85 * coreAlpha})`;
  ctx.shadowBlur = 18 * alpha;
  ctx.strokeStyle = `rgba(247, 242, 232, ${coreAlpha})`;
  ctx.lineWidth = coreWidth;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(240, 189, 85, ${0.56 * alpha})`;
  ctx.lineWidth = 2 + 3 * alpha;
  for (const offset of [-16, 16]) {
    const drift = offset + open * offset * 1.3;
    ctx.beginPath();
    ctx.moveTo(start.x + px * drift, start.y + py * drift);
    ctx.lineTo(end.x + px * drift, end.y + py * drift);
    ctx.stroke();
  }

  const flashStart = {
    x: lerp(from.x, start.x, 0.62 + open * 0.28),
    y: lerp(from.y, start.y, 0.62 + open * 0.28),
  };
  const flashEnd = {
    x: lerp(to.x, end.x, 0.62 + open * 0.28),
    y: lerp(to.y, end.y, 0.62 + open * 0.28),
  };
  ctx.strokeStyle = `rgba(247, 242, 232, ${0.88 * alpha})`;
  ctx.lineWidth = Math.max(1, 5 * alpha);
  ctx.beginPath();
  ctx.moveTo(flashStart.x, flashStart.y);
  ctx.lineTo(flashEnd.x, flashEnd.y);
  ctx.stroke();

  ctx.restore();
}

function syncHud() {
  scoreValue.textContent = state.score;
  comboValue.textContent = state.combo;
  maxComboValue.textContent = state.maxCombo;
  wallValue.textContent = state.wallsCut;
  syncTimeHud();
  bestValue.textContent = state.best;
}

function syncTimeHud() {
  timeValue.textContent = formatTime(state.elapsedTime);
}

function formatTime(seconds) {
  return `${seconds.toFixed(1)}초`;
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

let lastFrame = performance.now();
function tick(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.034);
  lastFrame = now;
  update(dt, now);
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const axis = KEY_TO_AXIS[key];
  if (!axis) return;
  event.preventDefault();
  if (event.repeat) return;
  primeAudio();
  handleAxisDown(axis, performance.now());
});

window.addEventListener("keyup", (event) => {
  const axis = KEY_TO_AXIS[event.key.toLowerCase()];
  if (!axis) return;
  state.activeKeys.delete(axis);
});
window.addEventListener("pointerdown", primeAudio, { capture: true, passive: true });

padButtons.forEach((button) => {
  const dir = button.dataset.dir;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    primeAudio();
    button.classList.add("active");
    handleDirection(dir, "pad");
  });
  button.addEventListener("pointerup", () => button.classList.remove("active"));
  button.addEventListener("pointercancel", () => button.classList.remove("active"));
  button.addEventListener("pointerleave", () => button.classList.remove("active"));
});

backgroundButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setBackground(button.dataset.bg);
  });
});

startButton.addEventListener("click", resetGame);
restartButton.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
syncHud();
syncBackgroundPicker();
requestAnimationFrame(tick);
