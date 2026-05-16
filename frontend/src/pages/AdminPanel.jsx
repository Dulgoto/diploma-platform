import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { del, get, patch, put } from "../api/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const TYPE_LABELS = {
  PRODUCT_SALE: "Продавам стока",
  SERVICE_OFFER: "Предлагам услуга",
  SERVICE_REQUEST: "Търся услуга",
};

const STATUS_LABELS = {
  ACTIVE: "Активна",
  COMPLETED: "Изпълнена",
  INACTIVE: "Неактивна",
};

const APPROVAL_LABELS = {
  PENDING_APPROVAL: "Чака одобрение",
  APPROVED: "Одобрена",
  REJECTED: "Отхвърлена",
};

const ROLE_LABELS = {
  CLIENT: "Клиент",
  SERVICE_PROVIDER: "Доставчик",
  ADMIN: "Администратор",
};

function formatPriceEur(price) {
  if (price == null || Number.isNaN(Number(price))) {
    return "— €";
  }
  const n = Number(price);
  const formatted = n.toLocaleString("bg-BG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} €`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString("bg-BG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

function statusLabel(status) {
  return STATUS_LABELS[status] || "—";
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role || "—";
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type || "—";
}

function statusOptionsForType(type) {
  if (type === "SERVICE_REQUEST") {
    return ["ACTIVE", "COMPLETED"];
  }
  if (type === "SERVICE_OFFER" || type === "PRODUCT_SALE") {
    return ["ACTIVE", "INACTIVE"];
  }
  return [];
}

function statusBadgeClass(status) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "COMPLETED") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  if (status === "INACTIVE") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function approvalLabel(approvalStatus) {
  return APPROVAL_LABELS[approvalStatus] || "—";
}

function approvalBadgeClass(approvalStatus) {
  if (approvalStatus === "PENDING_APPROVAL") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (approvalStatus === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (approvalStatus === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function activeBadgeClass(active) {
  if (active === true) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (active === false) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

const TAB_BUTTON_CLASS = (active) =>
  [
    "rounded-lg px-4 py-2 text-sm font-medium transition",
    active
      ? "bg-emerald-600 text-white shadow-sm"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");

const FILTER_BUTTON_CLASS = (active) =>
  [
    "rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm sm:px-4 sm:py-2",
    active
      ? "bg-emerald-600 text-white shadow-sm"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");

const TABLE_ICON_BUTTON_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-semibold leading-none transition disabled:opacity-60";

function AdminAdsTab() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAdId, setBusyAdId] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState("PENDING_APPROVAL");
  const [rejectingAdId, setRejectingAdId] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [approvingAdId, setApprovingAdId] = useState(null);

  const fetchAds = useCallback(() => {
    setLoading(true);
    setError("");
    get("/api/admin/ads")
      .then((data) => setAds(Array.isArray(data) ? data : []))
      .catch(() => setError("Неуспешно зареждане на обявите."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  async function handleStatusChange(adId, nextStatus) {
    setBusyAdId(adId);
    try {
      const updated = await patch(`/api/admin/ads/${adId}/status`, {
        status: nextStatus,
      });
      setAds((prev) => prev.map((ad) => (ad.id === adId ? updated : ad)));
    } catch (err) {
      window.alert(errorMessage(err, "Неуспешна промяна на статуса."));
    } finally {
      setBusyAdId(null);
    }
  }

  async function handleDelete(adId) {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете тази обява?")) {
      return;
    }
    setBusyAdId(adId);
    try {
      await del(`/api/admin/ads/${adId}`);
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (err) {
      window.alert(errorMessage(err, "Неуспешно изтриване на обява."));
    } finally {
      setBusyAdId(null);
    }
  }

  async function handleApprovalChange(adId, nextApprovalStatus, message = "") {
    setBusyAdId(adId);
    try {
      const updated = await patch(`/api/admin/ads/${adId}/approval`, {
        approvalStatus: nextApprovalStatus,
        message,
      });
      setAds((prev) => prev.map((ad) => (ad.id === adId ? updated : ad)));
    } catch (err) {
      window.alert(errorMessage(err, "Неуспешна промяна на одобрението."));
    } finally {
      setBusyAdId(null);
    }
  }

  function handleReject(adId) {
    setRejectingAdId(adId);
    setRejectionMessage("");
  }

  function closeRejectModal() {
    setRejectingAdId(null);
    setRejectionMessage("");
  }

  async function confirmReject() {
    if (rejectingAdId == null) {
      return;
    }
    const message = rejectionMessage.trim() === "" ? "" : rejectionMessage.trim();
    await handleApprovalChange(rejectingAdId, "REJECTED", message);
    closeRejectModal();
  }

  function handleApprove(adId) {
    setApprovingAdId(adId);
  }

  function closeApproveModal() {
    setApprovingAdId(null);
  }

  async function confirmApprove() {
    if (approvingAdId == null) {
      return;
    }
    await handleApprovalChange(approvingAdId, "APPROVED");
    closeApproveModal();
  }

  const pendingCount = ads.filter(
    (ad) => ad.approvalStatus === "PENDING_APPROVAL",
  ).length;
  const approvedCount = ads.filter(
    (ad) => ad.approvalStatus === "APPROVED",
  ).length;
  const rejectedCount = ads.filter(
    (ad) => ad.approvalStatus === "REJECTED",
  ).length;

  const filteredAds = ads.filter((ad) => {
    if (approvalFilter === "ALL") {
      return true;
    }
    return ad.approvalStatus === approvalFilter;
  });

  const approvalOrder = {
    PENDING_APPROVAL: 0,
    REJECTED: 1,
    APPROVED: 2,
  };

  const displayedAds = [...filteredAds].sort((a, b) => {
    if (approvalFilter === "ALL") {
      const orderA = approvalOrder[a.approvalStatus] ?? 99;
      const orderB = approvalOrder[b.approvalStatus] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
      return dateB - dateA;
    }

    return Number(b.id ?? 0) - Number(a.id ?? 0);
  });

  if (loading) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
        Зареждане на обяви…
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
      >
        {error}
      </p>
    );
  }

  if (ads.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
        Няма обяви.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={FILTER_BUTTON_CLASS(approvalFilter === "PENDING_APPROVAL")}
          onClick={() => setApprovalFilter("PENDING_APPROVAL")}
        >
          Чакащи ({pendingCount})
        </button>
        <button
          type="button"
          className={FILTER_BUTTON_CLASS(approvalFilter === "APPROVED")}
          onClick={() => setApprovalFilter("APPROVED")}
        >
          Одобрени ({approvedCount})
        </button>
        <button
          type="button"
          className={FILTER_BUTTON_CLASS(approvalFilter === "REJECTED")}
          onClick={() => setApprovalFilter("REJECTED")}
        >
          Отхвърлени ({rejectedCount})
        </button>
        <button
          type="button"
          className={FILTER_BUTTON_CLASS(approvalFilter === "ALL")}
          onClick={() => setApprovalFilter("ALL")}
        >
          Всички ({ads.length})
        </button>
      </div>

      {filteredAds.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
          Няма обяви в избрания филтър.
        </p>
      ) : (
        <>
          <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[1180px] table-fixed divide-y divide-slate-200 text-left text-sm">
              <colgroup>
                <col className="w-14" />
                <col className="w-36" />
                <col className="w-40" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-32" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-28" />
                <col className="w-40" />
                <col className="w-40" />
              </colgroup>
              <thead className="bg-slate-50 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-center">ID</th>
                  <th className="px-4 py-3 text-center">Заглавие</th>
                  <th className="px-4 py-3 text-center">Тип</th>
                  <th className="px-4 py-3 text-center">Статус</th>
                  <th className="px-4 py-3 text-center">Одобрение</th>
                  <th className="px-4 py-3 text-center">Категория</th>
                  <th className="px-4 py-3 text-center">Цена</th>
                  <th className="px-4 py-3 text-center">Собственик</th>
                  <th className="px-4 py-3 text-center">Локация</th>
                  <th className="px-4 py-3 text-center">Създадена</th>
                  <th className="px-4 py-3 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedAds.map((ad) => {
                  const options = statusOptionsForType(ad.type);
                  const disabled = busyAdId === ad.id;
                  return (
                    <tr key={ad.id} className="text-slate-700">
                      <td className="px-4 py-3 font-mono text-xs">{ad.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 break-words">
                        {ad.title || "—"}
                      </td>
                      <td className="px-4 py-3">{typeLabel(ad.type)}</td>
                      <td className="px-4 py-3">
                        {options.length > 0 ? (
                          <select
                            value={ad.status || ""}
                            disabled={disabled}
                            onChange={(e) =>
                              handleStatusChange(ad.id, e.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                          >
                            {options.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(ad.status)}`}
                          >
                            {statusLabel(ad.status)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${approvalBadgeClass(ad.approvalStatus)}`}
                        >
                          {approvalLabel(ad.approvalStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 break-words">{ad.category || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-700">
                        {formatPriceEur(ad.price)}
                      </td>
                      <td className="px-4 py-3 break-words">{ad.ownerName || "—"}</td>
                      <td className="px-4 py-3 break-words">{ad.location || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(ad.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {ad.approvalStatus === "PENDING_APPROVAL" ? (
                          <div className="flex flex-col items-center gap-2">
                            <Link
                              to={`/ads/${ad.id}`}
                              className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Виж
                            </Link>

                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                disabled={disabled}
                                title="Одобри"
                                aria-label="Одобри"
                                onClick={() => handleApprove(ad.id)}
                                className={`${TABLE_ICON_BUTTON_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                              >
                                ✓
                              </button>

                              <button
                                type="button"
                                disabled={disabled}
                                title="Отхвърли"
                                aria-label="Отхвърли"
                                onClick={() => handleReject(ad.id)}
                                className={`${TABLE_ICON_BUTTON_CLASS} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Link
                              to={`/ads/${ad.id}`}
                              className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Виж
                            </Link>

                            {ad.approvalStatus === "REJECTED" ? (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleApprove(ad.id)}
                                className="w-24 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                              >
                                Одобри
                              </button>
                            ) : null}

                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => handleDelete(ad.id)}
                              className="w-24 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
                            >
                              Изтрий
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {displayedAds.map((ad) => {
              const options = statusOptionsForType(ad.type);
              const disabled = busyAdId === ad.id;
              return (
                <article
                  key={ad.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-slate-400">
                        #{ad.id}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900">
                        {ad.title || "—"}
                      </h3>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${approvalBadgeClass(ad.approvalStatus)}`}
                      >
                        {approvalLabel(ad.approvalStatus)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(ad.status)}`}
                      >
                        {statusLabel(ad.status)}
                      </span>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                    <div>
                      <dt className="text-slate-400">Тип</dt>
                      <dd className="font-medium text-slate-700">
                        {typeLabel(ad.type)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Цена</dt>
                      <dd className="font-medium text-emerald-700">
                        {formatPriceEur(ad.price)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Категория</dt>
                      <dd>{ad.category || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Собственик</dt>
                      <dd>{ad.ownerName || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Локация</dt>
                      <dd>{ad.location || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Създадена</dt>
                      <dd>{formatDate(ad.createdAt)}</dd>
                    </div>
                  </dl>
                  {options.length > 0 ? (
                    <label className="mt-3 block text-xs font-medium text-slate-600">
                      Статус
                      <select
                        value={ad.status || ""}
                        disabled={disabled}
                        onChange={(e) =>
                          handleStatusChange(ad.id, e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                      >
                        {options.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {ad.approvalStatus === "PENDING_APPROVAL" ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        to={`/ads/${ad.id}`}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Виж
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          title="Одобри"
                          aria-label="Одобри"
                          onClick={() => handleApprove(ad.id)}
                          className={`${TABLE_ICON_BUTTON_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          title="Отхвърли"
                          aria-label="Отхвърли"
                          onClick={() => handleReject(ad.id)}
                          className={`${TABLE_ICON_BUTTON_CLASS} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        to={`/ads/${ad.id}`}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Виж
                      </Link>
                      {ad.approvalStatus === "REJECTED" ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleApprove(ad.id)}
                          className="w-24 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Одобри
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDelete(ad.id)}
                        className="w-24 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
                      >
                        Изтрий
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {approvingAdId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-ad-title"
          onClick={() => {
            if (busyAdId !== approvingAdId) {
              closeApproveModal();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="approve-ad-title"
              className="text-base font-semibold text-slate-900"
            >
              Одобряване на обява
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Сигурни ли сте, че искате да одобрите тази обява?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busyAdId === approvingAdId}
                onClick={closeApproveModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Отказ
              </button>
              <button
                type="button"
                disabled={busyAdId === approvingAdId}
                onClick={() => {
                  void confirmApprove();
                }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
              >
                Одобри
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectingAdId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-ad-title"
          onClick={closeRejectModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="reject-ad-title"
              className="text-base font-semibold text-slate-900"
            >
              Отхвърляне на обява
            </h3>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Причина (по избор)
              <textarea
                rows={4}
                value={rejectionMessage}
                disabled={busyAdId === rejectingAdId}
                onChange={(e) => setRejectionMessage(e.target.value)}
                placeholder="Обявата не беше одобрена. Моля, направете корекция или цялостна промяна."
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busyAdId === rejectingAdId}
                onClick={closeRejectModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Отказ
              </button>
              <button
                type="button"
                disabled={busyAdId === rejectingAdId}
                onClick={() => {
                  void confirmReject();
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
              >
                Отхвърли
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError("");
    get("/api/admin/users")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError("Неуспешно зареждане на потребителите."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleBan(userId) {
    if (
      !window.confirm("Сигурни ли сте, че искате да блокирате този потребител?")
    ) {
      return;
    }
    setBusyUserId(userId);
    try {
      const updated = await put(`/api/admin/users/${userId}/ban`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      window.alert(errorMessage(err, "Неуспешно блокиране на потребител."));
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleUnban(userId) {
    setBusyUserId(userId);
    try {
      const updated = await put(`/api/admin/users/${userId}/unban`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      window.alert(errorMessage(err, "Неуспешно активиране на потребител."));
    } finally {
      setBusyUserId(null);
    }
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
        Зареждане на потребители…
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
      >
        {error}
      </p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
        Няма потребители.
      </p>
    );
  }

  const roleOrder = {
    CLIENT: 0,
    SERVICE_PROVIDER: 1,
    ADMIN: 2,
  };

  const displayedUsers = [...users].sort((a, b) => {
    const orderA = roleOrder[a.role] ?? 99;
    const orderB = roleOrder[b.role] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
      return dateB - dateA;
    }

    return Number(b.id ?? 0) - Number(a.id ?? 0);
  });

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Име</th>
              <th className="px-4 py-3">Имейл</th>
              <th className="px-4 py-3">Роля</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Локация</th>
              <th className="px-4 py-3">Регистрация</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedUsers.map((u) => {
              const disabled = busyUserId === u.id;
              const isAdmin = u.role === "ADMIN";
              return (
                <tr key={u.id} className="text-slate-700">
                  <td className="px-4 py-3 font-mono text-xs">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.name || "—"}
                  </td>
                  <td className="px-4 py-3">{u.email || "—"}</td>
                  <td className="px-4 py-3">{roleLabel(u.role)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${activeBadgeClass(u.active)}`}
                    >
                      {u.active ? "Активен" : "Блокиран"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.location || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        to={`/users/${u.id}`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Профил
                      </Link>
                      {isAdmin ? (
                        <span className="px-2 py-1 text-xs text-slate-500">
                          Администратор
                        </span>
                      ) : u.active ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleBan(u.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
                        >
                          Блокирай
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleUnban(u.id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Активирай
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {displayedUsers.map((u) => {
          const disabled = busyUserId === u.id;
          const isAdmin = u.role === "ADMIN";
          return (
            <article
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-400">#{u.id}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">
                    {u.name || "—"}
                  </h3>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${activeBadgeClass(u.active)}`}
                >
                  {u.active ? "Активен" : "Блокиран"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <dt className="text-slate-400">Роля</dt>
                  <dd className="font-medium">{roleLabel(u.role)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Локация</dt>
                  <dd>{u.location || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Регистрация</dt>
                  <dd>{formatDate(u.createdAt)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link
                  to={`/users/${u.id}`}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Профил
                </Link>
                {isAdmin ? (
                  <span className="px-2 py-1 text-xs text-slate-500">
                    Администратор
                  </span>
                ) : u.active ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleBan(u.id)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                  >
                    Блокирай
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleUnban(u.id)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    Активирай
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AdminReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    setError("");
    get("/api/admin/reviews")
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setError("Неуспешно зареждане на отзивите."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleDelete(reviewId) {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този отзив?")) {
      return;
    }
    setDeletingId(reviewId);
    try {
      await del(`/api/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      window.alert(errorMessage(err, "Неуспешно изтриване на отзив."));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
        Зареждане на отзиви…
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
      >
        {error}
      </p>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
        Няма отзиви.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((rev) => {
        const disabled = deletingId === rev.id;
        return (
          <article
            key={rev.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-400">#{rev.id}</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {rev.reviewerName || "—"}
                  <span className="font-normal text-slate-400">
                    {" "}
                    → потребител #{rev.reviewedUserId ?? "—"}
                  </span>
                </p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                {rev.rating != null ? `${rev.rating / 2} ★` : "—"}
              </span>
            </div>
            {rev.comment ? (
              <p className="mt-2 text-sm text-slate-600">{rev.comment}</p>
            ) : (
              <p className="mt-2 text-sm italic text-slate-400">Без коментар</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {formatDate(rev.createdAt)}
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleDelete(rev.id)}
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              {disabled ? "…" : "Изтрий"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default function AdminPanel() {
  const { user, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("ads");

  if (authLoading) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
        Зареждане…
      </p>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">Нямате достъп до админ панела.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Админ панел</h1>
        <p className="text-sm text-slate-500">
          Управление на потребители, обяви и отзиви.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={TAB_BUTTON_CLASS(activeTab === "ads")}
          onClick={() => setActiveTab("ads")}
        >
          Обяви
        </button>
        <button
          type="button"
          className={TAB_BUTTON_CLASS(activeTab === "users")}
          onClick={() => setActiveTab("users")}
        >
          Потребители
        </button>
        <button
          type="button"
          className={TAB_BUTTON_CLASS(activeTab === "reviews")}
          onClick={() => setActiveTab("reviews")}
        >
          Отзиви
        </button>
      </div>

      {activeTab === "ads" ? <AdminAdsTab /> : null}
      {activeTab === "users" ? <AdminUsersTab /> : null}
      {activeTab === "reviews" ? <AdminReviewsTab /> : null}
    </div>
  );
}
