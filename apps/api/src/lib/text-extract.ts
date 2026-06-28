import mammoth from "mammoth";
// pdf-parse's package entry runs a debug harness on import; import the library
// module directly to avoid that side effect.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Count words in extracted plain text. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Extract plain text from an uploaded PDF or DOCX buffer. Returns the text and
 * a derived word count. Throws a plain Error on a corrupt/unsupported file; the
 * route maps that to a 422.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; wordCount: number }> {
  let text = "";
  if (mimeType === PDF_MIME) {
    const result = await pdfParse(buffer);
    text = result.text ?? "";
  } else if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value ?? "";
  } else {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }
  text = text.split("\u0000").join("").trim();
  return { text, wordCount: countWords(text) };
}
