const chartCanvas = document.querySelector("#chartCanvas");
const chartContext = chartCanvas.getContext("2d");
const lobbyPanelEl = document.querySelector("#lobbyPanel");
const gameLayoutEl = document.querySelector("#gameLayout");
const lobbyFormEl = document.querySelector("#lobbyForm");
const lobbyStatusEl = document.querySelector("#lobbyStatus");
const startGameButtonEl = document.querySelector("#startGameButton");
const sourceBadgeEl = document.querySelector("#sourceBadge");
const periodTextEl = document.querySelector("#periodText");
const dayTextEl = document.querySelector("#dayText");
const priceTextEl = document.querySelector("#priceText");
const marketMessageEl = document.querySelector("#marketMessage");
const valuePillEl = document.querySelector("#valuePill");
const cashValueEl = document.querySelector("#cashValue");
const unitValueEl = document.querySelector("#unitValue");
const returnValueEl = document.querySelector("#returnValue");
const totalValueEl = document.querySelector("#totalValue");
const dateValueEl = document.querySelector("#dateValue");
const openValueEl = document.querySelector("#openValue");
const highValueEl = document.querySelector("#highValue");
const lowValueEl = document.querySelector("#lowValue");
const changeValueEl = document.querySelector("#changeValue");
const historyListEl = document.querySelector("#historyList");
const resultOverlayEl = document.querySelector("#resultOverlay");
const resultTitleEl = document.querySelector("#resultTitle");
const resultDetailEl = document.querySelector("#resultDetail");
const resultOptimalEl = document.querySelector("#resultOptimal");
const settingsButtonEl = document.querySelector("#settingsButton");
const newRoundButtonEl = document.querySelector("#newRoundButton");
const buyButtonEl = document.querySelector("#buyButton");
const sellButtonEl = document.querySelector("#sellButton");
const holdButtonEl = document.querySelector("#holdButton");
const quantityInputEl = document.querySelector("#quantityInput");
const maxBuyButtonEl = document.querySelector("#maxBuyButton");
const maxSellButtonEl = document.querySelector("#maxSellButton");
const quantityHintEl = document.querySelector("#quantityHint");
const avatarPanelEl = document.querySelector("#avatarPanel");
const avatarBadgeEl = document.querySelector("#avatarBadge");
const avatarTitleEl = document.querySelector("#avatarTitle");
const avatarLineEl = document.querySelector("#avatarLine");

const CONTEXT_DAYS = 10;
const PLAY_DAYS = 30;
const ROUND_DAYS = CONTEXT_DAYS + PLAY_DAYS;
const BEST_KEY_PREFIX = "neoguri:should-have-bought:best";
const STARTING_CASH_RATIO = 0.5;
const UNIT_EPSILON = 0.0000001;
const UNIT_DUST_EPSILON = 0.000001;
const REVEAL_MIN_MS = 3000;
const REVEAL_MAX_MS = 6000;
const REVEAL_BASE_MS = 3300;
const REVEAL_VOLATILITY_SENSITIVITY = 420;
const LOBBY_STATUS_TEXT =
  "본 게임의 차트는 실제 1년치 일봉 데이터의 일부를 보여줍니다. 차트 앞에서 당신의 판단은 얼마나 냉철할까요?";

const MARKETS = {
  kospi: {
    id: "kospi",
    label: "KOSPI",
    badge: "KOSPI",
    dataUrl: "data/kospi-ks11.json",
    remoteUrl: "https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?range=1y&interval=1d",
    currency: "KRW",
    initialCash: 10_000_000,
    priceDecimals: 2,
    syntheticMin: 2500,
    syntheticMax: 3600,
    syntheticFloor: 1200,
    syntheticVolatility: [0.006, 0.022],
  },
  btc: {
    id: "btc",
    label: "Bitcoin",
    badge: "BTC",
    dataUrl: "data/btc-krw.json",
    remoteUrl: "https://query1.finance.yahoo.com/v8/finance/chart/BTC-KRW?range=1y&interval=1d",
    currency: "KRW",
    initialCash: 10_000_000,
    priceDecimals: 0,
    syntheticMin: 60_000_000,
    syntheticMax: 160_000_000,
    syntheticFloor: 10_000_000,
    syntheticVolatility: [0.012, 0.05],
  },
  eth: {
    id: "eth",
    label: "Ethereum",
    badge: "ETH",
    dataUrl: "data/eth-krw.json",
    remoteUrl: "https://query1.finance.yahoo.com/v8/finance/chart/ETH-KRW?range=1y&interval=1d",
    currency: "KRW",
    initialCash: 10_000_000,
    priceDecimals: 0,
    syntheticMin: 2_000_000,
    syntheticMax: 8_000_000,
    syntheticFloor: 500_000,
    syntheticVolatility: [0.014, 0.06],
  },
  sol: {
    id: "sol",
    label: "Solana",
    badge: "SOL",
    dataUrl: "data/sol-usd.json",
    remoteUrl: "https://query1.finance.yahoo.com/v8/finance/chart/SOL-USD?range=1y&interval=1d",
    currency: "USD",
    initialCash: 10_000,
    priceDecimals: 2,
    syntheticMin: 70,
    syntheticMax: 260,
    syntheticFloor: 10,
    syntheticVolatility: [0.018, 0.075],
  },
  soxl: {
    id: "soxl",
    label: "SOXL",
    badge: "SOXL",
    dataUrl: "data/soxl.json",
    remoteUrl: "https://query1.finance.yahoo.com/v8/finance/chart/SOXL?range=1y&interval=1d",
    currency: "USD",
    initialCash: 10_000,
    priceDecimals: 2,
    syntheticMin: 10,
    syntheticMax: 80,
    syntheticFloor: 1,
    syntheticVolatility: [0.025, 0.11],
  },
};

const ACTION_LABELS = {
  buy: "매수",
  sell: "매도",
  hold: "관망",
};

const AVATAR_TIERS = [
  {
    id: "wrecked",
    maxReturn: -50,
    badge: "-50% 이하",
    title: "깡통 개미",
    line: "대공황이다... 라면도 분할매수 중.",
  },
  {
    id: "panic",
    maxReturn: -25,
    badge: "패닉",
    title: "돔황챠 개미",
    line: "돔황챠! 손절 버튼이 눈앞에서 깜빡인다.",
  },
  {
    id: "trapped",
    maxReturn: -10,
    badge: "물림",
    title: "본전 기도 개미",
    line: "본전만 오면 진짜 나간다. 이번엔 진짜다.",
  },
  {
    id: "nervous",
    maxReturn: -0.01,
    badge: "흔들",
    title: "눈치 개미",
    line: "추매인가 손절인가, 커서가 떨린다.",
  },
  {
    id: "steady",
    maxReturn: 5,
    badge: "보합",
    title: "차트 공부 개미",
    line: "관망도 포지션이다. 일단 차분히 본다.",
  },
  {
    id: "rally",
    maxReturn: 20,
    badge: "상승",
    title: "가즈아 개미",
    line: "양봉이 뜨면 목소리도 같이 커진다. 가즈아!",
  },
  {
    id: "boom",
    maxReturn: 50,
    badge: "대호황",
    title: "불장 개미",
    line: "계좌가 빨개지니 커피도 대형으로 간다.",
  },
  {
    id: "flex",
    maxReturn: 100,
    badge: "플렉스",
    title: "리치 개미",
    line: "수익률이 액세서리가 됐다. 오늘은 내가 기관이다.",
  },
  {
    id: "rich",
    maxReturn: 899,
    badge: "부자",
    title: "건물주 꿈꾸는 개미",
    line: "대호황에 표정 관리가 안 된다. 점심은 특식이다.",
  },
  {
    id: "tenbagger",
    maxReturn: Infinity,
    badge: "텐베거",
    title: "텐베거 개미",
    line: "대호황을 넘어 전설의 투자 일지를 쓰는 중.",
  },
];

let marketData = [];
let marketSource = {
  label: "랜덤 차트",
  isReal: false,
};
let selectedMarket = MARKETS.kospi;
let state = null;

function formatMoney(value, market = selectedMarket) {
  if (market.currency === "USD") {
    return `$${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPoint(value, market = selectedMarket) {
  return Number(value).toLocaleString("ko-KR", {
    minimumFractionDigits: market.priceDecimals,
    maximumFractionDigits: market.priceDecimals,
  });
}

function formatUnits(value) {
  const absValue = Math.abs(Number(value));
  let maximumFractionDigits = 6;

  if (absValue >= 1000) {
    maximumFractionDigits = 2;
  } else if (absValue >= 1) {
    maximumFractionDigits = 4;
  }

  return Number(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatQuantityInput(value) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  const flooredValue = Math.floor(value * 1_000_000) / 1_000_000;
  return String(Number(flooredValue.toFixed(6)));
}

function formatPercent(value, { signed = true } = {}) {
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function initialCash() {
  return selectedMarket.initialCash;
}

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

function easeInOut(progress) {
  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

async function fetchWithTimeout(url, timeoutMs = 6500) {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } finally {
    window.clearTimeout(timerId);
  }
}

function normalizeMarketRows(rows, real = true) {
  return rows
    .map((row) => {
      const open = Number(row.open);
      const high = Number(row.high);
      const low = Number(row.low);
      const close = Number(row.close);

      if (![open, high, low, close].every(Number.isFinite)) return null;

      return {
        date: row.date,
        open,
        high,
        low,
        close,
        real,
      };
    })
    .filter(Boolean);
}

async function loadSavedMarketData(market) {
  const data = await fetchWithTimeout(market.dataUrl, 4500);
  const rows = normalizeMarketRows(data?.rows ?? [], true);

  if (rows.length < ROUND_DAYS + 5) {
    throw new Error(`저장된 ${market.label} 데이터가 부족합니다.`);
  }

  return {
    label: `저장 ${market.badge}`,
    rows,
  };
}

async function loadRemoteMarketData(market) {
  const data = await fetchWithTimeout(market.remoteUrl);
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0] ?? {};

  const rows = timestamps
    .map((timestamp, index) => {
      const close = quote.close?.[index];
      const open = quote.open?.[index] ?? close;
      const high = quote.high?.[index] ?? Math.max(open, close);
      const low = quote.low?.[index] ?? Math.min(open, close);

      if (![open, high, low, close].every(Number.isFinite)) return null;

      return {
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        open,
        high,
        low,
        close,
        real: true,
      };
    })
    .filter(Boolean);

  if (rows.length < ROUND_DAYS + 5) {
    throw new Error(`${market.label} 데이터가 부족합니다.`);
  }

  return {
    label: `실시간 ${market.badge}`,
    rows,
  };
}

function generateSyntheticMarket(market, days = 190) {
  const rows = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days * 1.45);

  let close = randomBetween(market.syntheticMin, market.syntheticMax);
  let drift = randomBetween(-0.0008, 0.0012);
  let volatility = randomBetween(...market.syntheticVolatility);

  for (let index = 0; rows.length < days; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    if (rows.length % 38 === 0) {
      drift = randomBetween(-0.0014, 0.0018);
      volatility = randomBetween(...market.syntheticVolatility);
    }

    const open = close * (1 + randomBetween(-0.006, 0.006));
    const shock = drift + randomBetween(-volatility, volatility);
    close = Math.max(market.syntheticFloor, open * (1 + shock));
    const high = Math.max(open, close) * (1 + randomBetween(0.001, 0.012));
    const low = Math.min(open, close) * (1 - randomBetween(0.001, 0.012));

    rows.push({
      date: date.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      real: false,
    });
  }

  return rows;
}

function chooseRoundRows(rows) {
  const maxStart = rows.length - ROUND_DAYS;
  const start = Math.floor(Math.random() * Math.max(1, maxStart + 1));
  return rows.slice(start, start + ROUND_DAYS);
}

function buildStartingPortfolio(days) {
  const totalValue = initialCash();
  const startingPrice = days[CONTEXT_DAYS - 1]?.close ?? 0;
  const cash = totalValue * STARTING_CASH_RATIO;
  const positionValue = totalValue - cash;
  const units = startingPrice > 0 ? positionValue / startingPrice : 0;

  return {
    cash,
    units,
    startingPrice,
    positionValue,
  };
}

function valueReturnRate(value) {
  return ((value - initialCash()) / initialCash()) * 100;
}

function theoreticalBestResult(days) {
  const portfolio = buildStartingPortfolio(days);
  let cash = portfolio.cash;
  let units = portfolio.units;

  for (let turn = 0; turn < PLAY_DAYS; turn += 1) {
    const tradePrice = days[CONTEXT_DAYS + turn - 1].close;
    const nextClose = days[CONTEXT_DAYS + turn].close;

    if (nextClose > tradePrice && cash > 0) {
      units += cash / tradePrice;
      cash = 0;
    } else if (nextClose < tradePrice && units > 0) {
      cash += units * tradePrice;
      units = 0;
    }
  }

  const value = cash + units * days[ROUND_DAYS - 1].close;

  return {
    value,
    returnRate: valueReturnRate(value),
  };
}

function bestScoreKey() {
  return `${BEST_KEY_PREFIX}:${selectedMarket.id}`;
}

function readBestScore() {
  const value = Number(localStorage.getItem(bestScoreKey()));
  return Number.isFinite(value) && value > 0 ? value : initialCash();
}

function saveBestScore(value) {
  if (value > readBestScore()) {
    localStorage.setItem(bestScoreKey(), String(Math.round(value)));
  }
}

function tradeDayIndex() {
  return CONTEXT_DAYS + state.playedDays - 1;
}

function nextRevealIndex() {
  return CONTEXT_DAYS + state.playedDays;
}

function visibleBaseCount() {
  return CONTEXT_DAYS + state.playedDays;
}

function activeDayIndex() {
  return Math.min(tradeDayIndex(), ROUND_DAYS - 1);
}

function activeDay() {
  return state.liveDay ?? state.days[activeDayIndex()];
}

function activePrice() {
  return state.livePrice ?? activeDay().close;
}

function averagePrice() {
  return state.units > UNIT_EPSILON && Number.isFinite(state.averagePrice)
    ? state.averagePrice
    : null;
}

function portfolioValue(price = activePrice()) {
  return state.cash + state.units * price;
}

function currentReturnRate() {
  return valueReturnRate(portfolioValue());
}

function avatarTierFor(returnRate) {
  return AVATAR_TIERS.find((tier) => returnRate <= tier.maxReturn) ?? AVATAR_TIERS.at(-1);
}

function maxBuyUnits(price = state.days[tradeDayIndex()].close) {
  return state.cash / price;
}

function maxSellUnits() {
  return state.units;
}

function isValidTradeQuantity(quantity, maxUnits) {
  return quantity > UNIT_EPSILON && quantity <= maxUnits + UNIT_EPSILON;
}

function readTradeQuantity() {
  const value = Number(quantityInputEl.value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function setTradeQuantity(value, intent = null) {
  quantityInputEl.value = formatQuantityInput(Math.max(0, value));
  if (state) {
    state.quantityIntent = intent;
  }
}

function startRound() {
  const days = chooseRoundRows(marketData);
  const startingPortfolio = buildStartingPortfolio(days);
  setTradeQuantity(0);
  state = {
    days,
    playedDays: 0,
    cash: startingPortfolio.cash,
    units: startingPortfolio.units,
    averagePrice: startingPortfolio.units > UNIT_EPSILON ? startingPortfolio.startingPrice : null,
    history: [],
    finished: false,
    animating: false,
    liveDay: null,
    livePrice: null,
    quantityIntent: null,
    message:
      marketSource.isReal
        ? `${selectedMarket.label} 1년치 일봉입니다. 예열 마지막 종가 기준 현금 ${formatMoney(startingPortfolio.cash)}와 현물 ${formatUnits(startingPortfolio.units)} 단위로 시작합니다.`
        : `${selectedMarket.label} 데이터 연결이 막혀 랜덤 생성 차트로 진행합니다. 예열 마지막 종가 기준 현금 ${formatMoney(startingPortfolio.cash)}와 현물 ${formatUnits(startingPortfolio.units)} 단위로 시작합니다.`,
  };
  render();
}

function act(action) {
  if (!state || state.finished || state.animating) return;

  const tradeIndex = tradeDayIndex();
  const day = state.days[tradeIndex];
  const price = day.close;
  const requestedUnits = readTradeQuantity();
  const buyUnits = maxBuyUnits(price);
  const sellUnits = maxSellUnits();
  const isMaxBuyIntent = state.quantityIntent === "maxBuy";
  const isMaxSellIntent = state.quantityIntent === "maxSell";
  let detail = "변동 없음";

  if (action === "buy") {
    if (requestedUnits <= UNIT_EPSILON) {
      state.message = "매수 수량을 0보다 크게 입력하세요.";
      render();
      return;
    }

    if (buyUnits <= UNIT_EPSILON) {
      state.message = "매수 가능한 수량이 없습니다.";
      render();
      return;
    }

    if (!isValidTradeQuantity(requestedUnits, buyUnits)) {
      state.message = `매수 수량은 ${formatUnits(buyUnits)} 단위 이하로 입력하세요.`;
      render();
      return;
    }

    const nextUnits = isMaxBuyIntent ? buyUnits : requestedUnits;
    if (nextUnits > UNIT_EPSILON) {
      const previousUnits = state.units;
      const previousAverage = averagePrice() ?? price;
      const nextTotalUnits = previousUnits + nextUnits;
      state.averagePrice =
        nextTotalUnits > UNIT_EPSILON
          ? (previousAverage * previousUnits + price * nextUnits) / nextTotalUnits
          : null;
      state.units += nextUnits;
      state.cash -= nextUnits * price;
      detail = `${formatUnits(nextUnits)} 단위 매수`;
    }
  } else if (action === "sell") {
    if (requestedUnits <= UNIT_EPSILON) {
      state.message = "매도 수량을 0보다 크게 입력하세요.";
      render();
      return;
    }

    if (sellUnits <= UNIT_EPSILON) {
      state.message = "매도 가능한 보유 수량이 없습니다.";
      render();
      return;
    }

    if (!isValidTradeQuantity(requestedUnits, sellUnits)) {
      state.message = `매도 수량은 ${formatUnits(sellUnits)} 단위 이하로 입력하세요.`;
      render();
      return;
    }

    const nextUnits = isMaxSellIntent ? sellUnits : requestedUnits;
    if (nextUnits > UNIT_EPSILON) {
      const proceeds = nextUnits * price;
      detail = `${formatUnits(nextUnits)} 단위 매도`;
      state.cash += proceeds;
      state.units -= nextUnits;
      if (isMaxSellIntent || state.units <= UNIT_DUST_EPSILON) {
        state.units = 0;
        state.averagePrice = null;
      }
    }
  }

  state.history.push({
    turn: state.playedDays + 1,
    tradeIndex,
    revealIndex: nextRevealIndex(),
    action,
    date: day.date,
    price,
    value: portfolioValue(),
    detail,
  });

  setTradeQuantity(0);
  revealNextDay();
}

function finishRound() {
  state.finished = true;
  const finalValue = portfolioValue(state.days[ROUND_DAYS - 1].close);
  const returnRate = valueReturnRate(finalValue);
  saveBestScore(finalValue);
  state.message = `최종 평가금액 ${formatMoney(finalValue)} · ${formatPercent(returnRate)}`;
  render();
}

function visibleDays() {
  const days = state.days.slice(0, visibleBaseCount());
  if (state.liveDay) {
    days.push(state.liveDay);
  }
  return days;
}

function revealVolatilityPct(day, previousDay) {
  const reference = Math.max(1, previousDay?.close ?? day.open);
  const rangePct = ((day.high - day.low) / reference) * 100;
  const closePct = Math.abs(((day.close - reference) / reference) * 100);
  return Math.max(rangePct, closePct * 1.25);
}

function revealDurationFor(day, previousDay) {
  const volatilityPct = revealVolatilityPct(day, previousDay);
  const rawDuration =
    REVEAL_BASE_MS + (volatilityPct - 1.5) * REVEAL_VOLATILITY_SENSITIVITY;

  return {
    duration: Math.round(clamp(rawDuration, REVEAL_MIN_MS, REVEAL_MAX_MS)),
    volatilityPct,
  };
}

function revealTickCountFor(duration) {
  return Math.round(clamp(duration / 26, 42, 140));
}

function buildRevealTicks(day, tickCount) {
  const highStep = Math.floor(randomBetween(10, tickCount - 12));
  let lowStep = Math.floor(randomBetween(8, tickCount - 10));

  if (Math.abs(highStep - lowStep) < 6) {
    lowStep = highStep < tickCount / 2 ? highStep + 8 : highStep - 8;
  }

  const milestones = [
    { step: 0, price: day.open },
    { step: highStep, price: day.high },
    { step: lowStep, price: day.low },
    { step: tickCount - 1, price: day.close },
  ].sort((a, b) => a.step - b.step);

  const range = Math.max(1, day.high - day.low);
  const ticks = [];

  for (let step = 0; step < tickCount; step += 1) {
    const nextMilestoneIndex = milestones.findIndex((milestone) => milestone.step >= step);
    const nextMilestone = milestones[Math.max(0, nextMilestoneIndex)];
    const previousMilestone = milestones[Math.max(0, nextMilestoneIndex - 1)] ?? nextMilestone;
    const segmentLength = Math.max(1, nextMilestone.step - previousMilestone.step);
    const segmentProgress = clamp((step - previousMilestone.step) / segmentLength, 0, 1);
    const base = lerp(previousMilestone.price, nextMilestone.price, easeInOut(segmentProgress));
    const envelope = Math.sin(Math.PI * segmentProgress);
    const wiggle = (Math.random() - 0.5) * range * 0.12 * envelope;
    ticks.push(clamp(base + wiggle, day.low, day.high));
  }

  for (const milestone of milestones) {
    ticks[milestone.step] = milestone.price;
  }

  ticks[0] = day.open;
  ticks[ticks.length - 1] = day.close;
  return ticks;
}

function partialDay(day, ticks, tickIndex) {
  const prices = ticks.slice(0, tickIndex + 1);
  return {
    ...day,
    high: Math.max(day.open, ...prices),
    low: Math.min(day.open, ...prices),
    close: prices[prices.length - 1],
  };
}

function updateLastHistoryValue(price) {
  const lastEntry = state.history.at(-1);
  if (lastEntry) {
    lastEntry.value = portfolioValue(price);
  }
}

function revealNextDay() {
  const revealIndex = nextRevealIndex();
  const day = state.days[revealIndex];
  const previousDay = state.days[revealIndex - 1];
  const revealMeta = revealDurationFor(day, previousDay);
  const ticks = buildRevealTicks(day, revealTickCountFor(revealMeta.duration));
  const startedAt = performance.now();

  state.animating = true;
  state.livePrice = ticks[0];
  state.liveDay = partialDay(day, ticks, 0);
  state.message = `${ACTION_LABELS[state.history.at(-1).action]} 체결 완료. 변동성 ${formatPercent(revealMeta.volatilityPct, { signed: false })} 봉이 열립니다.`;
  updateLastHistoryValue(ticks[0]);
  render();

  function frame(now) {
    const progress = clamp((now - startedAt) / revealMeta.duration, 0, 1);
    const tickIndex = Math.min(ticks.length - 1, Math.floor(easeInOut(progress) * ticks.length));
    const price = ticks[tickIndex];

    state.livePrice = price;
    state.liveDay = partialDay(day, ticks, tickIndex);
    state.message = `장중 변동 중... 현재가 ${formatPoint(price)} · 평가 ${formatMoney(portfolioValue(price))}`;
    updateLastHistoryValue(price);
    render();

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    state.playedDays += 1;
    state.animating = false;
    state.livePrice = null;
    state.liveDay = null;
    updateLastHistoryValue(day.close);

    if (state.playedDays >= PLAY_DAYS) {
      finishRound();
      return;
    }

    const change = ((day.close - state.days[revealIndex - 1].close) / state.days[revealIndex - 1].close) * 100;
    state.message = `다음 종가 ${formatPoint(day.close)} 공개 · ${formatPercent(change)}. 다음 결정을 내리세요.`;
    render();
  }

  requestAnimationFrame(frame);
}

function drawChart() {
  const rect = chartCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(640, Math.floor(rect.width * dpr));
  const height = Math.max(360, Math.floor(rect.height * dpr));

  if (chartCanvas.width !== width || chartCanvas.height !== height) {
    chartCanvas.width = width;
    chartCanvas.height = height;
  }

  const ctx = chartContext;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(dpr, dpr);

  const cssWidth = width / dpr;
  const cssHeight = height / dpr;
  const padding = { left: 56, right: 82, top: 24, bottom: 42 };
  const plotWidth = cssWidth - padding.left - padding.right;
  const plotHeight = cssHeight - padding.top - padding.bottom;
  const shown = visibleDays();
  const positionAverage = averagePrice();
  const highs = shown.map((day) => day.high);
  const lows = shown.map((day) => day.low);
  if (positionAverage !== null) {
    highs.push(positionAverage);
    lows.push(positionAverage);
  }
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const range = Math.max(1, maxPrice - minPrice);
  const paddedMin = minPrice - range * 0.08;
  const paddedMax = maxPrice + range * 0.08;
  const candleGap = plotWidth / ROUND_DAYS;
  const candleWidth = clamp(candleGap * 0.56, 7, 18);

  const xFor = (index) => padding.left + candleGap * index + candleGap * 0.5;
  const yFor = (price) =>
    padding.top + ((paddedMax - price) / (paddedMax - paddedMin)) * plotHeight;

  ctx.fillStyle = "#101417";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (plotHeight / 4) * index;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(cssWidth - padding.right, y);
    ctx.stroke();

    const labelValue = paddedMax - ((paddedMax - paddedMin) / 4) * index;
    ctx.fillStyle = "rgba(245,241,231,0.64)";
    ctx.font = "700 11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(labelValue).toLocaleString("ko-KR"), padding.left - 8, y + 4);
  }

  ctx.fillStyle = "rgba(255,255,255,0.035)";
  const futureStart = xFor(shown.length - 1) + candleGap * 0.5;
  ctx.fillRect(futureStart, padding.top, cssWidth - padding.right - futureStart, plotHeight);

  shown.forEach((day, index) => {
    const x = xFor(index);
    const up = day.close >= day.open;
    const color = up ? "#ef5b4f" : "#5f95ff";
    const yOpen = yFor(day.open);
    const yClose = yFor(day.close);
    const yHigh = yFor(day.high);
    const yLow = yFor(day.low);
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  });

  state.history.forEach((entry) => {
    const x = xFor(entry.tradeIndex);
    const y = yFor(state.days[entry.tradeIndex].close);
    ctx.fillStyle =
      entry.action === "buy" ? "#f1d35b" : entry.action === "sell" ? "#70d6ff" : "#9aa2aa";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const labelX = cssWidth - padding.right + 10;
  const labelWidth = Math.min(50, cssWidth - labelX - 8);
  const labelHeight = 22;
  const labelGap = 4;

  function priceGuidesWithLabels(guides) {
    const sortedGuides = guides
      .map((guide) => ({
        ...guide,
        lineY: yFor(guide.price),
      }))
      .sort((a, b) => a.lineY - b.lineY);

    const maxLabelY = cssHeight - padding.bottom - labelHeight;

    for (let index = 0; index < sortedGuides.length; index += 1) {
      const guide = sortedGuides[index];
      const naturalY = clamp(guide.lineY - labelHeight / 2, padding.top, maxLabelY);
      const previous = sortedGuides[index - 1];
      guide.labelY = previous
        ? Math.max(naturalY, previous.labelY + labelHeight + labelGap)
        : naturalY;
    }

    for (let index = sortedGuides.length - 1; index >= 0; index -= 1) {
      const guide = sortedGuides[index];
      const next = sortedGuides[index + 1];
      guide.labelY = next
        ? Math.min(guide.labelY, next.labelY - labelHeight - labelGap)
        : Math.min(guide.labelY, maxLabelY);
      guide.labelY = clamp(guide.labelY, padding.top, maxLabelY);
    }

    return sortedGuides;
  }

  function drawPriceGuide({ lineY, labelY, label, stroke, fill, border, dash }) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(padding.left, lineY);
    ctx.lineTo(cssWidth - padding.right, lineY);
    ctx.stroke();
    ctx.restore();

    if (Math.abs(labelY + labelHeight / 2 - lineY) > labelHeight / 2 + 2) {
      ctx.save();
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (labelY + labelHeight / 2 < lineY) {
        ctx.moveTo(labelX, labelY + labelHeight);
        ctx.lineTo(labelX - 8, lineY);
      } else {
        ctx.moveTo(labelX, labelY);
        ctx.lineTo(labelX - 8, lineY);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = fill;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f5f1e7";
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelX + labelWidth / 2, labelY + labelHeight / 2, labelWidth - 8);
  }

  const priceGuides = [];
  if (positionAverage !== null) {
    priceGuides.push({
      price: positionAverage,
      label: "평단",
      stroke: "rgba(255, 179, 71, 0.84)",
      fill: "rgba(255, 179, 71, 0.16)",
      border: "rgba(255, 179, 71, 0.54)",
      dash: [5, 5],
    });
  }

  const current = activeDay();
  const currentPrice = activePrice();
  priceGuides.push({
    price: currentPrice,
    label: "현재",
    stroke: "#42d2a8",
    fill: "rgba(66, 210, 168, 0.16)",
    border: "rgba(66, 210, 168, 0.58)",
    dash: [7, 6],
  });

  for (const guide of priceGuidesWithLabels(priceGuides)) {
    drawPriceGuide(guide);
  }

  ctx.fillStyle = "#f5f1e7";
  ctx.font = "900 12px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(current.date, padding.left, cssHeight - 16);
  ctx.textAlign = "right";
  ctx.fillText(`${state.playedDays}${state.animating ? "+1" : ""}/${PLAY_DAYS}`, cssWidth - padding.right, cssHeight - 16);

  ctx.restore();
}

function renderMetrics() {
  const value = portfolioValue();
  const returnRate = currentReturnRate();
  valuePillEl.textContent = formatMoney(value);
  valuePillEl.classList.toggle("live", state.animating);
  cashValueEl.textContent = formatMoney(state.cash);
  unitValueEl.textContent = formatUnits(state.units);
  returnValueEl.textContent = formatPercent(returnRate);
  returnValueEl.classList.toggle("positive", returnRate > 0);
  returnValueEl.classList.toggle("negative", returnRate < 0);
  totalValueEl.textContent = formatMoney(value);
}

function renderAvatar() {
  const returnRate = currentReturnRate();
  const tier = avatarTierFor(returnRate);
  avatarPanelEl.className = `avatar-panel tier-${tier.id}`;
  avatarBadgeEl.textContent = `${tier.badge} · ${formatPercent(returnRate)}`;
  avatarTitleEl.textContent = tier.title;
  avatarLineEl.textContent = tier.line;
}

function renderQuantity() {
  const price = state.days[tradeDayIndex()].close;
  const buyUnits = maxBuyUnits(price);
  const sellUnits = maxSellUnits();
  const requestedUnits = readTradeQuantity();
  const controlsLocked = state.finished || state.animating;
  const buyQuantityValid = isValidTradeQuantity(requestedUnits, buyUnits);
  const sellQuantityValid = isValidTradeQuantity(requestedUnits, sellUnits);
  const availableText = `매수 가능 ${formatUnits(buyUnits)} 단위 · 매도 가능 ${formatUnits(sellUnits)} 단위`;
  let quantityHint = availableText;

  if (requestedUnits <= UNIT_EPSILON) {
    quantityHint = `수량을 입력하거나 최대 버튼을 누르세요. ${availableText}`;
  } else if (!buyQuantityValid && !sellQuantityValid) {
    quantityHint = `입력 수량이 가능 수량보다 큽니다. ${availableText}`;
  } else if (!buyQuantityValid) {
    quantityHint = `매수 가능 수량보다 큽니다. ${availableText}`;
  } else if (!sellQuantityValid) {
    quantityHint = `매도 가능 수량보다 큽니다. ${availableText}`;
  }

  quantityHintEl.textContent = quantityHint;
  quantityInputEl.disabled = controlsLocked;
  maxBuyButtonEl.disabled = controlsLocked || buyUnits <= UNIT_EPSILON;
  maxSellButtonEl.disabled = controlsLocked || sellUnits <= UNIT_EPSILON;
  buyButtonEl.disabled = controlsLocked || !buyQuantityValid;
  sellButtonEl.disabled = controlsLocked || !sellQuantityValid;
}

function renderDaily() {
  const day = activeDay();
  const activeIndex = state.liveDay ? nextRevealIndex() : activeDayIndex();
  const previous = state.days[activeIndex - 1];
  const change = previous ? ((day.close - previous.close) / previous.close) * 100 : 0;

  dayTextEl.textContent = state.animating ? `공개 중 ${state.playedDays + 1} / ${PLAY_DAYS}` : `${state.playedDays} / ${PLAY_DAYS}`;
  priceTextEl.textContent = `${state.animating ? "현재" : "종가"} ${formatPoint(day.close)}`;
  priceTextEl.classList.toggle("live", state.animating);
  dateValueEl.textContent = day.date;
  openValueEl.textContent = formatPoint(day.open);
  highValueEl.textContent = formatPoint(day.high);
  lowValueEl.textContent = formatPoint(day.low);
  changeValueEl.textContent = formatPercent(change);
  changeValueEl.classList.toggle("positive", change > 0);
  changeValueEl.classList.toggle("negative", change < 0);
}

function renderHistory() {
  historyListEl.innerHTML = "";
  const recent = state.history.slice(-8).reverse();

  if (!recent.length) {
    const item = document.createElement("li");
    item.textContent = "첫 결정을 기다리는 중";
    historyListEl.append(item);
    return;
  }

  for (const entry of recent) {
    const item = document.createElement("li");
    const action = document.createElement("strong");
    const detail = document.createElement("span");
    action.textContent = `${entry.turn}턴 ${ACTION_LABELS[entry.action]}`;
    detail.textContent = `${entry.detail} · 체결 ${formatPoint(entry.price)} · 평가 ${formatMoney(entry.value)}`;
    item.append(action, detail);
    historyListEl.append(item);
  }
}

function renderResult() {
  resultOverlayEl.hidden = !state.finished;
  holdButtonEl.disabled = state.finished || state.animating;
  newRoundButtonEl.disabled = state.animating;

  if (!state.finished) return;

  buyButtonEl.disabled = true;
  sellButtonEl.disabled = true;
  const finalValue = portfolioValue(state.days[ROUND_DAYS - 1].close);
  const returnRate = valueReturnRate(finalValue);
  const bestResult = theoreticalBestResult(state.days);
  resultTitleEl.textContent = returnRate >= 0 ? "PROFIT" : "LOSS";
  resultDetailEl.textContent = `${formatMoney(finalValue)} · ${formatPercent(returnRate)}`;
  resultOptimalEl.textContent = `이론상 최대 ${formatMoney(bestResult.value)} · ${formatPercent(bestResult.returnRate)}`;
}

function render() {
  if (!state) return;

  sourceBadgeEl.textContent = marketSource.label;
  sourceBadgeEl.classList.toggle("real", marketSource.isReal);
  periodTextEl.textContent = `${selectedMarket.label} · ${state.days[0].date} - ${state.days[ROUND_DAYS - 1].date}`;
  marketMessageEl.textContent = state.message;
  renderAvatar();
  renderMetrics();
  renderQuantity();
  renderDaily();
  renderHistory();
  renderResult();
  drawChart();
}

function showLobby() {
  state = null;
  gameLayoutEl.hidden = true;
  lobbyPanelEl.hidden = false;
  valuePillEl.textContent = "설정 대기";
  valuePillEl.classList.remove("live");
  lobbyStatusEl.textContent = LOBBY_STATUS_TEXT;
}

function selectedMarketFromForm() {
  const formData = new FormData(lobbyFormEl);
  return MARKETS[formData.get("market")] ?? MARKETS.kospi;
}

async function loadMarketForGame(market) {
  try {
    const data = await loadSavedMarketData(market);
    marketData = data.rows;
    marketSource = {
      label: data.label,
      isReal: true,
    };
  } catch (error) {
    console.warn(`[Should Have Bought] ${market.label} 저장 데이터 로드 실패:`, error);
    try {
      const data = await loadRemoteMarketData(market);
      marketData = data.rows;
      marketSource = {
        label: data.label,
        isReal: true,
      };
    } catch (remoteError) {
      console.warn(`[Should Have Bought] ${market.label} 원격 데이터 로드 실패:`, remoteError);
      marketData = generateSyntheticMarket(market);
      marketSource = {
        label: `랜덤 ${market.badge}`,
        isReal: false,
      };
    }
  }
}

async function startGameFromLobby(event) {
  event?.preventDefault();
  selectedMarket = selectedMarketFromForm();

  startGameButtonEl.disabled = true;
  lobbyStatusEl.textContent = `${selectedMarket.label} 데이터를 확인하고 있습니다.`;
  valuePillEl.textContent = formatMoney(initialCash(), selectedMarket);

  await loadMarketForGame(selectedMarket);

  lobbyPanelEl.hidden = true;
  gameLayoutEl.hidden = false;
  startGameButtonEl.disabled = false;
  startRound();
}

buyButtonEl.addEventListener("click", () => act("buy"));
sellButtonEl.addEventListener("click", () => act("sell"));
holdButtonEl.addEventListener("click", () => act("hold"));
settingsButtonEl.addEventListener("click", () => {
  if (state?.animating) return;
  showLobby();
});
newRoundButtonEl.addEventListener("click", startRound);
maxBuyButtonEl.addEventListener("click", () => {
  if (!state || state.animating) return;
  setTradeQuantity(maxBuyUnits(), "maxBuy");
  renderQuantity();
});
maxSellButtonEl.addEventListener("click", () => {
  if (!state || state.animating) return;
  setTradeQuantity(maxSellUnits(), "maxSell");
  renderQuantity();
});
quantityInputEl.addEventListener("input", () => {
  if (!state) return;
  state.quantityIntent = null;
  renderQuantity();
});
window.addEventListener("resize", () => render());
lobbyFormEl.addEventListener("submit", startGameFromLobby);

showLobby();
