import { auth, db } from "./firebaseApp.js";
import { getUserPublicName } from "./authApi.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

function isBetterScore(order, nextValue, previousValue) {
  if (!Number.isFinite(previousValue)) return true;
  return order === "asc" ? nextValue < previousValue : nextValue > previousValue;
}

function entriesCollection(gameId, leaderboardId) {
  return collection(db, "games", gameId, "leaderboards", leaderboardId, "entries");
}

export async function submitLeaderboardEntry({
  gameId,
  leaderboardId,
  sortValue,
  order = "desc",
  payload = {},
  entryId = null,
  strategy = "best",
}) {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, reason: "signed-out" };
  }

  const targetId = entryId ?? user.uid;
  const entryRef = doc(entriesCollection(gameId, leaderboardId), targetId);
  const previous = await getDoc(entryRef);

  if (strategy === "best" && previous.exists()) {
    const previousValue = previous.data().sortValue;
    if (!isBetterScore(order, sortValue, previousValue)) {
      return { ok: true, changed: false };
    }
  }

  const publicName = await getUserPublicName(user);
  await setDoc(
    entryRef,
    {
      uid: user.uid,
      displayName: publicName,
      publicName,
      sortValue,
      order,
      payload,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, changed: true };
}

export async function getLeaderboard({
  gameId,
  leaderboardId,
  order = "desc",
  limitCount = 10,
}) {
  const q = query(entriesCollection(gameId, leaderboardId), orderBy("sortValue", order), limit(limitCount));
  const snap = await getDocs(q);

  return snap.docs.map((entry, index) => ({
    id: entry.id,
    rank: index + 1,
    ...entry.data(),
  }));
}

export const leaderboardApi = {
  getLeaderboard,
  submitLeaderboardEntry,
};

export default leaderboardApi;
