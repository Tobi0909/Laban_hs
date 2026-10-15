import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiDrafts } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { suggestInputSchema } from "@/lib/ai/schemas";
import { requestAuthorSuggestion } from "@/lib/ai/suggest";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";

export async function POST(request: Request) {
  let teacherId: string;
  try {
    ({ teacherId } = await requireTeacher());
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { allowed } = await checkAiRateLimit(teacherId);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = suggestInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const output = await requestAuthorSuggestion(parsed.data);

    const [draft] = await db
      .insert(aiDrafts)
      .values({
        teacherId,
        kind: parsed.data.kind,
        input: parsed.data,
        output,
        accepted: false,
      })
      .returning();

    return NextResponse.json({ draftId: draft.id, output });
  } catch (error) {
    console.error("AI suggest failed", error);
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }
}
