"use client";

import { motion, useReducedMotion } from "framer-motion";

export type KimMood =
  | "wave"
  | "think"
  | "help"
  | "ok"
  | "sure"
  | "cheer"
  | "look"
  | "sleep";

const KIM_SIZES = { sm: 56, md: 96, lg: 144 } as const;

export interface KimProps {
  mood: KimMood;
  size?: keyof typeof KIM_SIZES | number;
  className?: string;
}

function Eyes({ mood }: { mood: KimMood }) {
  if (mood === "sleep") {
    return (
      <>
        <path d="M22 36 q4 -4 8 0" stroke="#2B2A33" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M34 36 q4 -4 8 0" stroke="#2B2A33" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    );
  }
  if (mood === "think") {
    return (
      <>
        <circle cx="26" cy="34" r="3.5" fill="#2B2A33" />
        <circle cx="38" cy="32" r="3.5" fill="#2B2A33" />
      </>
    );
  }
  if (mood === "cheer" || mood === "sure") {
    return (
      <>
        <path d="M22 34 q4 -5 8 0" stroke="#2B2A33" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M34 34 q4 -5 8 0" stroke="#2B2A33" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    );
  }
  return (
    <>
      <circle cx="26" cy="35" r="4" fill="#2B2A33" />
      <circle cx="38" cy="35" r="4" fill="#2B2A33" />
    </>
  );
}

function Mouth({ mood }: { mood: KimMood }) {
  if (mood === "sleep") {
    return <circle cx="32" cy="45" r="2.5" fill="#2B2A33" />;
  }
  if (mood === "help") {
    return <ellipse cx="32" cy="46" rx="4" ry="5" fill="#2B2A33" />;
  }
  if (mood === "think") {
    return <path d="M27 46 q5 2 10 -1" stroke="#2B2A33" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
  }
  return (
    <path
      d="M24 44 q8 8 16 0"
      stroke="#2B2A33"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  );
}

function Accessory({ mood }: { mood: KimMood }) {
  switch (mood) {
    case "wave":
      return (
        <motion.g
          style={{ originX: "58px", originY: "40px" }}
          animate={{ rotate: [0, 20, 0, 20, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
        >
          <circle cx="60" cy="24" r="7" fill="#FFC93C" stroke="#E9DCC6" strokeWidth="2" />
        </motion.g>
      );
    case "help":
      return (
        <g>
          <circle cx="58" cy="22" r="8" fill="#4FB3E8" stroke="#1F7FB8" strokeWidth="2" />
          <text x="58" y="27" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">
            ?
          </text>
        </g>
      );
    case "sure":
      return (
        <g>
          <circle cx="58" cy="26" r="9" fill="#5CC98A" />
          <path
            d="M53 26 l4 4 l8 -8"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      );
    case "look":
      return (
        <g>
          <circle cx="56" cy="46" r="9" fill="none" stroke="#A78BFA" strokeWidth="4" />
          <line x1="63" y1="53" x2="70" y2="60" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "cheer":
      return (
        <>
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.4 }}
          >
            <path d="M6 20 l4 4 M58 20 l-4 4 M10 10 l3 5" stroke="#FFC93C" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        </>
      );
    case "sleep":
      return (
        <text x="56" y="18" fontSize="14" fill="#A78BFA" fontWeight="bold">
          Z
        </text>
      );
    case "think":
      return (
        <g>
          <circle cx="54" cy="16" r="2.5" fill="#E9DCC6" />
          <circle cx="60" cy="10" r="3.5" fill="#E9DCC6" />
        </g>
      );
    default:
      return null;
  }
}

export function Kim({ mood, size = "md", className }: KimProps) {
  const px = typeof size === "number" ? size : KIM_SIZES[size];
  const reduceMotion = useReducedMotion();

  const bodyAnimation = reduceMotion
    ? undefined
    : mood === "cheer"
      ? { y: [0, -6, 0] }
      : mood === "sleep"
        ? { y: [0, 1.5, 0] }
        : { y: [0, -2, 0] };

  const bodyTransition = reduceMotion
    ? undefined
    : {
        duration: mood === "cheer" ? 0.5 : 2.4,
        repeat: Infinity,
        ease: "easeInOut" as const,
      };

  return (
    <motion.svg
      viewBox="0 0 76 76"
      width={px}
      height={px}
      className={className}
      role="img"
      aria-label="Kim la bàn"
      animate={bodyAnimation}
      transition={bodyTransition}
    >
      {/* chân */}
      <rect x="22" y="60" width="6" height="8" rx="3" fill="#1F7FB8" />
      <rect x="40" y="60" width="6" height="8" rx="3" fill="#1F7FB8" />
      {/* thân la bàn */}
      <circle cx="32" cy="38" r="26" fill="#FFC93C" stroke="#E9DCC6" strokeWidth="2" />
      <circle cx="32" cy="38" r="19" fill="#FFF8EC" />
      {/* kim chỉ nam làm chỏm tóc */}
      <path d="M32 8 L36 19 L32 23 L28 19 Z" fill="#FF8A65" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      <Accessory mood={mood} />
    </motion.svg>
  );
}
