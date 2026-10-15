import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { isClassSessionOpen } from "@/lib/auth/class-session";
import { Kim } from "@/components/kid/Kim";
import { Card } from "@/components/kid/Card";
import { SwitchFriendButton } from "./SwitchFriendButton";
import { vi } from "@/lib/i18n/vi";
import { AVATARS } from "@/components/kid/icons";

export default async function StudentHomePage() {
  const session = await auth();
  if (session?.user.role !== "student" || !session.user.classId) {
    redirect("/");
  }

  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, session.user.classId) });
  if (!classRow) redirect("/");

  const sessionOpen = await isClassSessionOpen(classRow.id);
  if (!sessionOpen) {
    await signOut({ redirectTo: `/c/${classRow.joinCode}` });
  }

  const Avatar = AVATARS[(session.user.avatarId ?? "cat") as keyof typeof AVATARS];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <Card className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="h-20 w-20">{Avatar ? <Avatar /> : null}</div>
        <Kim mood="cheer" size="lg" />
        <p className="font-baloo text-2xl font-semibold text-sky-deep">
          {vi.classEntry.welcome} {session.user.name}!
        </p>
        <p className="font-nunito text-lg text-ink/70">
          Các màn học (La bàn, Nhiệm vụ, Gương phản tư...) sẽ được dựng ở giai đoạn tiếp theo.
        </p>
        <SwitchFriendButton joinCode={classRow.joinCode} />
      </Card>
    </main>
  );
}
