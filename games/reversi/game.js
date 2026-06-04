const boardEl = document.querySelector("#board");
const turnPillEl = document.querySelector("#turnPill");
const statusTextEl = document.querySelector("#statusText");
const blackScoreEl = document.querySelector("#blackScore");
const whiteScoreEl = document.querySelector("#whiteScore");
const blackScoreCardEl = document.querySelector(".black-score");
const whiteScoreCardEl = document.querySelector(".white-score");
const playerColorValueEl = document.querySelector("#playerColorValue");
const modeValueEl = document.querySelector("#modeValue");
const difficultyValueEl = document.querySelector("#difficultyValue");
const newGameButtonEl = document.querySelector("#newGameButton");
const boardRuleEl = document.querySelector("#boardRule");
const blockedRuleEl = document.querySelector("#blockedRule");
const legalMoveCountEl = document.querySelector("#legalMoveCount");
const historyListEl = document.querySelector("#historyList");
const saveStateValueEl = document.querySelector("#saveStateValue");
const saveHelpTextEl = document.querySelector("#saveHelpText");
const resultOverlayEl = document.querySelector("#resultOverlay");
const resultTitleEl = document.querySelector("#resultTitle");
const resultScoreEl = document.querySelector("#resultScore");
const cardRevealEl = document.querySelector("#cardReveal");
const cardRevealGlyphEl = document.querySelector("#cardRevealGlyph");
const cardRevealKickerEl = document.querySelector("#cardRevealKicker");
const cardRevealTitleEl = document.querySelector("#cardRevealTitle");
const cardRevealTextEl = document.querySelector("#cardRevealText");
const chaosPanelEl = document.querySelector("#chaosPanel");
const chaosLoadoutsEl = document.querySelector("#chaosLoadouts");
const chaosTierValueEl = document.querySelector("#chaosTierValue");
const onlinePanelEl = document.querySelector("#onlinePanel");
const roomCodeValueEl = document.querySelector("#roomCodeValue");
const roomStatusValueEl = document.querySelector("#roomStatusValue");
const copyRoomButtonEl = document.querySelector("#copyRoomButton");
const soundEnabledInputEl = document.querySelector("#soundEnabledInput");
const sfxVolumeInputEl = document.querySelector("#sfxVolumeInput");
const bgmVolumeInputEl = document.querySelector("#bgmVolumeInput");

const GAME_ID = "reversi";
const LEADERBOARD_ID = "cpu_best_win";

const PLAYERS = {
  black: {
    id: "black",
    label: "흑",
    name: "검은 돌",
  },
  white: {
    id: "white",
    label: "백",
    name: "흰 돌",
  },
};

const MODE_LABELS = {
  cpu: "VS 컴퓨터",
  local: "로컬 2인",
  online: "온라인",
};

const DIFFICULTY_LABELS = {
  easy: "입문",
  greedy: "욕심쟁이",
  positional: "전략가",
  minimax3: "수읽기",
  minimax4: "고수",
};

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const CLASSIC_RULESET = {
  id: "classic",
  label: "클래식 8x8",
  size: 8,
  blockedCells: [],
  randomBlockedCount: 0,
  startingLayout: "standard",
  players: {
    black: {
      controller: "human",
      powers: [],
      specialStoneDeck: [],
    },
    white: {
      controller: "computer",
      powers: [],
      specialStoneDeck: [],
    },
  },
};

const columnNames = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

const POSITION_WEIGHTS_8X8 = [
  [120, -28, 24, 12, 12, 24, -28, 120],
  [-28, -46, -8, -6, -6, -8, -46, -28],
  [24, -8, 14, 7, 7, 14, -8, 24],
  [12, -6, 7, 4, 4, 7, -6, 12],
  [12, -6, 7, 4, 4, 7, -6, 12],
  [24, -8, 14, 7, 7, 14, -8, 24],
  [-28, -46, -8, -6, -6, -8, -46, -28],
  [120, -28, 24, 12, 12, 24, -28, 120],
];

const DIFFICULTY_SCORE_BASE = {
  easy: 900,
  greedy: 1200,
  positional: 1600,
  minimax3: 2200,
  minimax4: 3000,
};

const ROOM_ID_PATTERN = /^[0-9A-Z]{6}$/;

const CHAOS_POWER_DEFS = {
  eclipse_3x3: {
    id: "eclipse_3x3",
    name: "3x3 일식",
    shortText: "선택한 3x3 안의 일반돌을 최대 6개 내 색으로 바꿉니다.",
    revealText: "선택한 3x3 안의 상대 일반돌을 최대 6개 내 색으로 바꿨습니다.",
    tier: 2,
    glyph: "eclipse",
    accent: "violet",
    target: "cell",
  },
  black_hole: {
    id: "black_hole",
    name: "블랙홀",
    shortText: "빈 칸 하나를 구멍으로 만들고 주변 상대 돌을 최대 4개까지 내 색으로 바꿉니다.",
    revealText: "구멍이 열리고 주변 상대 돌이 최대 4개 내 색으로 바뀌었습니다.",
    tier: 3,
    glyph: "black-hole",
    accent: "blue",
    target: "empty",
  },
  ownership_frenzy: {
    id: "ownership_frenzy",
    name: "소유권 폭주",
    shortText: "다음 내 착수 뒤 인접 상대 돌을 최대 4개 추가로 바꿉니다.",
    revealText: "다음 내 착수 뒤 인접 상대 돌을 최대 4개 더 바꿉니다.",
    tier: 2,
    glyph: "frenzy",
    accent: "red",
    target: "buff",
  },
  comeback_swing: {
    id: "comeback_swing",
    name: "역전세",
    shortText: "8개 이상 밀릴 때 상대 돌 6개를 무작위로 가져옵니다.",
    revealText: "8개 이상 밀리던 판에서 상대 돌 6개를 가져왔습니다.",
    tier: 3,
    glyph: "comeback",
    accent: "green",
    target: "instant",
  },
  move_ban: {
    id: "move_ban",
    name: "착수 봉인",
    shortText: "상대의 다음 합법 수 중 가치가 높은 칸을 최대 4개 봉인하고 주변 상대 돌을 균열 반전합니다.",
    revealText: "상대의 다음 합법 수를 봉인하고, 봉인된 칸 주변 상대 돌을 균열 반전했습니다.",
    tier: 2,
    glyph: "ban",
    accent: "red",
    target: "opponentMove",
  },
  destiny_move: {
    id: "destiny_move",
    name: "운명의 한 수",
    shortText: "내 비가장자리 돌 하나에 운명 표식과 보호막을 붙이고, 종료 시 최종 소유자가 +8점을 얻습니다.",
    revealText: "표식 돌은 보호막을 얻고, 최종 소유자는 종료 시 +8점을 얻습니다.",
    tier: 2,
    glyph: "destiny",
    accent: "violet",
    target: "ownPiece",
  },
  chain_lightning: {
    id: "chain_lightning",
    name: "연쇄번개",
    shortText: "상대 돌 하나를 찍으면 붙어 있는 상대 돌 무리를 타고 최대 5개를 내 색으로 바꿉니다.",
    revealText: "번개가 상대 돌 무리를 타고 연쇄 반전했습니다.",
    tier: 3,
    glyph: "lightning-chain",
    accent: "cyan",
    target: "opponentPiece",
  },
  edge_surge: {
    id: "edge_surge",
    name: "가장자리 해일",
    shortText: "가장자리의 상대 돌을 최대 4개까지 파도처럼 쓸어와 내 색으로 바꿉니다.",
    revealText: "가장자리 해일이 상대 돌을 쓸어왔습니다.",
    tier: 3,
    glyph: "edge-wave",
    accent: "blue",
    target: "instant",
  },
  gravity_crush: {
    id: "gravity_crush",
    name: "중력 붕괴",
    shortText: "선택한 중심 주변 3x3의 상대 돌이 3개 이상이면 최대 5개를 압축 반전합니다.",
    revealText: "중력장이 내려앉아 밀집한 상대 돌을 압축 반전했습니다.",
    tier: 3,
    glyph: "gravity",
    accent: "violet",
    target: "gravityCell",
  },
  tidal_wave: {
    id: "tidal_wave",
    name: "해일",
    shortText: "선택한 칸을 지나는 행 또는 열 중 더 좋은 라인의 상대 돌을 최대 5개 가져옵니다.",
    revealText: "해일이 한 줄을 쓸고 지나가 상대 돌을 가져왔습니다.",
    tier: 2,
    glyph: "tidal-wave",
    accent: "cyan",
    target: "lineCell",
  },
};

const CHAOS_STONE_DEFS = {
  domino: {
    id: "domino",
    name: "도미노돌",
    shortText: "착수로 뒤집은 각 방향의 다음 상대 돌까지 최대 4개 연쇄로 바꿉니다.",
    revealText: "각 뒤집힘 방향의 다음 상대 돌까지 최대 4개 연쇄로 바꿨습니다.",
    tier: 1,
    glyph: "domino",
    accent: "green",
  },
  jackpot: {
    id: "jackpot",
    name: "잭팟돌",
    shortText: "놓는 순간 주변 상대 돌 1개를 바꾸고, 1턴 뒤 주변 상대 일반돌을 최대 3개 가져옵니다.",
    revealText: "작은 당첨이 먼저 터지고, 다음 턴 큰 잭팟이 예약됩니다.",
    tier: 2,
    glyph: "jackpot",
    accent: "amber",
  },
  throne: {
    id: "throne",
    name: "왕좌돌",
    shortText: "보호막과 호위 반전을 얻고, 종료 시 가장자리에 남아 있으면 최종 소유자가 +5점을 얻습니다.",
    revealText: "보호막과 호위 반전이 발동하고, 가장자리에 남으면 최종 소유자가 +5점을 얻습니다.",
    tier: 3,
    glyph: "throne",
    accent: "gold",
  },
  magnet: {
    id: "magnet",
    name: "자석돌",
    shortText: "8방향에서 처음 마주치는 상대 돌을 최대 4개 끌어당겨 내 색으로 바꾸고 보호막을 얻습니다.",
    revealText: "자기장이 8방향 상대 돌을 끌어당기고 보호막을 둘렀습니다.",
    tier: 2,
    glyph: "magnet",
    accent: "cyan",
  },
  king_bomb: {
    id: "king_bomb",
    name: "대폭발돌",
    shortText: "놓을 때 같은 행/열 상대 돌 1개를 바꾸고, 누가 뒤집든 처음 놓은 플레이어 색으로 폭발 파동이 퍼집니다.",
    revealText: "같은 행/열 상대 돌 1개를 바꾸고, 누가 뒤집든 처음 놓은 플레이어 색으로 폭발 파동이 퍼집니다.",
    tier: 2,
    glyph: "mushroom-cloud",
    accent: "red",
  },
  mirror_stone: {
    id: "mirror_stone",
    name: "거울돌",
    shortText: "보드 반대편 대칭 위치와 양쪽 주변의 상대 돌을 최대 4개 함께 반전합니다.",
    revealText: "거울상이 보드 반대편 상대 돌까지 함께 흔들었습니다.",
    tier: 2,
    glyph: "mirror",
    accent: "violet",
  },
  laser_stone: {
    id: "laser_stone",
    name: "레이저돌",
    shortText: "8방향 광선으로 라인 위 상대 돌을 최대 6개 관통 반전하고 보호막을 얻습니다.",
    revealText: "레이저가 8방향 라인을 관통해 상대 돌을 반전했습니다.",
    tier: 2,
    glyph: "laser",
    accent: "cyan",
  },
  assassin_stone: {
    id: "assassin_stone",
    name: "암살돌",
    shortText: "3칸 거리 안의 가치 높은 상대 돌을 최대 2개 조용히 빼앗습니다.",
    revealText: "암살자가 근처 핵심 상대 돌을 골라 빼앗았습니다.",
    tier: 2,
    glyph: "assassin",
    accent: "red",
  },
  split_stone: {
    id: "split_stone",
    name: "분열돌",
    shortText: "주변 빈칸에 내 일반돌을 최대 2개 복제합니다.",
    revealText: "분열된 파편이 주변 빈칸에 내 돌로 복제되었습니다.",
    tier: 2,
    glyph: "split",
    accent: "green",
  },
  vampire_stone: {
    id: "vampire_stone",
    name: "흡혈돌",
    shortText: "이번 착수로 뒤집은 수에 비례해 주변 상대 돌을 최대 5개 추가로 가져옵니다.",
    revealText: "흡혈 파동이 뒤집힌 힘을 먹고 주변 상대 돌을 추가로 가져왔습니다.",
    tier: 2,
    glyph: "vampire",
    accent: "red",
  },
};

const CHAOS_BANNED_LOADOUTS = new Set([
  "black_hole+domino",
  "black_hole+magnet",
  "black_hole+mirror_stone",
  "black_hole+split_stone",
  "black_hole+throne",
  "black_hole+king_bomb",
  "black_hole+laser_stone",
  "chain_lightning+domino",
  "chain_lightning+assassin_stone",
  "chain_lightning+king_bomb",
  "chain_lightning+magnet",
  "chain_lightning+mirror_stone",
  "chain_lightning+split_stone",
  "chain_lightning+vampire_stone",
  "comeback_swing+magnet",
  "comeback_swing+throne",
  "comeback_swing+split_stone",
  "comeback_swing+vampire_stone",
  "destiny_move+jackpot",
  "destiny_move+king_bomb",
  "destiny_move+throne",
  "destiny_move+vampire_stone",
  "eclipse_3x3+jackpot",
  "eclipse_3x3+king_bomb",
  "eclipse_3x3+magnet",
  "eclipse_3x3+mirror_stone",
  "eclipse_3x3+vampire_stone",
  "edge_surge+jackpot",
  "edge_surge+assassin_stone",
  "edge_surge+king_bomb",
  "edge_surge+laser_stone",
  "edge_surge+mirror_stone",
  "edge_surge+split_stone",
  "edge_surge+throne",
  "edge_surge+vampire_stone",
  "gravity_crush+king_bomb",
  "gravity_crush+domino",
  "gravity_crush+laser_stone",
  "gravity_crush+mirror_stone",
  "move_ban+assassin_stone",
  "move_ban+jackpot",
  "move_ban+magnet",
  "move_ban+split_stone",
  "move_ban+throne",
  "ownership_frenzy+magnet",
  "ownership_frenzy+assassin_stone",
  "ownership_frenzy+king_bomb",
  "ownership_frenzy+mirror_stone",
  "ownership_frenzy+split_stone",
  "tidal_wave+king_bomb",
  "tidal_wave+throne",
  "tidal_wave+split_stone",
  "tidal_wave+vampire_stone",
]);

const CHAOS_MAX_TIER_SCORE = 5;
const SINGLE_TRIGGER_REVEAL_STONES = new Set(["infectious_bomb"]);
const AUDIO_STORAGE_KEY = "reversi.audio.v1";
const AUDIO_DEFAULTS = {
  enabled: true,
  sfxVolume: 0.72,
  bgmVolume: 0.3,
};

let state;
let gameSettings = readSettingsFromUrl();
let audioSettings = readAudioSettings();
let backendState = {
  ready: false,
  loadFailed: false,
  user: null,
  api: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readAudioSettings() {
  const saved = readStoredAudioSettings();
  return {
    enabled: typeof saved.enabled === "boolean" ? saved.enabled : AUDIO_DEFAULTS.enabled,
    sfxVolume: clamp(Number(saved.sfxVolume ?? AUDIO_DEFAULTS.sfxVolume), 0, 1),
    bgmVolume: clamp(Number(saved.bgmVolume ?? AUDIO_DEFAULTS.bgmVolume), 0, 1),
  };
}

function readStoredAudioSettings() {
  try {
    const raw = window.localStorage?.getItem(AUDIO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveAudioSettings() {
  try {
    window.localStorage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioSettings));
  } catch (error) {
    // Audio preferences are nice-to-have; private browsing can block storage.
  }
}

const audioEngine = {
  context: null,
  disabled: false,
  masterGain: null,
  sfxGain: null,
  bgmGain: null,
  bgmTimer: null,
  nextBgmTime: 0,
  bgmStep: 0,

  ensure() {
    if (this.disabled || !audioSettings.enabled) return null;

    if (!this.context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        this.disabled = true;
        return null;
      }

      try {
        this.context = new AudioContextCtor();
        this.masterGain = this.context.createGain();
        this.sfxGain = this.context.createGain();
        this.bgmGain = this.context.createGain();
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -16;
        limiter.knee.value = 14;
        limiter.ratio.value = 5;
        limiter.attack.value = 0.004;
        limiter.release.value = 0.16;

        this.sfxGain.connect(limiter);
        this.bgmGain.connect(limiter);
        limiter.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);
        this.updateGains();
      } catch (error) {
        this.disabled = true;
        return null;
      }
    }

    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }

    this.updateGains();
    this.startBgm();
    return this.context;
  },

  updateGains() {
    if (!this.context || !this.masterGain || !this.sfxGain || !this.bgmGain) return;

    const now = this.context.currentTime;
    const active = audioSettings.enabled ? 1 : 0;
    this.masterGain.gain.setTargetAtTime(active, now, 0.025);
    this.sfxGain.gain.setTargetAtTime(audioSettings.sfxVolume, now, 0.025);
    this.bgmGain.gain.setTargetAtTime(audioSettings.bgmVolume, now, 0.08);

    if (!audioSettings.enabled || audioSettings.bgmVolume <= 0) this.stopBgm();
  },

  startBgm() {
    if (!this.context || this.bgmTimer || !audioSettings.enabled || audioSettings.bgmVolume <= 0) return;

    this.nextBgmTime = this.context.currentTime + 0.08;
    this.bgmStep = 0;
    this.bgmTimer = window.setInterval(() => this.scheduleBgm(), 110);
    this.scheduleBgm();
  },

  stopBgm() {
    if (!this.bgmTimer) return;
    window.clearInterval(this.bgmTimer);
    this.bgmTimer = null;
  },

  scheduleBgm() {
    if (!this.context || !this.bgmGain || !audioSettings.enabled || audioSettings.bgmVolume <= 0) return;

    const lookAhead = this.context.currentTime + 0.62;
    while (this.nextBgmTime < lookAhead) {
      scheduleBgmStep(this.bgmStep, this.nextBgmTime);
      this.bgmStep += 1;
      this.nextBgmTime += 0.42;
    }
  },
};

function setupAudioControls() {
  renderAudioControls();

  document.addEventListener?.("pointerdown", unlockAudioFromUserGesture, { capture: true, once: true });
  document.addEventListener?.("keydown", unlockAudioFromUserGesture, { capture: true, once: true });

  soundEnabledInputEl?.addEventListener("change", (event) => {
    audioSettings.enabled = Boolean(event.target.checked);
    saveAudioSettings();
    renderAudioControls();

    if (audioSettings.enabled) {
      playUiSound();
    } else {
      audioEngine.updateGains();
    }
  });

  sfxVolumeInputEl?.addEventListener("input", (event) => {
    audioSettings.sfxVolume = clamp(Number(event.target.value) / 100, 0, 1);
    saveAudioSettings();
    audioEngine.updateGains();
  });

  sfxVolumeInputEl?.addEventListener("change", () => {
    playUiSound();
  });

  bgmVolumeInputEl?.addEventListener("input", (event) => {
    audioSettings.bgmVolume = clamp(Number(event.target.value) / 100, 0, 1);
    saveAudioSettings();
    audioEngine.ensure();
    audioEngine.updateGains();
  });
}

function renderAudioControls() {
  if (soundEnabledInputEl) soundEnabledInputEl.checked = audioSettings.enabled;
  if (sfxVolumeInputEl) sfxVolumeInputEl.value = String(Math.round(audioSettings.sfxVolume * 100));
  if (bgmVolumeInputEl) bgmVolumeInputEl.value = String(Math.round(audioSettings.bgmVolume * 100));
}

function unlockAudioFromUserGesture() {
  audioEngine.ensure();
}

function playTone(frequency, delay = 0, duration = 0.14, options = {}) {
  const context = audioEngine.ensure();
  if (!context) return;

  const start = context.currentTime + delay;
  const stop = start + duration;
  const destination = options.destination ?? audioEngine.sfxGain;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  let sourceNode = oscillator;

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.slideTo), stop);
  }
  if (options.detune) oscillator.detune.setValueAtTime(options.detune, start);

  if (options.filter) {
    const filter = context.createBiquadFilter();
    filter.type = options.filter.type ?? "lowpass";
    filter.frequency.setValueAtTime(options.filter.frequency ?? 1600, start);
    filter.Q.value = options.filter.q ?? 0.8;
    oscillator.connect(filter);
    sourceNode = filter;
  }

  const peak = Math.max(0.0001, options.gain ?? 0.08);
  const attack = Math.min(duration * 0.45, options.attack ?? 0.012);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, stop);

  sourceNode.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(stop + 0.035);
}

function playNoiseBurst(delay = 0, duration = 0.08, options = {}) {
  const context = audioEngine.ensure();
  if (!context) return;

  const start = context.currentTime + delay;
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    const fade = 1 - index / frameCount;
    data[index] = (Math.random() * 2 - 1) * fade;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const destination = options.destination ?? audioEngine.sfxGain;

  source.buffer = buffer;
  filter.type = options.filterType ?? "lowpass";
  filter.frequency.setValueAtTime(options.frequency ?? 900, start);
  filter.Q.value = options.q ?? 0.6;
  gain.gain.setValueAtTime(options.gain ?? 0.08, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
}

function playUiSound() {
  playTone(520, 0, 0.06, { type: "triangle", gain: 0.035 });
  playTone(780, 0.035, 0.08, { type: "triangle", gain: 0.025 });
}

function playInvalidSound() {
  playTone(210, 0, 0.09, { type: "square", gain: 0.035, slideTo: 150 });
  playNoiseBurst(0.005, 0.045, { filterType: "bandpass", frequency: 380, gain: 0.035 });
}

function playMoveSound({ playerId, flipCount, specialKind, triggeredKinds, gameOver }) {
  const base = playerId === "black" ? 138 : 166;
  playNoiseBurst(0, 0.055, { frequency: 720, gain: specialKind ? 0.075 : 0.055 });
  playTone(base, 0, 0.1, { type: "sine", gain: specialKind ? 0.075 : 0.055, slideTo: base * 0.72 });
  playTone(base * 1.5, 0.012, 0.07, { type: "triangle", gain: 0.03 });

  if (flipCount > 0) playFlipCascade(flipCount, 0.055);
  if (specialKind) playSpecialStoneSound(specialKind, 0.035, "place");

  triggeredKinds.forEach((kind, index) => {
    playSpecialStoneSound(kind, 0.16 + index * 0.055, "trigger");
  });

  if (gameOver) playResultSound();
}

function playFlipCascade(count, delay = 0) {
  const ticks = Math.min(count, 14);
  const gap = count > 8 ? 0.026 : 0.038;

  for (let index = 0; index < ticks; index += 1) {
    const offset = delay + index * gap;
    const frequency = 390 + index * 21 + Math.min(count, 10) * 5;
    playTone(frequency, offset, 0.052, { type: "triangle", gain: 0.025, slideTo: frequency * 1.18 });
    playNoiseBurst(offset, 0.022, { filterType: "bandpass", frequency: frequency * 1.6, gain: 0.018 });
  }

  if (count > ticks) {
    playTone(920, delay + ticks * gap, 0.12, { type: "triangle", gain: 0.04 });
  }
}

function playChaosRevealSound(reveal) {
  playNoiseBurst(0, 0.075, { filterType: "highpass", frequency: 1200, gain: 0.045 });
  playTone(440, 0, 0.09, { type: "triangle", gain: 0.035, slideTo: 760 });

  if (reveal.family === "power") {
    playPowerSound(reveal.id, 0.065);
  } else {
    playSpecialStoneSound(reveal.id, 0.065, "reveal");
  }
}

function playPowerSound(powerId, delay = 0) {
  if (powerId === "board_flip") {
    playNoiseBurst(delay, 0.24, { filterType: "bandpass", frequency: 560, q: 2.2, gain: 0.08 });
    playTone(520, delay, 0.22, { type: "sawtooth", gain: 0.035, slideTo: 250, filter: { frequency: 980 } });
    return;
  }

  if (powerId === "eclipse_3x3") {
    playTone(196, delay, 0.34, { type: "sine", gain: 0.075, slideTo: 132 });
    playTone(784, delay + 0.08, 0.24, { type: "triangle", gain: 0.035, slideTo: 1175 });
    playNoiseBurst(delay + 0.04, 0.16, { filterType: "highpass", frequency: 1800, gain: 0.035 });
    return;
  }

  if (powerId === "black_hole") {
    playTone(220, delay, 0.36, { type: "sine", gain: 0.08, slideTo: 55 });
    playNoiseBurst(delay, 0.32, { filterType: "lowpass", frequency: 360, gain: 0.08 });
    return;
  }

  if (powerId === "corner_contract") {
    playTone(392, delay, 0.14, { type: "triangle", gain: 0.055 });
    playTone(587, delay + 0.045, 0.16, { type: "triangle", gain: 0.045 });
    playTone(784, delay + 0.09, 0.18, { type: "triangle", gain: 0.035 });
    return;
  }

  if (powerId === "ownership_frenzy") {
    playTone(164, delay, 0.18, { type: "sawtooth", gain: 0.05, slideTo: 329, filter: { frequency: 760, q: 5 } });
    playTone(247, delay + 0.04, 0.18, { type: "square", gain: 0.028, slideTo: 494, filter: { frequency: 980, q: 6 } });
    playNoiseBurst(delay + 0.02, 0.12, { filterType: "bandpass", frequency: 1400, q: 8, gain: 0.025 });
    return;
  }

  if (powerId === "double_cast") {
    playTone(523, delay, 0.12, { type: "triangle", gain: 0.045 });
    playTone(659, delay + 0.11, 0.12, { type: "triangle", gain: 0.045 });
    playTone(1046, delay + 0.21, 0.16, { type: "sine", gain: 0.025 });
    return;
  }

  if (powerId === "final_auction") {
    playNoiseBurst(delay, 0.06, { frequency: 520, gain: 0.08 });
    playTone(116, delay, 0.11, { type: "sine", gain: 0.08, slideTo: 88 });
    playTone(880, delay + 0.13, 0.16, { type: "triangle", gain: 0.03 });
    return;
  }

  if (powerId === "comeback_swing") {
    playTone(174, delay, 0.18, { type: "triangle", gain: 0.045, slideTo: 348 });
    playTone(261, delay + 0.08, 0.18, { type: "triangle", gain: 0.04, slideTo: 523 });
    playTone(392, delay + 0.16, 0.18, { type: "triangle", gain: 0.04, slideTo: 784 });
    return;
  }

  if (powerId === "move_ban") {
    playTone(330, delay, 0.1, { type: "square", gain: 0.04, slideTo: 220 });
    playTone(165, delay + 0.06, 0.13, { type: "square", gain: 0.04, slideTo: 110 });
    playNoiseBurst(delay + 0.02, 0.08, { filterType: "bandpass", frequency: 420, gain: 0.04 });
    return;
  }

  if (powerId === "destiny_move") {
    playTone(392, delay, 0.28, { type: "sine", gain: 0.035, slideTo: 784 });
    playTone(587, delay + 0.05, 0.3, { type: "triangle", gain: 0.035, slideTo: 1174 });
    playNoiseBurst(delay + 0.08, 0.18, { filterType: "highpass", frequency: 2200, gain: 0.03 });
    return;
  }

  if (powerId === "chain_lightning") {
    [740, 980, 1280, 1640].forEach((frequency, index) => {
      playTone(frequency, delay + index * 0.035, 0.055, { type: "square", gain: 0.026, slideTo: frequency * 1.18 });
    });
    playNoiseBurst(delay + 0.02, 0.16, { filterType: "highpass", frequency: 2800, gain: 0.035 });
    return;
  }

  if (powerId === "edge_surge" || powerId === "tidal_wave") {
    playTone(156, delay, 0.32, { type: "sine", gain: 0.05, slideTo: 260 });
    playNoiseBurst(delay + 0.04, 0.26, { filterType: "bandpass", frequency: powerId === "tidal_wave" ? 840 : 640, gain: 0.052 });
    return;
  }

  if (powerId === "gravity_crush") {
    playTone(110, delay, 0.34, { type: "sine", gain: 0.075, slideTo: 58 });
    playTone(440, delay + 0.13, 0.12, { type: "triangle", gain: 0.032, slideTo: 220 });
    playNoiseBurst(delay + 0.06, 0.2, { filterType: "lowpass", frequency: 420, gain: 0.055 });
  }
}

function playSpecialStoneSound(kind, delay = 0, mode = "place") {
  const intensity = mode === "trigger" ? 1.12 : mode === "reveal" ? 0.88 : 1;

  if (kind === "supernova") {
    playTone(196, delay, 0.16, { type: "sine", gain: 0.06 * intensity, slideTo: 784 });
    playNoiseBurst(delay + 0.09, 0.18, { filterType: "highpass", frequency: 2600, gain: 0.055 * intensity });
    return;
  }

  if (kind === "lottery") {
    [523, 659, 784].forEach((frequency, index) => {
      playTone(frequency, delay + index * 0.045, 0.09, { type: "triangle", gain: 0.035 * intensity });
    });
    return;
  }

  if (kind === "throne") {
    playTone(196, delay, 0.2, { type: "sine", gain: 0.055 * intensity });
    playTone(294, delay + 0.015, 0.22, { type: "triangle", gain: 0.035 * intensity });
    playTone(392, delay + 0.03, 0.24, { type: "triangle", gain: 0.025 * intensity });
    return;
  }

  if (kind === "seizure") {
    playTone(180, delay, 0.1, { type: "square", gain: 0.04 * intensity, slideTo: 135 });
    playNoiseBurst(delay + 0.035, 0.085, { filterType: "bandpass", frequency: 760, q: 6, gain: 0.05 * intensity });
    return;
  }

  if (kind === "jackpot") {
    [880, 1174, 1567].forEach((frequency, index) => {
      playTone(frequency, delay + index * 0.035, 0.08, { type: "triangle", gain: 0.028 * intensity });
    });
    return;
  }

  if (kind === "magnet") {
    playTone(680, delay, 0.18, { type: "sine", gain: 0.04 * intensity, slideTo: 240 });
    playTone(240, delay + 0.08, 0.12, { type: "triangle", gain: 0.04 * intensity, slideTo: 420 });
    return;
  }

  if (kind === "king_bomb") {
    playTone(92, delay, 0.18, { type: "sine", gain: 0.08 * intensity, slideTo: 54 });
    playNoiseBurst(delay, 0.16, { filterType: "lowpass", frequency: 520, gain: 0.08 * intensity });
    return;
  }

  if (kind === "domino") {
    [360, 420, 480, 540].forEach((frequency, index) => {
      playTone(frequency, delay + index * 0.035, 0.06, { type: "triangle", gain: 0.03 * intensity });
    });
    return;
  }

  if (kind === "mirror_stone") {
    playTone(522, delay, 0.12, { type: "sine", gain: 0.035 * intensity, slideTo: 392 });
    playTone(522, delay + 0.055, 0.12, { type: "triangle", gain: 0.026 * intensity, slideTo: 784 });
    return;
  }

  if (kind === "laser_stone") {
    playTone(1240, delay, 0.13, { type: "sawtooth", gain: 0.028 * intensity, slideTo: 1880, filter: { frequency: 2200, q: 5 } });
    playNoiseBurst(delay + 0.035, 0.07, { filterType: "highpass", frequency: 3200, gain: 0.034 * intensity });
    return;
  }

  if (kind === "assassin_stone") {
    playTone(220, delay, 0.1, { type: "sine", gain: 0.03 * intensity, slideTo: 164 });
    playNoiseBurst(delay + 0.045, 0.05, { filterType: "bandpass", frequency: 1500, q: 9, gain: 0.035 * intensity });
    return;
  }

  if (kind === "split_stone") {
    [440, 554, 660].forEach((frequency, index) => {
      playTone(frequency, delay + index * 0.04, 0.075, { type: "triangle", gain: 0.026 * intensity });
    });
    return;
  }

  if (kind === "vampire_stone") {
    playTone(196, delay, 0.16, { type: "sawtooth", gain: 0.035 * intensity, slideTo: 392, filter: { frequency: 700, q: 4 } });
    playTone(98, delay + 0.07, 0.18, { type: "sine", gain: 0.048 * intensity, slideTo: 146 });
    return;
  }

  if (kind === "infectious_bomb") {
    playTone(250, delay, 0.12, { type: "sine", gain: 0.035 * intensity, slideTo: 410 });
    playTone(335, delay + 0.055, 0.12, { type: "sine", gain: 0.035 * intensity, slideTo: 520 });
    playNoiseBurst(delay + 0.04, 0.09, { filterType: "bandpass", frequency: 960, gain: 0.035 * intensity });
    return;
  }

  if (kind === "returning") {
    playNoiseBurst(delay, 0.15, { filterType: "bandpass", frequency: 880, q: 3, gain: 0.045 * intensity });
    playTone(784, delay, 0.14, { type: "sine", gain: 0.035 * intensity, slideTo: 392 });
  }
}

function playResultSound() {
  const winner = state.resultSummary?.winner;
  if (winner === "draw") {
    playTone(392, 0.18, 0.18, { type: "triangle", gain: 0.045 });
    playTone(392, 0.36, 0.22, { type: "triangle", gain: 0.045 });
    return;
  }

  const humanWon = winner === state.humanColor;
  const notes = humanWon ? [392, 523, 659, 1046] : [392, 330, 247, 196];
  notes.forEach((frequency, index) => {
    playTone(frequency, 0.18 + index * 0.12, 0.2, {
      type: humanWon ? "triangle" : "sine",
      gain: humanWon ? 0.048 : 0.038,
    });
  });
}

function scheduleBgmStep(step, time) {
  const context = audioEngine.context;
  if (!context || !audioEngine.bgmGain) return;

  const delay = Math.max(0, time - context.currentTime);
  const phrase = step % 16;
  const melody = [293.66, null, 349.23, null, 392, null, 349.23, 329.63, 293.66, null, 261.63, null, 329.63, null, 392, 440];
  const note = melody[phrase];

  if (phrase % 4 === 0) {
    const root = phrase < 8 ? 146.83 : 130.81;
    playTone(root, delay, 1.25, {
      type: "sine",
      gain: 0.025,
      destination: audioEngine.bgmGain,
      filter: { frequency: 420, q: 0.5 },
    });
    playTone(root * 1.5, delay + 0.02, 1.1, {
      type: "triangle",
      gain: 0.012,
      destination: audioEngine.bgmGain,
      filter: { frequency: 680, q: 0.5 },
    });
  }

  if (note) {
    playTone(note, delay, phrase % 8 === 7 ? 0.36 : 0.22, {
      type: "triangle",
      gain: 0.018,
      destination: audioEngine.bgmGain,
      filter: { frequency: 1350, q: 0.7 },
    });
  }
}

function normalizeRoomId(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
  return ROOM_ID_PATTERN.test(normalized) ? normalized : "";
}

function readSettingsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("mode");
  const playerParam = params.get("player");
  const difficultyParam = params.get("difficulty");
  const difficultyAliases = {
    random: "easy",
    tactical: "positional",
  };
  const requestedDifficulty = difficultyAliases[difficultyParam] ?? difficultyParam;
  const blockedParam = Number.parseInt(params.get("blocked") ?? "4", 10);
  const requestedMode = modeParam === "local" || modeParam === "online" ? modeParam : "cpu";
  const chaosParam = params.get("chaos");
  const chaosEnabled = requestedMode !== "online" && (chaosParam === null ? true : chaosParam === "1");

  return {
    mode: requestedMode,
    humanColor: playerParam === "white" ? "white" : "black",
    difficulty: DIFFICULTY_LABELS[requestedDifficulty] ? requestedDifficulty : "easy",
    blockedCount: clamp(Number.isFinite(blockedParam) ? blockedParam : 4, 0, 14),
    chaosEnabled,
    roomId: normalizeRoomId(params.get("room")),
    createRoom: params.get("create") === "1",
  };
}

function cloneRuleset(baseRules, settings) {
  const blackController =
    settings.mode === "cpu" && settings.humanColor === "white" ? "computer" : "human";
  const whiteController =
    settings.mode === "cpu" && settings.humanColor === "black" ? "computer" : "human";
  const randomBlockedCount = settings.mode === "online" && settings.roomId ? 0 : settings.blockedCount;

  return {
    ...baseRules,
    label: buildRulesetLabel(randomBlockedCount, settings.chaosEnabled),
    randomBlockedCount,
    chaosEnabled: settings.chaosEnabled,
    blockedCells: [...baseRules.blockedCells],
    players: {
      black: {
        ...baseRules.players.black,
        controller: blackController,
        powers: [...baseRules.players.black.powers],
        specialStoneDeck: [...baseRules.players.black.specialStoneDeck],
        power: null,
        specialStone: null,
      },
      white: {
        ...baseRules.players.white,
        controller: whiteController,
        powers: [...baseRules.players.white.powers],
        specialStoneDeck: [...baseRules.players.white.specialStoneDeck],
        power: null,
        specialStone: null,
      },
    },
  };
}

function buildRulesetLabel(randomBlockedCount, chaosEnabled) {
  if (chaosEnabled && randomBlockedCount > 0) return "카오스 변형 8x8";
  if (chaosEnabled) return "카오스 카드 8x8";
  return randomBlockedCount > 0 ? "변형 8x8" : CLASSIC_RULESET.label;
}

function createChaosState() {
  const groups = buildChaosLoadoutGroups();
  const tierScores = [...groups.keys()].filter((tierScore) => buildDistinctLoadoutPairs(groups.get(tierScore)).length > 0);
  const tierScore = tierScores[Math.floor(Math.random() * tierScores.length)];
  const pool = groups.get(tierScore);
  const [blackLoadout, whiteLoadout] = randomItem(buildDistinctLoadoutPairs(pool));

  return {
    enabled: true,
    tierScore,
    armedSpecialStone: null,
    targeting: null,
    reveal: null,
    revealTimer: null,
    effectKeys: [],
    effectMarks: [],
    scoreBonuses: { black: 0, white: 0 },
    bannedMoves: { black: [], white: [] },
    activeBuffs: { black: null, white: null },
    cornerContracts: { black: null, white: null },
    players: {
      black: createChaosPlayerState(blackLoadout),
      white: createChaosPlayerState(whiteLoadout),
    },
  };
}

function buildDistinctLoadoutPairs(pool) {
  const pairs = [];

  for (const blackLoadout of pool) {
    for (const whiteLoadout of pool) {
      if (blackLoadout === whiteLoadout) continue;
      if (blackLoadout.power === whiteLoadout.power) continue;
      if (blackLoadout.stone === whiteLoadout.stone) continue;
      pairs.push([blackLoadout, whiteLoadout]);
    }
  }

  return pairs;
}

function createChaosPlayerState(loadout) {
  return {
    power: {
      id: loadout.power,
      used: false,
      revealed: false,
      revealedAt: null,
    },
    specialStone: {
      id: loadout.stone,
      used: false,
      revealed: false,
      revealedAt: null,
    },
  };
}

function buildChaosLoadoutGroups() {
  const groups = new Map();

  for (const powerId of Object.keys(CHAOS_POWER_DEFS)) {
    for (const stoneId of Object.keys(CHAOS_STONE_DEFS)) {
      const key = loadoutKey(powerId, stoneId);
      const tierScore = CHAOS_POWER_DEFS[powerId].tier + CHAOS_STONE_DEFS[stoneId].tier;

      if (tierScore > CHAOS_MAX_TIER_SCORE || CHAOS_BANNED_LOADOUTS.has(key)) continue;

      if (!groups.has(tierScore)) groups.set(tierScore, []);
      groups.get(tierScore).push({ power: powerId, stone: stoneId, tierScore });
    }
  }

  return groups;
}

function loadoutKey(powerId, stoneId) {
  return `${powerId}+${stoneId}`;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createGame(settings = gameSettings) {
  clearPendingAi();
  gameSettings = settings;

  const rules = cloneRuleset(CLASSIC_RULESET, settings);
  const chaos = settings.chaosEnabled ? createChaosState() : { enabled: false };
  const board = createBoard(rules);

  state = {
    rules,
    chaos,
    board,
    current: "black",
    legalMoves: [],
    moveHistory: [],
    gameOver: false,
    message: `${PLAYERS.black.label}이 먼저 둡니다.`,
    aiDifficulty: settings.difficulty,
    humanColor: settings.humanColor,
    mode: settings.mode,
    aiTimer: null,
    aiThinking: false,
    interactionLocked: false,
    lastMove: null,
    startedAt: Date.now(),
    resultSummary: null,
    resultSaveAttempted: false,
    saveState: {
      label: "로그인 확인 중",
      detail: "Google 로그인 시 VS 컴퓨터 결과가 저장됩니다.",
    },
    online: {
      roomId: settings.roomId,
      shouldCreateRoom: settings.createRoom,
      seat: null,
      status: "offline",
      revision: 0,
      unsubscribe: null,
      inviteUrl: "",
      applyingRemote: false,
      initializing: false,
    },
  };

  syncSaveStateWithAuth();
  state.legalMoves = getPlayableMoves(state.board, state.current);
  render();
  if (state.mode === "online") {
    initializeOnlineRoom();
  }
}

function clearPendingAi() {
  if (state?.aiTimer) {
    window.clearTimeout(state.aiTimer);
    state.aiTimer = null;
  }
  if (state?.chaos?.revealTimer) {
    window.clearTimeout(state.chaos.revealTimer);
    state.chaos.revealTimer = null;
  }
  if (state?.online?.unsubscribe) {
    state.online.unsubscribe();
    state.online.unsubscribe = null;
  }
}

function createBoard(rules) {
  const board = Array.from({ length: rules.size }, () =>
    Array.from({ length: rules.size }, () => ({
      terrain: "open",
      piece: null,
    })),
  );

  const protectedCells = openingProtectedCells(rules.size).map(({ row, col }) => cellKey(row, col));
  const blockedCells = [
    ...rules.blockedCells,
    ...generateBlockedCells(rules.size, rules.randomBlockedCount, protectedCells),
  ];

  for (const { row, col } of blockedCells) {
    if (isInside(rules.size, row, col)) {
      board[row][col].terrain = "blocked";
    }
  }

  applyStartingLayout(board, rules);
  return board;
}

function standardStartCells(size) {
  const left = size / 2 - 1;
  const right = size / 2;

  return [
    { row: left, col: left, owner: "white" },
    { row: left, col: right, owner: "black" },
    { row: right, col: left, owner: "black" },
    { row: right, col: right, owner: "white" },
  ];
}

function openingProtectedCells(size) {
  const left = size / 2 - 1;
  const right = size / 2;

  return [
    ...standardStartCells(size),
    { row: left - 1, col: left },
    { row: left, col: left - 1 },
    { row: right, col: right + 1 },
    { row: right + 1, col: right },
    { row: left - 1, col: right },
    { row: left, col: right + 1 },
    { row: right, col: left - 1 },
    { row: right + 1, col: left },
  ].filter(({ row, col }) => isInside(size, row, col));
}

function applyStartingLayout(board, rules) {
  if (rules.startingLayout !== "standard") return;

  for (const { row, col, owner } of standardStartCells(rules.size)) {
    if (board[row][col].terrain === "open") {
      board[row][col].piece = createPiece(owner);
    }
  }
}

function generateBlockedCells(size, count, protectedKeys) {
  const blocked = [];
  const used = new Set(protectedKeys);

  while (blocked.length < count && used.size < size * size) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    const key = cellKey(row, col);

    if (used.has(key)) continue;
    used.add(key);
    blocked.push({ row, col });
  }

  return blocked;
}

function createPiece(owner, kind = "normal") {
  return {
    owner,
    kind,
    sourceOwner: owner,
    modifiers: [],
  };
}

function isInside(size, row, col) {
  return row >= 0 && col >= 0 && row < size && col < size;
}

function opponentOf(playerId) {
  return playerId === "black" ? "white" : "black";
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function getLegalMoves(board, playerId) {
  const moves = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      const { flips, lines } = getFlipAnalysisForMove(board, row, col, playerId);

      if (flips.length) {
        moves.push({ row, col, flips, lines });
      }
    }
  }

  return moves;
}

function getPlayableMoves(board, playerId) {
  const moves = getLegalMoves(board, playerId);
  const banned = new Set(state?.chaos?.bannedMoves?.[playerId] ?? []);

  if (!banned.size) return moves;
  return moves.filter((move) => !banned.has(cellKey(move.row, move.col)));
}

function getFlipsForMove(board, row, col, playerId) {
  return getFlipAnalysisForMove(board, row, col, playerId).flips;
}

function getFlipAnalysisForMove(board, row, col, playerId) {
  const size = board.length;
  const target = board[row]?.[col];

  if (!target || target.terrain !== "open" || target.piece) {
    return { flips: [], lines: [] };
  }

  const opponent = opponentOf(playerId);
  const allFlips = [];
  const lines = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let cursorRow = row + dr;
    let cursorCol = col + dc;

    while (isInside(size, cursorRow, cursorCol)) {
      const cell = board[cursorRow][cursorCol];

      if (cell.terrain === "blocked" || !cell.piece) {
        break;
      }

      if (cell.piece.owner === opponent) {
        line.push({ row: cursorRow, col: cursorCol });
        cursorRow += dr;
        cursorCol += dc;
        continue;
      }

      if (cell.piece.owner === playerId && line.length) {
        allFlips.push(...line);
        lines.push({ cells: line, dr, dc });
      }

      break;
    }
  }

  return { flips: allFlips, lines };
}

function isHumanTurn() {
  if (state.interactionLocked) return false;
  if (state.mode === "online") {
    return (
      !state.gameOver &&
      state.online.status === "playing" &&
      state.online.seat === state.current
    );
  }
  return state.rules.players[state.current].controller === "human" && !state.gameOver;
}

function isComputerTurn() {
  if (state.interactionLocked) return false;
  if (state.mode === "online") return false;
  return state.rules.players[state.current].controller === "computer" && !state.gameOver;
}

function applyMove(row, col) {
  if (!isHumanTurn()) return false;
  if (state.chaos?.targeting) return handleChaosTarget(row, col);
  return commitMove(row, col);
}

function commitMove(row, col, options = {}) {
  const move = state.legalMoves.find((candidate) => candidate.row === row && candidate.col === col);

  if (!move) return false;

  const playerId = state.current;
  const useSpecialStone = shouldPlaceSpecialStone(playerId, options);
  const pieceKind = useSpecialStone ? state.chaos.players[playerId].specialStone.id : "normal";
  const empoweredSpecialStone = useSpecialStone && state.chaos?.activeBuffs[playerId] === "double_cast";
  const flippedKeys = move.flips.map((flip) => cellKey(flip.row, flip.col));

  state.board[row][col].piece = createPiece(playerId, pieceKind);
  if (empoweredSpecialStone) {
    state.board[row][col].piece.modifiers.push("empowered");
  }

  if (useSpecialStone) {
    markSpecialStoneUsed(playerId, row, col, empoweredSpecialStone);
  }

  const triggeredStones = [];
  for (const flip of move.flips) {
    const cell = state.board[flip.row][flip.col];
    const previous = cell.piece ? { ...cell.piece } : null;
    const captured = capturePiece(cell, playerId, cellKey(flip.row, flip.col));
    if (captured && previous?.kind && previous.kind !== "normal") {
      triggeredStones.push({
        row: flip.row,
        col: flip.col,
        kind: previous.kind,
        previousOwner: previous.owner,
        sourceOwner: previous.sourceOwner ?? previous.owner,
      });
    }
  }

  const placedSpecialEffect = applyPlacedSpecialStoneEffect(playerId, row, col, pieceKind, move, empoweredSpecialStone);
  if (useSpecialStone) {
    appendSpecialStoneRevealDetail(playerId, pieceKind, placedSpecialEffect, empoweredSpecialStone);
  }
  const triggeredEffects = [];
  for (const trigger of triggeredStones) {
    const triggeredEffect = applyTriggeredSpecialStoneEffect(trigger, playerId);
    if (triggeredEffect) triggeredEffects.push(triggeredEffect);
  }
  appendTriggeredStoneRevealDetails(playerId, [...triggeredEffects, ...takeShieldBlockEffects()]);
  applyActivePowerMoveEffect(playerId, move);
  options.afterEffects?.({ playerId, move, row, col, pieceKind });
  appendTriggeredStoneRevealDetails(playerId, takeShieldBlockEffects());
  clearSpentDoubleCast(playerId, useSpecialStone);
  clearMoveBansFor(playerId);

  const moveAudio = {
    playerId,
    flipCount: move.flips.length,
    specialKind: useSpecialStone ? pieceKind : null,
    triggeredKinds: triggeredStones.map((trigger) => trigger.kind),
    gameOver: false,
  };

  state.lastMove = {
    placedKey: cellKey(row, col),
    flippedKeys,
    player: playerId,
  };

  state.moveHistory.push({
    player: playerId,
    row,
    col,
    flipped: move.flips.length,
    kind: pieceKind,
    tags: [...(useSpecialStone ? [empoweredSpecialStone ? "과충전 특수돌" : "특수돌"] : []), ...(options.tags ?? [])],
  });

  advanceTurn();
  moveAudio.gameOver = state.gameOver;
  playMoveSound(moveAudio);
  render();
  queueResultSave();
  if (state.mode === "online" && options.syncOnline !== false) {
    writeOnlineState();
  }
  return true;
}

function capturePiece(cell, owner, key = null) {
  if (!cell.piece) return false;

  if (cell.piece.owner !== owner && cell.piece.modifiers?.includes("shield")) {
    const shieldOwner = cell.piece.owner;
    cell.piece = {
      ...cell.piece,
      modifiers: cell.piece.modifiers.filter((modifier) => modifier !== "shield"),
    };
    recordShieldBlock(key, shieldOwner);
    return false;
  }

  if (cell.piece.owner === owner) return false;

  cell.piece = {
    ...cell.piece,
    owner,
  };
  return true;
}

function drawStoneKindFor(playerId) {
  const deck = state.rules.players[playerId].specialStoneDeck;
  return deck.shift() ?? "normal";
}

function shouldPlaceSpecialStone(playerId, options = {}) {
  if (!state.chaos?.enabled) return false;
  const specialStone = state.chaos.players[playerId]?.specialStone;
  if (!specialStone || specialStone.used) return false;
  return options.useSpecialStone === true || state.chaos.armedSpecialStone === playerId;
}

function markSpecialStoneUsed(playerId, row, col, empowered = false) {
  const specialStone = state.chaos.players[playerId].specialStone;
  specialStone.used = true;
  specialStone.revealed = true;
  specialStone.revealedAt = state.moveHistory.length + 1;
  if (SINGLE_TRIGGER_REVEAL_STONES.has(specialStone.id)) {
    specialStone.triggerRevealShown = true;
  }
  state.chaos.armedSpecialStone = null;

  const stoneDef = CHAOS_STONE_DEFS[specialStone.id];
  pushChaosReveal({
    player: playerId,
    family: "stone",
    id: specialStone.id,
    title: stoneDef.name,
    kicker: `${PLAYERS[playerId].label} ${empowered ? "과충전 특수돌" : "특수돌"} 공개`,
    text: `${formatCoordinate(row, col)} - ${stoneDef.revealText}`,
  });
}

function appendSpecialStoneRevealDetail(playerId, kind, effectDetail, empowered = false) {
  const reveal = state.chaos?.reveal;
  if (!reveal || reveal.family !== "stone" || reveal.player !== playerId || reveal.id !== kind) return;

  const details = [];
  if (effectDetail?.result) details.push(effectDetail.result);
  if (empowered && effectDetail?.empowered) details.push(`더블 캐스트 강화: ${effectDetail.empowered}`);
  if (!details.length) return;

  const summary = details.join(" ");
  const specialStone = state.chaos.players[playerId]?.specialStone;
  if (specialStone?.id === kind) {
    specialStone.effectSummary = summary;
  }
  const power = state.chaos.players[playerId]?.power;
  if (empowered && power?.id === "double_cast") {
    power.effectSummary = `${CHAOS_STONE_DEFS[kind]?.name ?? "특수돌"} 과충전 완료: ${effectDetail.empowered}`;
  }
  reveal.text = `${reveal.text} ${summary}`;
}

function appendTriggeredStoneRevealDetails(playerId, triggeredEffects) {
  if (!state.chaos?.enabled || !triggeredEffects.length) return;

  const summary = triggeredEffects.map((effect) => effect.result).join(" ");
  const revealableEffects = triggeredEffects.filter(shouldShowTriggeredStoneReveal);
  const reveal = state.chaos.reveal;
  if (reveal && revealableEffects.length) {
    reveal.text = `${reveal.text} 추가 발동: ${summary}`;
    return;
  }

  if (!revealableEffects.length) return;

  const first = revealableEffects[0];
  pushChaosReveal({
    player: playerId,
    family: "stone",
    id: first.kind,
    title: revealableEffects.length === 1 ? first.title : "특수돌 연쇄 발동",
    kicker: `${PLAYERS[playerId].label} 특수돌 발동`,
    text: revealableEffects.map((effect) => effect.result).join(" "),
  });
}

function shouldShowTriggeredStoneReveal(effect) {
  if (!effect?.kind || !SINGLE_TRIGGER_REVEAL_STONES.has(effect.kind)) return true;

  const owner = effect.owner ?? effect.effectOwner ?? effect.player;
  const specialStone = owner ? state.chaos?.players?.[owner]?.specialStone : null;
  if (!specialStone || specialStone.id !== effect.kind) return true;
  if (specialStone.triggerRevealShown) return false;

  specialStone.triggerRevealShown = true;
  return true;
}

function updateTriggeredStoneSummary(owner, kind, summary) {
  const specialStone = state.chaos?.players[owner]?.specialStone;
  if (!specialStone || specialStone.id !== kind) return;

  const base = specialStone.effectSummary?.split(" 나중에 발동:")[0] ?? "";
  specialStone.effectSummary = `${base ? `${base} ` : ""}나중에 발동: ${summary}`;
}

function recordShieldBlock(key, shieldOwner) {
  if (!state.chaos?.enabled || !key) return;

  const [row, col] = key.split(":").map(Number);
  markChaosEffectKey(key, "shield", "방어", "shield");
  if (!state.chaos.pendingShieldBlocks) state.chaos.pendingShieldBlocks = [];
  state.chaos.pendingShieldBlocks.push({
    kind: "shield",
    title: "보호막",
    result: `보호막 발동: ${formatCoordinate(row, col)}의 ${PLAYERS[shieldOwner].label} 돌이 뒤집힘 1회를 막았습니다.`,
  });
}

function takeShieldBlockEffects() {
  if (!state.chaos?.pendingShieldBlocks?.length) return [];

  const effects = state.chaos.pendingShieldBlocks;
  state.chaos.pendingShieldBlocks = [];
  return effects;
}

function markChaosEffect(row, col, type = "pulse", label = "", source = "") {
  if (!state.chaos?.enabled || !isInside(state.board.length, row, col)) return;
  markChaosEffectKey(cellKey(row, col), type, label, source);
}

function markChaosEffectKey(key, type = "pulse", label = "", source = "") {
  if (!state.chaos?.enabled || !key) return;

  state.chaos.effectKeys.push(key);
  state.chaos.effectMarks.push({ key, type, label, source });
}

function markSpecialStonePlacedEffect(row, col, kind) {
  const label = {
    supernova: "초신성",
    lottery: "복권",
    throne: "왕좌",
    seizure: "압류",
    jackpot: "잭팟",
    magnet: "자석",
    king_bomb: "대폭발",
    domino: "도미노",
    infectious_bomb: "전염",
    mirror_stone: "거울",
    laser_stone: "레이저",
    assassin_stone: "암살",
    split_stone: "분열",
    vampire_stone: "흡혈",
  }[kind] ?? "특수";
  markChaosEffect(row, col, kind, label, kind);
}

function applyPlacedSpecialStoneEffect(playerId, row, col, kind, move, empowered = false) {
  if (!state.chaos?.enabled || kind === "normal") return null;
  markSpecialStonePlacedEffect(row, col, kind);

  if (kind === "domino") {
    const converted = applyDominoStoneEffect(playerId, move, empowered);
    return {
      result: `실제 효과: 도미노 연쇄로 상대 돌 ${converted}개를 추가로 바꿨습니다.`,
      empowered: "연쇄 상한이 4개에서 6개로 증가했습니다.",
    };
  }

  if (kind === "magnet") {
    const converted = pullDirectionalTargets(row, col, playerId, empowered ? 5 : 4, {
      directions: DIRECTIONS,
      effectType: "magnet",
      effectLabel: "자석",
      effectSource: "magnet",
    });
    state.board[row][col].piece.modifiers.push("shield");
    return {
      result: `실제 효과: 8방향의 가까운 상대 돌 ${converted}개를 끌어당기고 보호막 1회를 얻었습니다.`,
      empowered: "끌어당기는 상한이 4개에서 5개로 증가했습니다.",
    };
  }

  if (kind === "lottery") {
    return applyLotteryStoneEffect(row, col, playerId, empowered);
  }

  if (kind === "supernova") {
    const converted = convertAdjacentPieces(row, col, playerId, {
      max: empowered ? 2 : 1,
      opponentOnly: true,
      normalOnly: true,
      effectType: "blast",
      effectLabel: "충격",
      effectSource: "supernova",
    });
    return {
      result: `실제 효과: 주변 상대 일반돌 ${converted.length}개를 즉시 바꿨습니다.`,
      empowered: "즉시 전환 상한이 1개에서 2개로 증가했습니다.",
    };
  }

  if (kind === "king_bomb") {
    const converted = convertCrossOpponentPieces(row, col, playerId, empowered ? 3 : 2, {
      effectType: "blast",
      effectLabel: "폭발",
      effectSource: "king_bomb",
    });
    return {
      result: `실제 효과: 같은 행/열 상대 돌 ${converted}개를 즉시 바꿨습니다.`,
      empowered: "즉시 전환 상한이 2개에서 3개로 증가했습니다.",
    };
  }

  if (kind === "jackpot") {
    const immediate = convertAdjacentPieces(row, col, playerId, {
      max: empowered ? 2 : 1,
      opponentOnly: true,
      normalOnly: false,
      effectType: "jackpot",
      effectLabel: "당첨",
      effectSource: "jackpot",
    });
    state.board[row][col].piece.modifiers.push("shield");
    state.board[row][col].piece.countdown = 1;
    state.board[row][col].piece.jackpotFlips = empowered ? 4 : 3;
    return {
      result: `실제 효과: 즉시 주변 상대 돌 ${immediate.length}개를 바꾸고 보호막을 얻었습니다. 다음 턴 큰 잭팟이 최대 ${empowered ? 4 : 3}개 터집니다.`,
      empowered: "즉시 당첨 상한이 1개에서 2개로 늘고, 큰 잭팟 상한이 3개에서 4개로 증가했습니다.",
    };
  }

  if (kind === "seizure") {
    const claimLine = chooseSeizureLine(row, col, playerId);
    state.board[row][col].piece.claimLine = claimLine;
    state.board[row][col].piece.claimPoints = empowered ? 4 : 3;
    return {
      result: `실제 효과: ${claimLine === "row" ? "행" : "열"}을 압류했고, 종료 시 우세하면 +${empowered ? 4 : 3}점을 얻습니다.`,
      empowered: "압류 보너스가 +3점에서 +4점으로 증가했습니다.",
    };
  }

  if (kind === "infectious_bomb") {
    const targets = shuffle(
      adjacentCells(row, col).filter((target) => {
        const cell = state.board[target.row]?.[target.col];
        return cell?.piece?.owner === opponentOf(playerId) && cell.piece.kind === "normal";
      }),
    ).slice(0, empowered ? 3 : 2);

    for (const target of targets) {
      const cell = state.board[target.row][target.col];
      cell.piece = {
        ...cell.piece,
        kind: "infectious_bomb",
        sourceOwner: playerId,
      };
      markChaosEffect(target.row, target.col, "infection", "표식", "infectious_bomb");
    }
    return {
      result: `실제 효과: 주변 상대 일반돌 ${targets.length}개에 전염 표식을 심었습니다.`,
      empowered: "전염 표식 상한이 2개에서 3개로 증가했습니다.",
    };
  }

  if (kind === "throne" && empowered) {
    state.board[row][col].piece.modifiers.push("shield");
    const guarded = convertAdjacentPieces(row, col, playerId, {
      max: 3,
      opponentOnly: true,
      normalOnly: false,
      effectType: "throne",
      effectLabel: "호위",
      effectSource: "throne",
    });
    return {
      result: `실제 효과: 왕좌돌에 보호막 1회가 추가되고 주변 상대 돌 ${guarded.length}개가 호위 반전됐습니다.`,
      empowered: "호위 반전 상한이 2개에서 3개로 증가했습니다.",
    };
  }

  if (kind === "throne") {
    state.board[row][col].piece.modifiers.push("shield");
    const guarded = convertAdjacentPieces(row, col, playerId, {
      max: 2,
      opponentOnly: true,
      normalOnly: false,
      effectType: "throne",
      effectLabel: "호위",
      effectSource: "throne",
    });
    return {
      result: `실제 효과: 보호막 1회를 얻고 주변 상대 돌 ${guarded.length}개를 호위 반전했습니다. 종료 시 가장자리에 남아 있으면 최종 소유자가 +5점을 얻습니다.`,
      empowered: null,
    };
  }

  if (kind === "mirror_stone") {
    return applyMirrorStoneEffect(playerId, row, col, empowered);
  }

  if (kind === "laser_stone") {
    const converted = pierceLaserTargets(row, col, playerId, empowered ? 7 : 6, {
      effectType: "laser_stone",
      effectLabel: "레이저",
      effectSource: "laser_stone",
    });
    state.board[row][col].piece.modifiers.push("shield");
    return {
      result: `실제 효과: 8방향 레이저가 라인 위 상대 돌 ${converted}개를 관통 반전하고 보호막을 얻었습니다.`,
      empowered: "레이저 상한이 6개에서 7개로 증가했습니다.",
    };
  }

  if (kind === "assassin_stone") {
    return applyAssassinStoneEffect(playerId, row, col, empowered);
  }

  if (kind === "split_stone") {
    return applySplitStoneEffect(playerId, row, col, empowered);
  }

  if (kind === "vampire_stone") {
    const max = Math.min(empowered ? 6 : 5, Math.max(2, Math.ceil(move.flips.length / 2)));
    const converted = convertAdjacentPieces(row, col, playerId, {
      max,
      opponentOnly: true,
      normalOnly: false,
      effectType: "vampire_stone",
      effectLabel: "흡혈",
      effectSource: "vampire_stone",
    });
    if (!converted.length) {
      state.board[row][col].piece.modifiers.push("shield");
    }
    return {
      result: converted.length
        ? `실제 효과: 이번 착수의 뒤집힘을 먹고 주변 상대 돌 ${converted.length}개를 추가로 흡혈했습니다.`
        : "실제 효과: 흡혈할 상대 돌이 없어 보호막 1회를 얻었습니다.",
      empowered: "흡혈 상한이 5개에서 6개로 증가했습니다.",
    };
  }

  return null;
}

function applyDominoStoneEffect(playerId, move, empowered = false) {
  let converted = 0;
  const cap = empowered ? 6 : 4;

  for (const line of move.lines ?? []) {
    const last = line.cells[line.cells.length - 1];
    let cursorRow = last.row + line.dr;
    let cursorCol = last.col + line.dc;
    let chain = 0;

    while (isInside(state.board.length, cursorRow, cursorCol) && chain < 3 && converted < cap) {
      const cell = state.board[cursorRow][cursorCol];
      if (cell.terrain !== "open" || cell.piece?.owner !== opponentOf(playerId)) break;

      const key = cellKey(cursorRow, cursorCol);
      if (!capturePiece(cell, playerId, key)) break;
      markChaosEffectKey(key, "chain", "연쇄", "domino");
      converted += 1;
      chain += 1;
      cursorRow += line.dr;
      cursorCol += line.dc;
    }
  }

  return converted;
}

function applyTriggeredSpecialStoneEffect(trigger, newOwner) {
  const { row, col, kind } = trigger;
  const effectOwner = trigger.sourceOwner ?? trigger.previousOwner ?? newOwner;

  if (kind === "supernova") {
    const converted = convertAdjacentPieces(row, col, effectOwner, {
      max: 4,
      opponentOnly: false,
      normalOnly: true,
      effectType: "blast",
      effectLabel: "폭발",
      effectSource: "supernova",
    });
    state.board[row][col] = { terrain: "blocked", piece: null };
    markChaosEffect(row, col, "hole", "구멍", "supernova");
    const result = `초신성돌 발동: ${formatCoordinate(row, col)} 주변 일반돌 ${converted.length}개를 ${PLAYERS[effectOwner].label} 색으로 바꾸고, 해당 칸은 구멍이 됐습니다.`;
    updateTriggeredStoneSummary(effectOwner, kind, result);
    return {
      kind,
      owner: effectOwner,
      title: CHAOS_STONE_DEFS[kind].name,
      result,
    };
  }

  if (kind === "king_bomb") {
    const converted = convertCrossPieces(row, col, effectOwner, 6, {
      effectType: "blast",
      effectLabel: "폭발",
      effectSource: "king_bomb",
    });
    if (state.board[row]?.[col].piece) {
      state.board[row][col].piece.kind = "normal";
      state.board[row][col].piece.sourceOwner = state.board[row][col].piece.owner;
    }
    const result = `대폭발돌 발동: ${formatCoordinate(row, col)}의 같은 행/열 돌 ${converted}개를 ${PLAYERS[effectOwner].label} 색으로 바꿨습니다.`;
    updateTriggeredStoneSummary(effectOwner, kind, result);
    return {
      kind,
      owner: effectOwner,
      title: CHAOS_STONE_DEFS[kind].name,
      result,
    };
  }

  if (kind === "infectious_bomb") {
    const converted = convertAdjacentPieces(row, col, effectOwner, {
      max: 1,
      opponentOnly: true,
      normalOnly: false,
      effectType: "infection",
      effectLabel: "전염",
      effectSource: "infectious_bomb",
    });
    if (state.board[row]?.[col].piece) {
      state.board[row][col].piece.kind = "normal";
      state.board[row][col].piece.sourceOwner = state.board[row][col].piece.owner;
    }
    for (const key of converted) {
      const [targetRow, targetCol] = key.split(":").map(Number);
      if (state.board[targetRow][targetCol].piece) {
        state.board[targetRow][targetCol].piece.kind = "infectious_bomb";
        state.board[targetRow][targetCol].piece.sourceOwner = effectOwner;
      }
    }
    const result = `전염폭탄돌 발동: ${formatCoordinate(row, col)} 표식이 터져 주변 상대 돌 ${converted.length}개를 ${PLAYERS[effectOwner].label} 색으로 바꾸고, 새 전염 표식을 옮겼습니다.`;
    updateTriggeredStoneSummary(effectOwner, kind, result);
    return {
      kind,
      owner: effectOwner,
      title: CHAOS_STONE_DEFS[kind].name,
      result,
    };
  }

  return null;
}

function applyActivePowerMoveEffect(playerId, move) {
  if (!state.chaos?.enabled) return;

  if (state.chaos.activeBuffs[playerId] !== "ownership_frenzy") return;

  const candidates = new Map();
  for (const flip of move.flips) {
    for (const { row, col } of adjacentCells(flip.row, flip.col)) {
      const cell = state.board[row]?.[col];
      if (!cell?.piece || cell.piece.owner === playerId) continue;
      if (isCornerCell(state.board.length, row, col)) continue;
      candidates.set(cellKey(row, col), { row, col });
    }
  }

  const selected = shuffle([...candidates.values()]).slice(0, 4);
  let converted = 0;
  for (const target of selected) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], playerId, key)) {
      markChaosEffectKey(key, "frenzy", "폭주", "ownership_frenzy");
      converted += 1;
    }
  }

  const power = state.chaos.players[playerId]?.power;
  if (power?.id === "ownership_frenzy") {
    power.effectSummary = `실제 효과: 착수 뒤 인접 상대 돌 ${converted}개를 추가로 바꿨습니다.`;
  }
  state.chaos.activeBuffs[playerId] = null;
}

function tickChaosStoneCountdowns(playerId) {
  if (!state.chaos?.enabled) return [];
  const effects = [];

  forEachBoardCell((cell, row, col) => {
    if (cell.piece?.kind !== "jackpot" || cell.piece.owner !== playerId) return;
    if (!Number.isFinite(cell.piece.countdown)) return;

    cell.piece.countdown -= 1;
    if (cell.piece.countdown <= 0) {
      const converted = convertAdjacentPieces(row, col, playerId, {
        max: cell.piece.jackpotFlips ?? 3,
        opponentOnly: true,
        normalOnly: true,
        effectType: "jackpot",
        effectLabel: "잭팟",
        effectSource: "jackpot",
      });
      delete cell.piece.countdown;
      delete cell.piece.jackpotFlips;
      markChaosEffect(row, col, "jackpot", "발동", "jackpot");
      const result = `잭팟돌 발동: ${formatCoordinate(row, col)} 주변 상대 일반돌 ${converted.length}개를 ${PLAYERS[playerId].label} 색으로 바꿨습니다.`;
      updateTriggeredStoneSummary(playerId, "jackpot", result);
      effects.push({
        kind: "jackpot",
        owner: playerId,
        title: CHAOS_STONE_DEFS.jackpot.name,
        result,
      });
    }
  });

  return effects;
}

function clearSpentDoubleCast(playerId, usedSpecialStone) {
  if (!state.chaos?.enabled || state.chaos.activeBuffs[playerId] !== "double_cast") return;
  if (usedSpecialStone) state.chaos.activeBuffs[playerId] = null;
}

function clearMoveBansFor(playerId) {
  if (!state.chaos?.enabled) return;
  state.chaos.bannedMoves[playerId] = [];
}

function convertAdjacentPieces(row, col, owner, options = {}) {
  const max = options.max ?? 3;
  const converted = [];
  const candidates = shuffle(
    adjacentCells(row, col).filter((candidate) => {
      const cell = state.board[candidate.row]?.[candidate.col];
      if (!cell?.piece) return false;
      if (options.opponentOnly && cell.piece.owner === owner) return false;
      if (options.normalOnly && cell.piece.kind !== "normal") return false;
      return true;
    }),
  );

  for (const target of candidates.slice(0, max)) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(
        key,
        options.effectType ?? "convert",
        options.effectLabel ?? "전환",
        options.effectSource ?? options.source ?? options.effectType ?? "convert",
      );
      converted.push(key);
    }
  }

  return converted;
}

function convertCrossPieces(row, col, owner, max, options = {}) {
  const targets = [];

  for (let index = 0; index < state.board.length; index += 1) {
    if (index !== col && state.board[row][index].piece) targets.push({ row, col: index });
    if (index !== row && state.board[index][col].piece) targets.push({ row: index, col });
  }

  const selected = shuffle(targets).slice(0, max);
  let converted = 0;
  for (const target of selected) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(
        key,
        options.effectType ?? "blast",
        options.effectLabel ?? "폭발",
        options.effectSource ?? options.source ?? options.effectType ?? "blast",
      );
      converted += 1;
    }
  }

  return converted;
}

function convertCrossOpponentPieces(row, col, owner, max, options = {}) {
  const targets = [];
  const opponent = opponentOf(owner);

  for (let index = 0; index < state.board.length; index += 1) {
    if (index !== col && state.board[row][index].piece?.owner === opponent) targets.push({ row, col: index });
    if (index !== row && state.board[index][col].piece?.owner === opponent) targets.push({ row: index, col });
  }

  const selected = shuffle(targets).slice(0, max);
  let converted = 0;
  for (const target of selected) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(
        key,
        options.effectType ?? "blast",
        options.effectLabel ?? "폭발",
        options.effectSource ?? options.source ?? options.effectType ?? "blast",
      );
      converted += 1;
    }
  }

  return converted;
}

function chooseSeizureLine(row, col, owner) {
  const rowScore =
    countLinePieces(state.board, row, col, "row", owner) -
    countLinePieces(state.board, row, col, "row", opponentOf(owner));
  const colScore =
    countLinePieces(state.board, row, col, "col", owner) -
    countLinePieces(state.board, row, col, "col", opponentOf(owner));

  return rowScore >= colScore ? "row" : "col";
}

function pullMagnetTargets(row, col, owner, maxPulls = 4) {
  const targets = [];

  for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    let cursorRow = row + dr;
    let cursorCol = col + dc;

    while (isInside(state.board.length, cursorRow, cursorCol)) {
      const cell = state.board[cursorRow][cursorCol];
      if (cell.terrain === "blocked") break;
      if (cell.piece) {
        if (cell.piece.owner !== owner) targets.push({ row: cursorRow, col: cursorCol });
        break;
      }
      cursorRow += dr;
      cursorCol += dc;
    }
  }

  const selected = targets.slice(0, maxPulls);
  let converted = 0;
  for (const target of selected) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(key, "magnet", "자석", "magnet");
      converted += 1;
    }
  }

  return converted;
}

function pullDirectionalTargets(row, col, owner, maxPulls = 4, options = {}) {
  const targets = [];
  const directions = options.directions ?? [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of directions) {
    let cursorRow = row + dr;
    let cursorCol = col + dc;

    while (isInside(state.board.length, cursorRow, cursorCol)) {
      const cell = state.board[cursorRow][cursorCol];
      if (cell.terrain === "blocked") break;
      if (cell.piece) {
        if (cell.piece.owner !== owner) {
          targets.push({
            row: cursorRow,
            col: cursorCol,
            score: getPositionWeight(state.board, cursorRow, cursorCol),
          });
        }
        break;
      }
      cursorRow += dr;
      cursorCol += dc;
    }
  }

  targets.sort((left, right) => right.score - left.score);
  let converted = 0;
  for (const target of targets.slice(0, maxPulls)) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(
        key,
        options.effectType ?? "magnet",
        options.effectLabel ?? "자석",
        options.effectSource ?? options.source ?? options.effectType ?? "magnet",
      );
      converted += 1;
    }
  }

  return converted;
}

function pierceLaserTargets(row, col, owner, maxHits = 6, options = {}) {
  const targets = [];

  for (const [dr, dc] of DIRECTIONS) {
    let cursorRow = row + dr;
    let cursorCol = col + dc;

    while (isInside(state.board.length, cursorRow, cursorCol)) {
      const cell = state.board[cursorRow][cursorCol];
      if (cell.terrain === "blocked") break;
      if (cell.piece?.owner === opponentOf(owner)) {
        targets.push({
          row: cursorRow,
          col: cursorCol,
          score: getPositionWeight(state.board, cursorRow, cursorCol),
        });
      }
      cursorRow += dr;
      cursorCol += dc;
    }
  }

  targets.sort((left, right) => right.score - left.score);
  let converted = 0;
  for (const target of targets.slice(0, maxHits)) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(
        key,
        options.effectType ?? "laser_stone",
        options.effectLabel ?? "레이저",
        options.effectSource ?? options.source ?? "laser_stone",
      );
      converted += 1;
    }
  }

  return converted;
}

function applyMirrorStoneEffect(owner, row, col, empowered = false) {
  const mirror = {
    row: state.board.length - 1 - row,
    col: state.board.length - 1 - col,
  };
  const candidates = [
    mirror,
    ...adjacentCells(mirror.row, mirror.col).sort(
      (left, right) =>
        Math.abs(left.row - mirror.row) + Math.abs(left.col - mirror.col) -
        (Math.abs(right.row - mirror.row) + Math.abs(right.col - mirror.col)),
    ),
  ].filter((target) => state.board[target.row]?.[target.col]?.piece?.owner === opponentOf(owner));

  let converted = 0;
  for (const target of candidates.slice(0, empowered ? 5 : 4)) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(key, "mirror_stone", "거울", "mirror_stone");
      converted += 1;
    }
  }

  const fallback = converted >= 4
    ? []
    : convertAdjacentPieces(row, col, owner, {
        max: 4 - converted,
        opponentOnly: true,
        normalOnly: false,
        effectType: "mirror_stone",
        effectLabel: "반사",
        effectSource: "mirror_stone",
      });
  converted += fallback.length;
  markChaosEffect(mirror.row, mirror.col, "mirror_stone", "거울상", "mirror_stone");

  if (!converted) {
    state.board[row][col].piece.modifiers.push("shield");
  }

  return {
    result: converted
      ? `실제 효과: 대칭 위치와 착수 지점 주변의 상대 돌 ${converted}개를 거울 반전했습니다.`
      : "실제 효과: 대칭 위치에 반전할 상대 돌이 없어 보호막 1회를 얻었습니다.",
    empowered: "거울 반전 상한이 4개에서 5개로 증가했습니다.",
  };
}

function applyAssassinStoneEffect(owner, row, col, empowered = false) {
  const candidates = [];
  const range = empowered ? 4 : 3;

  for (let targetRow = Math.max(0, row - range); targetRow <= Math.min(state.board.length - 1, row + range); targetRow += 1) {
    for (let targetCol = Math.max(0, col - range); targetCol <= Math.min(state.board.length - 1, col + range); targetCol += 1) {
      if (targetRow === row && targetCol === col) continue;
      const cell = state.board[targetRow][targetCol];
      if (cell.piece?.owner !== opponentOf(owner)) continue;
      candidates.push({
        row: targetRow,
        col: targetCol,
        score:
          getPositionWeight(state.board, targetRow, targetCol) +
          (cell.piece.kind !== "normal" ? 45 : 0) +
          (isCornerCell(state.board.length, targetRow, targetCol) ? 80 : 0),
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  let converted = 0;
  for (const target of candidates.slice(0, 2)) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], owner, key)) {
      markChaosEffectKey(key, "assassin_stone", "암살", "assassin_stone");
      converted += 1;
    }
  }

  if (!converted) {
    state.board[row][col].piece.modifiers.push("shield");
  }

  return {
    result: converted
      ? `실제 효과: 근처 고가치 상대 돌 ${converted}개를 암살 반전했습니다.`
      : "실제 효과: 암살할 상대 돌이 없어 보호막 1회를 얻었습니다.",
    empowered: "암살 탐지 범위가 3칸에서 4칸으로 증가했습니다.",
  };
}

function applySplitStoneEffect(owner, row, col, empowered = false) {
  const emptyTargets = adjacentCells(row, col)
    .filter((target) => {
      const cell = state.board[target.row]?.[target.col];
      return cell?.terrain === "open" && !cell.piece && !isCornerCell(state.board.length, target.row, target.col);
    })
    .sort((left, right) => getPositionWeight(state.board, right.row, right.col) - getPositionWeight(state.board, left.row, left.col));

  const cap = empowered ? 3 : 2;
  let created = 0;
  for (const target of emptyTargets.slice(0, cap)) {
    state.board[target.row][target.col].piece = createPiece(owner);
    markChaosEffect(target.row, target.col, "split_stone", "분열", "split_stone");
    created += 1;
  }

  const converted = convertAdjacentPieces(row, col, owner, {
    max: 1,
    opponentOnly: true,
    normalOnly: false,
    effectType: "split_stone",
    effectLabel: "파편",
    effectSource: "split_stone",
  });

  if (!created) {
    return {
      result: `실제 효과: 복제할 빈칸이 없어 주변 상대 돌 ${converted.length}개를 분열 반전했습니다.`,
      empowered: "분열 복제 상한이 2개에서 3개로 증가했습니다.",
    };
  }

  return {
    result: `실제 효과: 주변 빈칸 ${created}곳에 내 일반돌을 복제하고 주변 상대 돌 ${converted.length}개를 파편 반전했습니다.`,
    empowered: "분열 복제 상한이 2개에서 3개로 증가했습니다.",
  };
}

function applyLotteryStoneEffect(row, col, owner, empowered = false) {
  const roll = Math.floor(Math.random() * 3);
  const empoweredText = {
    convert: "주변 전환 상한이 2개에서 3개로 증가했습니다.",
    shield: "보호막 결과에 주변 상대 돌 1개 전환이 추가되었습니다.",
    ban: "착수 봉인 상한이 2칸에서 3칸으로 증가했습니다.",
  };

  if (roll === 0) {
    const converted = convertAdjacentPieces(row, col, owner, {
      max: empowered ? 3 : 2,
      opponentOnly: true,
      normalOnly: false,
      effectSource: "lottery",
    });
    if (!converted.length) {
      state.board[row][col].piece.modifiers.push("shield");
      return {
        result: "복권 결과: 주변 전환 후보가 없어 보호막 1회를 얻었습니다.",
        empowered: empoweredText.convert,
      };
    }
    return {
      result: `복권 결과: 주변 전환 - 상대 돌 ${converted.length}개를 바꿨습니다.`,
      empowered: empoweredText.convert,
    };
  } else if (roll === 1) {
    state.board[row][col].piece.modifiers.push("shield");
    const converted = empowered
      ? convertAdjacentPieces(row, col, owner, {
          max: 1,
          opponentOnly: true,
          normalOnly: false,
          effectSource: "lottery",
        })
      : [];
    return {
      result: empowered
        ? `복권 결과: 보호막 - 보호막 1회를 얻고 주변 상대 돌 ${converted.length}개를 바꿨습니다.`
        : "복권 결과: 보호막 - 이 돌이 다음 뒤집힘 1회를 막습니다.",
      empowered: empoweredText.shield,
    };
  } else {
    const opponent = opponentOf(owner);
    const moves = getPlayableMoves(state.board, opponent)
      .filter((move) => Math.abs(move.row - row) <= 1 && Math.abs(move.col - col) <= 1)
      .slice(0, empowered ? 3 : 2);
    state.chaos.bannedMoves[opponent] = moves.map((move) => cellKey(move.row, move.col));
    for (const move of moves) {
      markChaosEffect(move.row, move.col, "lottery", "봉인", "lottery");
    }
    if (moves.length) {
      return {
        result: `복권 결과: 착수 봉인 - 상대 다음 합법 수 ${moves.length}개를 막았습니다.`,
        empowered: empoweredText.ban,
      };
    }

    const converted = convertAdjacentPieces(row, col, owner, {
      max: 1,
      opponentOnly: true,
      normalOnly: false,
      effectSource: "lottery",
    });
    if (converted.length) {
      return {
        result: "복권 결과: 착수 봉인 후보가 없어 주변 상대 돌 1개를 바꿨습니다.",
        empowered: empoweredText.ban,
      };
    }

    state.board[row][col].piece.modifiers.push("shield");
    return {
      result: "복권 결과: 착수 봉인 후보와 전환 대상이 없어 보호막 1회를 얻었습니다.",
      empowered: empoweredText.ban,
    };
  }

  return null;
}

function adjacentCells(row, col) {
  return DIRECTIONS.map(([dr, dc]) => ({ row: row + dr, col: col + dc })).filter(({ row: targetRow, col: targetCol }) =>
    isInside(state.board.length, targetRow, targetCol),
  );
}

function forEachBoardCell(callback) {
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board.length; col += 1) {
      callback(state.board[row][col], row, col);
    }
  }
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function activateChaosPower(playerId) {
  if (!canAttemptChaosPower(playerId)) return;

  const powerState = state.chaos.players[playerId].power;
  const powerDef = CHAOS_POWER_DEFS[powerState.id];
  const activeTargeting = state.chaos.targeting;

  if (activeTargeting?.player === playerId && activeTargeting.powerId === powerDef.id) {
    state.chaos.targeting = null;
    state.message = `${powerDef.name} 발동을 취소했습니다.`;
    render();
    return;
  }

  const readiness = getChaosPowerReadiness(playerId, powerDef.id);
  if (!readiness.ok) {
    state.chaos.targeting = null;
    invalidChaosAction(readiness.message);
    render();
    return;
  }

  if (
    [
      "cell",
      "empty",
      "cornerReserve",
      "legalMove",
      "auctionPair",
      "opponentMove",
      "ownPiece",
      "opponentPiece",
      "gravityCell",
      "lineCell",
    ].includes(powerDef.target)
  ) {
    state.chaos.targeting = {
      player: playerId,
      powerId: powerDef.id,
      selected: [],
    };
    state.message = buildPowerTargetMessage(powerDef);
    render();
    return;
  }

  applyChaosPower(playerId, powerDef.id);
}

function canAttemptChaosPower(playerId) {
  if (!state.chaos?.enabled || state.gameOver || state.interactionLocked) return false;
  if (state.current !== playerId || !isHumanTurn()) return false;
  const powerState = state.chaos.players[playerId]?.power;
  if (powerState?.id === "double_cast" && state.chaos.players[playerId]?.specialStone.used) return false;
  return Boolean(powerState && !powerState.used);
}

function canUseChaosPower(playerId) {
  return getChaosPowerReadiness(playerId).ok;
}

function getChaosPowerReadiness(playerId, powerId = state.chaos?.players[playerId]?.power?.id, options = {}) {
  if (!state.chaos?.enabled) return { ok: false, message: "카오스 카드가 꺼져 있습니다." };
  if (state.gameOver) return { ok: false, message: "이미 종료된 게임입니다." };
  if (state.interactionLocked) return { ok: false, message: "카드 공개가 끝난 뒤 사용할 수 있습니다." };
  if (state.current !== playerId || (!options.allowComputer && !isHumanTurn())) {
    return { ok: false, message: "내 차례에만 초능력을 쓸 수 있습니다." };
  }

  const powerState = state.chaos.players[playerId]?.power;
  if (!powerState || !powerId) return { ok: false, message: "사용할 초능력이 없습니다." };
  if (powerState.used) return { ok: false, message: "이미 사용한 초능력입니다." };

  if (powerId === "board_flip" && countBoardFlipMovablePieces() <= 0) {
    return { ok: false, message: "판갈이는 이동할 돌이 있을 때만 쓸 수 있습니다." };
  }

  if (powerId === "eclipse_3x3" && !hasEclipseTarget(playerId)) {
    return { ok: false, message: "3x3 일식으로 바꿀 상대 일반돌이 있는 구역이 없습니다." };
  }

  if (powerId === "black_hole" && !hasBlackHoleTarget(playerId)) {
    return { ok: false, message: "블랙홀은 비가장자리 빈 칸 주변에 상대 돌이 2개 이상 있을 때만 쓸 수 있습니다." };
  }

  if (powerId === "corner_contract" && !hasCornerContractTarget()) {
    return { ok: false, message: "예약할 빈 모서리가 없습니다." };
  }

  if (powerId === "final_auction") {
    if (countOpenEmptyCells() > 18) {
      return { ok: false, message: "마지막 경매는 빈 칸이 18개 이하일 때만 쓸 수 있습니다." };
    }
    if (getAuctionCandidateMoves().length < 2) {
      return { ok: false, message: "마지막 경매는 비모서리 합법 수가 2개 이상일 때만 쓸 수 있습니다." };
    }
  }

  if (powerId === "comeback_swing") {
    const score = countRawPieces(state.board);
    const opponent = opponentOf(playerId);
    if (score[opponent] - score[playerId] < 8) {
      return { ok: false, message: "역전세는 8개 이상 밀릴 때만 쓸 수 있습니다." };
    }
    if (!getComebackCandidates(playerId).length) {
      return { ok: false, message: "가져올 수 있는 상대 돌이 없습니다." };
    }
  }

  if (powerId === "move_ban") {
    const moveBan = getMoveBanReadiness(playerId);
    if (!moveBan.ok) return moveBan;
  }

  if (powerId === "destiny_move" && !hasDestinyTarget(playerId)) {
    return { ok: false, message: "운명 표식을 붙일 내 비가장자리 돌이 없습니다." };
  }

  if (powerId === "chain_lightning" && !hasChainLightningTarget(playerId)) {
    return { ok: false, message: "연쇄번개를 시작할 상대 돌이 없습니다." };
  }

  if (powerId === "edge_surge" && !getEdgeSurgeTargets(playerId).length) {
    return { ok: false, message: "가장자리에 쓸어올 상대 돌이 없습니다." };
  }

  if (powerId === "gravity_crush" && !hasGravityCrushTarget(playerId)) {
    return { ok: false, message: "중력 붕괴를 일으킬 만큼 상대 돌이 밀집한 3x3 구역이 없습니다." };
  }

  if (powerId === "tidal_wave" && !hasTidalWaveTarget(playerId)) {
    return { ok: false, message: "해일로 쓸어올 상대 돌이 있는 행 또는 열이 없습니다." };
  }

  if (powerId === "double_cast" && state.chaos.players[playerId]?.specialStone.used) {
    return { ok: false, message: "더블 캐스트는 특수돌이 남아 있을 때만 쓸 수 있습니다." };
  }

  return { ok: true, message: "" };
}

function countOpenEmptyCells() {
  return state.board.flat().filter((cell) => cell.terrain === "open" && !cell.piece).length;
}

function countBoardFlipMovablePieces() {
  const size = state.board.length;
  const processed = new Set();
  let movablePieces = 0;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const key = cellKey(row, col);
      if (processed.has(key) || isCornerCell(size, row, col) || isOpeningCenterCell(size, row, col)) continue;

      const targetRow = size - 1 - row;
      const targetCol = size - 1 - col;
      const targetKey = cellKey(targetRow, targetCol);
      const cell = state.board[row][col];
      const targetCell = state.board[targetRow][targetCol];
      processed.add(key);
      processed.add(targetKey);

      if (cell.terrain !== "open" || targetCell.terrain !== "open") continue;
      movablePieces += (cell.piece ? 1 : 0) + (targetCell.piece ? 1 : 0);
    }
  }

  return movablePieces;
}

function canEclipseTarget(playerId, row, col) {
  if (!isInside(state.board.length, row, col) || isEdgeCell(state.board.length, row, col)) return false;

  for (let targetRow = row - 1; targetRow <= row + 1; targetRow += 1) {
    for (let targetCol = col - 1; targetCol <= col + 1; targetCol += 1) {
      const cell = state.board[targetRow]?.[targetCol];
      if (cell?.piece?.kind === "normal" && cell.piece.owner !== playerId) return true;
    }
  }

  return false;
}

function hasEclipseTarget(playerId) {
  for (let row = 1; row < state.board.length - 1; row += 1) {
    for (let col = 1; col < state.board.length - 1; col += 1) {
      if (canEclipseTarget(playerId, row, col)) return true;
    }
  }
  return false;
}

function canBlackHoleTarget(playerId, row, col) {
  const cell = state.board[row]?.[col];
  if (!cell || cell.terrain !== "open" || cell.piece || isEdgeCell(state.board.length, row, col)) return false;

  return adjacentCells(row, col).filter(({ row: targetRow, col: targetCol }) => {
    const adjacent = state.board[targetRow][targetCol];
    return adjacent.piece?.owner === opponentOf(playerId);
  }).length >= 2;
}

function hasBlackHoleTarget(playerId) {
  for (let row = 1; row < state.board.length - 1; row += 1) {
    for (let col = 1; col < state.board.length - 1; col += 1) {
      if (canBlackHoleTarget(playerId, row, col)) return true;
    }
  }
  return false;
}

function hasCornerContractTarget() {
  const size = state.board.length;
  return [
    [0, 0],
    [0, size - 1],
    [size - 1, 0],
    [size - 1, size - 1],
  ].some(([row, col]) => {
    const cell = state.board[row]?.[col];
    return cell?.terrain === "open" && !cell.piece;
  });
}

function getAuctionCandidateMoves() {
  return state.legalMoves.filter((move) => !isCornerCell(state.board.length, move.row, move.col));
}

function getComebackCandidates(playerId) {
  const opponent = opponentOf(playerId);
  const candidates = [];
  forEachBoardCell((cell, row, col) => {
    if (cell.piece?.owner === opponent && !isCornerCell(state.board.length, row, col)) {
      candidates.push({ row, col });
    }
  });
  return candidates;
}

function getMoveBanReadiness(playerId) {
  const opponentMoves = getPlayableMoves(state.board, opponentOf(playerId));
  if (opponentMoves.length <= 2) {
    return { ok: false, message: "착수 봉인은 상대에게 선택지가 3개 이상 있을 때만 쓸 수 있습니다." };
  }

  if (!opponentMoves.some((move) => !isCornerCell(state.board.length, move.row, move.col))) {
    return { ok: false, message: "봉인할 수 있는 비모서리 합법 수가 없습니다." };
  }

  return { ok: true, message: "" };
}

function isMoveBanTarget(playerId, row, col) {
  if (!getMoveBanReadiness(playerId).ok || isCornerCell(state.board.length, row, col)) return false;
  return getPlayableMoves(state.board, opponentOf(playerId)).some((move) => move.row === row && move.col === col);
}

function isDestinyTarget(playerId, row, col) {
  const cell = state.board[row]?.[col];
  return Boolean(
    cell?.piece?.owner === playerId &&
      !isEdgeCell(state.board.length, row, col) &&
      !cell.piece.modifiers?.includes("destiny"),
  );
}

function hasDestinyTarget(playerId) {
  for (let row = 1; row < state.board.length - 1; row += 1) {
    for (let col = 1; col < state.board.length - 1; col += 1) {
      if (isDestinyTarget(playerId, row, col)) return true;
    }
  }
  return false;
}

function isChainLightningTarget(playerId, row, col) {
  const cell = state.board[row]?.[col];
  return Boolean(cell?.piece?.owner === opponentOf(playerId));
}

function hasChainLightningTarget(playerId) {
  let found = false;
  forEachBoardCell((cell) => {
    if (cell.piece?.owner === opponentOf(playerId)) found = true;
  });
  return found;
}

function getEdgeSurgeTargets(playerId) {
  const opponent = opponentOf(playerId);
  const targets = [];
  forEachBoardCell((cell, row, col) => {
    if (!isEdgeCell(state.board.length, row, col) || isCornerCell(state.board.length, row, col)) return;
    if (cell.piece?.owner === opponent) {
      targets.push({
        row,
        col,
        score: getPositionWeight(state.board, row, col) + adjacentCells(row, col).filter((near) => state.board[near.row][near.col].piece?.owner === opponent).length * 9,
      });
    }
  });
  return targets.sort((left, right) => right.score - left.score);
}

function countGravityCrushTargets(playerId, row, col) {
  if (!isInside(state.board.length, row, col)) return 0;
  let count = 0;
  for (let targetRow = Math.max(0, row - 1); targetRow <= Math.min(state.board.length - 1, row + 1); targetRow += 1) {
    for (let targetCol = Math.max(0, col - 1); targetCol <= Math.min(state.board.length - 1, col + 1); targetCol += 1) {
      if (state.board[targetRow][targetCol].piece?.owner === opponentOf(playerId)) count += 1;
    }
  }
  return count;
}

function isGravityCrushTarget(playerId, row, col) {
  return countGravityCrushTargets(playerId, row, col) >= 3;
}

function hasGravityCrushTarget(playerId) {
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board.length; col += 1) {
      if (isGravityCrushTarget(playerId, row, col)) return true;
    }
  }
  return false;
}

function lineOpponentTargets(playerId, row, col, axis) {
  if (!isInside(state.board.length, row, col)) return [];
  const targets = [];
  for (let index = 0; index < state.board.length; index += 1) {
    const targetRow = axis === "row" ? row : index;
    const targetCol = axis === "row" ? index : col;
    if (state.board[targetRow][targetCol].piece?.owner === opponentOf(playerId)) {
      targets.push({ row: targetRow, col: targetCol, score: getPositionWeight(state.board, targetRow, targetCol) });
    }
  }
  return targets;
}

function isTidalWaveTarget(playerId, row, col) {
  return lineOpponentTargets(playerId, row, col, "row").length > 0 || lineOpponentTargets(playerId, row, col, "col").length > 0;
}

function hasTidalWaveTarget(playerId) {
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board.length; col += 1) {
      if (isTidalWaveTarget(playerId, row, col)) return true;
    }
  }
  return false;
}

function buildPowerTargetMessage(powerDef) {
  if (powerDef.target === "empty") return `${powerDef.name}: 구멍으로 만들 빈 칸을 고르세요.`;
  if (powerDef.target === "cornerReserve") return `${powerDef.name}: 공개 예약할 빈 모서리를 고르세요.`;
  if (powerDef.target === "legalMove") return `${powerDef.name}: 경매로 둘 합법 수를 고르세요.`;
  if (powerDef.target === "auctionPair") return `${powerDef.name}: 입찰할 비모서리 합법 수 2개를 고르세요.`;
  if (powerDef.target === "opponentMove") return `${powerDef.name}: 막을 상대 합법 수를 고르세요.`;
  if (powerDef.target === "ownPiece") return `${powerDef.name}: 운명 표식을 붙일 내 비가장자리 돌을 고르세요.`;
  if (powerDef.target === "opponentPiece") return `${powerDef.name}: 번개를 꽂을 상대 돌을 고르세요.`;
  if (powerDef.target === "gravityCell") return `${powerDef.name}: 상대 돌이 밀집한 3x3 중심을 고르세요.`;
  if (powerDef.target === "lineCell") return `${powerDef.name}: 쓸어낼 행 또는 열 위의 칸을 고르세요.`;
  return `${powerDef.name}: 영향을 줄 칸을 고르세요.`;
}

function handleChaosTarget(row, col) {
  const targeting = state.chaos?.targeting;
  if (!targeting || targeting.player !== state.current) return false;

  const readiness = getChaosPowerReadiness(targeting.player, targeting.powerId);
  if (!readiness.ok) {
    state.chaos.targeting = null;
    invalidChaosAction(readiness.message);
    render();
    return false;
  }

  const applied = applyChaosPower(targeting.player, targeting.powerId, { row, col });
  if (!applied) {
    render();
    return false;
  }

  if (applied === "pending") {
    return true;
  }

  state.chaos.targeting = null;
  return true;
}

function applyChaosPower(playerId, powerId, target = null) {
  const powerDef = CHAOS_POWER_DEFS[powerId];
  const effectApplied = runChaosPowerEffect(playerId, powerId, target);

  if (!effectApplied) return false;

  if (effectApplied === "pending") {
    state.legalMoves = getPlayableMoves(state.board, state.current);
    render();
    return "pending";
  }

  if (!state.chaos.players[playerId].power.used) {
    markPowerUsed(playerId, powerDef, target, effectApplied);
  }
  appendTriggeredStoneRevealDetails(playerId, takeShieldBlockEffects());
  state.legalMoves = getPlayableMoves(state.board, state.current);
  render();
  return true;
}

function markPowerUsed(playerId, powerDef, target, effectDetail = null) {
  const powerState = state.chaos.players[playerId].power;
  powerState.used = true;
  powerState.revealed = true;
  powerState.revealedAt = state.moveHistory.length;
  if (effectDetail?.result) powerState.effectSummary = effectDetail.result;

  const targetText = target ? `${formatCoordinate(target.row, target.col)} - ` : "";
  const resultText = effectDetail?.result ? ` ${effectDetail.result}` : "";
  pushChaosReveal({
    player: playerId,
    family: "power",
    id: powerDef.id,
    title: powerDef.name,
    kicker: `${PLAYERS[playerId].label} 초능력 발동`,
    text: `${targetText}${powerDef.revealText}${resultText}`,
  });

  state.moveHistory.push({
    player: playerId,
    row: target?.row ?? -1,
    col: target?.col ?? -1,
    flipped: 0,
    kind: "power",
    power: powerDef.id,
    tags: ["초능력"],
  });
}

function runChaosPowerEffect(playerId, powerId, target) {
  if (powerId === "board_flip") return applyBoardFlipPower(playerId);
  if (powerId === "eclipse_3x3") return applyEclipsePower(playerId, target);
  if (powerId === "black_hole") return applyBlackHolePower(playerId, target);
  if (powerId === "corner_contract") return applyCornerContractPower(playerId, target);
  if (powerId === "ownership_frenzy") {
    state.chaos.activeBuffs[playerId] = "ownership_frenzy";
    return { result: "실제 효과: 다음 내 착수 뒤 인접 상대 돌을 최대 3개 추가로 바꿉니다." };
  }
  if (powerId === "double_cast") {
    if (state.chaos.players[playerId].specialStone.used) {
      return invalidChaosAction("더블 캐스트는 특수돌이 남아 있을 때만 쓸 수 있습니다.");
    }
    state.chaos.activeBuffs[playerId] = "double_cast";
    const stoneId = state.chaos.players[playerId].specialStone.id;
    return {
      result: `실제 효과: 다음에 놓는 ${CHAOS_STONE_DEFS[stoneId]?.name ?? "특수돌"}이 과충전됩니다.`,
    };
  }
  if (powerId === "final_auction") return applyFinalAuctionPower(playerId, target);
  if (powerId === "comeback_swing") return applyComebackPower(playerId);
  if (powerId === "move_ban") return applyMoveBanPower(playerId, target);
  if (powerId === "destiny_move") return applyDestinyMovePower(playerId, target);
  if (powerId === "chain_lightning") return applyChainLightningPower(playerId, target);
  if (powerId === "edge_surge") return applyEdgeSurgePower(playerId);
  if (powerId === "gravity_crush") return applyGravityCrushPower(playerId, target);
  if (powerId === "tidal_wave") return applyTidalWavePower(playerId, target);
  return false;
}

function applyBoardFlipPower(playerId) {
  const size = state.board.length;
  const processed = new Set();
  let movedPieces = 0;

  forEachBoardCell((cell, row, col) => {
    const key = cellKey(row, col);
    if (processed.has(key) || isCornerCell(size, row, col) || isOpeningCenterCell(size, row, col)) return;

    const targetRow = size - 1 - row;
    const targetCol = size - 1 - col;
    const targetKey = cellKey(targetRow, targetCol);
    const targetCell = state.board[targetRow][targetCol];
    processed.add(key);
    processed.add(targetKey);

    if (cell.terrain !== "open" || targetCell.terrain !== "open") return;
    movedPieces += (cell.piece ? 1 : 0) + (targetCell.piece ? 1 : 0);
    const piece = cell.piece;
    cell.piece = targetCell.piece;
    targetCell.piece = piece;
    markChaosEffectKey(key, "swap", "이동", "board_flip");
    markChaosEffectKey(targetKey, "swap", "이동", "board_flip");
  });

  return {
    result: `실제 효과: 돌 ${movedPieces}개의 위치가 반대로 이동했습니다.`,
  };
}

function scoreBoardFlipPower(playerId) {
  const preview = cloneBoard(state.board);
  const size = preview.length;
  const processed = new Set();

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const key = cellKey(row, col);
      if (processed.has(key) || isCornerCell(size, row, col) || isOpeningCenterCell(size, row, col)) continue;

      const targetRow = size - 1 - row;
      const targetCol = size - 1 - col;
      const targetKey = cellKey(targetRow, targetCol);
      const cell = preview[row][col];
      const targetCell = preview[targetRow][targetCol];
      processed.add(key);
      processed.add(targetKey);

      if (cell.terrain !== "open" || targetCell.terrain !== "open") continue;
      const piece = cell.piece;
      cell.piece = targetCell.piece;
      targetCell.piece = piece;
    }
  }

  return evaluateBoard(preview, playerId, "balanced") - evaluateBoard(state.board, playerId, "balanced");
}

function applyEclipsePower(playerId, target) {
  if (!target || !canEclipseTarget(playerId, target.row, target.col)) {
    return invalidChaosAction("3x3 안에 바꿀 상대 일반돌이 있는 비가장자리 칸을 고르세요.");
  }

  let changed = 0;
  for (let row = target.row - 1; row <= target.row + 1; row += 1) {
    for (let col = target.col - 1; col <= target.col + 1; col += 1) {
      const cell = state.board[row]?.[col];
      if (!cell?.piece || cell.piece.kind !== "normal" || cell.piece.owner === playerId) continue;
      const key = cellKey(row, col);
      if (capturePiece(cell, playerId, key)) {
        markChaosEffectKey(key, "eclipse", "일식", "eclipse_3x3");
        changed += 1;
      }
      if (changed >= 6) {
        return { result: `실제 효과: 선택한 3x3 안의 상대 일반돌 ${changed}개를 내 색으로 바꿨습니다.` };
      }
    }
  }

  if (changed > 0) {
    return { result: `실제 효과: 선택한 3x3 안의 상대 일반돌 ${changed}개를 내 색으로 바꿨습니다.` };
  }
  return invalidChaosAction("일식으로 바꿀 상대 일반돌이 없습니다.");
}

function applyBlackHolePower(playerId, target) {
  if (!target) return invalidChaosAction("블랙홀을 열 빈 칸을 고르세요.");
  const cell = state.board[target.row]?.[target.col];
  if (!cell || cell.terrain !== "open" || cell.piece) return invalidChaosAction("빈 칸에만 블랙홀을 열 수 있습니다.");
  if (isEdgeCell(state.board.length, target.row, target.col)) return invalidChaosAction("블랙홀은 가장자리에는 열 수 없습니다.");

  const opponentTargets = adjacentCells(target.row, target.col).filter(({ row, col }) => {
    const adjacent = state.board[row][col];
    return adjacent.piece?.owner === opponentOf(playerId);
  });

  if (opponentTargets.length < 2) return invalidChaosAction("주변 상대 돌이 2개 이상일 때만 쓸 수 있습니다.");

  const pulled = shuffle(opponentTargets).slice(0, 4);
  let converted = 0;
  for (const removed of pulled) {
    const key = cellKey(removed.row, removed.col);
    if (capturePiece(state.board[removed.row][removed.col], playerId, key)) {
      markChaosEffectKey(key, "void", "흡수", "black_hole");
      converted += 1;
    }
  }

  cell.terrain = "blocked";
  markChaosEffect(target.row, target.col, "hole", "구멍", "black_hole");
  return {
    result: `실제 효과: ${formatCoordinate(target.row, target.col)}을 구멍으로 만들고 주변 상대 돌 ${converted}개를 내 색으로 바꿨습니다.`,
  };
}

function applyCornerContractPower(playerId, target) {
  if (!target || !isCornerCell(state.board.length, target.row, target.col)) {
    return invalidChaosAction("계약할 빈 모서리를 고르세요.");
  }

  const cell = state.board[target.row]?.[target.col];
  if (!cell || cell.terrain !== "open" || cell.piece) {
    return invalidChaosAction("빈 모서리에만 계약할 수 있습니다.");
  }

  state.chaos.cornerContracts[playerId] = { row: target.row, col: target.col };
  markChaosEffect(target.row, target.col, "contract", "계약", "corner_contract");
  return {
    result: `실제 효과: ${formatCoordinate(target.row, target.col)} 모서리를 예약했습니다. 다음 내 턴에 합법 수면 자동 착수됩니다.`,
  };
}

function applyFinalAuctionPower(playerId, target) {
  const emptyCount = countOpenEmptyCells();
  if (emptyCount > 18) return invalidChaosAction("마지막 경매는 빈 칸이 18개 이하일 때만 쓸 수 있습니다.");
  if (getAuctionCandidateMoves().length < 2) {
    return invalidChaosAction("마지막 경매는 비모서리 합법 수가 2개 이상일 때만 쓸 수 있습니다.");
  }
  if (!target) return invalidChaosAction("입찰할 합법 수를 고르세요.");

  const selected = state.chaos.targeting?.powerId === "final_auction" ? state.chaos.targeting.selected ?? [] : [];
  const legalMove = state.legalMoves.find((move) => move.row === target.row && move.col === target.col);
  if (!legalMove || isCornerCell(state.board.length, target.row, target.col)) {
    return invalidChaosAction("경매 후보는 비모서리 합법 수여야 합니다.");
  }

  if (selected.some((candidate) => candidate.row === target.row && candidate.col === target.col)) {
    return invalidChaosAction("서로 다른 후보 2개를 골라야 합니다.");
  }

  if (!selected.length) {
    state.chaos.targeting.selected = [{ row: target.row, col: target.col }];
    markChaosEffect(target.row, target.col, "auction", "입찰", "final_auction");
    state.message = `${CHAOS_POWER_DEFS.final_auction.name}: 두 번째 입찰 칸을 고르세요.`;
    return "pending";
  }

  const firstMove = state.legalMoves.find((move) => move.row === selected[0].row && move.col === selected[0].col);
  if (!firstMove) return invalidChaosAction("첫 번째 입찰 칸이 더 이상 합법 수가 아닙니다.");

  const [blockedMove, winningMove] = chooseAuctionOutcome([firstMove, legalMove], playerId);
  const blocked = { row: blockedMove.row, col: blockedMove.col };
  const winning = { row: winningMove.row, col: winningMove.col };

  state.chaos.targeting = null;
  return commitMove(winning.row, winning.col, {
    useSpecialStone: false,
    tags: ["경매 낙찰"],
    afterEffects: () => {
      const blockedCell = state.board[blocked.row]?.[blocked.col];
      let converted = [];
      if (blockedCell && blockedCell.terrain === "open" && !blockedCell.piece) {
        blockedCell.terrain = "blocked";
        markChaosEffect(blocked.row, blocked.col, "hole", "낙찰", "final_auction");
        converted = convertAdjacentPieces(blocked.row, blocked.col, playerId, {
          max: 1,
          opponentOnly: true,
          normalOnly: false,
          effectType: "auction",
          effectLabel: "경매",
          effectSource: "final_auction",
        });
      }
      markPowerUsed(playerId, CHAOS_POWER_DEFS.final_auction, winning, {
        result: `실제 효과: ${formatCoordinate(blocked.row, blocked.col)} 후보가 구멍으로 막히고 ${formatCoordinate(
          winning.row,
          winning.col,
        )}에 착수했습니다. 막힌 칸 주변 상대 돌 ${converted.length}개를 가져왔습니다.`,
      });
    },
  });
}

function chooseAuctionOutcome(moves, playerId) {
  const ranked = moves
    .map((move) => ({ move, score: scoreChaosMove(move, playerId) }))
    .sort((left, right) => right.score - left.score);

  return [ranked[0].move, ranked[1].move];
}

function scoreChaosMove(move, playerId) {
  const positional = getPositionWeight(state.board, move.row, move.col);
  const mobilityPenalty = getLegalMoves(applyMoveToBoard(state.board, move, playerId), opponentOf(playerId)).length * 2.5;
  return move.flips.length * 16 + positional - mobilityPenalty;
}

function applyComebackPower(playerId) {
  const score = countRawPieces(state.board);
  const opponent = opponentOf(playerId);
  if (score[opponent] - score[playerId] < 8) {
    return invalidChaosAction("역전세는 8개 이상 밀릴 때만 쓸 수 있습니다.");
  }

  const candidates = getComebackCandidates(playerId);

  const selected = shuffle(candidates).slice(0, 6);
  let converted = 0;
  for (const target of selected) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], playerId, key)) {
      markChaosEffectKey(key, "comeback", "역전", "comeback_swing");
      converted += 1;
    }
  }

  if (!selected.length) return invalidChaosAction("가져올 수 있는 상대 돌이 없습니다.");
  return {
    result: `실제 효과: 상대 돌 ${converted}개를 무작위로 가져왔습니다.`,
  };
}

function applyMoveBanPower(playerId, target) {
  const opponent = opponentOf(playerId);
  if (!target) return invalidChaosAction("봉인할 상대 합법 수를 고르세요.");

  const opponentMoves = getPlayableMoves(state.board, opponent);
  const readiness = getMoveBanReadiness(playerId);
  if (!readiness.ok) return invalidChaosAction(readiness.message);

  const legal = opponentMoves.some((move) => move.row === target.row && move.col === target.col);
  if (!legal) return invalidChaosAction("상대의 다음 합법 수 중 하나를 골라야 합니다.");
  if (isCornerCell(state.board.length, target.row, target.col)) {
    return invalidChaosAction("모서리 착수는 봉인할 수 없습니다.");
  }

  const candidates = opponentMoves
    .filter((move) => !isCornerCell(state.board.length, move.row, move.col))
    .map((move) => ({
      move,
      key: cellKey(move.row, move.col),
      score: scoreChaosMove(move, opponent) + (move.row === target.row && move.col === target.col ? 999 : 0),
    }))
    .sort((left, right) => right.score - left.score);
  const banCount = Math.min(4, Math.max(1, opponentMoves.length - 2), candidates.length);
  const banned = candidates.slice(0, banCount).map((item) => item.key);

  state.chaos.bannedMoves[opponent] = banned;
  let cracked = 0;
  for (const key of banned) {
    const [banRow, banCol] = key.split(":").map(Number);
    markChaosEffectKey(key, "ban", "봉인", "move_ban");
    if (cracked >= 3) continue;
    const converted = convertAdjacentPieces(banRow, banCol, playerId, {
      max: 3 - cracked,
      opponentOnly: true,
      normalOnly: false,
      effectType: "ban",
      effectLabel: "균열",
      effectSource: "move_ban",
    });
    cracked += converted.length;
  }
  return {
    result: `실제 효과: 상대 다음 합법 수 ${banned.length}개를 1턴 동안 봉인하고 주변 상대 돌 ${cracked}개를 균열 반전했습니다.`,
  };
}

function applyDestinyMovePower(playerId, target) {
  if (!target) return invalidChaosAction("운명 표식을 붙일 내 돌을 고르세요.");

  const cell = state.board[target.row]?.[target.col];
  if (!isDestinyTarget(playerId, target.row, target.col)) {
    if (!cell?.piece || cell.piece.owner !== playerId) return invalidChaosAction("내 돌에만 운명 표식을 붙일 수 있습니다.");
    if (isEdgeCell(state.board.length, target.row, target.col)) {
      return invalidChaosAction("운명의 한 수는 가장자리 돌에는 쓸 수 없습니다.");
    }
    return invalidChaosAction("이미 운명 표식이 붙은 돌입니다.");
  }

  cell.piece = {
    ...cell.piece,
    modifiers: [...new Set([...(cell.piece.modifiers ?? []), "destiny", "shield"])],
  };
  markChaosEffect(target.row, target.col, "destiny", "운명", "destiny_move");
  return {
    result: `실제 효과: ${formatCoordinate(target.row, target.col)} 돌에 운명 표식과 보호막 1회를 붙였습니다. 최종 소유자는 종료 시 +8점을 얻습니다.`,
  };
}

function applyChainLightningPower(playerId, target) {
  if (!target || !isChainLightningTarget(playerId, target.row, target.col)) {
    return invalidChaosAction("연쇄번개를 시작할 상대 돌을 고르세요.");
  }

  const queue = [{ row: target.row, col: target.col }];
  const visited = new Set();
  let converted = 0;
  const cap = 5;

  while (queue.length && converted < cap) {
    const current = queue.shift();
    const key = cellKey(current.row, current.col);
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = state.board[current.row]?.[current.col];
    if (cell?.piece?.owner !== opponentOf(playerId)) continue;

    if (capturePiece(cell, playerId, key)) {
      markChaosEffectKey(key, "chain", "번개", "chain_lightning");
      converted += 1;
    }

    for (const near of adjacentCells(current.row, current.col)) {
      const nearKey = cellKey(near.row, near.col);
      if (!visited.has(nearKey) && state.board[near.row][near.col].piece?.owner === opponentOf(playerId)) {
        queue.push(near);
      }
    }
  }

  return {
    result: `실제 효과: 연쇄번개가 상대 돌 ${converted}개를 타고 들어가 내 색으로 바꿨습니다.`,
  };
}

function applyEdgeSurgePower(playerId) {
  const targets = getEdgeSurgeTargets(playerId).slice(0, 4);
  if (!targets.length) return invalidChaosAction("가장자리에 쓸어올 상대 돌이 없습니다.");

  let converted = 0;
  for (const target of targets) {
    const key = cellKey(target.row, target.col);
    if (capturePiece(state.board[target.row][target.col], playerId, key)) {
      markChaosEffectKey(key, "wave", "해일", "edge_surge");
      converted += 1;
    }
  }

  return {
    result: `실제 효과: 가장자리 상대 돌 ${converted}개를 해일처럼 쓸어왔습니다.`,
  };
}

function applyGravityCrushPower(playerId, target) {
  if (!target || !isGravityCrushTarget(playerId, target.row, target.col)) {
    return invalidChaosAction("상대 돌이 3개 이상 밀집한 3x3 중심을 고르세요.");
  }

  const candidates = [];
  for (let row = Math.max(0, target.row - 1); row <= Math.min(state.board.length - 1, target.row + 1); row += 1) {
    for (let col = Math.max(0, target.col - 1); col <= Math.min(state.board.length - 1, target.col + 1); col += 1) {
      if (state.board[row][col].piece?.owner === opponentOf(playerId)) {
        candidates.push({ row, col, score: getPositionWeight(state.board, row, col) });
      }
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  let converted = 0;
  for (const candidate of candidates.slice(0, 5)) {
    const key = cellKey(candidate.row, candidate.col);
    if (capturePiece(state.board[candidate.row][candidate.col], playerId, key)) {
      markChaosEffectKey(key, "gravity", "붕괴", "gravity_crush");
      converted += 1;
    }
  }
  markChaosEffect(target.row, target.col, "gravity", "중력", "gravity_crush");

  return {
    result: `실제 효과: 선택한 3x3의 상대 돌 ${converted}개를 중력장으로 압축 반전했습니다.`,
  };
}

function applyTidalWavePower(playerId, target) {
  if (!target || !isTidalWaveTarget(playerId, target.row, target.col)) {
    return invalidChaosAction("해일로 쓸어올 상대 돌이 있는 행 또는 열 위의 칸을 고르세요.");
  }

  const rowTargets = lineOpponentTargets(playerId, target.row, target.col, "row");
  const colTargets = lineOpponentTargets(playerId, target.row, target.col, "col");
  const scoreLine = (targets) => targets.length * 18 + targets.reduce((score, item) => score + item.score * 0.2, 0);
  const axis = scoreLine(rowTargets) >= scoreLine(colTargets) ? "row" : "col";
  const targets = (axis === "row" ? rowTargets : colTargets).sort((left, right) => right.score - left.score).slice(0, 5);

  let converted = 0;
  for (const candidate of targets) {
    const key = cellKey(candidate.row, candidate.col);
    if (capturePiece(state.board[candidate.row][candidate.col], playerId, key)) {
      markChaosEffectKey(key, "wave", "해일", "tidal_wave");
      converted += 1;
    }
  }
  markChaosEffect(target.row, target.col, "wave", axis === "row" ? "행" : "열", "tidal_wave");

  return {
    result: `실제 효과: ${axis === "row" ? "행" : "열"} 해일로 상대 돌 ${converted}개를 내 색으로 바꿨습니다.`,
  };
}

function invalidChaosAction(message) {
  state.message = message;
  if (isHumanTurn()) playInvalidSound();
  return false;
}

function pushChaosReveal(reveal) {
  if (!state.chaos?.enabled) return;

  state.chaos.reveal = reveal;
  state.interactionLocked = true;
  playChaosRevealSound(reveal);

  if (state.chaos.revealTimer) {
    window.clearTimeout(state.chaos.revealTimer);
  }

  state.chaos.revealTimer = window.setTimeout(() => {
    if (!state?.chaos) return;
    state.chaos.reveal = null;
    state.interactionLocked = false;
    state.chaos.revealTimer = null;
    render();
  }, 2800);
}

function advanceTurn() {
  const current = state.current;
  const next = opponentOf(current);
  const nextMoves = getPlayableMoves(state.board, next);

  if (nextMoves.length) {
    state.current = next;
    state.legalMoves = nextMoves;
    state.message = `${PLAYERS[next].label} 차례입니다.`;
    if (resolveTurnStartEffects(next)) return;
    if (state.gameOver) return;
    state.legalMoves = getPlayableMoves(state.board, next);
    if (state.legalMoves.length) return;

    const currentMovesAfterEffects = getPlayableMoves(state.board, current);
    if (currentMovesAfterEffects.length) {
      state.current = current;
      state.legalMoves = currentMovesAfterEffects;
      state.message = `${PLAYERS[next].label}은 둘 곳이 없어 ${PLAYERS[current].label}이 계속 둡니다.`;
      return;
    }

    state.gameOver = true;
    state.resultSummary = buildResultSummary();
    state.message = buildGameOverMessage();
    return;
  }

  const currentMoves = getPlayableMoves(state.board, current);

  if (currentMoves.length) {
    state.legalMoves = currentMoves;
    state.message = `${PLAYERS[next].label}은 둘 곳이 없어 ${PLAYERS[current].label}이 계속 둡니다.`;
    return;
  }

  state.legalMoves = [];
  state.gameOver = true;
  state.resultSummary = buildResultSummary();
  state.message = buildGameOverMessage();
}

function resolveTurnStartEffects(playerId) {
  if (!state.chaos?.enabled || state.gameOver) return false;

  const countdownEffects = tickChaosStoneCountdowns(playerId);
  appendTriggeredStoneRevealDetails(playerId, countdownEffects);
  state.legalMoves = getPlayableMoves(state.board, playerId);

  const contract = state.chaos.cornerContracts[playerId];
  if (!contract) return false;

  state.chaos.cornerContracts[playerId] = null;
  const move = state.legalMoves.find(
    (candidate) => candidate.row === contract.row && candidate.col === contract.col,
  );

  if (!move) {
    const summary = `최종 결과: ${formatCoordinate(contract.row, contract.col)} 모서리가 합법 수가 아니어서 계약이 무산되었습니다.`;
    state.chaos.players[playerId].power.effectSummary = summary;
    state.message = `${PLAYERS[playerId].label} 모서리 계약이 무산되었습니다. ${formatCoordinate(contract.row, contract.col)}`;
    markChaosEffect(contract.row, contract.col, "contract", "실패", "corner_contract");
    return false;
  }

  state.chaos.players[playerId].power.effectSummary = `최종 결과: ${formatCoordinate(contract.row, contract.col)} 모서리에 자동 착수했습니다.`;
  state.message = `${PLAYERS[playerId].label} 모서리 계약이 자동 발동했습니다. ${formatCoordinate(contract.row, contract.col)}`;
  commitMove(contract.row, contract.col, {
    useSpecialStone: false,
    tags: ["모서리 계약"],
  });
  return true;
}

function buildGameOverMessage() {
  const score = countScore(state.board);
  const bonusText = buildChaosFinalBonusText();
  const suffix = bonusText ? ` ${bonusText}` : "";

  if (score.black === score.white) {
    return `무승부입니다. ${score.black}:${score.white}${suffix}`;
  }

  const winner = score.black > score.white ? "black" : "white";
  return `${PLAYERS[winner].label} 승리입니다. ${score.black}:${score.white}${suffix}`;
}

function buildChaosFinalBonusText() {
  if (!state.chaos?.enabled || !state.gameOver) return "";

  const details = [];
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board.length; col += 1) {
      const piece = state.board[row][col].piece;
      if (!piece) continue;

      if (piece.kind === "throne" && isEdgeCell(state.board.length, row, col)) {
        details.push(`${PLAYERS[piece.owner].label} 왕좌 +5`);
      }

      if (piece.kind === "seizure" && piece.claimLine) {
        const ownerCount = countLinePieces(state.board, row, col, piece.claimLine, piece.owner);
        const opponentCount = countLinePieces(state.board, row, col, piece.claimLine, opponentOf(piece.owner));
        if (ownerCount > opponentCount) {
          details.push(`${PLAYERS[piece.owner].label} 압류 +${piece.claimPoints ?? 3}`);
        }
      }

      if (piece.modifiers?.includes("destiny")) {
        details.push(`${PLAYERS[piece.owner].label} 운명 +8`);
      }
    }
  }

  if (!details.length) return "";
  return `보너스: ${details.join(", ")}`;
}

function buildResultOverlayText() {
  const summary = state.resultSummary ?? buildResultSummary();
  const title = summary.winner === "draw" ? "DRAW" : `${PLAYERS[summary.winner].label} WIN`;
  const score = `${summary.score.black} : ${summary.score.white}`;

  return { title, score };
}

function buildResultSummary() {
  const score = countScore(state.board);
  const winner = score.black === score.white ? "draw" : score.black > score.white ? "black" : "white";
  const humanColor = state.humanColor;
  const computerColor = opponentOf(humanColor);
  const humanScore = score[humanColor];
  const computerScore = score[computerColor];
  const margin = humanScore - computerScore;
  const playerResult = winner === "draw" ? "draw" : winner === humanColor ? "won" : "lost";
  const leaderboardScore = playerResult === "won" ? calculateWinScore(margin) : 0;

  return {
    mode: state.mode,
    difficulty: state.aiDifficulty,
    blockedCount: score.blocked,
    humanColor,
    computerColor,
    score,
    winner,
    playerResult,
    humanScore,
    computerScore,
    margin,
    moveCount: state.moveHistory.length,
    durationMs: Date.now() - state.startedAt,
    leaderboardScore,
  };
}

function calculateWinScore(margin) {
  const base = DIFFICULTY_SCORE_BASE[state.aiDifficulty] ?? DIFFICULTY_SCORE_BASE.easy;
  return base + Math.max(1, margin) * 35 + state.rules.randomBlockedCount * 12;
}

function countScore(board) {
  const score = countRawPieces(board);

  if (state?.chaos?.enabled && board === state.board) {
    const bonuses = calculateChaosBonuses(board);
    score.black += bonuses.black;
    score.white += bonuses.white;
  }

  return score;
}

function countRawPieces(board) {
  return board.flat().reduce(
    (score, cell) => {
      if (cell.terrain === "blocked") score.blocked += 1;
      if (cell.piece?.owner === "black") score.black += 1;
      if (cell.piece?.owner === "white") score.white += 1;
      return score;
    },
    { black: 0, white: 0, blocked: 0 },
  );
}

function calculateChaosBonuses(board) {
  const bonuses = {
    black: state.chaos.scoreBonuses.black,
    white: state.chaos.scoreBonuses.white,
  };

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      const piece = board[row][col].piece;
      if (!piece) continue;

      if (state.gameOver && piece.kind === "throne" && isEdgeCell(board.length, row, col)) {
        bonuses[piece.owner] += 5;
      }

      if (state.gameOver && piece.kind === "seizure" && piece.claimLine) {
        const ownerCount = countLinePieces(board, row, col, piece.claimLine, piece.owner);
        const opponentCount = countLinePieces(board, row, col, piece.claimLine, opponentOf(piece.owner));
        if (ownerCount > opponentCount) bonuses[piece.owner] += piece.claimPoints ?? 3;
      }

      if (state.gameOver && piece.modifiers?.includes("destiny")) {
        bonuses[piece.owner] += 8;
      }
    }
  }

  return bonuses;
}

function countLinePieces(board, row, col, axis, owner) {
  let total = 0;

  for (let index = 0; index < board.length; index += 1) {
    const cell = axis === "row" ? board[row][index] : board[index][col];
    if (cell.piece?.owner === owner) total += 1;
  }

  return total;
}

function scheduleComputerMove() {
  if (!isComputerTurn() || state.aiTimer) return;

  state.aiThinking = true;
  state.aiTimer = window.setTimeout(() => {
    state.aiTimer = null;
    state.aiThinking = false;

    if (maybeUseComputerChaosPower()) {
      return;
    }

    const move = chooseComputerMove();
    if (move) {
      commitMove(move.row, move.col, {
        useSpecialStone: shouldComputerUseSpecialStone(move),
      });
    }
  }, 560);
}

function shouldComputerUseSpecialStone(move) {
  if (!state.chaos?.enabled) return false;
  const chaosPlayer = state.chaos.players[state.current];
  const specialStone = chaosPlayer?.specialStone;
  if (!specialStone || specialStone.used) return false;
  if (chaosPlayer?.power?.id === "double_cast" && !chaosPlayer.power.used && state.moveHistory.length < 8) {
    return false;
  }
  if (state.moveHistory.length < 8) return false;
  return move.flips.length >= 3 || Math.random() < 0.22;
}

function shouldComputerUseDoubleCast(playerId) {
  if (!state.chaos?.enabled) return false;
  const specialStone = state.chaos.players[playerId]?.specialStone;
  if (!specialStone || specialStone.used) return false;
  if (state.moveHistory.length < 8) return false;
  return state.legalMoves.some(
    (move) => move.flips.length >= 3 || isCornerCell(state.board.length, move.row, move.col),
  );
}

function maybeUseComputerChaosPower() {
  if (!state.chaos?.enabled) return false;
  const playerId = state.current;
  const player = state.chaos.players[playerId];
  if (state.rules.players[playerId].controller !== "computer" || player.power.used) return false;

  const powerId = player.power.id;
  if (!getChaosPowerReadiness(playerId, powerId, { allowComputer: true }).ok) return false;

  if (powerId === "eclipse_3x3" && state.moveHistory.length > 10) {
    const target = chooseComputerEclipseTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  } else if (powerId === "black_hole" && state.moveHistory.length > 10) {
    const target = chooseComputerBlackHoleTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  } else if (powerId === "comeback_swing") {
    return Boolean(applyChaosPower(playerId, powerId));
  } else if (powerId === "destiny_move" && state.moveHistory.length > 12 && Math.random() < 0.45) {
    const target = chooseComputerDestinyTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  } else if (powerId === "ownership_frenzy" && state.moveHistory.length > 10 && Math.random() < 0.3) {
    return Boolean(applyChaosPower(playerId, powerId));
  } else if (powerId === "move_ban" && state.moveHistory.length > 10) {
    const target = chooseComputerMoveBanTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  } else if (powerId === "chain_lightning" && state.moveHistory.length > 10) {
    const target = chooseComputerChainLightningTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  } else if (powerId === "edge_surge" && state.moveHistory.length > 12 && Math.random() < 0.55) {
    return Boolean(applyChaosPower(playerId, powerId));
  } else if (powerId === "gravity_crush" && state.moveHistory.length > 10) {
    const target = chooseComputerGravityCrushTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  } else if (powerId === "tidal_wave" && state.moveHistory.length > 10) {
    const target = chooseComputerTidalWaveTarget(playerId);
    if (target) return Boolean(applyChaosPower(playerId, powerId, target));
  }

  return false;
}

function rawScoreMargin(playerId) {
  const score = countRawPieces(state.board);
  return score[playerId] - score[opponentOf(playerId)];
}

function chooseComputerEclipseTarget(playerId) {
  const candidates = [];
  for (let row = 1; row < state.board.length - 1; row += 1) {
    for (let col = 1; col < state.board.length - 1; col += 1) {
      let score = 0;
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const cell = state.board[row + dr]?.[col + dc];
          if (!cell?.piece || cell.piece.kind !== "normal") continue;
          score += cell.piece.owner === playerId ? -7 : 10;
        }
      }
      if (score >= 18) candidates.push({ row, col, score });
    }
  }
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

function chooseComputerBlackHoleTarget(playerId) {
  const candidates = [];
  forEachBoardCell((cell, row, col) => {
    if (cell.terrain !== "open" || cell.piece || isEdgeCell(state.board.length, row, col)) return;
    let score = 0;
    let opponentNeighbors = 0;
    let ownNeighbors = 0;
    for (const near of adjacentCells(row, col)) {
      const owner = state.board[near.row][near.col].piece?.owner;
      if (owner === opponentOf(playerId)) {
        opponentNeighbors += 1;
        score += 10 + Math.max(0, getPositionWeight(state.board, near.row, near.col) / 20);
      } else if (owner === playerId) {
        ownNeighbors += 1;
        score -= 12;
      }
    }
    if (opponentNeighbors >= 2 && opponentNeighbors > ownNeighbors) candidates.push({ row, col, score });
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

function chooseComputerChainLightningTarget(playerId) {
  const opponent = opponentOf(playerId);
  const candidates = [];

  forEachBoardCell((cell, row, col) => {
    if (cell.piece?.owner !== opponent) return;
    const clusterScore =
      12 +
      adjacentCells(row, col).filter((near) => state.board[near.row][near.col].piece?.owner === opponent).length * 10 +
      getPositionWeight(state.board, row, col) * 0.2;
    candidates.push({ row, col, score: clusterScore });
  });

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

function chooseComputerGravityCrushTarget(playerId) {
  const candidates = [];

  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board.length; col += 1) {
      const targetCount = countGravityCrushTargets(playerId, row, col);
      if (targetCount < 3) continue;
      candidates.push({
        row,
        col,
        score: targetCount * 18 + getPositionWeight(state.board, row, col) * 0.12,
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

function chooseComputerTidalWaveTarget(playerId) {
  const candidates = [];

  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board.length; col += 1) {
      const rowTargets = lineOpponentTargets(playerId, row, col, "row");
      const colTargets = lineOpponentTargets(playerId, row, col, "col");
      const bestLine = Math.max(rowTargets.length, colTargets.length);
      if (!bestLine) continue;
      candidates.push({
        row,
        col,
        score: bestLine * 18 + Math.max(...rowTargets.concat(colTargets).map((target) => target.score), 0) * 0.2,
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

function chooseComputerCornerContractTarget(playerId) {
  const corners = cornerCells(state.board.length)
    .filter(({ row, col }) => state.board[row][col].terrain === "open" && !state.board[row][col].piece)
    .map(({ row, col }) => {
      const adjacentOpponent = adjacentCells(row, col).filter(
        (near) => state.board[near.row][near.col].piece?.owner === opponentOf(playerId),
      ).length;
      return { row, col, score: adjacentOpponent * 12 - adjacentCells(row, col).length };
    })
    .sort((left, right) => right.score - left.score);
  return corners[0] ?? null;
}

function chooseComputerAuctionTargets(playerId) {
  const moves = state.legalMoves
    .filter((move) => !isCornerCell(state.board.length, move.row, move.col))
    .map((move) => ({ row: move.row, col: move.col, score: scoreChaosMove(move, playerId) }))
    .sort((left, right) => right.score - left.score);

  if (moves.length < 2) return null;
  return [moves[0], moves[1]];
}

function chooseComputerMoveBanTarget(playerId) {
  const opponent = opponentOf(playerId);
  const moves = getPlayableMoves(state.board, opponent)
    .filter((move) => !isCornerCell(state.board.length, move.row, move.col))
    .map((move) => ({ row: move.row, col: move.col, score: scoreChaosMove(move, opponent) }))
    .sort((left, right) => right.score - left.score);
  return moves[0] ?? null;
}

function chooseComputerDestinyTarget(playerId) {
  const candidates = [];

  forEachBoardCell((cell, row, col) => {
    if (cell.piece?.owner !== playerId || isEdgeCell(state.board.length, row, col)) return;
    if (cell.piece.modifiers?.includes("destiny")) return;
    const adjacentOpponent = adjacentCells(row, col).filter((near) => state.board[near.row][near.col].piece?.owner === opponentOf(playerId)).length;
    const adjacentOwn = adjacentCells(row, col).filter((near) => state.board[near.row][near.col].piece?.owner === playerId).length;
    const adjacentEmpty = adjacentCells(row, col).filter((near) => {
      const nearCell = state.board[near.row][near.col];
      return nearCell.terrain === "open" && !nearCell.piece;
    }).length;
    candidates.push({
      row,
      col,
      score: getPositionWeight(state.board, row, col) * 0.45 + adjacentOwn * 5 - adjacentOpponent * 8 - adjacentEmpty * 3,
    });
  });

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] ?? null;
}

function chooseComputerMove() {
  if (!state.legalMoves.length) return null;

  if (state.aiDifficulty === "easy") {
    return chooseHighestScoreMove(scoreEasyMove);
  }

  if (state.aiDifficulty === "greedy") {
    return chooseHighestScoreMove((move) => move.flips.length);
  }

  if (state.aiDifficulty === "positional") {
    return chooseHighestScoreMove(scorePositionalMove);
  }

  if (state.aiDifficulty === "minimax3") {
    return chooseMinimaxMove(3, "balanced");
  }

  if (state.aiDifficulty === "minimax4") {
    return chooseMinimaxMove(4, "strong");
  }

  return chooseHighestScoreMove(scoreEasyMove);
}

function chooseHighestScoreMove(scoreMove) {
  let bestScore = -Infinity;
  let bestMoves = [];

  for (const move of state.legalMoves) {
    const score = scoreMove(move);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return randomMove(bestMoves);
}

function scoreEasyMove(move) {
  const nextBoard = applyMoveToBoard(state.board, move, state.current);
  const opponentMobility = getLegalMoves(nextBoard, opponentOf(state.current)).length;

  return move.flips.length * 2 + getPositionWeight(state.board, move.row, move.col) * 0.14 - opponentMobility * 0.45 + Math.random() * 1.5;
}

function scorePositionalMove(move) {
  const nextBoard = applyMoveToBoard(state.board, move, state.current);

  return evaluateBoard(nextBoard, state.current, "balanced") + move.flips.length * 3;
}

function chooseMinimaxMove(depth, profile) {
  const aiPlayer = state.current;
  let bestScore = -Infinity;
  let bestMoves = [];

  for (const move of orderMoves(state.board, state.legalMoves, aiPlayer)) {
    const nextBoard = applyMoveToBoard(state.board, move, aiPlayer);
    const score = minimax(
      nextBoard,
      opponentOf(aiPlayer),
      aiPlayer,
      depth - 1,
      -Infinity,
      Infinity,
      0,
      profile,
    );

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return randomMove(bestMoves);
}

function minimax(board, currentPlayer, aiPlayer, depth, alpha, beta, passCount, profile) {
  if (depth <= 0 || passCount >= 2 || isBoardSettled(board)) {
    return evaluateBoard(board, aiPlayer, profile);
  }

  const moves = getLegalMoves(board, currentPlayer);

  if (!moves.length) {
    return minimax(
      board,
      opponentOf(currentPlayer),
      aiPlayer,
      depth - 1,
      alpha,
      beta,
      passCount + 1,
      profile,
    );
  }

  const maximizing = currentPlayer === aiPlayer;
  const orderedMoves = orderMoves(board, moves, currentPlayer);

  if (maximizing) {
    let bestScore = -Infinity;
    for (const move of orderedMoves) {
      const nextBoard = applyMoveToBoard(board, move, currentPlayer);
      bestScore = Math.max(
        bestScore,
        minimax(nextBoard, opponentOf(currentPlayer), aiPlayer, depth - 1, alpha, beta, 0, profile),
      );
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const move of orderedMoves) {
    const nextBoard = applyMoveToBoard(board, move, currentPlayer);
    bestScore = Math.min(
      bestScore,
      minimax(nextBoard, opponentOf(currentPlayer), aiPlayer, depth - 1, alpha, beta, 0, profile),
    );
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return bestScore;
}

function applyMoveToBoard(board, move, playerId) {
  const nextBoard = cloneBoard(board);
  nextBoard[move.row][move.col].piece = createPiece(playerId);

  for (const flip of move.flips) {
    nextBoard[flip.row][flip.col].piece = {
      ...nextBoard[flip.row][flip.col].piece,
      owner: playerId,
    };
  }

  return nextBoard;
}

function cloneBoard(board) {
  return board.map((row) =>
    row.map((cell) => ({
      terrain: cell.terrain,
      piece: cell.piece
        ? {
            ...cell.piece,
            modifiers: [...(cell.piece.modifiers ?? [])],
          }
        : null,
    })),
  );
}

function orderMoves(board, moves, playerId) {
  return moves
    .map((move) => ({
      move,
      score: scoreMoveForOrdering(board, move, playerId),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ move }) => move);
}

function scoreMoveForOrdering(board, move, playerId) {
  const nextBoard = applyMoveToBoard(board, move, playerId);
  return evaluateBoard(nextBoard, playerId, "ordering") + move.flips.length;
}

function evaluateBoard(board, aiPlayer, profile) {
  const opponent = opponentOf(aiPlayer);
  const score = countScore(board);
  const occupied = score.black + score.white;
  const playableCells = Math.max(1, board.length * board.length - score.blocked);
  const phase = occupied / playableCells;
  const pieceDiff = score[aiPlayer] - score[opponent];
  const aiMobility = getLegalMoves(board, aiPlayer).length;
  const opponentMobility = getLegalMoves(board, opponent).length;
  const mobilityDiff = aiMobility - opponentMobility;
  const cornerDiff = countCornerPieces(board, aiPlayer) - countCornerPieces(board, opponent);
  const edgeDiff = countEdgePieces(board, aiPlayer) - countEdgePieces(board, opponent);
  const positionDiff = countPositionScore(board, aiPlayer) - countPositionScore(board, opponent);
  const frontierDiff = countFrontierPieces(board, opponent) - countFrontierPieces(board, aiPlayer);
  const gameOverBonus = isGameOverBoard(board) ? pieceDiff * 1000 : 0;
  const profileBoost = profile === "strong" ? 1.18 : 1;
  const pieceWeight = phase > 0.76 ? 12 : phase > 0.52 ? 5 : 1.2;
  const mobilityWeight = phase > 0.76 ? 2.5 : 8.5 * profileBoost;
  const cornerWeight = 105 * profileBoost;
  const edgeWeight = 8;
  const frontierWeight = phase > 0.72 ? 1 : 4.5;
  const positionWeight = profile === "ordering" ? 0.55 : 1;

  return (
    gameOverBonus +
    pieceDiff * pieceWeight +
    mobilityDiff * mobilityWeight +
    cornerDiff * cornerWeight +
    edgeDiff * edgeWeight +
    positionDiff * positionWeight +
    frontierDiff * frontierWeight
  );
}

function isBoardSettled(board) {
  return isGameOverBoard(board) || board.every((row) => row.every((cell) => cell.terrain === "blocked" || cell.piece));
}

function isGameOverBoard(board) {
  return !getLegalMoves(board, "black").length && !getLegalMoves(board, "white").length;
}

function countCornerPieces(board, playerId) {
  return cornerCells(board.length).filter(({ row, col }) => board[row][col].piece?.owner === playerId).length;
}

function countEdgePieces(board, playerId) {
  const last = board.length - 1;
  let total = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      const isCorner = (row === 0 || row === last) && (col === 0 || col === last);
      const isEdge = row === 0 || col === 0 || row === last || col === last;

      if (isEdge && !isCorner && board[row][col].piece?.owner === playerId) {
        total += 1;
      }
    }
  }

  return total;
}

function countPositionScore(board, playerId) {
  let total = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      if (board[row][col].piece?.owner === playerId) {
        total += getPositionWeight(board, row, col);
      }
    }
  }

  return total;
}

function countFrontierPieces(board, playerId) {
  let total = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board.length; col += 1) {
      if (board[row][col].piece?.owner !== playerId) continue;

      const touchesOpenCell = DIRECTIONS.some(([dr, dc]) => {
        const nextRow = row + dr;
        const nextCol = col + dc;
        const cell = board[nextRow]?.[nextCol];
        return cell?.terrain === "open" && !cell.piece;
      });

      if (touchesOpenCell) total += 1;
    }
  }

  return total;
}

function getPositionWeight(board, row, col) {
  if (board.length === 8) {
    return POSITION_WEIGHTS_8X8[row][col];
  }

  const last = board.length - 1;
  const isCorner = (row === 0 || row === last) && (col === 0 || col === last);
  const isEdge = row === 0 || col === 0 || row === last || col === last;
  const nearCorner =
    (row <= 1 && col <= 1) ||
    (row <= 1 && col >= last - 1) ||
    (row >= last - 1 && col <= 1) ||
    (row >= last - 1 && col >= last - 1);

  if (isCorner) return 120;
  if (nearCorner) return -28;
  if (isEdge) return 14;
  return 4;
}

function cornerCells(size) {
  const last = size - 1;
  return [
    { row: 0, col: 0 },
    { row: 0, col: last },
    { row: last, col: 0 },
    { row: last, col: last },
  ];
}

function isCornerCell(size, row, col) {
  const last = size - 1;
  return (row === 0 || row === last) && (col === 0 || col === last);
}

function isEdgeCell(size, row, col) {
  const last = size - 1;
  return row === 0 || col === 0 || row === last || col === last;
}

function isOpeningCenterCell(size, row, col) {
  const left = size / 2 - 1;
  const right = size / 2;
  return (row === left || row === right) && (col === left || col === right);
}

function randomMove(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

function waitForInitialAuth(authApi, timeoutMs = 2500) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(user);
    };
    const timer = window.setTimeout(() => finish(authApi.getCurrentUser()), timeoutMs);
    authApi.waitForAuthState().then(finish).catch(() => finish(authApi.getCurrentUser()));
  });
}

function withTimeout(promise, timeoutMs, message) {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = window.setTimeout(() => {
      const error = new Error(message);
      error.code = "timeout";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timerId);
  });
}

function setupBackend() {
  return Promise.all([
    import("../../shared/backend/authApi.js"),
    import("../../shared/backend/userApi.js"),
    import("../../shared/backend/leaderboardApi.js"),
    import("../../shared/backend/eventsApi.js"),
    import("../../shared/backend/roomApi.js"),
  ])
    .then(async ([authApi, userApi, leaderboardApi, eventsApi, roomApi]) => {
      const initialUser = await waitForInitialAuth(authApi);

      backendState = {
        ready: true,
        loadFailed: false,
        user: initialUser,
        api: {
          ...authApi,
          ...userApi,
          ...leaderboardApi,
          ...eventsApi,
          ...roomApi,
        },
      };

      authApi.onAuthStateChanged((user) => {
        backendState.user = user;
        syncSaveStateWithAuth();
        renderSaveState();

        if (state?.mode !== "online") return;

        if (user && !user.isAnonymous) {
          if (["login-required", "offline"].includes(state.online.status)) {
            initializeOnlineRoom();
          }
          return;
        }

        setOnlineStatus("login-required", "온라인 대전은 Google 로그인이 필요합니다. 로비에서 로그인해 주세요.");
        render();
      });

      syncSaveStateWithAuth();
      renderSaveState();
      return backendState;
    })
    .catch((error) => {
      console.warn("[Reversi] 백엔드 모듈 로드 실패:", error);
      backendState = {
        ready: false,
        loadFailed: true,
        user: null,
        api: null,
      };
      syncSaveStateWithAuth();
      renderSaveState();
      return backendState;
    });
}

const backendReadyPromise = setupBackend();

function canSaveResult() {
  return Boolean(backendState.ready && backendState.user && !backendState.user.isAnonymous);
}

function syncSaveStateWithAuth() {
  if (!state) return;

  if (state.mode === "online") {
    setSaveState("저장 안 함", "온라인 대전 결과는 아직 전적/리더보드에 저장하지 않습니다.", false);
    return;
  }

  if (state.mode !== "cpu") {
    setSaveState("저장 안 함", "로컬 2인은 한 계정으로 두 명이 플레이할 수 있어 결과 저장에서 제외됩니다.", false);
    return;
  }

  if (state.gameOver && state.resultSaveAttempted) {
    return;
  }

  if (backendState.loadFailed) {
    setSaveState("오프라인", "백엔드 모듈을 불러오지 못해 이번 결과는 저장되지 않습니다.", false);
    return;
  }

  if (!backendState.ready) {
    setSaveState("로그인 확인 중", "Google 로그인 시 VS 컴퓨터 결과가 저장됩니다.", false);
    return;
  }

  if (canSaveResult()) {
    setSaveState("저장 가능", "게임이 끝나면 전적과 승리 리더보드가 저장됩니다.", false);
    return;
  }

  setSaveState("로그인 필요", "로그인하지 않은 플레이 결과는 저장하지 않습니다.", false);
}

function setSaveState(label, detail, shouldRender = true) {
  if (!state) return;
  state.saveState = { label, detail };
  if (shouldRender) renderSaveState();
}

function renderSaveState() {
  if (!state || !saveStateValueEl || !saveHelpTextEl) return;
  saveStateValueEl.textContent = state.saveState.label;
  saveHelpTextEl.textContent = state.saveState.detail;
}

function queueResultSave() {
  if (!state.gameOver || state.resultSaveAttempted) return;

  state.resultSaveAttempted = true;
  persistResult();
}

async function persistResult() {
  const summary = state.resultSummary;
  if (!summary) return;

  if (summary.mode === "online") {
    setSaveState("저장 안 함", "온라인 대전 결과는 아직 전적/리더보드에 저장하지 않습니다.");
    return;
  }

  if (summary.mode !== "cpu") {
    setSaveState("저장 안 함", "로컬 2인은 한 계정으로 두 명이 플레이할 수 있어 결과 저장에서 제외됩니다.");
    return;
  }

  setSaveState("저장 확인 중", "로그인 상태와 백엔드 연결을 확인하고 있습니다.");
  await backendReadyPromise;

  if (!canSaveResult()) {
    setSaveState("저장 안 됨", "로그인하지 않은 플레이 결과는 저장하지 않습니다.");
    return;
  }

  setSaveState("저장 중", "VS 컴퓨터 결과를 저장하고 있습니다.");

  try {
    const previousGameData = (await backendState.api.getUserGameData(GAME_ID)) ?? {};
    const cpuStats = buildNextCpuStats(previousGameData.cpuStats, summary);

    await backendState.api.saveUserGameData(GAME_ID, {
      cpuStats,
      lastCpuResult: resultPayload(summary),
    });

    await backendState.api.trackGameEnd({
      gameId: GAME_ID,
      sessionId: null,
      result: summary.playerResult,
      durationMs: summary.durationMs,
      payload: resultPayload(summary),
    });

    if (summary.playerResult === "won") {
      const submitResult = await backendState.api.submitLeaderboardEntry({
        gameId: GAME_ID,
        leaderboardId: LEADERBOARD_ID,
        sortValue: summary.leaderboardScore,
        order: "desc",
        payload: resultPayload(summary),
      });

      await backendState.api.trackScoreSubmit({
        gameId: GAME_ID,
        leaderboardId: LEADERBOARD_ID,
        sortValue: summary.leaderboardScore,
        payload: {
          changed: submitResult.changed ?? false,
          ...resultPayload(summary),
        },
      });

      setSaveState(
        submitResult.changed ? "저장 완료" : "전적 저장 완료",
        submitResult.changed
          ? `리더보드에 ${summary.leaderboardScore}점으로 반영했습니다.`
          : "전적은 저장했고, 기존 최고 승리 점수가 더 높습니다.",
      );
      return;
    }

    setSaveState("전적 저장 완료", "승리한 판만 리더보드 최고 기록 후보로 제출됩니다.");
  } catch (error) {
    console.warn("[Reversi] 결과 저장 실패:", error);
    setSaveState("저장 실패", "네트워크나 Firebase 권한 문제로 이번 결과를 저장하지 못했습니다.");
  }
}

function buildNextCpuStats(previousStats = {}, summary) {
  const games = (previousStats.games ?? 0) + 1;
  const wins = (previousStats.wins ?? 0) + (summary.playerResult === "won" ? 1 : 0);
  const draws = (previousStats.draws ?? 0) + (summary.playerResult === "draw" ? 1 : 0);
  const losses = (previousStats.losses ?? 0) + (summary.playerResult === "lost" ? 1 : 0);
  const bestWinScore = Math.max(previousStats.bestWinScore ?? 0, summary.leaderboardScore);
  const winRate = Math.round((wins / games) * 1000) / 10;

  return {
    games,
    wins,
    draws,
    losses,
    winRate,
    bestWinScore,
    bestDifficulty: bestWinScore === summary.leaderboardScore ? summary.difficulty : previousStats.bestDifficulty,
    lastResult: summary.playerResult,
    lastDifficulty: summary.difficulty,
    lastMargin: summary.margin,
    lastPlayedAtMs: Date.now(),
  };
}

function resultPayload(summary) {
  return {
    result: summary.playerResult,
    difficulty: summary.difficulty,
    blockedCount: summary.blockedCount,
    humanColor: summary.humanColor,
    winner: summary.winner,
    margin: summary.margin,
    humanScore: summary.humanScore,
    computerScore: summary.computerScore,
    blackScore: summary.score.black,
    whiteScore: summary.score.white,
    moveCount: summary.moveCount,
    durationMs: summary.durationMs,
  };
}

function makeOnlineRoomId() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let id = "";
  for (let index = 0; index < 6; index += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

async function makeUniqueOnlineRoomId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomId = makeOnlineRoomId();
    const existingRoom = await backendState.api.getRoom(GAME_ID, roomId);
    if (!existingRoom) return roomId;
  }
  throw new Error("방 코드를 만들 수 없습니다.");
}

async function initializeOnlineRoom() {
  if (state.online.initializing) return;
  state.online.initializing = true;
  setOnlineStatus("connecting", "온라인 방을 준비하고 있습니다.");
  render();
  await backendReadyPromise;

  try {
    if (!backendState.ready || !backendState.api) {
      setOnlineStatus("offline", "온라인 모듈을 불러오지 못했습니다.");
      render();
      return;
    }

    const user = backendState.user;
    if (!user || user.isAnonymous) {
      setOnlineStatus("login-required", "온라인 대전은 Google 로그인이 필요합니다. 로비에서 로그인해 주세요.");
      render();
      return;
    }

    if (state.online.shouldCreateRoom) {
      await withTimeout(createOnlineRoom(user), 10000, "온라인 방 생성 시간이 초과되었습니다.");
    } else if (state.online.roomId) {
      await withTimeout(joinOnlineRoom(user, state.online.roomId), 10000, "온라인 방 참가 시간이 초과되었습니다.");
    } else {
      setOnlineStatus("missing-room", "방 코드가 없습니다. 로비에서 새 온라인 방을 만들거나 초대 코드로 참가해 주세요.");
      render();
    }
  } catch (error) {
    console.warn("[Reversi] 온라인 방 초기화 실패:", error);
    setOnlineStatus("error", onlineErrorMessage(error));
    render();
  } finally {
    state.online.initializing = false;
  }
}

async function createOnlineRoom(user) {
  const roomId = await makeUniqueOnlineRoomId();
  const seat = state.humanColor;
  state.online.roomId = roomId;
  state.online.seat = seat;
  state.online.revision = 1;
  state.online.inviteUrl = buildInviteUrl(roomId);
  const publicName = await backendState.api.getUserPublicName(user);

  await backendState.api.createRoom({
    gameId: GAME_ID,
    roomId,
    data: {
      status: "waiting",
      settings: {
        blockedCount: countScore(state.board).blocked,
        hostColor: seat,
        rulesVersion: 1,
      },
      seats: {
        [seat]: makeSeatData(user, publicName, seat),
      },
      state: serializeOnlineState(1),
    },
  });

  state.online.shouldCreateRoom = false;
  replaceRoomUrl(roomId);
  await backendState.api.setPresence({
    gameId: GAME_ID,
    roomId,
    uid: user.uid,
    data: { seat, publicName },
  });
  startOnlineRoomListener(roomId);
  setOnlineStatus("waiting", "상대를 기다리는 중입니다. 초대 링크를 공유하세요.");
  render();
}

async function joinOnlineRoom(user, roomId) {
  const room = await backendState.api.getRoom(GAME_ID, roomId);
  if (!room) {
    setOnlineStatus("not-found", "방을 찾을 수 없습니다. 초대 코드를 다시 확인해 주세요.");
    render();
    return;
  }

  const existingSeat = findSeatForUid(room, user.uid);
  const seat = existingSeat ?? pickOpenSeat(room);
  if (!seat) {
    state.online.roomId = roomId;
    state.online.seat = null;
    state.online.inviteUrl = buildInviteUrl(roomId);
    startOnlineRoomListener(roomId);
    setOnlineStatus("spectating", "방이 가득 차서 관전 모드로 들어왔습니다.");
    render();
    return;
  }

  state.online.roomId = roomId;
  state.online.seat = seat;
  state.online.inviteUrl = buildInviteUrl(roomId);
  const publicName = await backendState.api.getUserPublicName(user);

  const patch = {};
  if (!existingSeat) {
    patch[`seats/${seat}`] = makeSeatData(user, publicName, seat);
  }
  patch.status = hasTwoSeats({ ...room, seats: { ...(room.seats ?? {}), [seat]: { uid: user.uid } } })
    ? "playing"
    : "waiting";

  await backendState.api.updateRoom(GAME_ID, roomId, patch);
  await backendState.api.setPresence({
    gameId: GAME_ID,
    roomId,
    uid: user.uid,
    data: { seat, publicName },
  });
  startOnlineRoomListener(roomId);
}

function makeSeatData(user, publicName, seat) {
  return {
    uid: user.uid,
    publicName,
    seat,
    joinedAtMs: Date.now(),
  };
}

function findSeatForUid(room, uid) {
  if (room?.seats?.black?.uid === uid) return "black";
  if (room?.seats?.white?.uid === uid) return "white";
  return null;
}

function pickOpenSeat(room) {
  if (!room?.seats?.black?.uid) return "black";
  if (!room?.seats?.white?.uid) return "white";
  return null;
}

function hasTwoSeats(room) {
  return Boolean(room?.seats?.black?.uid && room?.seats?.white?.uid);
}

function startOnlineRoomListener(roomId) {
  if (state.online.unsubscribe) {
    state.online.unsubscribe();
  }
  state.online.unsubscribe = backendState.api.listenRoom(GAME_ID, roomId, (room, error) => {
    if (error) {
      setOnlineStatus("error", onlineErrorMessage(error));
      render();
      return;
    }
    applyOnlineRoom(room, roomId);
  });
}

function applyOnlineRoom(room, roomId) {
  if (state.mode !== "online") return;

  if (!room) {
    setOnlineStatus("not-found", "방이 삭제되었거나 찾을 수 없습니다.");
    render();
    return;
  }

  state.online.applyingRemote = true;
  const user = backendState.user;
  const seat = user ? findSeatForUid(room, user.uid) : null;
  if (seat) {
    state.online.seat = seat;
    state.humanColor = seat;
  }

  state.online.status = room.status ?? "waiting";
  state.online.roomId = state.online.roomId || normalizeRoomId(roomId);
  state.online.inviteUrl = buildInviteUrl(state.online.roomId);

  if (room.state?.board) {
    hydrateOnlineState(room);
  }

  state.message = buildOnlineMessage(room);
  state.legalMoves = getPlayableMoves(state.board, state.current);
  state.online.applyingRemote = false;
  render();
}

function hydrateOnlineState(room) {
  const onlineState = room.state;
  state.board = deserializeBoard(onlineState.board);
  state.rules.randomBlockedCount = countScore(state.board).blocked;
  state.rules.label = buildRulesetLabel(state.rules.randomBlockedCount, state.rules.chaosEnabled);
  state.current = onlineState.current ?? "black";
  state.moveHistory = Array.isArray(onlineState.moveHistory) ? onlineState.moveHistory : [];
  state.lastMove = onlineState.lastMove ?? null;
  state.gameOver = Boolean(onlineState.gameOver);
  state.resultSummary = onlineState.resultSummary ?? (state.gameOver ? buildResultSummary() : null);
  state.online.revision = onlineState.revision ?? state.online.revision;
}

function buildOnlineMessage(room) {
  if (state.online.status === "waiting") {
    return "상대를 기다리는 중입니다. 초대 링크를 공유하세요.";
  }
  if (state.online.status === "login-required") {
    return "온라인 대전은 Google 로그인이 필요합니다.";
  }
  if (!state.online.seat) {
    return "관전 중입니다.";
  }
  if (state.gameOver) {
    return buildGameOverMessage();
  }

  const currentSeat = room?.seats?.[state.current];
  const currentName = currentSeat?.publicName ? ` · ${currentSeat.publicName}` : "";
  return state.current === state.online.seat
    ? "내 차례입니다."
    : `${PLAYERS[state.current].label}${currentName} 차례입니다.`;
}

async function writeOnlineState() {
  if (state.mode !== "online" || state.online.applyingRemote || !state.online.roomId) return;
  if (!backendState.ready || !backendState.api) return;

  const revision = (state.online.revision ?? 0) + 1;
  state.online.revision = revision;
  try {
    await backendState.api.updateRoom(GAME_ID, state.online.roomId, {
      status: state.gameOver ? "finished" : "playing",
      state: serializeOnlineState(revision),
    });
  } catch (error) {
    console.warn("[Reversi] 온라인 상태 저장 실패:", error);
    setOnlineStatus("error", "방 상태를 저장하지 못했습니다. 연결을 확인해 주세요.");
    render();
  }
}

function serializeOnlineState(revision = state.online.revision ?? 0) {
  return {
    board: serializeBoard(state.board),
    current: state.current,
    gameOver: state.gameOver,
    message: state.message,
    moveHistory: state.moveHistory,
    lastMove: state.lastMove,
    resultSummary: state.resultSummary,
    revision,
    updatedAtMs: Date.now(),
  };
}

function serializeBoard(board) {
  return board.map((row) =>
    row
      .map((cell) => {
        if (cell.terrain === "blocked") return "#";
        if (cell.piece?.owner === "black") return "b";
        if (cell.piece?.owner === "white") return "w";
        return ".";
      })
      .join(""),
  );
}

function deserializeBoard(rows) {
  return rows.map((row) =>
    String(row)
      .split("")
      .map((value) => {
        if (value === "#") {
          return { terrain: "blocked", piece: null };
        }
        if (value === "b") {
          return { terrain: "open", piece: createPiece("black") };
        }
        if (value === "w") {
          return { terrain: "open", piece: createPiece("white") };
        }
        return { terrain: "open", piece: null };
      }),
  );
}

function setOnlineStatus(status, message) {
  if (!state?.online) return;
  state.online.status = status;
  state.message = message;
}

function onlineErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Firebase 권한 문제로 방을 만들 수 없습니다. Firestore Rules에서 games/{gameId}/rooms 경로를 허용해야 합니다.";
  }

  if (error?.code === "unavailable") {
    return "Firebase 연결이 불안정합니다. 네트워크를 확인한 뒤 다시 시도해 주세요.";
  }

  if (error?.code === "timeout") {
    return `${error.message} Firebase 연결 또는 보안 규칙을 확인해 주세요.`;
  }

  return "온라인 방 연결에 실패했습니다. 브라우저 콘솔의 [Reversi] 로그를 확인해 주세요.";
}

function buildInviteUrl(roomId = state.online.roomId) {
  if (!roomId) return "";
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/index\.html$/, "lobby.html");
  url.search = new URLSearchParams({ room: roomId }).toString();
  return url.toString();
}

function replaceRoomUrl(roomId) {
  const params = new URLSearchParams({
    mode: "online",
    room: roomId,
  });
  window.history.replaceState(null, "", `index.html?${params.toString()}`);
}

function renderOnlinePanel() {
  if (!onlinePanelEl || !roomCodeValueEl || !roomStatusValueEl || !copyRoomButtonEl) return;

  onlinePanelEl.hidden = state.mode !== "online";
  if (state.mode !== "online") return;

  roomCodeValueEl.textContent = onlineRoomCodeLabel();
  roomStatusValueEl.textContent = onlineStatusLabel();
  copyRoomButtonEl.disabled = !state.online.inviteUrl;
}

function onlineRoomCodeLabel() {
  if (state.online.roomId) return state.online.roomId;
  if (state.online.status === "connecting") return "생성 중";
  if (state.online.status === "login-required") return "로그인 후 생성";
  if (state.online.status === "offline") return "모듈 오류";
  if (state.online.status === "error") return "생성 실패";
  if (state.online.status === "missing-room") return "방 코드 없음";
  return "-";
}

function onlineStatusLabel() {
  if (state.online.status === "waiting") return "상대 대기";
  if (state.online.status === "playing") {
    return state.current === state.online.seat ? "내 차례" : "상대 차례";
  }
  if (state.online.status === "finished") return "종료";
  if (state.online.status === "login-required") return "로그인 필요";
  if (state.online.status === "error") return "연결 실패";
  if (state.online.status === "spectating") return "관전";
  if (state.online.status === "connecting") return "연결 중";
  return "오프라인";
}

function render() {
  const score = countScore(state.board);
  const legalMoveMap = new Map(state.legalMoves.map((move) => [cellKey(move.row, move.col), move]));
  const currentLabel = PLAYERS[state.current].label;
  const flippedKeySet = new Set(state.lastMove?.flippedKeys ?? []);
  const effectKeySet = new Set(state.chaos?.effectKeys ?? []);
  const effectMarkMap = new Map((state.chaos?.effectMarks ?? []).map((mark) => [mark.key, mark]));

  boardEl.style.setProperty("--board-size", state.rules.size);
  boardEl.innerHTML = "";

  for (let row = 0; row < state.rules.size; row += 1) {
    for (let col = 0; col < state.rules.size; col += 1) {
      const cell = state.board[row][col];
      const key = cellKey(row, col);
      const legalMove = legalMoveMap.get(key);
      const targetable = isTargetableChaosCell(row, col, legalMove);
      const contracted = getCornerContractOwner(row, col);
      const auctionSelected = isAuctionSelectedCell(row, col);
      const effectMark = effectMarkMap.get(key);
      const button = document.createElement("button");

      button.type = "button";
      button.className = "cell";
      button.setAttribute("role", "gridcell");
      button.dataset.row = row;
      button.dataset.col = col;

      if (cell.terrain === "blocked") {
        button.classList.add("blocked");
      }

      if (key === state.lastMove?.placedKey) {
        button.classList.add("last-move");
      }

      if (legalMove && isHumanTurn()) {
        button.classList.add("valid");
      }

      if (targetable) {
        button.classList.add("power-target");
      }

      if (contracted) {
        button.classList.add("contract-cell");
        button.dataset.contractOwner = PLAYERS[contracted].label;
      }

      if (auctionSelected) {
        button.classList.add("auction-cell");
      }

      if (effectKeySet.has(key)) {
        button.classList.add("effect-cell");
        if (effectMark?.type) {
          button.classList.add(`effect-${effectMark.type}`);
          button.dataset.effectType = effectMark.type;
        }
        if (effectMark?.source) {
          button.classList.add(`effect-source-${effectMark.source}`);
          button.dataset.effectSource = effectMark.source;
        }
      }

      if (effectMark) {
        const visual = document.createElement("span");
        visual.className = "effect-visual";
        visual.setAttribute("aria-hidden", "true");
        button.append(visual);
      }

      if (effectMark?.label) {
        const badge = document.createElement("span");
        badge.className = "effect-badge";
        badge.textContent = effectMark.label;
        button.append(badge);
      }

      if (cell.piece) {
        const piece = document.createElement("span");
        piece.className = `piece ${cell.piece.owner}`;
        if (cell.piece.kind !== "normal") {
          piece.classList.add("special");
          piece.dataset.kind = cell.piece.kind;
          piece.dataset.accent = CHAOS_STONE_DEFS[cell.piece.kind]?.accent ?? "blue";
          piece.append(createPieceAura(cell.piece.kind), createPieceOwnerMark(), createPieceGlyph(cell.piece.kind));
        }
        if (cell.piece.countdown) {
          piece.dataset.countdown = cell.piece.countdown;
        }
        if (cell.piece.modifiers?.includes("shield")) {
          piece.classList.add("shielded");
        }
        if (cell.piece.modifiers?.includes("destiny")) {
          piece.classList.add("destiny");
          piece.append(createDestinyGlyph());
        }
        if (key === state.lastMove?.placedKey) {
          piece.classList.add("placed");
        }
        if (flippedKeySet.has(key)) {
          piece.classList.add("flipped");
        }
        piece.setAttribute("aria-hidden", "true");
        button.append(piece);
      }

      button.disabled = state.gameOver || !isHumanTurn() || (!legalMove && !targetable);
      button.setAttribute("aria-label", describeCell(cell, row, col, legalMove));
      button.addEventListener("click", () => applyMove(row, col));
      boardEl.append(button);
    }
  }

  turnPillEl.textContent = buildTurnLabel(currentLabel);

  statusTextEl.textContent = isComputerTurn()
    ? "컴퓨터가 둘 곳을 고르는 중입니다."
    : state.message;
  blackScoreEl.textContent = score.black;
  whiteScoreEl.textContent = score.white;
  boardRuleEl.textContent = state.rules.label;
  blockedRuleEl.textContent = score.blocked;
  legalMoveCountEl.textContent = state.legalMoves.length;
  playerColorValueEl.textContent = PLAYERS[state.humanColor].label;
  modeValueEl.textContent = MODE_LABELS[state.mode];
  difficultyValueEl.textContent = state.mode === "cpu" ? DIFFICULTY_LABELS[state.aiDifficulty] : "-";
  renderSaveState();
  renderOnlinePanel();
  renderChaosPanel();
  renderCardReveal();

  blackScoreCardEl.classList.toggle("mine", state.humanColor === "black");
  whiteScoreCardEl.classList.toggle("mine", state.humanColor === "white");

  renderResultOverlay();
  renderHistory();
  state.chaos.effectKeys = [];
  state.chaos.effectMarks = [];
  scheduleComputerMove();
}

function isTargetableChaosCell(row, col, legalMove) {
  const targeting = state.chaos?.targeting;
  if (!targeting || !isHumanTurn()) return false;

  const powerDef = CHAOS_POWER_DEFS[targeting.powerId];
  const cell = state.board[row]?.[col];

  if (powerDef.target === "cell") return canEclipseTarget(state.current, row, col);
  if (powerDef.target === "empty") return canBlackHoleTarget(state.current, row, col);
  if (powerDef.target === "cornerReserve") return Boolean(cell?.terrain === "open" && !cell.piece && isCornerCell(state.board.length, row, col));
  if (powerDef.target === "legalMove") return Boolean(legalMove);
  if (powerDef.target === "auctionPair") {
    if (countOpenEmptyCells() > 18 || getAuctionCandidateMoves().length < 2) return false;
    if (!legalMove || isCornerCell(state.board.length, row, col)) return false;
    return !isAuctionSelectedCell(row, col);
  }
  if (powerDef.target === "ownPiece") {
    return isDestinyTarget(state.current, row, col);
  }
  if (powerDef.target === "opponentMove") {
    return isMoveBanTarget(state.current, row, col);
  }
  if (powerDef.target === "opponentPiece") {
    return isChainLightningTarget(state.current, row, col);
  }
  if (powerDef.target === "gravityCell") {
    return isGravityCrushTarget(state.current, row, col);
  }
  if (powerDef.target === "lineCell") {
    return isTidalWaveTarget(state.current, row, col);
  }

  return false;
}

function getCornerContractOwner(row, col) {
  if (!state.chaos?.enabled) return null;
  for (const playerId of ["black", "white"]) {
    const contract = state.chaos.cornerContracts?.[playerId];
    if (contract?.row === row && contract?.col === col) return playerId;
  }
  return null;
}

function isAuctionSelectedCell(row, col) {
  const selected = state.chaos?.targeting?.powerId === "final_auction" ? state.chaos.targeting.selected ?? [] : [];
  return selected.some((target) => target.row === row && target.col === col);
}

function createPieceGlyph(kind) {
  const glyph = document.createElement("span");
  glyph.className = "piece-glyph";
  glyph.dataset.glyph = CHAOS_STONE_DEFS[kind]?.glyph ?? "stone";
  return glyph;
}

function createPieceAura(kind) {
  const aura = document.createElement("span");
  aura.className = "piece-aura";
  aura.dataset.kind = kind;
  return aura;
}

function createPieceOwnerMark() {
  const mark = document.createElement("span");
  mark.className = "piece-owner-mark";
  return mark;
}

function createDestinyGlyph() {
  const glyph = document.createElement("span");
  glyph.className = "destiny-glyph";
  return glyph;
}

function renderChaosPanel() {
  if (!chaosPanelEl || !chaosLoadoutsEl || !chaosTierValueEl) return;

  chaosPanelEl.hidden = !state.chaos?.enabled;
  if (!state.chaos?.enabled) return;

  chaosTierValueEl.textContent = `티어 합 ${state.chaos.tierScore}`;
  chaosLoadoutsEl.innerHTML = "";

  for (const playerId of ["black", "white"]) {
    const group = document.createElement("section");
    group.className = `loadout-group ${playerId === state.current ? "active" : ""}`;

    const heading = document.createElement("div");
    heading.className = "loadout-heading";
    heading.innerHTML = `<span>${PLAYERS[playerId].label}</span><strong>${loadoutVisibilityLabel(playerId)}</strong>`;

    const cards = document.createElement("div");
    cards.className = "chaos-card-grid";
    cards.append(renderChaosCard(playerId, "power"));
    cards.append(renderChaosCard(playerId, "specialStone"));

    group.append(heading, cards);
    chaosLoadoutsEl.append(group);
  }
}

function loadoutVisibilityLabel(playerId) {
  if (state.mode === "local") return "로컬 공개";
  if (playerId === state.humanColor) return "내 카드";
  return "상대 카드";
}

function renderChaosCard(playerId, slot) {
  const cardState = state.chaos.players[playerId][slot];
  const isPower = slot === "power";
  const def = isPower ? CHAOS_POWER_DEFS[cardState.id] : CHAOS_STONE_DEFS[cardState.id];
  const visible = isChaosCardVisible(playerId, slot);
  const card = document.createElement("article");
  const family = isPower ? "power" : "stone";

  card.className = `chaos-card ${family} ${visible ? "revealed" : "hidden-card"} ${cardState.used ? "used" : ""}`;
  card.dataset.accent = visible ? def.accent : "hidden";
  card.dataset.player = playerId;

  if (!visible) {
    card.innerHTML = `
      <span class="card-owner">${PLAYERS[playerId].label}</span>
      <span class="card-back-mark" aria-hidden="true">${isPower ? "P" : "S"}</span>
      <strong>${isPower ? "미공개 초능력" : "미공개 특수돌"}</strong>
      <p>아직 사용하지 않았습니다.</p>
    `;
    return card;
  }

  const action = renderChaosCardAction(playerId, slot, cardState, def);
  card.innerHTML = `
    <span class="card-owner">${PLAYERS[playerId].label}</span>
    <span class="card-glyph" data-glyph="${def.glyph}" aria-hidden="true"></span>
    <span class="card-type">${isPower ? "초능력" : "특수돌"}</span>
    <strong>${def.name}</strong>
    <p>${def.shortText}</p>
    ${cardState.effectSummary ? `<p class="card-result">${cardState.effectSummary}</p>` : ""}
  `;
  if (action) card.append(action);
  return card;
}

function renderChaosCardAction(playerId, slot, cardState, def) {
  if (cardState.used || state.gameOver || state.current !== playerId) return null;
  if (state.mode === "cpu" && playerId !== state.humanColor) return null;
  if (state.mode === "online") return null;

  const button = document.createElement("button");
  button.type = "button";

  if (slot === "power") {
    const targetingThisPower =
      state.chaos?.targeting?.player === playerId && state.chaos.targeting.powerId === cardState.id;
    const readiness = getChaosPowerReadiness(playerId, cardState.id);
    button.className = "card-action";
    button.textContent = targetingThisPower ? "취소" : "발동";
    button.disabled = !targetingThisPower && !canAttemptChaosPower(playerId);
    if (!readiness.ok) {
      button.title = readiness.message;
      button.setAttribute("aria-label", `${def.name}: ${readiness.message}`);
    }
    button.addEventListener("click", () => {
      playUiSound();
      activateChaosPower(playerId);
    });
    return button;
  }

  const armed = state.chaos.armedSpecialStone === playerId;
  const empowered = state.chaos.activeBuffs[playerId] === "double_cast";
  button.className = `card-action ${armed ? "armed" : ""}`;
  button.textContent = armed ? (empowered ? "과충전됨" : "장전됨") : (empowered ? "과충전 장전" : "장전");
  button.disabled = !isHumanTurn();
  button.addEventListener("click", () => {
    playUiSound();
    state.chaos.armedSpecialStone = armed ? null : playerId;
    state.message = armed ? "특수돌 장전을 취소했습니다." : `${def.name}: 둘 칸을 고르세요.`;
    render();
  });
  return button;
}

function isChaosCardVisible(playerId, slot) {
  if (!state.chaos?.enabled) return false;
  if (state.mode === "local") return true;
  if (playerId === state.humanColor) return true;
  return Boolean(state.chaos.players[playerId][slot].revealed);
}

function renderCardReveal() {
  if (!cardRevealEl || !cardRevealKickerEl || !cardRevealTitleEl || !cardRevealTextEl) return;

  const reveal = state.chaos?.reveal;
  cardRevealEl.hidden = !reveal;
  if (!reveal) {
    cardRevealEl.dataset.family = "";
    cardRevealEl.dataset.accent = "";
    cardRevealEl.dataset.effect = "";
    if (cardRevealGlyphEl) cardRevealGlyphEl.dataset.glyph = "";
    return;
  }

  const def = reveal.family === "power" ? CHAOS_POWER_DEFS[reveal.id] : CHAOS_STONE_DEFS[reveal.id];
  cardRevealEl.dataset.family = reveal.family;
  cardRevealEl.dataset.accent = def?.accent ?? "gold";
  cardRevealEl.dataset.effect = reveal.id;
  if (cardRevealGlyphEl) cardRevealGlyphEl.dataset.glyph = def?.glyph ?? "stone";
  cardRevealKickerEl.textContent = reveal.kicker;
  cardRevealTitleEl.textContent = reveal.title;
  cardRevealTextEl.textContent = reveal.text;
}

function buildTurnLabel(currentLabel) {
  if (state.gameOver) return "종료";
  if (state.mode === "online") {
    if (state.online.status === "waiting") return "대기중";
    if (!state.online.seat) return "관전";
    return state.current === state.online.seat ? "내 차례" : "상대 차례";
  }
  if (isComputerTurn()) return "컴퓨터 생각중";
  return `${currentLabel} 차례`;
}

function renderResultOverlay() {
  if (!resultOverlayEl || !resultTitleEl || !resultScoreEl) return;

  resultOverlayEl.hidden = !state.gameOver;

  if (!state.gameOver) {
    resultOverlayEl.dataset.result = "";
    resultOverlayEl.dataset.winner = "";
    return;
  }

  const resultText = buildResultOverlayText();
  const summary = state.resultSummary ?? buildResultSummary();
  resultOverlayEl.dataset.result = summary.playerResult;
  resultOverlayEl.dataset.winner = summary.winner;
  resultTitleEl.textContent = resultText.title;
  resultScoreEl.textContent = resultText.score;
}

function describeCell(cell, row, col, legalMove) {
  const coordinate = formatCoordinate(row, col);
  const isLastMove = cellKey(row, col) === state.lastMove?.placedKey;
  const suffix = isLastMove ? ", 마지막 착수" : "";

  if (cell.terrain === "blocked") {
    return `${coordinate}, 막힌 칸${suffix}`;
  }

  if (cell.piece) {
    const stoneName =
      cell.piece.kind && cell.piece.kind !== "normal" ? `, ${CHAOS_STONE_DEFS[cell.piece.kind]?.name ?? "특수돌"}` : "";
    const shieldName = cell.piece.modifiers?.includes("shield") ? ", 보호막" : "";
    return `${coordinate}, ${PLAYERS[cell.piece.owner].name}${stoneName}${shieldName}${suffix}`;
  }

  if (legalMove) {
    return `${coordinate}, 둘 수 있음, ${legalMove.flips.length}개 뒤집기${suffix}`;
  }

  return `${coordinate}, 빈 칸${suffix}`;
}

function renderHistory() {
  historyListEl.innerHTML = "";

  if (!state.moveHistory.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "첫 수를 기다리는 중";
    historyListEl.append(emptyItem);
    return;
  }

  const recentMoves = state.moveHistory.slice(-7).reverse();

  for (const move of recentMoves) {
    const item = document.createElement("li");
    if (move.power) {
      item.innerHTML = `<strong>${PLAYERS[move.player].label} ${
        CHAOS_POWER_DEFS[move.power]?.name ?? "초능력"
      }</strong> 발동`;
    } else {
      const stoneLabel =
        move.kind && move.kind !== "normal" ? ` · ${CHAOS_STONE_DEFS[move.kind]?.name ?? "특수돌"}` : "";
      item.innerHTML = `<strong>${PLAYERS[move.player].label} ${formatCoordinate(
        move.row,
        move.col,
      )}</strong>${stoneLabel} · ${move.flipped}개 뒤집음`;
    }
    historyListEl.append(item);
  }
}

function formatCoordinate(row, col) {
  return `${columnNames[col]}${row + 1}`;
}

newGameButtonEl.addEventListener("click", () => {
  playUiSound();
  if (gameSettings.mode === "online") {
    window.location.href = "lobby.html";
    return;
  }
  createGame(gameSettings);
});

copyRoomButtonEl?.addEventListener("click", async () => {
  if (!state?.online?.inviteUrl) return;

  try {
    await navigator.clipboard.writeText(state.online.inviteUrl);
    setOnlineStatus(state.online.status, "초대 링크를 복사했습니다.");
  } catch (error) {
    console.warn("[Reversi] 초대 링크 복사 실패:", error);
    window.prompt("초대 링크를 복사하세요.", state.online.inviteUrl);
  }
  render();
});

window.reversiDebug = {
  state: () => state,
  settings: () => gameSettings,
  getLegalMoves,
  getFlipsForMove,
  serializeBoard,
  deserializeBoard,
};

setupAudioControls();
createGame();
