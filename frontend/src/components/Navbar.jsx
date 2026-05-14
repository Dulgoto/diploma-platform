import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-emerald-50 text-emerald-800"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

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

        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated ? (
            <>
              {user?.name && (
                <span className="hidden max-w-[8rem] truncate text-sm text-slate-500 md:inline">
                  {user.name}
                </span>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Изход
              </button>
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
