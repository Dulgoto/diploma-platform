import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { put, uploadFile } from "../api/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-emerald-50 text-emerald-800"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

const dropdownLinkClass =
  "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900";

const PRESET_AVATAR_OPTIONS = [
  { key: null, label: "Стандартен" },
  { key: "avatar-1.png", label: "Аватар 1" },
  { key: "avatar-2.png", label: "Аватар 2" },
  { key: "avatar-3.png", label: "Аватар 3" },
  { key: "avatar-4.png", label: "Аватар 4" },
];

function avatarUrl(key) {
  if (!key || !key.trim()) {
    return "";
  }
  const trimmed = key.trim();
  if (trimmed.startsWith("avatars/")) {
    return `/uploads/${trimmed}`;
  }
  if (trimmed.startsWith("avatar-") && trimmed.endsWith(".png")) {
    return `/avatars/${trimmed}`;
  }
  return "";
}

function isImageAvatar(key) {
  return typeof key === "string" && key.trim().length > 0 && avatarUrl(key) !== "";
}

function presetAvatarKeyFromUser(key) {
  if (!key || !key.trim()) {
    return null;
  }
  const trimmed = key.trim();
  if (trimmed.startsWith("avatars/")) {
    return null;
  }
  if (trimmed.startsWith("avatar-") && trimmed.endsWith(".png")) {
    return trimmed;
  }
  return null;
}

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

function avatarOptionClass(selected, variant = "default") {
  return [
    "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-100 transition",
    selected
      ? "border-emerald-500 ring-2 ring-emerald-100"
      : variant === "pending"
        ? "border-amber-300 ring-2 ring-amber-100"
        : "border-slate-200 hover:border-emerald-200",
  ].join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user, refreshAccount } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSelectionChanged, setAvatarSelectionChanged] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const dropdownRef = useRef(null);
  const avatarDropdownRef = useRef(null);
  const avatarFileInputRef = useRef(null);

  const displayName = user?.name?.trim() ? user.name.trim() : "Профил";
  const avatarLetter =
    user?.name && user.name.trim() ? user.name.trim().charAt(0).toUpperCase() : "?";
  const pendingAvatarRequest =
    user?.pendingAvatarRequest?.status === "PENDING_APPROVAL"
      ? user.pendingAvatarRequest
      : null;

  useEffect(() => {
    if (!isDropdownOpen && !isAvatarMenuOpen) {
      return undefined;
    }

    function handleOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target)) {
        setIsAvatarMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isDropdownOpen, isAvatarMenuOpen]);

  function closeUserDropdown() {
    setIsDropdownOpen(false);
  }

  function closeAvatarMenu() {
    setIsAvatarMenuOpen(false);
    setAvatarError("");
  }

  function toggleUserDropdown() {
    setIsAvatarMenuOpen(false);
    setIsDropdownOpen((open) => !open);
  }

  function toggleAvatarMenu() {
    setIsDropdownOpen(false);
    setIsAvatarMenuOpen((open) => {
      if (!open) {
        setSelectedAvatarKey(presetAvatarKeyFromUser(user?.avatarKey));
        setAvatarSelectionChanged(false);
        setAvatarError("");
      }
      return !open;
    });
  }

  function handleLogout() {
    closeUserDropdown();
    closeAvatarMenu();
    logout();
    navigate("/");
  }

  function handleCustomAvatarClick() {
    avatarFileInputRef.current?.click();
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setAvatarUploading(true);
    setAvatarError("");
    try {
      await uploadFile("/api/uploads/avatar", file);
      if (refreshAccount) {
        await refreshAccount();
      }
      setAvatarSelectionChanged(false);
    } catch (err) {
      setAvatarError(errorMessage(err, "Неуспешно качване на аватара."));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveAvatar() {
    if (!user || !avatarSelectionChanged) {
      return;
    }
    setAvatarSaving(true);
    setAvatarError("");
    try {
      await put("/api/users/account", {
        name: user.name ?? "",
        location: user.location ?? "",
        latitude: user.latitude ?? null,
        longitude: user.longitude ?? null,
        description: user.description ?? "",
        avatarKey: selectedAvatarKey,
      });
      if (refreshAccount) {
        await refreshAccount();
      }
      setAvatarSelectionChanged(false);
      closeAvatarMenu();
    } catch (err) {
      setAvatarError(errorMessage(err, "Неуспешно запазване на аватара."));
    } finally {
      setAvatarSaving(false);
    }
  }

  const avatarBusy = avatarSaving || avatarUploading;
  const saveAvatarDisabled = avatarBusy || !avatarSelectionChanged;

  return (
    <header className="sticky top-0 z-[1100] border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm text-white shadow-sm">
            О
          </span>
          <span className="hidden sm:inline">Обяви плюс</span>
        </Link>

        <nav className="flex flex-1 items-center justify-end gap-1 sm:justify-center sm:gap-2">
          <NavLink to="/" end className={linkClass}>
            Начало
          </NavLink>
          <NavLink to="/ads" className={linkClass}>
            Обяви
          </NavLink>
          <NavLink to="/post-ad" className={linkClass}>
            Публикувай
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {isAuthenticated ? (
            <>
              <Link
                to="/favorites"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-lg text-rose-600 shadow-sm transition hover:bg-rose-100 hover:text-rose-700"
                title="Любими"
                aria-label="Любими"
              >
                ♥
              </Link>

              <div ref={avatarDropdownRef} className="relative z-[1100]">
                <button
                  type="button"
                  onClick={toggleAvatarMenu}
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                  title="Избор на аватар"
                  aria-label="Избор на аватар"
                  aria-haspopup="menu"
                  aria-expanded={isAvatarMenuOpen}
                >
                  {isImageAvatar(user?.avatarKey) ? (
                    <img
                      src={avatarUrl(user.avatarKey)}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </button>

                {isAvatarMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[1200] mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">Избери аватар</h3>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {PRESET_AVATAR_OPTIONS.map((option) => {
                        const selected = selectedAvatarKey === option.key;
                        return (
                          <button
                            key={option.key ?? "default"}
                            type="button"
                            disabled={avatarBusy}
                            onClick={() => {
                              setSelectedAvatarKey(option.key);
                              setAvatarSelectionChanged(true);
                            }}
                            className="flex flex-col items-center gap-1.5 disabled:opacity-60"
                            aria-label={option.label}
                            aria-pressed={selected}
                          >
                            <span className={avatarOptionClass(selected)}>
                              {option.key ? (
                                <img
                                  src={avatarUrl(option.key)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-slate-600">
                                  {avatarLetter}
                                </span>
                              )}
                            </span>
                            <span className="text-center text-[10px] leading-tight text-slate-600">
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={avatarBusy}
                        onClick={handleCustomAvatarClick}
                        className="flex flex-col items-center gap-1.5 disabled:opacity-60"
                        aria-label="Качи снимка"
                      >
                        <span
                          className={avatarOptionClass(
                            false,
                            pendingAvatarRequest ? "pending" : "default",
                          )}
                        >
                          {pendingAvatarRequest?.imageKey ? (
                            <img
                              src={avatarUrl(pendingAvatarRequest.imageKey)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : avatarUploading ? (
                            <span className="text-[10px] font-medium text-slate-500">…</span>
                          ) : (
                            <span className="text-lg text-slate-500" aria-hidden>
                              📷
                            </span>
                          )}
                        </span>
                        <span className="text-center text-[10px] leading-tight text-slate-600">
                          {avatarUploading
                            ? "Качване…"
                            : pendingAvatarRequest
                              ? "Изчаква одобрение"
                              : "Качи снимка"}
                        </span>
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saveAvatarDisabled}
                        onClick={handleSaveAvatar}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {avatarSaving ? "Запазване…" : "Запази"}
                      </button>
                      <button
                        type="button"
                        disabled={avatarBusy}
                        onClick={closeAvatarMenu}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Отказ
                      </button>
                    </div>

                    {avatarError ? (
                      <p className="mt-3 text-sm text-red-600" role="alert">
                        {avatarError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div ref={dropdownRef} className="relative z-[1100]">
                <button
                  type="button"
                  onClick={toggleUserDropdown}
                  className="hidden max-w-[8rem] items-center gap-1 truncate rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-emerald-700 md:inline-flex"
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                  aria-label="Потребителско меню"
                >
                  <span className="truncate">{displayName}</span>
                  <span className="shrink-0 text-[10px] leading-none text-slate-400" aria-hidden>
                    ▼
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleUserDropdown}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-emerald-700 md:hidden"
                  title="Потребителско меню"
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                  aria-label="Потребителско меню"
                >
                  <span aria-hidden>▼</span>
                </button>

                {isDropdownOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[1200] mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg"
                  >
                    {user?.id != null ? (
                      <Link
                        to={`/users/${user.id}`}
                        role="menuitem"
                        className={dropdownLinkClass}
                        onClick={closeUserDropdown}
                      >
                        Моят профил
                      </Link>
                    ) : null}
                    <Link
                      to="/my-ads"
                      role="menuitem"
                      className={dropdownLinkClass}
                      onClick={closeUserDropdown}
                    >
                      Моите обяви
                    </Link>
                    <Link
                      to="/post-ad"
                      role="menuitem"
                      className={dropdownLinkClass}
                      onClick={closeUserDropdown}
                    >
                      Публикувай обява
                    </Link>
                    {user?.role === "ADMIN" ? (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className={dropdownLinkClass}
                        onClick={closeUserDropdown}
                      >
                        Админ панел
                      </Link>
                    ) : null}
                    <div className="my-2 border-t border-slate-100" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Изход
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
