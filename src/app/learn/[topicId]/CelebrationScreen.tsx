"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Kim } from "@/components/kid/Kim";
import { vi } from "@/lib/i18n/vi";

const CONFETTI_COLORS = ["#FFC93C", "#5CC98A", "#FF8A65", "#A78BFA", "#4FB3E8"];

function Confetti() {
  const reduceMotion = useReducedMotion();
  const [pieces] = useState(() =>
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    })),
  );

  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 h-3 w-3 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: 420, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function CelebrationScreen() {
  return (
    <div className="relative flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <Confetti />
      <Kim mood="cheer" size="lg" />
      <p className="font-baloo text-3xl font-bold text-sky-deep">{vi.learn.celebrateTitle}</p>
      <p className="font-nunito text-xl">{vi.learn.celebrateBody}</p>
      <div className="flex gap-3">
        <Link
          href="/journal"
          className="rounded-[20px] border-b-[6px] border-[#7C5FE0] bg-lavender px-6 py-3 font-baloo text-lg font-semibold text-ink transition-transform active:translate-y-1 active:border-b-[2px]"
        >
          {vi.journey.title}
        </Link>
        <Link
          href="/s"
          className="rounded-[20px] border-b-[6px] border-sky-deep bg-sky px-6 py-3 font-baloo text-lg font-semibold text-ink transition-transform active:translate-y-1 active:border-b-[2px]"
        >
          {vi.learn.backToClass}
        </Link>
      </div>
    </div>
  );
}
