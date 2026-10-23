/** FNV-1a over UTF-8, as 8 hex chars. Used to notice published text changing without a version bump. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
