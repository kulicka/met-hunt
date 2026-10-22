import "server-only";

// The client already re-encodes photos without metadata. This is the server's
// second line of defence: accept only real JPEGs and drop any metadata segments.

const SOI = 0xd8, SOS = 0xda, EOI = 0xd9;

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === SOI && bytes[2] === 0xff;
}

/**
 * Remove APP1–APP15 (EXIF, XMP, ICC, IPTC, maker notes) and COM segments.
 * APP0 (JFIF) is kept. Returns null if the segment structure is malformed.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
  if (!isJpeg(bytes)) return null;
  const out: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === SOS) {
      out.push(bytes.subarray(i)); // entropy-coded image data through EOI
      return concat(out);
    }
    if (marker === EOI) return null;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return null;
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) out.push(bytes.subarray(i, i + 2 + length));
    i += 2 + length;
  }
  return null;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}
