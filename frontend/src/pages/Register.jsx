import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post } from "../api/apiClient.js";

function errorMessage(err, fallback) {
  const m = err?.body?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}

const AVATAR_OPTIONS = [
  { value: "", label: "Без аватар" },
  { value: "avatar-1.png", label: "Аватар 1" },
  { value: "avatar-2.png", label: "Аватар 2" },
  { value: "avatar-3.png", label: "Аватар 3" },
  { value: "avatar-4.png", label: "Аватар 4" },
  { value: "avatar-5.png", label: "Аватар 5" },
];

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [description, setDescription] = useState("");
  const [avatarKey, setAvatarKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-bold text-slate-900">Регистрация</h1>
        <p className="mt-1 text-sm text-slate-500">Създайте профил за публикуване на обяви.</p>

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
              const payload = {
                name,
                email,
                password,
                confirmPassword,
              };
              const loc = locationVal.trim();
              if (loc) {
                payload.location = loc;
              }
              const desc = description.trim();
              if (desc) {
                payload.description = desc;
              }
              if (avatarKey) {
                payload.avatarKey = avatarKey;
              }
              await post("/api/auth/register", payload);
              navigate("/login", { replace: true, state: { registered: true } });
            } catch (err) {
              setError(errorMessage(err, "Неуспешна регистрация."));
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
              Име
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
              Имейл
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
              Парола
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-500">
              Минимум 8 символа, главна буква, цифра и специален символ.
            </p>
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700">
              Потвърди парола
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="reg-location" className="block text-sm font-medium text-slate-700">
              Локация <span className="font-normal text-slate-400">(по избор)</span>
            </label>
            <input
              id="reg-location"
              type="text"
              value={locationVal}
              onChange={(e) => setLocationVal(e.target.value)}
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="reg-desc" className="block text-sm font-medium text-slate-700">
              Описание <span className="font-normal text-slate-400">(по избор)</span>
            </label>
            <textarea
              id="reg-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="reg-avatar" className="block text-sm font-medium text-slate-700">
              Аватар <span className="font-normal text-slate-400">(по избор)</span>
            </label>
            <select
              id="reg-avatar"
              value={avatarKey}
              onChange={(e) => setAvatarKey(e.target.value)}
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            >
              {AVATAR_OPTIONS.map((opt) => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Регистрация…" : "Създай профил"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Вече имате профил?{" "}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Вход
          </Link>
        </p>
      </div>
    </div>
  );
}
