/** Only allow same-origin relative paths; blocks //evil.com, /\evil.com, javascript:, etc. */
export function safeRedirectPath(input: unknown, fallback = "/dashboard"): string {
  if (typeof input !== "string") return fallback;
  if (!input.startsWith("/") || input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(input)) return fallback;
  try {
    const u = new URL(input, "http://local.invalid");
    if (u.origin !== "http://local.invalid") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

/** Accept only http(s) URLs for rendering user-supplied links. */
export function isSafeHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/pdf": "pdf",
};
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/** Checks declared type, size and magic bytes. */
export async function validateAttachment(file: File): Promise<string | null> {
  const ext = ALLOWED_ATTACHMENT_TYPES[file.type];
  if (!ext) return "Only PNG, JPEG or PDF files are allowed.";
  if (file.size > MAX_ATTACHMENT_BYTES) return "Files must be 5 MB or smaller.";
  if (file.size === 0) return "File is empty.";
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const hex = Array.from(head).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ok =
    (ext === "png" && hex.startsWith("89504e47")) ||
    (ext === "jpg" && hex.startsWith("ffd8ff")) ||
    (ext === "pdf" && hex.startsWith("25504446"));
  return ok ? null : "File contents do not match its type.";
}
