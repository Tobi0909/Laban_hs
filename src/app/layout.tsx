import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "La bàn tự tin",
  description: "Giúp em tự đánh giá việc học một cách vui vẻ, không áp lực.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${baloo2.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-paper)] text-[var(--color-ink)] font-nunito">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
