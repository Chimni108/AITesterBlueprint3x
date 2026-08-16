// Rough token estimate: ~4 characters per token (no tokenizer dependency needed for a demo app).
const CHARS_PER_TOKEN = 4;

/**
 * Splits text into overlapping chunks, sized in approximate tokens.
 * @param {string} text
 * @param {{ chunkSize?: number, chunkOverlap?: number }} opts chunkSize/chunkOverlap in tokens
 */
export function chunkText(text, opts = {}) {
  const chunkSizeTokens = opts.chunkSize ?? 500;
  const overlapTokens = opts.chunkOverlap ?? 50;

  const chunkSizeChars = Math.max(chunkSizeTokens * CHARS_PER_TOKEN, 100);
  const overlapChars = Math.min(overlapTokens * CHARS_PER_TOKEN, chunkSizeChars - 1);

  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSizeChars, clean.length);
    let sliceEnd = end;

    // Prefer to break on a paragraph/sentence boundary near the target end.
    if (end < clean.length) {
      const window = clean.slice(start, end);
      const lastBreak = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('. '));
      if (lastBreak > chunkSizeChars * 0.5) {
        sliceEnd = start + lastBreak + 1;
      }
    }

    const text = clean.slice(start, sliceEnd).trim();
    if (text) {
      chunks.push({
        index,
        text,
        charCount: text.length,
        tokenEstimate: Math.ceil(text.length / CHARS_PER_TOKEN),
      });
      index += 1;
    }

    if (sliceEnd >= clean.length) break;
    start = Math.max(sliceEnd - overlapChars, start + 1);
  }

  return chunks;
}
