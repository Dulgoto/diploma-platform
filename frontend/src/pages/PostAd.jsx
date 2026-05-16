import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { post, uploadFile } from "../api/apiClient.js";
import { getCategoriesForAdType, isValidAdCategory } from "../constants/adCategories.js";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_IMAGES = 10;

function getAllowedAdTypes(role) {
  if (role === "CLIENT") {
    return [{ value: "SERVICE_REQUEST", label: "Търся услуга" }];
  }
  if (role === "SERVICE_PROVIDER") {
    return [
      { value: "SERVICE_OFFER", label: "Предлагам услуга" },
      { value: "PRODUCT_SALE", label: "Продавам стока" },
    ];
  }
  if (role === "ADMIN") {
    return [
      { value: "PRODUCT_SALE", label: "Продавам стока" },
      { value: "SERVICE_OFFER", label: "Предлагам услуга" },
      { value: "SERVICE_REQUEST", label: "Търся услуга" },
    ];
  }
  return [];
}

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

export default function PostAd() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [imageItems, setImageItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextIdRef = useRef(0);
  const imageItemsRef = useRef([]);
  imageItemsRef.current = imageItems;

  const allowedAdTypes = useMemo(() => getAllowedAdTypes(user?.role), [user?.role]);
  const availableCategories = useMemo(() => getCategoriesForAdType(type), [type]);

  useEffect(() => {
    if (category && !isValidAdCategory(category, type)) {
      setCategory("");
    }
  }, [category, type]);

  useEffect(() => {
    if (allowedAdTypes.length === 1) {
      const only = allowedAdTypes[0].value;
      if (!type || !allowedAdTypes.some((opt) => opt.value === type)) {
        setType(only);
      }
    }
  }, [allowedAdTypes, type]);

  useEffect(() => {
    return () => {
      imageItemsRef.current.forEach((item) => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  function addImageFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }
    setImageItems((prev) => {
      const next = [...prev];
      for (const file of files) {
        if (next.length >= MAX_IMAGES) {
          break;
        }
        nextIdRef.current += 1;
        const id = nextIdRef.current;
        next.push({
          id,
          file,
          url: URL.createObjectURL(file),
        });
      }
      return next;
    });
  }

  function removeImageAt(index) {
    setImageItems((prev) => {
      const row = prev[index];
      if (row?.url) {
        URL.revokeObjectURL(row.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Нова обява</h1>
        <p className="text-sm text-slate-500">Качете снимки, попълнете данните и публикувайте.</p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!authLoading && allowedAdTypes.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          Неуспешно определяне на позволените типове обяви. Моля, влезте отново.
        </p>
      ) : null}

      <form
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");

          const titleTrim = title.trim();
          if (!titleTrim) {
            setError("Моля, въведете заглавие.");
            return;
          }
          if (imageItems.length < 1) {
            setError("Изберете поне една снимка.");
            return;
          }
          if (imageItems.length > MAX_IMAGES) {
            setError("Максимум 10 снимки.");
            return;
          }
          const priceNum = Number(price);
          if (price === "" || Number.isNaN(priceNum) || priceNum < 0) {
            setError("Моля, въведете валидна цена (≥ 0).");
            return;
          }
          if (!type) {
            setError("Моля, изберете тип на обявата.");
            return;
          }
          if (!allowedAdTypes.some((opt) => opt.value === type)) {
            setError("Нямате право да публикувате този тип обява.");
            return;
          }
          if (!category || !isValidAdCategory(category, type)) {
            setError("Моля, изберете валидна категория.");
            return;
          }

          setLoading(true);
          let step = "upload";
          try {
            const imageKeys = [];
            for (const item of imageItems) {
              const res = await uploadFile("/api/uploads/ad-images", item.file);
              if (!res?.imageKey) {
                throw new Error("missing imageKey");
              }
              imageKeys.push(res.imageKey);
            }
            step = "create";
            const created = await post("/api/ads", {
              title: titleTrim,
              description: description.trim(),
              price: priceNum,
              type,
              category,
              keywords: keywords.trim(),
              imageKeys,
            });
            if (created?.id != null) {
              navigate(`/ads/${created.id}`, { replace: true });
            } else {
              setError("Неуспешно създаване на обява.");
            }
          } catch (err) {
            const fallback =
              step === "upload" ? "Неуспешно качване на снимка." : "Неуспешно създаване на обява.";
            setError(errorMessage(err, fallback));
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label htmlFor="ad-title" className="block text-sm font-medium text-slate-700">
            Заглавие <span className="text-red-500">*</span>
          </label>
          <input
            id="ad-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            placeholder="Кратко описание на обявата"
          />
        </div>

        <div>
          <label htmlFor="ad-desc" className="block text-sm font-medium text-slate-700">
            Описание
          </label>
          <textarea
            id="ad-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            placeholder="Подробности…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-type" className="block text-sm font-medium text-slate-700">
              Тип <span className="text-red-500">*</span>
            </label>
            {allowedAdTypes.length > 1 ? (
              <select
                id="ad-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                disabled={loading || authLoading}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              >
                <option value="" disabled>
                  Изберете тип
                </option>
                {allowedAdTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div
                id="ad-type"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                aria-readonly="true"
              >
                {allowedAdTypes[0]?.label || "—"}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="ad-category" className="block text-sm font-medium text-slate-700">
              Категория <span className="text-red-500">*</span>
            </label>
            <select
              id="ad-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading || !type}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            >
              <option value="" disabled>
                {!type ? "Първо изберете тип" : "Изберете категория"}
              </option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-price" className="block text-sm font-medium text-slate-700">
              Цена (€) <span className="text-red-500">*</span>
            </label>
            <input
              id="ad-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="ad-keywords" className="block text-sm font-medium text-slate-700">
              Ключови думи
            </label>
            <input
              id="ad-keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              placeholder="думи разделени с интервал"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ad-images" className="block text-sm font-medium text-slate-700">
            Снимки <span className="text-red-500">*</span>
            <span className="ml-2 font-normal text-slate-400">(1–10, само изображения)</span>
          </label>
          <input
            id="ad-images"
            type="file"
            accept="image/*"
            multiple
            disabled={loading || imageItems.length >= MAX_IMAGES}
            onChange={(e) => {
              addImageFiles(e.target.files);
              e.target.value = "";
            }}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-800 hover:file:bg-emerald-100 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-slate-500">
            Избрани: {imageItems.length} / {MAX_IMAGES}
          </p>

          {imageItems.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {imageItems.map((item, index) => (
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
                    disabled={loading}
                    onClick={() => removeImageAt(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white hover:bg-black/70 disabled:opacity-50"
                    aria-label="Премахни снимка"
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
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Публикуване…" : "Публикувай обява"}
        </button>
      </form>
    </div>
  );
}
