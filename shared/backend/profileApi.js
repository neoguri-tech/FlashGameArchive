import { auth, db } from "./firebaseApp.js";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const PUBLIC_NAME_MIN_LENGTH = 2;
const PUBLIC_NAME_MAX_LENGTH = 16;
const PUBLIC_NAME_PATTERN = /^[0-9A-Za-z가-힣 _.-]+$/;

export function createDefaultPublicName(user = auth.currentUser) {
  const suffix = (user?.uid ?? "0000").slice(0, 4).toUpperCase();
  return user?.isAnonymous ? `임시${suffix}` : `플레이어${suffix}`;
}

export function normalizePublicName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function validatePublicName(value) {
  const publicName = normalizePublicName(value);
  const length = [...publicName].length;

  if (length < PUBLIC_NAME_MIN_LENGTH) {
    return { ok: false, message: `닉네임은 ${PUBLIC_NAME_MIN_LENGTH}자 이상이어야 합니다.` };
  }

  if (length > PUBLIC_NAME_MAX_LENGTH) {
    return { ok: false, message: `닉네임은 ${PUBLIC_NAME_MAX_LENGTH}자 이하여야 합니다.` };
  }

  if (!PUBLIC_NAME_PATTERN.test(publicName)) {
    return {
      ok: false,
      message: "닉네임에는 한글, 영문, 숫자, 공백, 마침표, 하이픈, 밑줄만 사용할 수 있습니다.",
    };
  }

  return { ok: true, publicName };
}

export async function getUserProfile(uid = auth.currentUser?.uid) {
  if (!uid) return null;

  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function ensurePublicName(user = auth.currentUser) {
  if (!user) return null;

  const profileRef = doc(db, "users", user.uid);
  const snap = await getDoc(profileRef);
  const currentProfile = snap.exists() ? snap.data() : {};

  if (currentProfile.publicName) {
    return currentProfile.publicName;
  }

  const publicName = createDefaultPublicName(user);
  await setDoc(
    profileRef,
    {
      publicName,
      publicNameUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return publicName;
}

export async function updatePublicName(value) {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  const validation = validatePublicName(value);
  if (!validation.ok) return validation;

  await setDoc(
    doc(db, "users", user.uid),
    {
      publicName: validation.publicName,
      publicNameUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, publicName: validation.publicName };
}

export function getProfilePublicName(profile, user = auth.currentUser) {
  return profile?.publicName || createDefaultPublicName(user);
}

export const profileApi = {
  createDefaultPublicName,
  ensurePublicName,
  getProfilePublicName,
  getUserProfile,
  normalizePublicName,
  updatePublicName,
  validatePublicName,
};

export default profileApi;
