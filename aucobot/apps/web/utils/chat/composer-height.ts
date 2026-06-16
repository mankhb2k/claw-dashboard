/** Max visible lines in the chat composer textarea before scrolling. */
export const COMPOSER_MAX_INPUT_LINES = 12;

export function syncComposerHeight(
  element: HTMLTextAreaElement,
  maxLines: number,
): void {
  element.style.height = "auto";
  const styles = getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom;
  const nextHeight = Math.min(element.scrollHeight, maxHeight);
  element.style.height = `${nextHeight}px`;
  element.style.overflowY =
    element.scrollHeight > maxHeight ? "auto" : "hidden";
}
