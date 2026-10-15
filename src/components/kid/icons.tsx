import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Sun = (p: IconProps) =>
  base(
    <>
      <circle cx="32" cy="32" r="14" fill="#FFC93C" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 32 + Math.cos(angle) * 20;
        const y1 = 32 + Math.sin(angle) * 20;
        const x2 = 32 + Math.cos(angle) * 27;
        const y2 = 32 + Math.sin(angle) * 27;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#FFC93C"
            strokeWidth="5"
            strokeLinecap="round"
          />
        );
      })}
    </>,
    p,
  );

export const Star = (p: IconProps) =>
  base(
    <path
      d="M32 6 L38.5 24.5 L58 25 L42.5 37 L47.5 56 L32 45 L16.5 56 L21.5 37 L6 25 L25.5 24.5 Z"
      fill="#FFC93C"
    />,
    p,
  );

export const Apple = (p: IconProps) =>
  base(
    <>
      <path
        d="M32 24c6-8 18-6 18 5 0 14-10 24-18 24S14 43 14 29c0-11 12-13 18-5Z"
        fill="#FF8A65"
      />
      <path d="M32 24c0-4 2-7 6-9" stroke="#5CC98A" strokeWidth="4" strokeLinecap="round" fill="none" />
    </>,
    p,
  );

export const Boat = (p: IconProps) =>
  base(
    <>
      <path d="M12 40 L52 40 L46 52 L18 52 Z" fill="#FF8A65" />
      <line x1="32" y1="40" x2="32" y2="12" stroke="#2B2A33" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 14 L48 32 L32 32 Z" fill="#4FB3E8" />
    </>,
    p,
  );

export const Flower = (p: IconProps) =>
  base(
    <>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="32"
          cy="18"
          rx="8"
          ry="12"
          fill="#A78BFA"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="8" fill="#FFC93C" />
    </>,
    p,
  );

export const Balloon = (p: IconProps) =>
  base(
    <>
      <ellipse cx="32" cy="24" rx="16" ry="18" fill="#FF8A65" />
      <path d="M32 42 L28 52 L36 52 Z" fill="#FF8A65" />
      <line x1="32" y1="52" x2="32" y2="60" stroke="#2B2A33" strokeWidth="2" />
    </>,
    p,
  );

export const Kite = (p: IconProps) =>
  base(
    <>
      <path d="M32 8 L50 28 L32 48 L14 28 Z" fill="#4FB3E8" />
      <path d="M32 8 L32 48 M14 28 L50 28" stroke="#1F7FB8" strokeWidth="2" />
      <path d="M32 48 Q36 54 32 58 Q28 54 32 48" stroke="#FFC93C" strokeWidth="3" fill="none" />
    </>,
    p,
  );

export const Cloud = (p: IconProps) =>
  base(
    <path
      d="M18 40a10 10 0 0 1 0-20 12 12 0 0 1 23-4 9 9 0 0 1 9 9 9 9 0 0 1-2 15Z"
      fill="#4FB3E8"
    />,
    p,
  );

export const Moon = (p: IconProps) =>
  base(
    <path
      d="M40 10a22 22 0 1 0 14 38A22 22 0 0 1 40 10Z"
      fill="#A78BFA"
    />,
    p,
  );

export const Fish = (p: IconProps) =>
  base(
    <>
      <ellipse cx="28" cy="32" rx="18" ry="12" fill="#4FB3E8" />
      <path d="M46 32 L58 22 L58 42 Z" fill="#4FB3E8" />
      <circle cx="20" cy="29" r="2.5" fill="#2B2A33" />
    </>,
    p,
  );

export const Leaf = (p: IconProps) =>
  base(
    <>
      <path d="M14 50C14 24 50 14 50 14S40 50 14 50Z" fill="#5CC98A" />
      <path d="M16 48 36 28" stroke="#2B2A33" strokeWidth="2" strokeLinecap="round" />
    </>,
    p,
  );

export const Drop = (p: IconProps) =>
  base(
    <path
      d="M32 8c10 16 16 24 16 33a16 16 0 1 1-32 0c0-9 6-17 16-33Z"
      fill="#4FB3E8"
    />,
    p,
  );

export const MagnifyingGlass = (p: IconProps) =>
  base(
    <>
      <circle cx="28" cy="28" r="16" fill="none" stroke="#A78BFA" strokeWidth="6" />
      <line x1="39" y1="39" x2="54" y2="54" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" />
    </>,
    p,
  );

export const Sparkle = (p: IconProps) =>
  base(
    <path
      d="M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z"
      fill="#FFC93C"
    />,
    p,
  );

export const RefreshLoop = (p: IconProps) =>
  base(
    <>
      <path
        d="M14 32a18 18 0 0 1 30-13"
        fill="none"
        stroke="#4FB3E8"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M44 14 L44 24 L34 24 Z" fill="#4FB3E8" />
      <path
        d="M50 32a18 18 0 0 1-30 13"
        fill="none"
        stroke="#4FB3E8"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M20 50 L20 40 L30 40 Z" fill="#4FB3E8" />
      <circle cx="32" cy="32" r="3" fill="#FFC93C" />
    </>,
    p,
  );

export const OpenBook = (p: IconProps) =>
  base(
    <>
      <path d="M32 16c-6-4-16-4-22 0v30c6-4 16-4 22 0Z" fill="#FF8A65" />
      <path d="M32 16c6-4 16-4 22 0v30c-6-4-16-4-22 0Z" fill="#FFC93C" />
      <line x1="32" y1="16" x2="32" y2="46" stroke="#2B2A33" strokeWidth="2" />
    </>,
    p,
  );

export const LightBulb = (p: IconProps) =>
  base(
    <>
      <circle cx="32" cy="26" r="16" fill="#FFC93C" />
      <rect x="25" y="40" width="14" height="8" rx="2" fill="#E9DCC6" />
      <line x1="27" y1="50" x2="37" y2="50" stroke="#2B2A33" strokeWidth="2" strokeLinecap="round" />
    </>,
    p,
  );

export const Mountain = (p: IconProps) =>
  base(
    <>
      <path d="M6 50 L24 20 L34 36 L42 26 L58 50 Z" fill="#5CC98A" />
      <path d="M42 26 L34 36 L38 42 L46 38 Z" fill="#3C9A66" />
      <path d="M42 18 L42 28 L50 22 Z" fill="#FF8A65" />
      <line x1="42" y1="14" x2="42" y2="26" stroke="#2B2A33" strokeWidth="2" />
    </>,
    p,
  );

export const ICON_IDS = [
  "sun",
  "star",
  "apple",
  "boat",
  "flower",
  "balloon",
  "kite",
  "cloud",
  "moon",
  "fish",
  "leaf",
  "drop",
] as const;
export type IconId = (typeof ICON_IDS)[number];

export const ICONS: Record<IconId, (p: IconProps) => React.ReactElement> = {
  sun: Sun,
  star: Star,
  apple: Apple,
  boat: Boat,
  flower: Flower,
  balloon: Balloon,
  kite: Kite,
  cloud: Cloud,
  moon: Moon,
  fish: Fish,
  leaf: Leaf,
  drop: Drop,
};

export const ICON_LABELS_VI: Record<IconId, string> = {
  sun: "Mặt trời",
  star: "Ngôi sao",
  apple: "Quả táo",
  boat: "Thuyền",
  flower: "Bông hoa",
  balloon: "Bóng bay",
  kite: "Diều",
  cloud: "Đám mây",
  moon: "Mặt trăng",
  fish: "Con cá",
  leaf: "Lá cây",
  drop: "Giọt nước",
};

// Linh vật động vật dùng làm avatar chọn học sinh.
export const Cat = (p: IconProps) =>
  base(
    <>
      <path d="M18 20 L24 8 L28 20 Z" fill="#F2B880" />
      <path d="M46 20 L40 8 L36 20 Z" fill="#F2B880" />
      <circle cx="32" cy="34" r="20" fill="#F2B880" />
      <circle cx="24" cy="32" r="2.5" fill="#2B2A33" />
      <circle cx="40" cy="32" r="2.5" fill="#2B2A33" />
      <path d="M28 42c2 2 6 2 8 0" stroke="#2B2A33" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path
        d="M10 30 L20 32 M10 36 L20 35 M54 30 L44 32 M54 36 L44 35"
        stroke="#2B2A33"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>,
    p,
  );

export const Dog = (p: IconProps) =>
  base(
    <>
      <ellipse cx="18" cy="26" rx="7" ry="11" fill="#A78BFA" transform="rotate(-20 18 26)" />
      <ellipse cx="46" cy="26" rx="7" ry="11" fill="#A78BFA" transform="rotate(20 46 26)" />
      <circle cx="32" cy="36" r="19" fill="#A78BFA" />
      <circle cx="25" cy="34" r="2.5" fill="#2B2A33" />
      <circle cx="39" cy="34" r="2.5" fill="#2B2A33" />
      <ellipse cx="32" cy="42" rx="4" ry="3" fill="#2B2A33" />
    </>,
    p,
  );

export const Rabbit = (p: IconProps) =>
  base(
    <>
      <ellipse cx="24" cy="14" rx="5" ry="14" fill="#5CC98A" />
      <ellipse cx="40" cy="14" rx="5" ry="14" fill="#5CC98A" />
      <circle cx="32" cy="38" r="18" fill="#5CC98A" />
      <circle cx="26" cy="36" r="2.5" fill="#2B2A33" />
      <circle cx="38" cy="36" r="2.5" fill="#2B2A33" />
      <circle cx="32" cy="44" r="2.5" fill="#FF8A65" />
    </>,
    p,
  );

export const Bear = (p: IconProps) =>
  base(
    <>
      <circle cx="16" cy="18" r="7" fill="#FFC93C" />
      <circle cx="48" cy="18" r="7" fill="#FFC93C" />
      <circle cx="32" cy="36" r="20" fill="#FFC93C" />
      <circle cx="25" cy="33" r="2.5" fill="#2B2A33" />
      <circle cx="39" cy="33" r="2.5" fill="#2B2A33" />
      <circle cx="32" cy="42" r="5" fill="#FFF8EC" />
      <circle cx="32" cy="42" r="2" fill="#2B2A33" />
    </>,
    p,
  );

export const Fox = (p: IconProps) =>
  base(
    <>
      <path d="M12 22 L24 8 L28 26 Z" fill="#FF8A65" />
      <path d="M52 22 L40 8 L36 26 Z" fill="#FF8A65" />
      <path d="M16 20 L24 12 L26 23 Z" fill="#2B2A33" />
      <path d="M48 20 L40 12 L38 23 Z" fill="#2B2A33" />
      <circle cx="32" cy="36" r="18" fill="#FF8A65" />
      <path d="M20 36c0 10 24 10 24 0 0-8-24-8-24 0Z" fill="#FFF8EC" />
      <circle cx="32" cy="42" r="2" fill="#2B2A33" />
      <circle cx="25" cy="32" r="2.5" fill="#2B2A33" />
      <circle cx="39" cy="32" r="2.5" fill="#2B2A33" />
    </>,
    p,
  );

export const Owl = (p: IconProps) =>
  base(
    <>
      <circle cx="32" cy="34" r="20" fill="#4FB3E8" />
      <circle cx="24" cy="30" r="8" fill="#FFF8EC" />
      <circle cx="40" cy="30" r="8" fill="#FFF8EC" />
      <circle cx="24" cy="30" r="3.5" fill="#2B2A33" />
      <circle cx="40" cy="30" r="3.5" fill="#2B2A33" />
      <path d="M32 36 L28 42 L36 42 Z" fill="#FFC93C" />
      <path d="M20 16 L26 24 M44 16 L38 24" stroke="#1F7FB8" strokeWidth="4" strokeLinecap="round" />
    </>,
    p,
  );

export const AVATAR_IDS = ["cat", "dog", "rabbit", "bear", "fox", "owl"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATARS: Record<AvatarId, (p: IconProps) => React.ReactElement> = {
  cat: Cat,
  dog: Dog,
  rabbit: Rabbit,
  bear: Bear,
  fox: Fox,
  owl: Owl,
};

export const AVATAR_LABELS_VI: Record<AvatarId, string> = {
  cat: "Mèo",
  dog: "Chó",
  rabbit: "Thỏ",
  bear: "Gấu",
  fox: "Cáo",
  owl: "Cú mèo",
};
