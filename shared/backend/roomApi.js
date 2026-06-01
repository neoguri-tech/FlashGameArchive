import { db } from "./firebaseApp.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

function roomsCollection(gameId) {
  return collection(db, "games", gameId, "rooms");
}

function roomRef(gameId, roomId) {
  return doc(roomsCollection(gameId), roomId);
}

function normalizePatch(patch) {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key.replaceAll("/", "."), value]),
  );
}

export function makeRoomId(gameId = "shared") {
  return doc(roomsCollection(gameId)).id;
}

export async function createRoom({ gameId, roomId = makeRoomId(gameId), data }) {
  const target = roomRef(gameId, roomId);
  await setDoc(target, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return roomId;
}

export async function getRoom(gameId, roomId) {
  const snap = await getDoc(roomRef(gameId, roomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateRoom(gameId, roomId, patch) {
  await updateDoc(roomRef(gameId, roomId), {
    ...normalizePatch(patch),
    updatedAt: serverTimestamp(),
  });
}

export function listenRoom(gameId, roomId, callback) {
  return onSnapshot(
    roomRef(gameId, roomId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    (error) => {
      console.warn("[Room API] 방 구독 실패:", error);
      callback(null, error);
    },
  );
}

export async function pushRoomMove({ gameId, roomId, move }) {
  const moveRef = doc(collection(roomRef(gameId, roomId), "moves"));
  await setDoc(moveRef, {
    ...move,
    createdAt: serverTimestamp(),
  });
  return moveRef.id;
}

export async function setPresence({ gameId, roomId, uid, data }) {
  await setDoc(
    doc(roomRef(gameId, roomId), "presence", uid),
    {
      ...data,
      online: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function leavePresence({ gameId, roomId, uid }) {
  await deleteDoc(doc(roomRef(gameId, roomId), "presence", uid));
}

export const roomApi = {
  createRoom,
  getRoom,
  leavePresence,
  listenRoom,
  makeRoomId,
  pushRoomMove,
  setPresence,
  updateRoom,
};

export default roomApi;
