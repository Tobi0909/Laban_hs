import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth/guards";
import { createClass } from "../../actions";

export default async function NewClassPage() {
  await requireTeacher();

  async function action(formData: FormData) {
    "use server";
    const created = await createClass(formData);
    redirect(`/teacher/classes/${created.id}`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-sky-deep">Tạo lớp mới</h1>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tên lớp
          <input
            name="name"
            required
            className="rounded-lg border border-border bg-card px-3 py-2"
            placeholder="2A"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Khối lớp
          <select name="grade" required className="rounded-lg border border-border bg-card px-3 py-2">
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-sky-deep px-4 py-2 font-medium text-white hover:bg-sky">
          Tạo lớp
        </button>
      </form>
    </main>
  );
}
