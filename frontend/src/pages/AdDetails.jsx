import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { del, get, post } from "../api/apiClient.js";
import { getImageUrl } from "../utils/imageUtils.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdLocationMap from "../components/AdLocationMap.jsx";

const AD_TYPE_LABELS = {
  PRODUCT_SALE: "Продажба на стока",
  SERVICE_OFFER: "Предлагане на услуга",
  SERVICE_REQUEST: "Търсене на услуга",
};

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

export default function AdDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, user } = useAuth();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favStatusLoading, setFavStatusLoading] = useState(false);
  const [favMutating, setFavMutating] = useState(false);
  const [favError, setFavError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAd, setDeletingAd] = useState(false);

  const sortedImages = useMemo(() => {
    if (!ad?.images?.length) {
      return [];
    }
    return [...ad.images].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [ad]);

  useEffect(() => {
    setActiveIndex(0);
  }, [id]);

  useEffect(() => {
    setFavError("");
    if (!ad?.id) {
      setIsFavorite(false);
      return undefined;
    }
    if (!isAuthenticated) {
      setIsFavorite(false);
      setFavStatusLoading(false);
      return undefined;
    }
    if (authLoading) {
      return undefined;
    }

    let cancelled = false;
    setFavStatusLoading(true);

    get(`/api/favorites/${ad.id}/status`)
      .then((flag) => {
        if (!cancelled) {
          setIsFavorite(Boolean(flag));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsFavorite(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFavStatusLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ad?.id, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Липсва идентификатор на обява.");
      setAd(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setAd(null);

    get(`/api/ads/${id}`)
      .then((data) => {
        if (!cancelled) {
          setAd(data);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err.status === 404) {
          setError("Обявата не е намерена.");
        } else {
          setError("Неуспешно зареждане на обявата.");
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
  }, [id]);

  const mainImageKey = sortedImages[activeIndex]?.imageKey;
  const mainImageUrl = mainImageKey ? getImageUrl(mainImageKey) : "";

  const typeLabel = ad?.type ? AD_TYPE_LABELS[ad.type] || ad.type : "—";

  const isOwner =
    user?.id != null && ad?.ownerId != null && Number(user.id) === Number(ad.ownerId);

  return (
    <div className="space-y-6">
      <Link to="/ads" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Назад към обявите
      </Link>

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

      {!loading && !error && ad ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[var(--shadow-card)]">
              <div className="aspect-video">
                {mainImageUrl ? (
                  <img src={mainImageUrl} alt="" className="h-full w-full object-contain bg-slate-900/5" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    Няма снимка
                  </div>
                )}
              </div>
              {sortedImages.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-2">
                  {sortedImages.map((img, idx) => {
                    const url = img.imageKey ? getImageUrl(img.imageKey) : "";
                    return (
                      <button
                        key={img.id ?? idx}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 ${
                          idx === activeIndex ? "border-emerald-600" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                      >
                        {url ? (
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Обява #{ad.id}</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{ad.title}</h1>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{formatPriceEur(ad.price)}</p>
              <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Категория</dt>
                  <dd className="font-medium text-slate-900">{ad.category || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Тип</dt>
                  <dd className="font-medium text-slate-900">{typeLabel}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-400">Локация</dt>
                  <dd className="font-medium text-slate-900">{ad.location || "—"}</dd>
                </div>
              </dl>
              {ad.keywords ? (
                <p className="mt-4 text-sm">
                  <span className="text-slate-400">Ключови думи: </span>
                  <span className="text-slate-800">{ad.keywords}</span>
                </p>
              ) : null}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h2 className="text-sm font-semibold text-slate-900">Описание</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {ad.description || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  <>
                    <Link
                      to={`/ads/${ad.id}/edit`}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm hover:bg-emerald-100"
                    >
                      Редактирай обява
                    </Link>
                    <button
                      type="button"
                      disabled={deletingAd}
                      onClick={async () => {
                        if (
                          !window.confirm("Сигурни ли сте, че искате да изтриете тази обява?")
                        ) {
                          return;
                        }
                        setDeleteError("");
                        setDeletingAd(true);
                        try {
                          await del(`/api/ads/${ad.id}`);
                          navigate("/ads", { replace: true });
                        } catch (err) {
                          setDeleteError(errorMessage(err, "Неуспешно изтриване на обява."));
                        } finally {
                          setDeletingAd(false);
                        }
                      }}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingAd ? "Изтриване…" : "Изтрий обява"}
                    </button>
                  </>
                ) : (
                  <>
                    {!isAuthenticated ? (
                      <Link
                        to="/login"
                        state={{ from: location }}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm hover:bg-emerald-100"
                      >
                        Влезте, за да добавите в любими
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={favMutating || favStatusLoading || !ad?.id}
                        onClick={async () => {
                          setFavError("");
                          setFavMutating(true);
                          try {
                            if (isFavorite) {
                              await del(`/api/favorites/${ad.id}`);
                              setIsFavorite(false);
                            } else {
                              await post(`/api/favorites/${ad.id}`, {});
                              setIsFavorite(true);
                            }
                          } catch (err) {
                            setFavError(errorMessage(err, "Неуспешна операция с любими."));
                          } finally {
                            setFavMutating(false);
                          }
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {favStatusLoading || favMutating
                          ? "…"
                          : isFavorite
                            ? "♥ Премахни от любими"
                            : "♡ Добави в любими"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-400"
                      title="Скоро"
                    >
                      Изпрати съобщение
                    </button>
                  </>
                )}
              </div>
              {favError ? (
                <p className="text-sm text-red-600" role="alert">
                  {favError}
                </p>
              ) : null}
              {deleteError ? (
                <p className="text-sm text-red-600" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold text-slate-900">Продавач</h2>
              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  {(ad.ownerName || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{ad.ownerName || "—"}</p>
                  {ad.ownerId != null ? (
                    <Link
                      to={`/users/${ad.ownerId}`}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Виж профила
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-500">—</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold text-slate-900">Локация</h2>
              <p className="mt-1 text-sm text-slate-600">{ad.location || "—"}</p>
              <div className="mt-4">
                <AdLocationMap
                  latitude={ad.latitude}
                  longitude={ad.longitude}
                  location={ad.location}
                  title={ad.title}
                />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
