/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from "serwist";
import { defaultCache } from "@serwist/turbopack/worker";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Gói đề 1 chủ đề: ưu tiên mạng (nội dung có thể đổi khi giáo viên
    // duyệt bài mới), nhưng vẫn dùng được bản đã tải khi mất mạng giữa
    // phiên — học sinh không bị kẹt giữa chừng.
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/session-pack/"),
      handler: new NetworkFirst({
        cacheName: "session-pack",
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    // MP3/WAV của bài học (Vercel Blob) — tải 1 lần, dùng lại khi offline.
    {
      matcher: ({ url, request }) =>
        request.destination === "audio" || url.pathname.startsWith("/audio/") || url.hostname.includes("blob.vercel-storage.com"),
      handler: new CacheFirst({
        cacheName: "lesson-audio",
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
