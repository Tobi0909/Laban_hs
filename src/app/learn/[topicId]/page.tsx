import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LearnFlow } from "./LearnFlow";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const session = await auth();
  if (session?.user.role !== "student") {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <LearnFlow topicId={topicId} />
    </main>
  );
}
