import { vi } from "@/lib/i18n/vi";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-baloo text-4xl font-bold text-sky-deep">
        {vi.common.appName}
      </h1>
      <p className="max-w-md font-nunito text-xl text-ink">
        Các màn học (La bàn, Nhiệm vụ, Gương phản tư, Chọn đường học, Nhật ký)
        sẽ được dựng ở giai đoạn tiếp theo.
      </p>
    </main>
  );
}
