import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { getInsightsData } from "./data";
import { FiltersBar } from "./FiltersBar";
import { CalibrationPie, MistakeTagBarChart, NextStepBarChart } from "./InsightsCharts";
import { MIN_GROUP_SIZE } from "@/lib/insights/aggregate";

const SUPPORT_REASON_LABELS = {
  over_lap_lai: "Tự tin nhưng làm sai nhiều lần",
  luon_chon_1_muc: "Luôn chọn cùng 1 mức tự tin",
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; topicId?: string; days?: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const sp = await searchParams;

  const myClasses = await db.query.classes.findMany({ where: eq(classes.teacherId, teacherId) });

  if (myClasses.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-sky-deep">Xu hướng lớp học</h1>
        <p className="mt-4 text-ink/60">Chưa có lớp nào. Hãy tạo lớp trước.</p>
      </main>
    );
  }

  const classId = sp.classId && myClasses.some((c) => c.id === sp.classId) ? sp.classId : myClasses[0].id;
  const topicId = sp.topicId ?? "all";
  const days = sp.days ? Number(sp.days) : 30;

  const data = await getInsightsData({ classId, topicId: topicId === "all" ? undefined : topicId, days }, teacherId);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-sky-deep">Xu hướng lớp học</h1>

      <FiltersBar
        classes={myClasses.map((c) => ({ id: c.id, name: c.name }))}
        topics={data.topics}
        classId={classId}
        topicId={topicId}
        days={days}
      />

      {data.isTooSmall ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-ink/60">
          Cần ít nhất {MIN_GROUP_SIZE} em có dữ liệu trong khoảng thời gian này mới hiện báo cáo — bảo vệ
          riêng tư cho nhóm nhỏ. Hiện có {data.activeStudentCount} em.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink/60">
            {data.activeStudentCount} em có dữ liệu · {data.totalAttempts} lượt làm bài
          </p>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 font-medium">Tự tin có khớp với kết quả không?</h2>
            <CalibrationPie counts={data.calibrationCounts} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 font-medium">Lỗi thường gặp</h2>
            <MistakeTagBarChart counts={data.mistakeTagCounts} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 font-medium">Đường học được chọn nhiều nhất</h2>
            <NextStepBarChart counts={data.nextStepCounts} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 font-medium">Em cần hỗ trợ thêm</h2>
            {data.studentsNeedingSupport.length === 0 ? (
              <p className="text-sm text-ink/50">Chưa thấy em nào cần chú ý đặc biệt.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.studentsNeedingSupport.map((s) => (
                  <li key={s.studentId} className="rounded-lg border border-border p-2 text-sm">
                    <span className="font-medium">{s.displayName}</span> —{" "}
                    {s.reasons.map((r) => SUPPORT_REASON_LABELS[r]).join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
