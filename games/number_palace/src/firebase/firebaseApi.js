import { app, auth, db, getAnalyticsInstance } from "../../../../shared/backend/firebaseApp.js";
import {
  ensureUserProfile,
  getUserPublicName,
  mergeGuestDataToRealAccount,
  onAuthStateChanged,
  signInAsGuest,
  signInWithGoogle,
  signOut,
} from "../../../../shared/backend/authApi.js";
import { getUserData, saveUserData } from "../../../../shared/backend/userApi.js";
import {
  getLeaderboard as getSharedLeaderboard,
  submitLeaderboardEntry,
} from "../../../../shared/backend/leaderboardApi.js";
import { trackScoreSubmit } from "../../../../shared/backend/eventsApi.js";
import { logEvent } from "firebase/analytics";
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";

const GAME_ID = "number_palace";
const BEST_CLEAR_LEADERBOARD_ID = "best_clear_time";

function fallbackPublicName(uid) {
  return `플레이어${String(uid ?? "0000").slice(0, 4).toUpperCase()}`;
}

async function getLegacyLeaderboard(limitCount) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("bestClearTime", "asc"), limit(limitCount));
  const querySnapshot = await getDocs(q);
  const leaderboard = [];

  querySnapshot.forEach((entry) => {
    const data = entry.data();
    leaderboard.push({
      uid: entry.id,
      ...data,
      displayName: data.publicName || fallbackPublicName(entry.id),
    });
  });

  return leaderboard;
}

const FirebaseApi = {
  getApp: () => app,
  getAuth: () => auth,
  getDb: () => db,

  logCustomEvent: async (eventName, eventParams = {}) => {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  },

  saveUserData,
  getUserData,
  signInAsGuest,
  signInWithGoogle,
  mergeGuestDataToRealAccount,
  signOut,
  onAuthStateChanged,

  updateBestClearTime: async (timeMs) => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      await ensureUserProfile(user);

      const publicName = await getUserPublicName(user);
      const currentData = await getUserData();
      const currentBest = currentData?.bestClearTime;

      if (currentBest && timeMs >= currentBest) {
        return false;
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          bestClearTime: timeMs,
          displayName: publicName,
          publicName,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await submitLeaderboardEntry({
        gameId: GAME_ID,
        leaderboardId: BEST_CLEAR_LEADERBOARD_ID,
        sortValue: timeMs,
        order: "asc",
        payload: { bestClearTime: timeMs },
      });

      await trackScoreSubmit({
        gameId: GAME_ID,
        leaderboardId: BEST_CLEAR_LEADERBOARD_ID,
        sortValue: timeMs,
        payload: { bestClearTime: timeMs },
      });

      return true;
    } catch (error) {
      console.error("[Number Palace] 최단 클리어 시간 저장 실패:", error);
      return false;
    }
  },

  getLeaderboard: async (limitCount = 10) => {
    try {
      const sharedEntries = await getSharedLeaderboard({
        gameId: GAME_ID,
        leaderboardId: BEST_CLEAR_LEADERBOARD_ID,
        order: "asc",
        limitCount,
      });

      if (sharedEntries.length > 0) {
        return sharedEntries.map((entry) => ({
          uid: entry.uid,
          displayName: entry.publicName || entry.displayName || fallbackPublicName(entry.uid),
          bestClearTime: entry.sortValue,
          ...entry.payload,
        }));
      }

      return getLegacyLeaderboard(limitCount);
    } catch (error) {
      console.error("[Number Palace] 리더보드 데이터 가져오기 실패:", error);
      return [];
    }
  },
};

window.FirebaseApi = FirebaseApi;
export default FirebaseApi;
