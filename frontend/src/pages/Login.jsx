import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { get, post } from "../api/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-bold text-slate-900">Вход</h1>
        <p className="mt-1 text-sm text-slate-500">Влезте с имейл и парола.</p>

        {location.state?.registered ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Регистрацията е успешна. Можете да влезете.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const authRes = await post("/api/auth/login", { email, password });
              login(authRes.token, null);
              const account = await get("/api/users/account");
              login(authRes.token, account);
              navigate("/", { replace: true });
            } catch (err) {
              setError(errorMessage(err, "Неуспешен вход."));
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
              Имейл
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Парола
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Влизане…" : "Вход"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Нямате профил?{" "}
          <Link to="/register" className="font-medium text-emerald-700 hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
