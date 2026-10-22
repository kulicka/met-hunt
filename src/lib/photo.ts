// Client-side photo preparation. Drawing onto a canvas and re-encoding copies
// pixels only, so EXIF (including GPS tags), XMP, and camera serials are dropped.
// The original file never leaves the phone.

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export async function preparePhoto(file: File): Promise<Blob> {
  // "from-image" bakes the EXIF orientation into the pixels before EXIF is discarded.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  canvas.width = canvas.height = 0;
  if (!blob) throw new Error("Could not encode photo");
  return blob;
}
