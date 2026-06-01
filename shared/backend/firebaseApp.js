import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyCUseyo9XJdu9jiypGkqCiXfdwHyCnAlKA",
  authDomain: "number-palace.firebaseapp.com",
  projectId: "number-palace",
  storageBucket: "number-palace.firebasestorage.app",
  messagingSenderId: "921331808127",
  appId: "1:921331808127:web:a95aef9d49dd5a502b8c4a",
  measurementId: "G-L7W49TE73J",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("[Firebase Auth] 로컬 로그인 유지 설정 실패:", error);
});

const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch((error) => {
    console.warn("[Firebase Analytics] 초기화 생략:", error);
    return null;
  });

export function getAnalyticsInstance() {
  return analyticsPromise;
}
