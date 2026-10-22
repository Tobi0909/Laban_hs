import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { LearnFlow } from "./LearnFlow";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const session = await auth();
  if (session?.user.role !== "student" || !session.user.classId) {
    redirect("/");
  }

  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, session.user.classId) });
  if (!classRow) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <LearnFlow topicId={topicId} joinCode={classRow.joinCode} />
    </main>
  );
}
