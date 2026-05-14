const BASE_URL = "http://localhost:8080";

export function getImageUrl(imageKey) {
  if (!imageKey) return "";
  return `${BASE_URL}/uploads/${imageKey}`;
}
