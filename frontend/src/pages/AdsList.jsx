import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { get } from "../api/apiClient.js";
import LocationFilterPicker, { getSettlementNamesForRegion } from "../components/LocationFilterPicker.jsx";
import { AD_CATEGORIES } from "../constants/adCategories.js";
import { getImageUrl } from "../utils/imageUtils.js";

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} €`;
}

function normalizeText(value) {
  if (value == null) {
    return "";
  }
  return String(value).trim().toLowerCase();
}

function numericPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function filterAds(ads, filters) {
  const {
    searchTerm,
    selectedCategory,
    selectedRegion,
    selectedLocation,
    locationRegions,
    minPrice,
    maxPrice,
    sortBy,
  } = filters;
  const query = normalizeText(searchTerm);
  const min = minPrice !== "" ? numericPrice(minPrice) : null;
  const max = maxPrice !== "" ? numericPrice(maxPrice) : null;

  let result = ads.filter((ad) => {
    if (query) {
      const haystack = [
        ad.title,
        ad.description,
        ad.category,
        ad.location,
      ]
        .map(normalizeText)
        .join(" ");
      if (!haystack.includes(query)) {
        return false;
      }
    }
    if (selectedCategory && ad.category !== selectedCategory) {
      return false;
    }
    if (selectedLocation) {
      if (ad.location !== selectedLocation) {
        return false;
      }
    } else if (selectedRegion) {
      const names = getSettlementNamesForRegion(locationRegions, selectedRegion);
      if (!names.has(ad.location)) {
        return false;
      }
    }
    const price = numericPrice(ad.price);
    if (min != null && (price == null || price < min)) {
      return false;
    }
    if (max != null && (price == null || price > max)) {
      return false;
    }
    return true;
  });

  result = [...result];

  switch (sortBy) {
    case "price-asc":
      result.sort((a, b) => (numericPrice(a.price) ?? Infinity) - (numericPrice(b.price) ?? Infinity));
      break;
    case "price-desc":
      result.sort((a, b) => (numericPrice(b.price) ?? -Infinity) - (numericPrice(a.price) ?? -Infinity));
      break;
    case "title-asc":
      result.sort((a, b) =>
        normalizeText(a.title).localeCompare(normalizeText(b.title), "bg"),
      );
      break;
    case "newest":
    default:
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
        if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
          return dateB - dateA;
        }
        return Number(b.id) - Number(a.id);
      });
      break;
  }

  return result;
}

const FILTER_INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const SORT_OPTIONS = new Set(["newest", "price-asc", "price-desc", "title-asc"]);

function parseCategoryFromUrl(value) {
  if (!value) {
    return "";
  }
  return AD_CATEGORIES.includes(value) ? value : "";
}

function parseSortFromUrl(value) {
  if (!value || value === "newest") {
    return "newest";
  }
  return SORT_OPTIONS.has(value) ? value : "newest";
}

function filtersFromSearchParams(searchParams) {
  return {
    searchTerm: searchParams.get("q") ?? "",
    selectedCategory: parseCategoryFromUrl(searchParams.get("category") ?? ""),
    selectedRegion: searchParams.get("region") ?? "",
    selectedLocation: searchParams.get("location") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    sortBy: parseSortFromUrl(searchParams.get("sort")),
  };
}

function buildSearchParamsFromFilters(filters) {
  const params = new URLSearchParams();
  const q = filters.searchTerm?.trim();
  if (q) {
    params.set("q", q);
  }
  if (filters.selectedCategory) {
    params.set("category", filters.selectedCategory);
  }
  if (filters.selectedRegion) {
    params.set("region", filters.selectedRegion);
  }
  if (filters.selectedLocation) {
    params.set("location", filters.selectedLocation);
  }
  if (filters.minPrice !== "" && filters.minPrice != null) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== "" && filters.maxPrice != null) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.sortBy && filters.sortBy !== "newest") {
    params.set("sort", filters.sortBy);
  }
  return params;
}

export default function AdsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(() =>
    parseCategoryFromUrl(searchParams.get("category") ?? ""),
  );
  const [selectedRegion, setSelectedRegion] = useState(() => searchParams.get("region") ?? "");
  const [selectedLocation, setSelectedLocation] = useState(() => searchParams.get("location") ?? "");
  const [locationRegions, setLocationRegions] = useState([]);
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") ?? "");
  const [sortBy, setSortBy] = useState(() => parseSortFromUrl(searchParams.get("sort")));

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    setSearchTerm(fromUrl.searchTerm);
    setSelectedCategory(fromUrl.selectedCategory);
    setSelectedRegion(fromUrl.selectedRegion);
    setSelectedLocation(fromUrl.selectedLocation);
    setMinPrice(fromUrl.minPrice);
    setMaxPrice(fromUrl.maxPrice);
    setSortBy(fromUrl.sortBy);
  }, [searchParams]);

  function updateUrlFromFilters(nextFilters) {
    setSearchParams(buildSearchParamsFromFilters(nextFilters), { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    get("/api/ads")
      .then((data) => {
        if (!cancelled) {
          setAds(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Неуспешно зареждане на обявите.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/data/bg-locations.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load locations");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setLocationRegions(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationRegions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAds = useMemo(
    () =>
      filterAds(ads, {
        searchTerm,
        selectedCategory,
        selectedRegion,
        selectedLocation,
        locationRegions,
        minPrice,
        maxPrice,
        sortBy,
      }),
    [
      ads,
      searchTerm,
      selectedCategory,
      selectedRegion,
      selectedLocation,
      locationRegions,
      minPrice,
      maxPrice,
      sortBy,
    ],
  );

  function hasActiveFilters() {
    return (
      normalizeText(searchTerm) !== "" ||
      selectedCategory !== "" ||
      selectedRegion !== "" ||
      selectedLocation !== "" ||
      minPrice !== "" ||
      maxPrice !== "" ||
      sortBy !== "newest"
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedRegion("");
    setSelectedLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Обяви</h1>
          <p className="text-sm text-slate-500">Всички активни обяви от платформата.</p>
        </div>
        <Link
          to="/post-ad"
          className="inline-flex w-fit items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Нова обява
        </Link>
      </div>

      {!loading && !error ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="ads-search" className="mb-1 block text-xs font-medium text-slate-600">
                Търсене
              </label>
              <input
                id="ads-search"
                type="search"
                value={searchTerm}
                onChange={(e) => {
                  const nextSearch = e.target.value;
                  setSearchTerm(nextSearch);
                  updateUrlFromFilters({
                    searchTerm: nextSearch,
                    selectedCategory,
                    selectedRegion,
                    selectedLocation,
                    minPrice,
                    maxPrice,
                    sortBy,
                  });
                }}
                placeholder="Търси обява…"
                className={FILTER_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ads-category" className="mb-1 block text-xs font-medium text-slate-600">
                Категория
              </label>
              <select
                id="ads-category"
                value={selectedCategory}
                onChange={(e) => {
                  const nextCategory = e.target.value;
                  setSelectedCategory(nextCategory);
                  updateUrlFromFilters({
                    searchTerm,
                    selectedCategory: nextCategory,
                    selectedRegion,
                    selectedLocation,
                    minPrice,
                    maxPrice,
                    sortBy,
                  });
                }}
                className={FILTER_INPUT_CLASS}
              >
                <option value="">Всички категории</option>
                {AD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Локация</label>
              <LocationFilterPicker
                selectedRegion={selectedRegion}
                selectedLocation={selectedLocation}
                disabled={loading}
                onChange={(next) => {
                  setSelectedRegion(next.region);
                  setSelectedLocation(next.location);
                  updateUrlFromFilters({
                    searchTerm,
                    selectedCategory,
                    selectedRegion: next.region,
                    selectedLocation: next.location,
                    minPrice,
                    maxPrice,
                    sortBy,
                  });
                }}
              />
            </div>
            <div>
              <label htmlFor="ads-min-price" className="mb-1 block text-xs font-medium text-slate-600">
                Мин. цена
              </label>
              <input
                id="ads-min-price"
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => {
                  const nextMin = e.target.value;
                  setMinPrice(nextMin);
                  updateUrlFromFilters({
                    searchTerm,
                    selectedCategory,
                    selectedRegion,
                    selectedLocation,
                    minPrice: nextMin,
                    maxPrice,
                    sortBy,
                  });
                }}
                placeholder="0"
                className={FILTER_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ads-max-price" className="mb-1 block text-xs font-medium text-slate-600">
                Макс. цена
              </label>
              <input
                id="ads-max-price"
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => {
                  const nextMax = e.target.value;
                  setMaxPrice(nextMax);
                  updateUrlFromFilters({
                    searchTerm,
                    selectedCategory,
                    selectedRegion,
                    selectedLocation,
                    minPrice,
                    maxPrice: nextMax,
                    sortBy,
                  });
                }}
                placeholder="∞"
                className={FILTER_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ads-sort" className="mb-1 block text-xs font-medium text-slate-600">
                Сортирай
              </label>
              <select
                id="ads-sort"
                value={sortBy}
                onChange={(e) => {
                  const nextSort = e.target.value;
                  setSortBy(nextSort);
                  updateUrlFromFilters({
                    searchTerm,
                    selectedCategory,
                    selectedRegion,
                    selectedLocation,
                    minPrice,
                    maxPrice,
                    sortBy: nextSort,
                  });
                }}
                className={FILTER_INPUT_CLASS}
              >
                <option value="newest">Най-нови</option>
                <option value="price-asc">Цена: ниска към висока</option>
                <option value="price-desc">Цена: висока към ниска</option>
                <option value="title-asc">Заглавие: А–Я</option>
              </select>
            </div>
            <div className="flex items-end">
              {hasActiveFilters() ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Изчисти
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Показани {filteredAds.length} от {ads.length} обяви
          </p>
        </section>
      ) : null}

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
          Зареждане на обяви…
        </p>
      ) : null}

      {error && !loading ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && ads.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
          Все още няма обяви.
        </p>
      ) : null}

      {!loading && !error && ads.length > 0 && filteredAds.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-600">Няма обяви, които отговарят на избраните филтри.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Изчисти филтрите
          </button>
        </div>
      ) : null}

      {!loading && !error && filteredAds.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAds.map((ad) => {
            const sortedImages = [...(ad.images || [])].sort(
              (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
            );
            const firstKey = sortedImages[0]?.imageKey;
            const imgUrl = firstKey ? getImageUrl(firstKey) : "";

            return (
              <Link
                key={ad.id}
                to={`/ads/${ad.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Няма снимка
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h2 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                    {ad.title || "—"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {[ad.category, ad.location].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-auto pt-2 text-base font-bold text-emerald-700">{formatPriceEur(ad.price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
