export function getImageUrl(imageKey) {
  if (!imageKey) return "";
  return `/uploads/${imageKey}`;
}
