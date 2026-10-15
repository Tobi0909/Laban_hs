import { openDB, type DBSchema } from "idb";
import type { SubmitAnswerInput } from "@/lib/learning/submit-answer";

interface OfflineDB extends DBSchema {
  "pending-attempts": {
    key: string;
    value: SubmitAnswerInput;
  };
}

const DB_NAME = "laban-offline";
const STORE = "pending-attempts";

function getDb() {
  return openDB<OfflineDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: "clientId" });
    },
  });
}

/** Lưu tạm 1 lượt làm bài vào IndexedDB khi gửi lên server thất bại (mất mạng). */
export async function enqueuePendingAttempt(input: SubmitAnswerInput): Promise<void> {
  const db = await getDb();
  await db.put(STORE, input);
}

export async function getPendingAttempts(): Promise<SubmitAnswerInput[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function removePendingAttempt(clientId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, clientId);
}

export async function countPendingAttempts(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}
