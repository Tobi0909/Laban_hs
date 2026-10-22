"use server";

import { customAlphabet } from "nanoid";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { attempts, classes, classSessions, students, tasks, topics } from "@/lib/db/schema";
import { requireTeacher, AuthError } from "@/lib/auth/guards";
import { hashPictureSecret, hashQrToken, generateQrToken } from "@/lib/auth/picture-secret";
import { AVATAR_IDS, ICON_IDS, type AvatarId, type IconId } from "@/components/kid/icons";

const joinCodeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function createClass(formData: FormData) {
  const { teacherId } = await requireTeacher();

  const name = String(formData.get("name") ?? "").trim();
  const grade = Number(formData.get("grade"));
  if (!name || !Number.isInteger(grade) || grade < 1 || grade > 5) {
    throw new Error("Tên lớp hoặc khối lớp không hợp lệ.");
  }

  const [created] = await db
    .insert(classes)
    .values({ teacherId, name, grade, joinCode: joinCodeAlphabet() })
    .returning();

  revalidatePath("/teacher");
  return created;
}

export interface AddStudentResult {
  studentId: string;
}

export async function addStudent(classId: string, formData: FormData): Promise<AddStudentResult> {
  await requireTeacher(classId);

  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarId = String(formData.get("avatarId") ?? "") as AvatarId;
  const pick1 = String(formData.get("pick1") ?? "") as IconId;
  const pick2 = String(formData.get("pick2") ?? "") as IconId;
  const guardianConsentAt = String(formData.get("guardianConsentAt") ?? "");

  if (!displayName) throw new Error("Thiếu biệt danh học sinh.");
  if (!AVATAR_IDS.includes(avatarId)) throw new Error("Avatar không hợp lệ.");
  if (!ICON_IDS.includes(pick1) || !ICON_IDS.includes(pick2) || pick1 === pick2) {
    throw new Error("Cần chọn 2 hình bí mật khác nhau.");
  }
  if (!guardianConsentAt) {
    throw new Error("Bắt buộc nhập ngày nhận phiếu đồng ý phụ huynh.");
  }

  const [created] = await db
    .insert(students)
    .values({
      classId,
      displayName,
      avatarId,
      pictureSecretHash: "pending",
      qrTokenHash: "pending",
      guardianConsentAt: new Date(guardianConsentAt),
    })
    .returning();

  const pictureSecretHash = hashPictureSecret(created.id, [pick1, pick2]);
  const qrToken = generateQrToken();
  const qrTokenHash = hashQrToken(qrToken);

  await db
    .update(students)
    .set({ pictureSecretHash, qrTokenHash })
    .where(eq(students.id, created.id));

  revalidatePath(`/teacher/classes/${classId}`);
  return { studentId: created.id };
}

export interface PrintCard {
  studentId: string;
  displayName: string;
  avatarId: string;
  qrToken: string;
}

/**
 * Sinh lại token QR cho toàn bộ học sinh trong lớp để in thẻ. Token cũ (nếu
 * đã in trước đó) sẽ hết tác dụng — chỉ thẻ mới in ra là dùng được.
 */
export async function regenerateClassQrCodes(classId: string): Promise<PrintCard[]> {
  await requireTeacher(classId);

  const classStudents = await db.query.students.findMany({ where: eq(students.classId, classId) });

  const cards: PrintCard[] = [];
  for (const student of classStudents) {
    const qrToken = generateQrToken();
    await db.update(students).set({ qrTokenHash: hashQrToken(qrToken) }).where(eq(students.id, student.id));
    cards.push({
      studentId: student.id,
      displayName: student.displayName,
      avatarId: student.avatarId,
      qrToken,
    });
  }
  return cards;
}

export async function openClassSession(classId: string) {
  const { teacherId } = await requireTeacher(classId);

  const existing = await db.query.classSessions.findFirst({
    where: and(eq(classSessions.classId, classId), isNull(classSessions.closedAt)),
  });
  if (!existing) {
    await db.insert(classSessions).values({ classId, openedBy: teacherId });
  }
  revalidatePath("/teacher");
  revalidatePath(`/teacher/classes/${classId}`);
}

export async function closeClassSession(classId: string) {
  await requireTeacher(classId);

  const existing = await db.query.classSessions.findFirst({
    where: and(eq(classSessions.classId, classId), isNull(classSessions.closedAt)),
  });
  if (existing) {
    await db.update(classSessions).set({ closedAt: new Date() }).where(eq(classSessions.id, existing.id));
  }
  revalidatePath("/teacher");
  revalidatePath(`/teacher/classes/${classId}`);
}

/**
 * Xoá toàn bộ dữ liệu của 1 học sinh (khi phụ huynh rút đồng ý). Xoá bản
 * ghi `students` sẽ cascade xoá luôn sessions/attempts/reflections/
 * next_steps liên quan (xem schema) — không để sót dữ liệu mồ côi.
 */
export async function deleteStudentData(classId: string, studentId: string) {
  await requireTeacher(classId);

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student || student.classId !== classId) {
    throw new Error("Không tìm thấy học sinh trong lớp này.");
  }

  await db.delete(students).where(eq(students.id, studentId));
  revalidatePath(`/teacher/classes/${classId}`);
}

/**
 * Xoá vĩnh viễn 1 lớp cùng toàn bộ dữ liệu liên quan (học sinh, phiên lớp,
 * chủ đề, bài, lượt làm bài...). `attempts.taskId` không có cascade ở DB
 * nên phải xoá attempts của các task thuộc lớp trước, phần còn lại cascade
 * tự động theo schema.
 */
export async function deleteClass(classId: string) {
  await requireTeacher(classId);

  try {
    await db.transaction(async (tx) => {
      const classTopics = await tx.query.topics.findMany({ where: eq(topics.classId, classId) });
      const topicIds = classTopics.map((t) => t.id);

      if (topicIds.length > 0) {
        const classTasks = await tx.query.tasks.findMany({ where: inArray(tasks.topicId, topicIds) });
        const taskIds = classTasks.map((t) => t.id);
        if (taskIds.length > 0) {
          await tx.delete(attempts).where(inArray(attempts.taskId, taskIds));
        }
      }

      await tx.delete(classes).where(eq(classes.id, classId));
    });
  } catch (e) {
    if (e instanceof AuthError) throw e;
    console.error("deleteClass failed", classId, e);
    throw new Error("Xoá lớp thất bại. Vui lòng thử lại.");
  }

  revalidatePath("/teacher");
}
