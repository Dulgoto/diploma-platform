import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { del, get, post, put } from "../api/apiClient.js";
import { getImageUrl } from "../utils/imageUtils.js";
import { backendRatingToStars, starsToBackendRating } from "../utils/ratingUtils.js";
import { useAuth } from "../context/AuthContext.jsx";

const SLOT_CLASS = "relative h-8 w-8 shrink-0 select-none";

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

function isImageAvatar(key) {
  return typeof key === "string" && key.trim().length > 0;
}

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} €`;
}

function formatDate(iso) {
  if (!iso) {
    return "";
  }
  try {
    return new Date(iso).toLocaleString("bg-BG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

/**
 * One star slot (index 1–5). `value` is 0–5 in 0.5 steps.
 * Readonly visual: no click targets.
 */
function StarSlotReadonly({ index, value }) {
  const filled = value >= index;
  const half = !filled && value >= index - 0.5;
  return (
    <div className={SLOT_CLASS}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl leading-none">
        <span className="text-slate-300">☆</span>
      </div>
      {filled ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl leading-none text-amber-500">
          ★
        </div>
      ) : null}
      {half ? (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1/2 overflow-hidden">
          <div className="flex h-full w-8 items-center justify-center text-xl leading-none text-amber-500">★</div>
        </div>
      ) : null}
    </div>
  );
}

function StarRowReadonly({ value }) {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <span className="inline-flex items-center gap-0" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarSlotReadonly key={i} index={i} value={v} />
      ))}
    </span>
  );
}

/**
 * Interactive row: same visuals as readonly; transparent half-slice buttons on top.
 */
function StarRowInteractive({ value, onChange, disabled }) {
  const [hoverRating, setHoverRating] = useState(null);
  const selected = Math.min(5, Math.max(0.5, Number(value) || 0.5));
  const display =
    hoverRating != null ? Math.min(5, Math.max(0.5, hoverRating)) : selected;

  function pickRating(rating) {
    onChange(Math.min(5, Math.max(0.5, rating)));
    setHoverRating(null);
  }

  return (
    <span
      className="inline-flex items-center gap-0"
      role="group"
      aria-label="Оценка"
      onMouseLeave={() => setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={SLOT_CLASS}>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl leading-none">
            <span className="text-slate-300">☆</span>
          </div>
          {display >= i ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl leading-none text-amber-500">
              ★
            </div>
          ) : null}
          {display < i && display >= i - 0.5 ? (
            <div className="pointer-events-none absolute left-0 top-0 h-full w-1/2 overflow-hidden">
              <div className="flex h-full w-8 items-center justify-center text-xl leading-none text-amber-500">★</div>
            </div>
          ) : null}
          {!disabled ? (
            <>
              <button
                type="button"
                className="absolute left-0 top-0 z-10 h-full w-1/2 cursor-pointer border-0 bg-transparent p-0 outline-none focus:outline-none"
                aria-label={`Оценка ${i - 0.5} от 5`}
                onMouseEnter={() => setHoverRating(i - 0.5)}
                onClick={() => pickRating(i - 0.5)}
              />
              <button
                type="button"
                className="absolute right-0 top-0 z-10 h-full w-1/2 cursor-pointer border-0 bg-transparent p-0 outline-none focus:outline-none"
                aria-label={`Оценка ${i} от 5`}
                onMouseEnter={() => setHoverRating(i)}
                onClick={() => pickRating(i)}
              />
            </>
          ) : null}
        </div>
      ))}
    </span>
  );
}

export default function PublicProfile() {
  const { id } = useParams();
  const location = useLocation();
  const { user, isAuthenticated, refreshAccount } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [selectedStars, setSelectedStars] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  const [profileAds, setProfileAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState("");
  const [deletingAdId, setDeletingAdId] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", location: "", description: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileEditError, setProfileEditError] = useState("");
  const [profileEditSuccess, setProfileEditSuccess] = useState("");

  async function reloadProfileAndReviews() {
    const [p, r] = await Promise.all([
      get(`/api/users/${id}`),
      get(`/api/reviews/users/${id}`),
    ]);
    setProfile(p);
    setReviews(Array.isArray(r) ? r : []);
  }

  useEffect(() => {
    if (!id) {
      setError("Липсва идентификатор на потребител.");
      setLoading(false);
      setProfile(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setProfile(null);
    setReviews([]);
    setReviewsError("");

    get(`/api/users/${id}`)
      .then((p) => {
        if (!cancelled) {
          setProfile(p);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err.status === 404) {
          setError("Потребителят не е намерен.");
        } else {
          setError("Неуспешно зареждане на профила.");
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

  useEffect(() => {
    if (!id || !profile?.id) {
      return undefined;
    }

    let cancelled = false;
    setReviewsLoading(true);
    setReviewsError("");

    get(`/api/reviews/users/${id}`)
      .then((r) => {
        if (!cancelled) {
          setReviews(Array.isArray(r) ? r : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviewsError("Неуспешно зареждане на отзивите.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setProfileAds([]);
      return undefined;
    }

    let cancelled = false;
    setAdsLoading(true);
    setAdsError("");

    get("/api/ads")
      .then((data) => {
        if (cancelled) {
          return;
        }
        const all = Array.isArray(data) ? data : [];
        const filtered = all.filter((ad) => Number(ad.ownerId) === Number(profile.id));
        setProfileAds(filtered);
      })
      .catch(() => {
        if (!cancelled) {
          setAdsError("Неуспешно зареждане на обявите.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAdsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const isOwnProfile =
    user?.id != null && profile?.id != null && Number(user.id) === Number(profile.id);

  const myReview = isAuthenticated
    ? reviews.find((rev) => rev.reviewerId != null && user?.id != null && Number(rev.reviewerId) === Number(user.id))
    : null;

  const canReview = isAuthenticated && !isOwnProfile;

  useEffect(() => {
    if (reviewSubmitting) {
      return;
    }
    if (myReview) {
      const stars = backendRatingToStars(myReview.rating);
      const clamped = Math.min(5, Math.max(0.5, stars));
      setSelectedStars(clamped);
      setComment(myReview.comment ?? "");
    } else {
      setSelectedStars(5);
      setComment("");
    }
  }, [id, myReview?.id, myReview?.rating, myReview?.comment, reviewSubmitting]);

  const avgDisplay =
    profile?.averageRating != null && !Number.isNaN(Number(profile.averageRating))
      ? Number(profile.averageRating)
      : 0;

  async function handleSubmitReview(e) {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    setReviewSubmitting(true);
    const payload = {
      rating: starsToBackendRating(selectedStars),
      comment: comment.trim(),
    };
    try {
      try {
        await post(`/api/reviews/users/${id}`, payload);
      } catch (err) {
        const msg = (err?.body?.message || "").toLowerCase();
        if (err.status === 400 && msg.includes("already")) {
          await put(`/api/reviews/users/${id}`, payload);
        } else {
          throw err;
        }
      }
      await reloadProfileAndReviews();
      setReviewSuccess("Отзивът е запазен.");
    } catch (err) {
      setReviewError(errorMessage(err, "Неуспешно изпращане на отзив."));
    } finally {
      setReviewSubmitting(false);
    }
  }

  const reviewsHeading = isOwnProfile ? "Получени отзиви" : "Отзиви";

  const profileInputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60";

  function editFormFromProfile(p) {
    return {
      name: p?.name || "",
      location: p?.location || "",
      description: p?.description || "",
    };
  }

  function openEditProfile() {
    setEditForm(editFormFromProfile(profile));
    setProfileEditError("");
    setProfileEditSuccess("");
    setIsEditingProfile(true);
  }

  function cancelEditProfile() {
    setEditForm(editFormFromProfile(profile));
    setProfileEditError("");
    setProfileEditSuccess("");
    setIsEditingProfile(false);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileEditError("");
    setProfileEditSuccess("");
    try {
      const updatedAccount = await put("/api/users/account", {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        description: editForm.description.trim(),
        avatarKey: profile.avatarKey ?? user?.avatarKey ?? null,
      });
      setProfile((prev) => ({
        ...prev,
        id: updatedAccount.id,
        name: updatedAccount.name,
        location: updatedAccount.location,
        latitude: updatedAccount.latitude,
        longitude: updatedAccount.longitude,
        description: updatedAccount.description,
        averageRating: updatedAccount.averageRating,
        avatarKey: updatedAccount.avatarKey,
      }));
      if (refreshAccount) {
        await refreshAccount();
      }
      setProfileEditSuccess("Профилът е обновен.");
      setIsEditingProfile(false);
    } catch (err) {
      setProfileEditError(errorMessage(err, "Неуспешно обновяване на профила."));
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/ads" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Към обявите
      </Link>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
          Зареждане на профила…
        </p>
      ) : null}

      {error && !loading ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && profile ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-emerald-100 text-2xl font-bold text-emerald-800">
                    {isImageAvatar(profile.avatarKey) ? (
                      <img
                        src={`/avatars/${profile.avatarKey}`}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (profile.name || "?").trim().charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">{profile.name || "—"}</h1>
                    <p className="mt-1 text-sm text-slate-600">{profile.location || "—"}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <StarRowReadonly value={avgDisplay} />
                      <span className="font-medium">
                        {avgDisplay.toFixed(1)} / 5
                        {profile.averageRating == null ? " (няма оценки)" : ""}
                      </span>
                    </div>

                    {!isEditingProfile ? (
                      profile.description ? (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                          {profile.description}
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-slate-400">Няма описание.</p>
                      )
                    ) : null}
                  </div>
                </div>

                {isOwnProfile && !isEditingProfile ? (
                  <button
                    type="button"
                    onClick={openEditProfile}
                    className="shrink-0 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    Редактирай профил
                  </button>
                ) : null}
              </div>

              {!isEditingProfile && profileEditSuccess ? (
                <p className="text-sm text-emerald-700" role="status">
                  {profileEditSuccess}
                </p>
              ) : null}

              {isEditingProfile ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                >
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="profile-edit-name" className="mb-1 block text-sm font-medium text-slate-700">
                        Име
                      </label>
                      <input
                        id="profile-edit-name"
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        disabled={profileSaving}
                        className={profileInputClass}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-edit-location"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Локация
                      </label>
                      <input
                        id="profile-edit-location"
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                        disabled={profileSaving}
                        className={profileInputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-edit-description"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Описание
                      </label>
                      <textarea
                        id="profile-edit-description"
                        rows={4}
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        disabled={profileSaving}
                        className={profileInputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {profileSaving ? "Запазване…" : "Запази"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditProfile}
                      disabled={profileSaving}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Отказ
                    </button>
                  </div>

                  {profileEditError ? (
                    <p className="mt-3 text-sm text-red-600" role="alert">
                      {profileEditError}
                    </p>
                  ) : null}
                  {profileEditSuccess ? (
                    <p className="mt-3 text-sm text-emerald-700" role="status">
                      {profileEditSuccess}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
            <aside className="space-y-4 lg:min-w-0">
              {canReview ? (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <h2 className="text-base font-semibold text-slate-900">Вашият отзив</h2>
                  <form className="mt-3 space-y-3" onSubmit={handleSubmitReview}>
                    <div className={reviewSubmitting ? "opacity-60" : ""}>
                      <StarRowInteractive
                        value={selectedStars}
                        onChange={setSelectedStars}
                        disabled={reviewSubmitting}
                      />
                    </div>
                    <textarea
                      id="review-comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={reviewSubmitting}
                      aria-label="Текст на отзива"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                      placeholder="Споделете впечатленията си…"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-slate-600">
                        Оценка: {selectedStars.toFixed(1)} / 5
                      </span>
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                      >
                        {reviewSubmitting ? "Изпращане…" : myReview ? "Обнови отзива" : "Изпрати отзив"}
                      </button>
                    </div>
                    {reviewError ? (
                      <p className="text-sm text-red-600" role="alert">
                        {reviewError}
                      </p>
                    ) : null}
                    {reviewSuccess ? (
                      <p className="text-sm text-emerald-700" role="status">
                        {reviewSuccess}
                      </p>
                    ) : null}
                  </form>
                </section>
              ) : null}

              {!isAuthenticated && !isOwnProfile ? (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-600">
                    <Link
                      to="/login"
                      state={{ from: location }}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Влезте, за да оставите отзив
                    </Link>
                  </p>
                </section>
              ) : null}

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">{reviewsHeading}</h2>

                {reviewsLoading ? (
                  <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                    Зареждане на отзивите…
                  </p>
                ) : null}
                {reviewsError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {reviewsError}
                  </p>
                ) : null}

                <ul className="space-y-3">
                  {reviews.length === 0 && !reviewsLoading && !reviewsError ? (
                    <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Все още няма отзиви.
                    </li>
                  ) : null}
                  {reviews.map((rev) => {
                    const stars = backendRatingToStars(rev.rating);
                    const initial = (rev.reviewerName || "?").trim().charAt(0).toUpperCase() || "?";
                    return (
                      <li
                        key={rev.id ?? `${rev.reviewerId}-${rev.createdAt}`}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="font-medium text-slate-900">{rev.reviewerName || "Анонимен"}</p>
                              {rev.createdAt ? (
                                <time className="text-xs text-slate-400" dateTime={rev.createdAt}>
                                  {formatDate(rev.createdAt)}
                                </time>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                              <StarRowReadonly value={stars} />
                              <span className="text-slate-600">{stars.toFixed(1)} / 5</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                              {rev.comment || "—"}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </aside>

            <section className="min-w-0 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {isOwnProfile ? "Моите обяви" : "Обяви на потребителя"}
              </h2>

              {adsLoading ? (
                <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm">
                  Зареждане на обяви…
                </p>
              ) : null}

              {adsError && !adsLoading ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {adsError}
                </p>
              ) : null}

              {!adsLoading && !adsError && profileAds.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
                  {isOwnProfile
                    ? "Все още нямате публикувани обяви."
                    : "Този потребител все още няма публикувани обяви."}
                </p>
              ) : null}

              {!adsLoading && !adsError && profileAds.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profileAds.map((ad) => {
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
                          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{ad.title || "—"}</h3>
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
                            {isOwnProfile ? (
                              <>
                                <Link
                                  to={`/ads/${ad.id}/edit`}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                                >
                                  Редактирай
                                </Link>
                                <button
                                  type="button"
                                  disabled={deletingAdId === ad.id}
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        "Сигурни ли сте, че искате да изтриете тази обява?",
                                      )
                                    ) {
                                      return;
                                    }
                                    setDeletingAdId(ad.id);
                                    try {
                                      await del(`/api/ads/${ad.id}`);
                                      setProfileAds((prev) => prev.filter((a) => a.id !== ad.id));
                                    } catch (err) {
                                      window.alert(
                                        errorMessage(err, "Неуспешно изтриване на обява."),
                                      );
                                    } finally {
                                      setDeletingAdId(null);
                                    }
                                  }}
                                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
                                >
                                  {deletingAdId === ad.id ? "…" : "Изтрий"}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </div>

        </>
      ) : null}
    </div>
  );
}
