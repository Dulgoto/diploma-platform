import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
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

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user?.name?.trim() ? user.name.trim() : "Профил";
  const avatarLetter =
    user?.name && user.name.trim() ? user.name.trim().charAt(0).toUpperCase() : "?";

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    function handleOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isDropdownOpen]);

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  function toggleDropdown() {
    setIsDropdownOpen((open) => !open);
  }

  function handleLogout() {
    closeDropdown();
    logout();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur">
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

              {user?.id != null ? (
                <Link
                  to={`/users/${user.id}`}
                  onClick={closeDropdown}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                  title={user?.name || "Профил"}
                >
                  {avatarLetter}
                </Link>
              ) : (
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 shadow-sm"
                  aria-hidden
                >
                  ?
                </span>
              )}

              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown}
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
                  onClick={toggleDropdown}
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
                    className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg"
                  >
                    {user?.id != null ? (
                      <Link
                        to={`/users/${user.id}`}
                        role="menuitem"
                        className={dropdownLinkClass}
                        onClick={closeDropdown}
                      >
                        Моят профил
                      </Link>
                    ) : null}
                    <Link
                      to="/my-ads"
                      role="menuitem"
                      className={dropdownLinkClass}
                      onClick={closeDropdown}
                    >
                      Моите обяви
                    </Link>
                    <Link
                      to="/favorites"
                      role="menuitem"
                      className={dropdownLinkClass}
                      onClick={closeDropdown}
                    >
                      Любими
                    </Link>
                    <Link
                      to="/post-ad"
                      role="menuitem"
                      className={dropdownLinkClass}
                      onClick={closeDropdown}
                    >
                      Публикувай обява
                    </Link>
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
