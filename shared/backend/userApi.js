import { auth, db } from "./firebaseApp.js";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export function requireSignedInUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("로그인된 사용자가 없습니다.");
  }
  return user;
}

export async function saveUserData(key, value) {
  const user = requireSignedInUser();
  await setDoc(
    doc(db, "users", user.uid),
    {
      [key]: value,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserData(key = null) {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  return key ? data[key] : data;
}

export async function saveUserGameData(gameId, data) {
  const user = requireSignedInUser();
  await setDoc(
    doc(db, "users", user.uid, "games", gameId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserGameData(gameId) {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid, "games", gameId));
  return snap.exists() ? snap.data() : null;
}

export const userApi = {
  getUserData,
  getUserGameData,
  requireSignedInUser,
  saveUserData,
  saveUserGameData,
};

export default userApi;
