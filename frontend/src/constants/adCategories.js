export const AD_CATEGORIES = [
  "Автомобили",
  "Имоти",
  "Електроника",
  "Дом и градина",
  "Мода",
  "Работа",
  "Услуги",
  "Спорт и хоби",
  "Животни",
  "Други",
];

export function isValidAdCategory(category) {
  return AD_CATEGORIES.includes(category);
}

export function resolveAdCategory(value) {
  if (typeof value === "string" && value.trim() && AD_CATEGORIES.includes(value.trim())) {
    return value.trim();
  }
  return "Други";
}
