import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Ứng dụng vốn dynamic (phụ thuộc session/DB mỗi request) nên không bật
   * cacheComponents/partialPrefetching — tránh phải khoanh Suspense thủ công
   * cho từng điểm đọc session/DB. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
