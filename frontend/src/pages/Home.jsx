import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get } from "../api/apiClient.js";
import { getImageUrl } from "../utils/imageUtils.js";

const popularCategories = ["Услуги", "Електроника", "Дом и градина", "Спорт и хоби", "Автомобили"];

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} €`;
}

function sortNewest(ads) {
  return [...ads].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
      return dateB - dateA;
    }
    return Number(b.id) - Number(a.id);
  });
}

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [latestAds, setLatestAds] = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestError, setLatestError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLatestLoading(true);
    setLatestError("");

    get("/api/ads")
      .then((data) => {
        if (cancelled) {
          return;
        }
        const all = Array.isArray(data) ? data : [];
        setLatestAds(sortNewest(all).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) {
          setLatestError("Неуспешно зареждане на последните обяви.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLatestLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-800 p-6 text-white shadow-lg sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Намерете услуги и стоки наблизо
          </h1>
          <p className="mt-2 text-sm text-emerald-100 sm:text-base">
            Търсете по ключови думи, категории и локация сред публикуваните обяви.
          </p>
          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = searchTerm.trim();
              if (trimmed) {
                navigate(`/ads?q=${encodeURIComponent(trimmed)}`);
              } else {
                navigate("/ads");
              }
            }}
          >
            <label className="sr-only" htmlFor="home-search">
              Търсене
            </label>
            <input
              id="home-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Какво търсите днес?"
              className="min-h-12 flex-1 rounded-xl border border-white/20 bg-white/95 px-4 text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-white px-6 text-sm font-semibold text-emerald-800 shadow-md hover:bg-emerald-50"
            >
              Търси
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Популярни категории</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {popularCategories.map((category) => (
            <Link
              key={category}
              to={`/ads?category=${encodeURIComponent(category)}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Последни обяви</h2>
            <p className="text-sm text-slate-500">Най-новите публикувани обяви на платформата.</p>
          </div>
          <Link
            to="/ads"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Към всички обяви
          </Link>
        </div>

        {latestLoading ? (
          <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            Зареждане на последни обяви…
          </p>
        ) : null}

        {latestError && !latestLoading ? (
          <p className="mt-6 text-sm text-red-600" role="alert">
            {latestError}
          </p>
        ) : null}

        {!latestLoading && !latestError && latestAds.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Все още няма публикувани обяви.
          </p>
        ) : null}

        {!latestLoading && !latestError && latestAds.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {latestAds.map((ad) => {
              const sortedImages = [...(ad.images || [])].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
              );
              const firstKey = sortedImages[0]?.imageKey;
              const imgUrl = firstKey ? getImageUrl(firstKey) : "";

              return (
                <Link
                  key={ad.id}
                  to={`/ads/${ad.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                      {ad.title || "—"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {[ad.category, ad.location].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-auto pt-1 text-sm font-bold text-emerald-700">
                      {formatPriceEur(ad.price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
