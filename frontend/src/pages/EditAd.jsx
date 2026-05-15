import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, put, uploadFile } from "../api/apiClient.js";
import { getImageUrl } from "../utils/imageUtils.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AD_CATEGORIES, isValidAdCategory, resolveAdCategory } from "../constants/adCategories.js";

const AD_TYPES = [
  { value: "PRODUCT_SALE", label: "Продавам стока" },
  { value: "SERVICE_OFFER", label: "Предлагам услуга" },
  { value: "SERVICE_REQUEST", label: "Търся услуга" },
];

const MAX_IMAGES = 10;

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

export default function EditAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const userRef = useRef(user);
  userRef.current = user;

  const [loadError, setLoadError] = useState("");
  const [loadingAd, setLoadingAd] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("PRODUCT_SALE");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImageItems, setNewImageItems] = useState([]);

  const existingImagesCountRef = useRef(0);
  existingImagesCountRef.current = existingImages.length;

  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const nextIdRef = useRef(0);
  const newImageItemsRef = useRef([]);
  newImageItemsRef.current = newImageItems;

  useEffect(() => {
    return () => {
      newImageItemsRef.current.forEach((item) => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setLoadError("Липсва идентификатор на обява.");
      setLoadingAd(false);
      return undefined;
    }

    if (authLoading) {
      return undefined;
    }

    let cancelled = false;
    setLoadingAd(true);
    setLoadError("");

    get(`/api/ads/${id}`)
      .then((ad) => {
        if (cancelled) {
          return;
        }
        const u = userRef.current;
        if (u?.id != null && ad.ownerId != null && ad.ownerId !== u.id) {
          setLoadError("Можете да редактирате само собствените си обяви.");
          return;
        }
        setTitle(ad.title ?? "");
        setDescription(ad.description ?? "");
        setPrice(ad.price != null ? String(ad.price) : "");
        setType(ad.type ?? "PRODUCT_SALE");
        setCategory(resolveAdCategory(ad.category));
        setKeywords(ad.keywords ?? "");
        const sorted = [...(ad.images || [])].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
        );
        setExistingImages(
          sorted.map((img, idx) => ({
            rowKey: `ex-${img.id ?? img.imageKey ?? idx}`,
            imageKey: img.imageKey,
            id: img.id,
          })),
        );
        setNewImageItems([]);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err.status === 404) {
          setLoadError("Обявата не е намерена.");
        } else if (err.status === 403) {
          setLoadError("Нямате достъп до тази обява.");
        } else {
          setLoadError("Неуспешно зареждане на обявата.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAd(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, authLoading]);

  const totalImages = existingImages.length + newImageItems.length;

  function addImageFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }
    setNewImageItems((prev) => {
      const next = [...prev];
      const room = MAX_IMAGES - existingImagesCountRef.current - next.length;
      let added = 0;
      for (const file of files) {
        if (added >= room) {
          break;
        }
        nextIdRef.current += 1;
        const nid = nextIdRef.current;
        next.push({
          id: nid,
          file,
          url: URL.createObjectURL(file),
        });
        added += 1;
      }
      return next;
    });
  }

  function removeNewAt(index) {
    setNewImageItems((prev) => {
      const row = prev[index];
      if (row?.url) {
        URL.revokeObjectURL(row.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeExistingAt(index) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  if (loadingAd) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
          Зареждане на обявата…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/my-ads" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Към моите обяви
        </Link>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/ads/${id}`} className="text-sm font-medium text-emerald-700 hover:underline">
          ← Към обявата
        </Link>
        <Link to="/my-ads" className="text-sm font-medium text-slate-600 hover:underline">
          Моите обяви
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Редактиране на обява</h1>
        <p className="text-sm text-slate-500">Обновете данните и снимките (общо 1–10).</p>
      </div>

      {submitError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <form
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitError("");

          const titleTrim = title.trim();
          if (!titleTrim) {
            setSubmitError("Моля, въведете заглавие.");
            return;
          }
          const priceNum = Number(price);
          if (price === "" || Number.isNaN(priceNum) || priceNum < 0) {
            setSubmitError("Моля, въведете валидна цена (≥ 0).");
            return;
          }
          if (!type) {
            setSubmitError("Изберете тип на обявата.");
            return;
          }
          if (!category || !isValidAdCategory(category)) {
            setSubmitError("Моля, изберете валидна категория.");
            return;
          }
          const total = existingImages.length + newImageItems.length;
          if (total < 1) {
            setSubmitError("Трябва да има поне една снимка.");
            return;
          }
          if (total > MAX_IMAGES) {
            setSubmitError("Максимум 10 снимки.");
            return;
          }

          setSaving(true);
          let step = "upload";
          try {
            const existingKeys = existingImages.map((img) => img.imageKey);
            const uploadedKeys = [];
            for (const item of newImageItems) {
              const res = await uploadFile("/api/uploads/ad-images", item.file);
              if (!res?.imageKey) {
                throw new Error("missing imageKey");
              }
              uploadedKeys.push(res.imageKey);
            }
            const imageKeys = [...existingKeys, ...uploadedKeys];
            step = "save";
            const updated = await put(`/api/ads/${id}`, {
              title: titleTrim,
              description: description.trim(),
              price: priceNum,
              type,
              category,
              keywords: keywords.trim(),
              imageKeys,
            });
            navigate(`/ads/${updated?.id ?? id}`, { replace: true });
          } catch (err) {
            const fallback =
              step === "upload" ? "Неуспешно качване на снимка." : "Неуспешно обновяване на обява.";
            setSubmitError(errorMessage(err, fallback));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700">
            Заглавие <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="edit-desc" className="block text-sm font-medium text-slate-700">
            Описание
          </label>
          <textarea
            id="edit-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-price" className="block text-sm font-medium text-slate-700">
              Цена (€) <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="edit-type" className="block text-sm font-medium text-slate-700">
              Тип <span className="text-red-500">*</span>
            </label>
            <select
              id="edit-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            >
              {AD_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-slate-700">
              Категория <span className="text-red-500">*</span>
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            >
              {AD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-keywords" className="block text-sm font-medium text-slate-700">
              Ключови думи
            </label>
            <input
              id="edit-keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            Снимки <span className="text-red-500">*</span>
            <span className="ml-2 font-normal text-slate-400">
              (общо {totalImages} / {MAX_IMAGES}, поне 1)
            </span>
          </p>

          {existingImages.length > 0 ? (
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {existingImages.map((img, index) => {
                const url = img.imageKey ? getImageUrl(img.imageKey) : "";
                return (
                  <li
                    key={img.rowKey}
                    className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm"
                  >
                    <div className="aspect-square">
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">—</div>
                      )}
                    </div>
                    <p className="truncate px-1.5 py-1 text-[10px] text-slate-600" title={img.imageKey}>
                      {img.imageKey}
                    </p>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeExistingAt(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white hover:bg-black/70 disabled:opacity-50"
                      aria-label="Премахни снимка"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <label htmlFor="edit-new-images" className="mt-3 block text-sm font-medium text-slate-700">
            Добави нови снимки
          </label>
          <input
            id="edit-new-images"
            type="file"
            accept="image/*"
            multiple
            disabled={saving || totalImages >= MAX_IMAGES}
            onChange={(e) => {
              addImageFiles(e.target.files);
              e.target.value = "";
            }}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-800 hover:file:bg-emerald-100 disabled:opacity-60"
          />

          {newImageItems.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {newImageItems.map((item, index) => (
                <li
                  key={item.id}
                  className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm"
                >
                  <div className="aspect-square">
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <p className="truncate px-1.5 py-1 text-[10px] text-slate-600" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => removeNewAt(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white hover:bg-black/70 disabled:opacity-50"
                    aria-label="Премахни нова снимка"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Запазване…" : "Запази промените"}
        </button>
      </form>
    </div>
  );
}
