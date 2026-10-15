import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/url";
import { regenerateClassQrCodes } from "../../../actions";
import { AVATARS } from "@/components/kid/icons";
import { PrintButton } from "./PrintButton";

export default async function PrintCardsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireTeacher(classId);

  const classRow = await db.query.classes.findFirst({ where: (c, { eq }) => eq(c.id, classId) });
  if (!classRow) notFound();

  const cards = await regenerateClassQrCodes(classId);
  const baseUrl = await getBaseUrl();

  const cardsWithSvg = await Promise.all(
    cards.map(async (card) => {
      const url = `${baseUrl}/c/${classRow.joinCode}/qr/${card.qrToken}`;
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 160 });
      return { ...card, svg };
    }),
  );

  return (
    <main className="px-6 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-sky-deep">
          In thẻ QR — {classRow.name}
        </h1>
        <PrintButton />
      </div>

      <div className="mx-auto grid max-w-[190mm] grid-cols-2 gap-[4mm] print:grid-cols-2">
        {cardsWithSvg.map((card) => {
          const Avatar = AVATARS[card.avatarId as keyof typeof AVATARS];
          return (
            <div
              key={card.studentId}
              className="flex h-[65mm] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center break-inside-avoid"
            >
              <div className="h-14 w-14">{Avatar ? <Avatar /> : null}</div>
              <p className="font-baloo text-lg font-semibold">{card.displayName}</p>
              <div
                className="h-28 w-28"
                dangerouslySetInnerHTML={{ __html: card.svg }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </main>
  );
}
