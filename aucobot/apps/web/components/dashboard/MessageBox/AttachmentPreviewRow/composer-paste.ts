const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "TR",
  "BLOCKQUOTE",
  "PRE",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "UL",
  "OL",
  "TABLE",
]);

const PARAGRAPH_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
  "TR",
]);

/** Plain text from clipboard, preserving paragraph breaks only when present in source. */
export function readClipboardPlainText(data: DataTransfer): string {
  const plain = normalizePlainText(data.getData("text/plain"));
  const html = data.getData("text/html").trim();

  if (html) {
    const fromHtml = htmlToPlainText(html);
    if (fromHtml && shouldPreferHtmlPlain(plain, fromHtml)) {
      return alignBreaksWithPlain(fromHtml, plain);
    }
  }

  return plain;
}

function shouldPreferHtmlPlain(plain: string, fromHtml: string): boolean {
  if (!plain.trim()) return true;

  if (plain.includes("\n")) return false;

  const plainBreaks = countParagraphBreaks(plain);
  const htmlBreaks = countParagraphBreaks(fromHtml);
  if (plainBreaks > 0 && plainBreaks >= htmlBreaks) return false;
  if (htmlBreaks > plainBreaks) return true;

  return isPlainTextMissingSpaces(plain, fromHtml);
}

function alignBreaksWithPlain(fromHtml: string, plain: string): string {
  let text = fromHtml;
  if (!/^\s*\n/.test(plain)) {
    text = text.replace(/^\n+/, "");
  }
  if (!/\n\s*$/.test(plain)) {
    text = text.replace(/\n+$/, "");
  }
  return text;
}

function countParagraphBreaks(text: string): number {
  return (text.match(/\n[ \t]*\n/g) ?? []).length;
}

function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style").forEach((node) => node.remove());

  const parts: string[] = [];
  for (const child of doc.body.childNodes) {
    appendNodeText(child, parts);
  }

  return finalizePlainText(parts.join(""));
}

function appendNodeText(node: Node, parts: string[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (text) parts.push(text);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as HTMLElement;
  const tag = el.tagName;

  if (tag === "BR") {
    if (!hasOnlyWhitespace(parts)) parts.push("\n");
    return;
  }

  if (BLOCK_TAGS.has(tag) && !elementHasMeaningfulText(el)) {
    return;
  }

  const isBlock = BLOCK_TAGS.has(tag);
  if (isBlock) {
    ensureParagraphBreak(parts);
  }

  for (const child of el.childNodes) {
    appendNodeText(child, parts);
  }

  if (PARAGRAPH_TAGS.has(tag)) {
    ensureParagraphBreak(parts);
  } else if (isBlock) {
    ensureLineBreak(parts);
  }
}

function elementHasMeaningfulText(el: HTMLElement): boolean {
  return (el.textContent ?? "").replace(/\u00a0/g, " ").trim().length > 0;
}

function hasOnlyWhitespace(parts: string[]): boolean {
  return parts.length === 0 || parts.join("").trim().length === 0;
}

function ensureLineBreak(parts: string[]): void {
  if (hasOnlyWhitespace(parts)) return;
  const last = parts[parts.length - 1];
  if (last.endsWith("\n\n") || last.endsWith("\n")) return;
  parts.push("\n");
}

function ensureParagraphBreak(parts: string[]): void {
  if (hasOnlyWhitespace(parts)) return;
  const last = parts[parts.length - 1];
  if (last.endsWith("\n\n")) return;
  if (last.endsWith("\n")) {
    parts.push("\n");
    return;
  }
  parts.push("\n\n");
}

function finalizePlainText(text: string): string {
  return normalizePlainText(text)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");
}

function normalizePlainText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ");
}

function isPlainTextMissingSpaces(plain: string, fromHtml: string): boolean {
  const plainWords = countWords(plain);
  const htmlWords = countWords(fromHtml);
  if (htmlWords <= plainWords) return false;
  const plainSpaces = (plain.match(/ /g) ?? []).length;
  const htmlSpaces = (fromHtml.match(/ /g) ?? []).length;
  return htmlSpaces > plainSpaces + 2;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function insertTextAtSelection(
  textarea: HTMLTextAreaElement,
  currentValue: string,
  insertText: string,
): string {
  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;
  return currentValue.slice(0, start) + insertText + currentValue.slice(end);
}

export function restoreSelection(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
): void {
  textarea.selectionStart = start;
  textarea.selectionEnd = end;
}
