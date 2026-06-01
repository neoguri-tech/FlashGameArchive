import { auth, db } from "./firebaseApp.js";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

function makeSessionId(gameId) {
  const randomPart =
    crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${gameId}:${randomPart}`;
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
}

export async function trackEvent({ gameId, type, sessionId = null, payload = {} }) {
  if (!gameId || !type) {
    throw new Error("trackEvent에는 gameId와 type이 필요합니다.");
  }

  const user = auth.currentUser;
  const event = stripUndefined({
    gameId,
    type,
    sessionId,
    uid: user?.uid ?? null,
    isAnonymous: user?.isAnonymous ?? null,
    payload,
    createdAt: serverTimestamp(),
  });

  try {
    await addDoc(collection(db, "platform", "events", "items"), event);
    return { ok: true };
  } catch (error) {
    console.warn("[Backend Events] 이벤트 기록 실패:", error);
    return { ok: false, error };
  }
}

export async function trackGameStart({ gameId, mode = "default", payload = {} }) {
  const sessionId = makeSessionId(gameId);
  const startedAt = Date.now();

  await trackEvent({
    gameId,
    type: "game_start",
    sessionId,
    payload: { mode, ...payload },
  });

  try {
    await setDoc(
      doc(db, "platform", "gameStats", "games", gameId),
      {
        gameId,
        playCount: increment(1),
        lastPlayedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("[Backend Events] 게임 집계 갱신 실패:", error);
  }

  return { sessionId, startedAt };
}

export async function trackGameEnd({
  gameId,
  sessionId,
  result = "finished",
  durationMs = null,
  payload = {},
}) {
  await trackEvent({
    gameId,
    type: "game_end",
    sessionId,
    payload: { result, durationMs, ...payload },
  });

  try {
    const stats = {
      gameId,
      endCount: increment(1),
      lastEndedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (result === "finished" || result === "cleared" || result === "won") {
      stats.completedCount = increment(1);
    }

    if (Number.isFinite(durationMs)) {
      stats.totalPlayTimeMs = increment(durationMs);
    }

    await setDoc(doc(db, "platform", "gameStats", "games", gameId), stats, { merge: true });
  } catch (error) {
    console.warn("[Backend Events] 종료 집계 갱신 실패:", error);
  }
}

export async function trackScoreSubmit({ gameId, leaderboardId, sortValue, payload = {} }) {
  return trackEvent({
    gameId,
    type: "score_submit",
    payload: { leaderboardId, sortValue, ...payload },
  });
}

export const eventsApi = {
  trackEvent,
  trackGameEnd,
  trackGameStart,
  trackScoreSubmit,
};

export default eventsApi;
