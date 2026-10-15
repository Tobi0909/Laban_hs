import { notFound } from "next/navigation";
import { getClassEntryData } from "./actions";
import { ClassEntry } from "./ClassEntry";

export default async function ClassEntryPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;
  const data = await getClassEntryData(joinCode);
  if (!data) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <ClassEntry joinCode={joinCode} initialData={data} />
    </main>
  );
}
