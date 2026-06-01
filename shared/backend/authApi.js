import { auth, authPersistenceReady, db } from "./firebaseApp.js";
import {
  GoogleAuthProvider,
  deleteUser,
  linkWithPopup,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createDefaultPublicName, ensurePublicName } from "./profileApi.js";

const googleProvider = new GoogleAuthProvider();
const GUEST_FLAG_KEY = "neoguri:isGuest";
const GUEST_UID_KEY = "neoguri:guestUid";
const LEGACY_GUEST_FLAG_KEY = "isGuest";
const LEGACY_GUEST_UID_KEY = "guestUid";

function setGuestStorage(uid) {
  localStorage.setItem(GUEST_FLAG_KEY, "true");
  localStorage.setItem(GUEST_UID_KEY, uid);
  localStorage.setItem(LEGACY_GUEST_FLAG_KEY, "true");
  localStorage.setItem(LEGACY_GUEST_UID_KEY, uid);
}

function getStoredGuestUid() {
  return localStorage.getItem(GUEST_UID_KEY) || localStorage.getItem(LEGACY_GUEST_UID_KEY);
}

function clearGuestStorage() {
  localStorage.removeItem(GUEST_FLAG_KEY);
  localStorage.removeItem(GUEST_UID_KEY);
  localStorage.removeItem(LEGACY_GUEST_FLAG_KEY);
  localStorage.removeItem(LEGACY_GUEST_UID_KEY);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export function waitForAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export function getUserDisplayName(user = auth.currentUser) {
  if (!user) return "플레이어";
  if (user.isAnonymous) return "임시 계정";
  return user.displayName || user.email?.split("@")[0] || "플레이어";
}

export async function getUserPublicName(user = auth.currentUser) {
  if (!user) return "플레이어";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().publicName) {
      return snap.data().publicName;
    }
  } catch (error) {
    console.warn("[Firebase Auth] 공개 닉네임 조회 실패:", error);
  }

  return createDefaultPublicName(user);
}

export async function ensureUserProfile(user = auth.currentUser) {
  if (!user) return null;

  const profileRef = doc(db, "users", user.uid);
  const snap = await getDoc(profileRef);
  const previous = snap.exists() ? snap.data() : {};
  const profile = {
    displayName: getUserDisplayName(user),
    email: user.isAnonymous ? null : user.email ?? null,
    photoURL: user.isAnonymous ? null : user.photoURL ?? null,
    isAnonymous: user.isAnonymous,
    lastSeenAt: serverTimestamp(),
  };

  if (!previous.publicName) {
    profile.publicName = createDefaultPublicName(user);
    profile.publicNameUpdatedAt = serverTimestamp();
  }

  await setDoc(profileRef, profile, { merge: true });
  return { ...previous, ...profile };
}

export async function signInAsGuest() {
  await authPersistenceReady;
  const result = await signInAnonymously(auth);
  setGuestStorage(result.user.uid);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithGoogle() {
  await authPersistenceReady;

  const currentUser = auth.currentUser;
  const guestUid = getStoredGuestUid();

  if (currentUser?.isAnonymous) {
    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      clearGuestStorage();
      await ensureUserProfile(result.user);
      await ensurePublicName(result.user);
      return result.user;
    } catch (error) {
      if (error.code !== "auth/credential-already-in-use") {
        throw error;
      }

      const credential = GoogleAuthProvider.credentialFromError(error);
      if (!credential) throw error;

      try {
        await deleteUser(currentUser);
      } catch (deleteError) {
        console.warn("[Firebase Auth] 기존 게스트 계정 삭제 실패:", deleteError);
      }

      const result = await signInWithCredential(auth, credential);
      await mergeGuestDataToRealAccount(guestUid, result.user);
      await ensureUserProfile(result.user);
      await ensurePublicName(result.user);
      return result.user;
    }
  }

  const result = await signInWithPopup(auth, googleProvider);
  clearGuestStorage();
  await ensureUserProfile(result.user);
  await ensurePublicName(result.user);
  return result.user;
}

export async function mergeGuestDataToRealAccount(guestUid, realUser) {
  if (!guestUid || !realUser) return;

  try {
    const guestRef = doc(db, "users", guestUid);
    const guestSnap = await getDoc(guestRef);

    if (guestSnap.exists()) {
      const guestData = guestSnap.data();
      await setDoc(
        doc(db, "users", realUser.uid),
        {
          ...guestData,
          displayName: getUserDisplayName(realUser),
          email: realUser.email ?? null,
          photoURL: realUser.photoURL ?? null,
          isAnonymous: false,
          mergedGuestUid: guestUid,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await deleteDoc(guestRef);
    }
  } catch (error) {
    console.warn("[Firebase Auth] 게스트 데이터 병합 실패:", error);
  }

  clearGuestStorage();
}

export async function signOut() {
  await authPersistenceReady;
  clearGuestStorage();
  if (!auth.currentUser) return;
  return firebaseSignOut(auth);
}

export const authApi = {
  getCurrentUser,
  getUserPublicName,
  getUserDisplayName,
  ensureUserProfile,
  mergeGuestDataToRealAccount,
  onAuthStateChanged,
  signInAsGuest,
  signInWithGoogle,
  signOut,
  waitForAuthState,
};

export default authApi;
