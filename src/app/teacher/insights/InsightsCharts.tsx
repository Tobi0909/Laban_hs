"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { MISTAKE_TAG_LABELS_VI, type MistakeTag } from "@/lib/learning/types";
import { vi } from "@/lib/i18n/vi";
import type { CalibrationCounts, MistakeTagCount, NextStepCount } from "@/lib/insights/aggregate";
import type { NextStepChoice } from "@/lib/db/schema";

const CALIBRATION_COLORS = { match: "#5CC98A", over: "#FF8A65", under: "#4FB3E8" };
const CALIBRATION_LABELS = { match: "Đoán đúng về mình", over: "Tự tin nhưng chưa đúng", under: "Chưa tự tin nhưng đúng" };

const NEXT_STEP_LABELS: Record<NextStepChoice, string> = {
  practice: vi.nextStep.practice,
  review_example: vi.nextStep.reviewExample,
  how_to: vi.nextStep.howTo,
  harder: vi.nextStep.harder,
};

export function CalibrationPie({ counts }: { counts: CalibrationCounts }) {
  const data = (Object.keys(counts) as (keyof CalibrationCounts)[])
    .map((k) => ({ key: k, name: CALIBRATION_LABELS[k], value: counts[k] }))
    .filter((d) => d.value > 0);

  if (data.length === 0) return <p className="text-sm text-ink/50">Chưa có dữ liệu.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((d) => (
            <Cell key={d.key} fill={CALIBRATION_COLORS[d.key]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MistakeTagBarChart({ counts }: { counts: MistakeTagCount[] }) {
  if (counts.length === 0) return <p className="text-sm text-ink/50">Chưa có lỗi nào được ghi nhận.</p>;
  const data = counts.map((c) => ({ name: MISTAKE_TAG_LABELS_VI[c.mistakeTag as MistakeTag], count: c.count }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9DCC6" />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#A78BFA" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NextStepBarChart({ counts }: { counts: NextStepCount[] }) {
  if (counts.length === 0) return <p className="text-sm text-ink/50">Chưa có dữ liệu.</p>;
  const data = counts.map((c) => ({ name: NEXT_STEP_LABELS[c.chosen], count: c.count }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9DCC6" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#4FB3E8" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
