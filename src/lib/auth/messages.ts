/**
 * Thông điệp lỗi auth dùng chung giữa server (guards.ts, ném AuthError) và
 * client (LearnFlow, so khớp message để phân biệt "hết phiên đăng nhập"
 * với lỗi mất mạng thật). Đặt ở file riêng (không "server-only") để
 * component client import được.
 */
export const STUDENT_AUTH_ERROR_MESSAGE = "Cần đăng nhập học sinh.";
