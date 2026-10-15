import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function TeacherLoginPage() {
  const session = await auth();
  if (session?.user.role === "teacher") {
    redirect("/teacher");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-baloo text-2xl font-bold text-sky-deep">La bàn tự tin — Giáo viên</h1>
        <p className="text-sm text-ink/70">Đăng nhập để mở lớp, thêm học sinh và duyệt bài.</p>
        <GoogleSignInButton />
      </div>
    </main>
  );
}
