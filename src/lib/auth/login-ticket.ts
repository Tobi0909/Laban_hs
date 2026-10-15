import { randomBytes } from "node:crypto";
import { redis } from "@/lib/redis";

const TICKET_TTL_SECONDS = 60;

function key(ticket: string) {
  return `login-ticket:${ticket}`;
}

export async function issueLoginTicket(studentId: string): Promise<string> {
  const ticket = randomBytes(24).toString("hex");
  await redis.set(key(ticket), studentId, { ex: TICKET_TTL_SECONDS });
  return ticket;
}

/** Dùng 1 lần: đọc xong xoá ngay để tránh phát lại (replay). */
export async function consumeLoginTicket(ticket: string): Promise<string | null> {
  const studentId = await redis.get<string>(key(ticket));
  if (!studentId) return null;
  await redis.del(key(ticket));
  return studentId;
}
