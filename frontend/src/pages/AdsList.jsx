import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api/apiClient.js";
import { getImageUrl } from "../utils/imageUtils.js";

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} €`;
}

export default function AdsList() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {!loading && !error && ads.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ads.map((ad) => {
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
