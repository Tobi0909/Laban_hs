import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La bàn tự tin",
    short_name: "La bàn tự tin",
    description: "Giúp em tự đánh giá việc học một cách vui vẻ, không áp lực.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EC",
    theme_color: "#4FB3E8",
    orientation: "any",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
