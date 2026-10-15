import { notFound } from "next/navigation";
import { Kim, type KimMood } from "@/components/kid/Kim";
import { KidButton } from "@/components/kid/KidButton";
import { AudioButton } from "@/components/kid/AudioButton";
import { Card } from "@/components/kid/Card";
import { ProgressStones } from "@/components/kid/ProgressStones";
import { ICON_IDS, ICONS, ICON_LABELS_VI, AVATAR_IDS, AVATARS, AVATAR_LABELS_VI } from "@/components/kid/icons";

const MOODS: KimMood[] = ["wave", "think", "help", "ok", "sure", "cheer", "look", "sleep"];

const COLOR_SWATCHES = [
  { name: "Nền giấy", varName: "--color-paper", cls: "bg-paper" },
  { name: "Thẻ", varName: "--color-card", cls: "bg-card" },
  { name: "Viền", varName: "--color-border", cls: "bg-border" },
  { name: "Bầu trời", varName: "--color-sky", cls: "bg-sky" },
  { name: "Bầu trời đậm", varName: "--color-sky-deep", cls: "bg-sky-deep" },
  { name: "Nắng", varName: "--color-sun", cls: "bg-sun" },
  { name: "Lá", varName: "--color-leaf", cls: "bg-leaf" },
  { name: "San hô", varName: "--color-coral", cls: "bg-coral" },
  { name: "Oải hương", varName: "--color-lavender", cls: "bg-lavender" },
];

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
      <header>
        <h1 className="font-baloo text-4xl font-bold text-sky-deep">Styleguide — La bàn tự tin</h1>
        <p className="mt-2 font-nunito text-lg text-ink/70">
          Trang nội bộ (chỉ hiện ở môi trường dev) để duyệt màu, chữ, nút và linh vật Kim.
        </p>
      </header>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Bảng màu</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-2">
              <div className={`h-16 w-16 rounded-2xl border border-border ${c.cls}`} />
              <span className="text-center text-sm font-nunito">{c.name}</span>
              <code className="text-xs text-ink/50">{c.varName}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Chữ</h2>
        <Card className="flex flex-col gap-3">
          <p className="font-baloo text-4xl font-bold">Tiêu đề 40px — Baloo 2</p>
          <p className="font-baloo text-2xl font-semibold">Tiêu đề phụ 32px</p>
          <p className="font-nunito text-2xl">Nội dung lớn nhất 28px — Nunito, Tiếng Việt có dấu: ă â ê ô ơ ư đ</p>
          <p className="font-nunito text-xl">Nội dung 22px — Em hãy chạm vào mức tự tin của mình nhé.</p>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Nút kẹo dẻo (KidButton)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <KidButton tone="sky">Em cần cô giúp</KidButton>
          <KidButton tone="sun">Em nghĩ em làm được</KidButton>
          <KidButton tone="leaf">Em chắc chắn</KidButton>
          <KidButton tone="coral">San hô</KidButton>
          <KidButton tone="lavender">Oải hương</KidButton>
          <KidButton tone="sky" highlighted>
            Được gợi ý
          </KidButton>
          <KidButton tone="paper" disabled>
            Vô hiệu hoá
          </KidButton>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">AudioButton</h2>
        <div className="flex items-center gap-4">
          <AudioButton text="Em tự tin đến đâu với bài này?" />
          <AudioButton text="Nghe lại câu hỏi" size="sm" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Thanh tiến trình viên đá</h2>
        <ProgressStones total={5} current={2} />
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Linh vật Kim — 8 trạng thái</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {MOODS.map((mood) => (
            <Card key={mood} className="flex flex-col items-center gap-2">
              <Kim mood={mood} size="lg" />
              <span className="font-nunito text-sm">{mood}</span>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Avatar học sinh</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {AVATAR_IDS.map((id) => {
            const Icon = AVATARS[id];
            return (
              <Card key={id} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16">
                  <Icon />
                </div>
                <span className="text-sm font-nunito">{AVATAR_LABELS_VI[id]}</span>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-baloo text-2xl font-semibold">Lưới hình mật khẩu (12 hình)</h2>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
          {ICON_IDS.map((id) => {
            const Icon = ICONS[id];
            return (
              <Card key={id} className="flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <Icon />
                </div>
                <span className="text-xs font-nunito">{ICON_LABELS_VI[id]}</span>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
