import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { classes, students, teachers } from "./schema";
import { hashPictureSecret, hashQrToken, generateQrToken } from "@/lib/auth/picture-secret";
import { AVATAR_IDS, ICON_IDS, type IconId } from "@/components/kid/icons";

const STUDENT_NAMES = ["Bin", "Nấm", "Tũn", "Xíu", "Bo", "Mít"];

async function seed() {
  console.log("Seeding dữ liệu mẫu...");

  const [teacher] = await db
    .insert(teachers)
    .values({ email: "co.lan@truongtieuhoc.edu.vn", name: "Cô Lan" })
    .returning();
  console.log("✓ Giáo viên mẫu:", teacher.email);

  const [klass] = await db
    .insert(classes)
    .values({ teacherId: teacher.id, name: "2A", grade: 2, joinCode: "2A2026" })
    .returning();
  console.log("✓ Lớp mẫu:", klass.name, "— mã vào lớp:", klass.joinCode);

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const displayName = STUDENT_NAMES[i];
    const avatarId = AVATAR_IDS[i % AVATAR_IDS.length];
    const pick1: IconId = ICON_IDS[i % ICON_IDS.length];
    const pick2: IconId = ICON_IDS[(i + 3) % ICON_IDS.length];

    const [student] = await db
      .insert(students)
      .values({
        classId: klass.id,
        displayName,
        avatarId,
        pictureSecretHash: "pending",
        qrTokenHash: "pending",
        guardianConsentAt: new Date("2026-08-15"),
      })
      .returning();

    const pictureSecretHash = hashPictureSecret(student.id, [pick1, pick2]);
    const qrToken = generateQrToken();
    const qrTokenHash = hashQrToken(qrToken);

    await db
      .update(students)
      .set({ pictureSecretHash, qrTokenHash })
      .where(eq(students.id, student.id));

    console.log(`✓ Học sinh "${displayName}" (avatar: ${avatarId}, mật khẩu hình: ${pick1} + ${pick2})`);
  }

  console.log("\nHoàn tất. Vào lớp tại /c/2A2026 (cần mở phiên lớp trong trang giáo viên trước).");
  console.log("12 hình cho lưới mật khẩu:", ICON_IDS.join(", "));
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
