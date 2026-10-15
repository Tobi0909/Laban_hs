import { attemptQrLogin } from "../../actions";
import { QrAutoLogin } from "./QrAutoLogin";
import { Card } from "@/components/kid/Card";
import { Kim } from "@/components/kid/Kim";
import { vi } from "@/lib/i18n/vi";

export default async function QrEntryPage({
  params,
}: {
  params: Promise<{ joinCode: string; token: string }>;
}) {
  const { joinCode, token } = await params;
  const result = await attemptQrLogin(joinCode, token);

  if (!result.ok) {
    const text =
      result.reason === "locked"
        ? vi.classEntry.locked
        : result.reason === "session_closed"
          ? vi.classEntry.sessionClosed
          : vi.classEntry.wrong;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
        <Card className="flex max-w-md flex-col items-center gap-4 text-center">
          <Kim mood="help" size="lg" />
          <p className="font-nunito text-xl">{text}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <QrAutoLogin ticket={result.ticket} />
    </main>
  );
}
