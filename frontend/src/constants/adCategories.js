export const SERVICE_CATEGORIES = [
  "Ремонтни услуги",
  "ВиК услуги",
  "Електроуслуги",
  "Строителни услуги",
  "Почистване",
  "Транспорт",
  "Градинарство",
  "Уроци и обучение",
  "IT услуги",
  "Други услуги",
];

export const PRODUCT_CATEGORIES = [
  "Инструменти",
  "Строителни материали",
  "Електроника",
  "Дом и градина",
  "Мебели",
  "Авточасти",
  "Дрехи и аксесоари",
  "Други стоки",
];

export const AD_CATEGORIES = [...new Set([...SERVICE_CATEGORIES, ...PRODUCT_CATEGORIES])];

export function getCategoriesForAdType(type) {
  if (type === "PRODUCT_SALE") {
    return PRODUCT_CATEGORIES;
  }
  if (type === "SERVICE_REQUEST" || type === "SERVICE_OFFER") {
    return SERVICE_CATEGORIES;
  }
  return [];
}

export function isValidAdCategory(category, type) {
  if (type) {
    return getCategoriesForAdType(type).includes(category);
  }
  return AD_CATEGORIES.includes(category);
}

export function resolveAdCategory(value, type) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed && isValidAdCategory(trimmed, type)) {
    return trimmed;
  }
  if (type === "PRODUCT_SALE") {
    return "Други стоки";
  }
  if (type === "SERVICE_REQUEST" || type === "SERVICE_OFFER") {
    return "Други услуги";
  }
  return "Други услуги";
}
