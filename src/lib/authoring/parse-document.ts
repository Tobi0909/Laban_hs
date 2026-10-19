import "server-only";

export const SUPPORTED_IMPORT_EXTENSIONS = [".txt", ".docx", ".pdf"] as const;
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

/**
 * Đọc nội dung file giáo viên tải lên thành text thuần để parse đề thi.
 * .txt đọc trực tiếp, .docx tách chữ bằng mammoth, .pdf tách chữ bằng
 * unpdf (không cần dịch vụ ngoài).
 */
export async function parseImportFile(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error("File quá lớn (tối đa 5MB).");
  }

  const ext = extensionOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === ".txt") {
    return buffer.toString("utf-8");
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (ext === ".pdf") {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  throw new Error("Chỉ hỗ trợ file .txt, .docx hoặc .pdf.");
}
