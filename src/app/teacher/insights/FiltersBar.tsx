"use client";

import { useRouter, usePathname } from "next/navigation";

export function FiltersBar({
  classes,
  topics,
  classId,
  topicId,
  days,
}: {
  classes: { id: string; name: string }[];
  topics: { id: string; title: string }[];
  classId: string;
  topicId: string;
  days: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const update = (next: Partial<{ classId: string; topicId: string; days: number }>) => {
    const params = new URLSearchParams({
      classId: next.classId ?? classId,
      topicId: next.topicId ?? topicId,
      days: String(next.days ?? days),
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Lớp
        <select value={classId} onChange={(e) => update({ classId: e.target.value, topicId: "all" })} className="rounded border border-border px-2 py-1.5">
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Chủ đề
        <select value={topicId} onChange={(e) => update({ topicId: e.target.value })} className="rounded border border-border px-2 py-1.5">
          <option value="all">Tất cả chủ đề</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Khoảng thời gian
        <select value={days} onChange={(e) => update({ days: Number(e.target.value) })} className="rounded border border-border px-2 py-1.5">
          <option value={7}>1 tuần qua</option>
          <option value={30}>4 tuần qua</option>
          <option value={365}>Cả năm</option>
        </select>
      </label>
    </div>
  );
}
