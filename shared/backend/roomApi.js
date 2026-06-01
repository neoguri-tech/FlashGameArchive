import { realtimeDb } from "./firebaseApp.js";
import {
  child,
  get,
  off,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";

function roomRef(gameId, roomId) {
  return ref(realtimeDb, `rooms/${gameId}/${roomId}`);
}

export function makeRoomId() {
  return push(ref(realtimeDb, "roomIds")).key;
}

export async function createRoom({ gameId, roomId = makeRoomId(), data }) {
  const target = roomRef(gameId, roomId);
  await set(target, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return roomId;
}

export async function getRoom(gameId, roomId) {
  const snap = await get(roomRef(gameId, roomId));
  return snap.exists() ? snap.val() : null;
}

export async function updateRoom(gameId, roomId, patch) {
  await update(roomRef(gameId, roomId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export function listenRoom(gameId, roomId, callback) {
  const target = roomRef(gameId, roomId);
  onValue(target, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return () => off(target);
}

export async function pushRoomMove({ gameId, roomId, move }) {
  const movesRef = child(roomRef(gameId, roomId), "moves");
  const nextMoveRef = push(movesRef);
  await set(nextMoveRef, {
    ...move,
    createdAt: serverTimestamp(),
  });
  return nextMoveRef.key;
}

export async function setPresence({ gameId, roomId, uid, data }) {
  const presenceRef = child(roomRef(gameId, roomId), `presence/${uid}`);
  await set(presenceRef, {
    ...data,
    online: true,
    updatedAt: serverTimestamp(),
  });
  await onDisconnect(presenceRef).remove();
}

export async function leavePresence({ gameId, roomId, uid }) {
  await remove(child(roomRef(gameId, roomId), `presence/${uid}`));
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
