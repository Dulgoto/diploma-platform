import { Link } from "react-router-dom";

const categories = ["Услуги", "Електроника", "Дом и градина", "Спорт", "Превозни средства"];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-800 p-6 text-white shadow-lg sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Намерете услуги и стоки наблизо
          </h1>
          <p className="mt-2 text-sm text-emerald-100 sm:text-base">
            Търсене по думи, категория и локация ще бъде свързано с бекенда в следваща стъпка.
          </p>
          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="sr-only" htmlFor="home-search">
              Търсене
            </label>
            <input
              id="home-search"
              type="search"
              placeholder="Какво търсите днес?"
              className="min-h-12 flex-1 rounded-xl border border-white/20 bg-white/95 px-4 text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-white px-6 text-sm font-semibold text-emerald-800 shadow-md hover:bg-emerald-50"
            >
              Търси
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Популярни категории</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 shadow-sm"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Последни обяви</h2>
            <p className="text-sm text-slate-500">
              Списъкът ще се попълни от API. Засега вижте оформлението на каталога.
            </p>
          </div>
          <Link
            to="/ads"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Към всички обяви
          </Link>
        </div>
      </section>
    </div>
  );
}
