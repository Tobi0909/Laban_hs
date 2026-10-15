import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { classSessions, classes } from "@/lib/db/schema";

export async function getClassByJoinCode(joinCode: string) {
  return db.query.classes.findFirst({ where: eq(classes.joinCode, joinCode) });
}

export async function getOpenClassSession(classId: string) {
  return db.query.classSessions.findFirst({
    where: and(eq(classSessions.classId, classId), isNull(classSessions.closedAt)),
    orderBy: desc(classSessions.openedAt),
  });
}

export async function isClassSessionOpen(classId: string): Promise<boolean> {
  const open = await getOpenClassSession(classId);
  return Boolean(open);
}
