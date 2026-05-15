import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, "..");

const SOURCE_PATH = path.join(FRONTEND_ROOT, "scripts", "source", "Places-in-Bulgaria.json");
const OUTPUT_DIR = path.join(FRONTEND_ROOT, "public", "data");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "bg-locations.json");

const TYPE_MAP = {
  "гр.": "град",
  "гр": "град",
  "с.": "село",
  "с": "село",
  "к.к.": "курорт",
  "к.к": "курорт",
};

function normalizeRegionName(rawName) {
  const trimmed = String(rawName ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (/^област\s/i.test(trimmed)) {
    return trimmed.replace(/^област\s/i, "Област ");
  }
  return `Област ${trimmed}`;
}

function normalizeSettlementType(rawType) {
  if (rawType == null) {
    return undefined;
  }
  const trimmed = String(rawType).trim();
  if (!trimmed) {
    return undefined;
  }
  const mapped = TYPE_MAP[trimmed.toLowerCase()];
  if (mapped) {
    return mapped;
  }
  return trimmed.replace(/\.$/, "");
}

function isValidCoordinate(value) {
  const n = Number(value);
  return Number.isFinite(n);
}

function isSettlementRecord(value) {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.name === "string" &&
    ("latitude" in value || "longitude" in value)
  );
}

function compareBg(a, b) {
  return String(a).localeCompare(String(b), "bg");
}

function extractLocations(source) {
  const regionMap = new Map();

  for (const [rawRegion, municipalities] of Object.entries(source)) {
    if (municipalities == null || typeof municipalities !== "object" || Array.isArray(municipalities)) {
      continue;
    }

    const region = normalizeRegionName(rawRegion);
    if (!region) {
      continue;
    }

    if (!regionMap.has(region)) {
      regionMap.set(region, new Map());
    }
    const settlementsByName = regionMap.get(region);

    for (const municipality of Object.values(municipalities)) {
      if (municipality == null || typeof municipality !== "object" || Array.isArray(municipality)) {
        continue;
      }

      for (const entry of Object.values(municipality)) {
        if (!isSettlementRecord(entry)) {
          continue;
        }

        const latitude = Number(entry.latitude);
        const longitude = Number(entry.longitude);
        if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
          continue;
        }

        const name = String(entry.name).trim();
        if (!name) {
          continue;
        }

        const dedupeKey = name.toLocaleLowerCase("bg");
        if (settlementsByName.has(dedupeKey)) {
          continue;
        }

        const settlement = {
          name,
          latitude,
          longitude,
        };

        const type = normalizeSettlementType(entry.type);
        if (type) {
          settlement.type = type;
        }

        settlementsByName.set(dedupeKey, settlement);
      }
    }
  }

  const output = [...regionMap.entries()]
    .map(([region, settlementsByName]) => ({
      region,
      settlements: [...settlementsByName.values()].sort((a, b) => compareBg(a.name, b.name)),
    }))
    .filter((item) => item.settlements.length > 0)
    .sort((a, b) => compareBg(a.region, b.region));

  return output;
}

async function main() {
  const raw = await readFile(SOURCE_PATH, "utf8");
  const source = JSON.parse(raw);
  const locations = extractLocations(source);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(locations, null, 2)}\n`, "utf8");

  const totalSettlements = locations.reduce((sum, region) => sum + region.settlements.length, 0);

  console.log(`Генерирани области: ${locations.length}`);
  console.log(`Генерирани населени места: ${totalSettlements}`);
  console.log(`Записан файл: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
