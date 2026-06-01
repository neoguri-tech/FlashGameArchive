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
const onlinePanelEl = document.querySelector("#onlinePanel");
const roomCodeValueEl = document.querySelector("#roomCodeValue");
const roomStatusValueEl = document.querySelector("#roomStatusValue");
const copyRoomButtonEl = document.querySelector("#copyRoomButton");

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

let state;
let gameSettings = readSettingsFromUrl();
let backendState = {
  ready: false,
  loadFailed: false,
  user: null,
  api: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  const blockedParam = Number.parseInt(params.get("blocked") ?? "0", 10);
  const requestedMode = modeParam === "local" || modeParam === "online" ? modeParam : "cpu";

  return {
    mode: requestedMode,
    humanColor: playerParam === "white" ? "white" : "black",
    difficulty: DIFFICULTY_LABELS[requestedDifficulty] ? requestedDifficulty : "easy",
    blockedCount: clamp(Number.isFinite(blockedParam) ? blockedParam : 0, 0, 14),
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
    label: randomBlockedCount > 0 ? `변형 8x8` : baseRules.label,
    randomBlockedCount,
    blockedCells: [...baseRules.blockedCells],
    players: {
      black: {
        ...baseRules.players.black,
        controller: blackController,
        powers: [...baseRules.players.black.powers],
        specialStoneDeck: [...baseRules.players.black.specialStoneDeck],
      },
      white: {
        ...baseRules.players.white,
        controller: whiteController,
        powers: [...baseRules.players.white.powers],
        specialStoneDeck: [...baseRules.players.white.specialStoneDeck],
      },
    },
  };
}

function createGame(settings = gameSettings) {
  clearPendingAi();
  gameSettings = settings;

  const rules = cloneRuleset(CLASSIC_RULESET, settings);
  const board = createBoard(rules);

  state = {
    rules,
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
  state.legalMoves = getLegalMoves(state.board, state.current);
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
      const flips = getFlipsForMove(board, row, col, playerId);

      if (flips.length) {
        moves.push({ row, col, flips });
      }
    }
  }

  return moves;
}

function getFlipsForMove(board, row, col, playerId) {
  const size = board.length;
  const target = board[row]?.[col];

  if (!target || target.terrain !== "open" || target.piece) {
    return [];
  }

  const opponent = opponentOf(playerId);
  const allFlips = [];

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
      }

      break;
    }
  }

  return allFlips;
}

function isHumanTurn() {
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
  if (state.mode === "online") return false;
  return state.rules.players[state.current].controller === "computer" && !state.gameOver;
}

function applyMove(row, col) {
  if (!isHumanTurn()) return false;
  return commitMove(row, col);
}

function commitMove(row, col, options = {}) {
  const move = state.legalMoves.find((candidate) => candidate.row === row && candidate.col === col);

  if (!move) return false;

  const playerId = state.current;
  const pieceKind = drawStoneKindFor(playerId);
  const flippedKeys = move.flips.map((flip) => cellKey(flip.row, flip.col));

  state.board[row][col].piece = createPiece(playerId, pieceKind);

  for (const flip of move.flips) {
    capturePiece(state.board[flip.row][flip.col], playerId);
  }

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
  });

  advanceTurn();
  render();
  queueResultSave();
  if (state.mode === "online" && options.syncOnline !== false) {
    writeOnlineState();
  }
  return true;
}

function capturePiece(cell, owner) {
  if (!cell.piece) return;

  cell.piece = {
    ...cell.piece,
    owner,
  };
}

function drawStoneKindFor(playerId) {
  const deck = state.rules.players[playerId].specialStoneDeck;
  return deck.shift() ?? "normal";
}

function advanceTurn() {
  const current = state.current;
  const next = opponentOf(current);
  const nextMoves = getLegalMoves(state.board, next);

  if (nextMoves.length) {
    state.current = next;
    state.legalMoves = nextMoves;
    state.message = `${PLAYERS[next].label} 차례입니다.`;
    return;
  }

  const currentMoves = getLegalMoves(state.board, current);

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

function buildGameOverMessage() {
  const score = countScore(state.board);

  if (score.black === score.white) {
    return `무승부입니다. ${score.black}:${score.white}`;
  }

  const winner = score.black > score.white ? "black" : "white";
  return `${PLAYERS[winner].label} 승리입니다. ${score.black}:${score.white}`;
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

function scheduleComputerMove() {
  if (!isComputerTurn() || state.aiTimer) return;

  state.aiThinking = true;
  state.aiTimer = window.setTimeout(() => {
    state.aiTimer = null;
    state.aiThinking = false;

    const move = chooseComputerMove();
    if (move) {
      commitMove(move.row, move.col);
    }
  }, 560);
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
  state.legalMoves = getLegalMoves(state.board, state.current);
  state.online.applyingRemote = false;
  render();
}

function hydrateOnlineState(room) {
  const onlineState = room.state;
  state.board = deserializeBoard(onlineState.board);
  state.rules.randomBlockedCount = countScore(state.board).blocked;
  state.rules.label = state.rules.randomBlockedCount > 0 ? "변형 8x8" : CLASSIC_RULESET.label;
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

  boardEl.style.setProperty("--board-size", state.rules.size);
  boardEl.innerHTML = "";

  for (let row = 0; row < state.rules.size; row += 1) {
    for (let col = 0; col < state.rules.size; col += 1) {
      const cell = state.board[row][col];
      const key = cellKey(row, col);
      const legalMove = legalMoveMap.get(key);
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

      if (cell.piece) {
        const piece = document.createElement("span");
        piece.className = `piece ${cell.piece.owner}`;
        if (cell.piece.kind !== "normal") {
          piece.classList.add("special");
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

      button.disabled = state.gameOver || !isHumanTurn() || !legalMove;
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

  blackScoreCardEl.classList.toggle("mine", state.humanColor === "black");
  whiteScoreCardEl.classList.toggle("mine", state.humanColor === "white");

  renderResultOverlay();
  renderHistory();
  scheduleComputerMove();
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
    return;
  }

  const resultText = buildResultOverlayText();
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
    return `${coordinate}, ${PLAYERS[cell.piece.owner].name}${suffix}`;
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
    item.innerHTML = `<strong>${PLAYERS[move.player].label} ${formatCoordinate(
      move.row,
      move.col,
    )}</strong> ${move.flipped}개 뒤집음`;
    historyListEl.append(item);
  }
}

function formatCoordinate(row, col) {
  return `${columnNames[col]}${row + 1}`;
}

newGameButtonEl.addEventListener("click", () => {
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

createGame();
