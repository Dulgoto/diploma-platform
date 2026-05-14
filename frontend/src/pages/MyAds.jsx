import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { del, get } from "../api/apiClient.js";
import { getImageUrl } from "../utils/imageUtils.js";

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} €`;
}

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

export default function MyAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchAds = useCallback(() => {
    setLoading(true);
    setError("");
    get("/api/ads/myAds")
      .then((data) => {
        setAds(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError("Неуспешно зареждане на вашите обяви.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Моите обяви</h1>
          <p className="text-sm text-slate-500">Управлявайте публикуваните от вас обяви.</p>
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
          Зареждане…
        </p>
      ) : null}

      {error && !loading ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && ads.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
          Все още нямате обяви.{" "}
          <Link to="/post-ad" className="font-medium text-emerald-700 hover:underline">
            Публикувайте първата
          </Link>
          .
        </p>
      ) : null}

      {!loading && !error && ads.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => {
            const sortedImages = [...(ad.images || [])].sort(
              (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
            );
            const firstKey = sortedImages[0]?.imageKey;
            const imgUrl = firstKey ? getImageUrl(firstKey) : "";

            return (
              <article
                key={ad.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200">
                  {imgUrl ? (
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Няма снимка
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">{ad.title || "—"}</h2>
                  <p className="text-xs text-slate-500">
                    {[ad.category, ad.location].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-base font-bold text-emerald-700">{formatPriceEur(ad.price)}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    <Link
                      to={`/ads/${ad.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Виж
                    </Link>
                    <Link
                      to={`/ads/${ad.id}/edit`}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                    >
                      Редактирай
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === ad.id}
                      onClick={async () => {
                        if (
                          !window.confirm("Сигурни ли сте, че искате да изтриете тази обява?")
                        ) {
                          return;
                        }
                        setDeletingId(ad.id);
                        try {
                          await del(`/api/ads/${ad.id}`);
                          setAds((prev) => prev.filter((a) => a.id !== ad.id));
                        } catch (err) {
                          window.alert(errorMessage(err, "Неуспешно изтриване на обява."));
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === ad.id ? "…" : "Изтрий"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
