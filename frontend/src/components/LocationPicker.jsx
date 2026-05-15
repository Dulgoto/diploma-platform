import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FIELD_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60";

const LIST_ITEM_CLASS =
  "w-full rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-emerald-50 hover:text-emerald-900";

export default function LocationPicker({
  value = "",
  latitude,
  longitude,
  onChange,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/data/bg-locations.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load locations");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setRegions(Array.isArray(data) ? data : []);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRegions([]);
          setError("Неуспешно зареждане на локациите.");
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
  }, []);

  const filteredSettlements = useMemo(() => {
    if (!selectedRegion?.settlements) {
      return [];
    }
    const query = searchQuery.trim().toLocaleLowerCase("bg");
    if (!query) {
      return selectedRegion.settlements;
    }
    return selectedRegion.settlements.filter((settlement) =>
      settlement.name.toLocaleLowerCase("bg").includes(query),
    );
  }, [selectedRegion, searchQuery]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setSelectedRegion(null);
    setSearchQuery("");
  }, []);

  function openMenu() {
    if (disabled || loading || error) {
      return;
    }
    setOpen(true);
    setSelectedRegion(null);
    setSearchQuery("");
  }

  function handleSelectRegion(region) {
    setSelectedRegion(region);
    setSearchQuery("");
  }

  function handleSelectSettlement(settlement) {
    onChange?.({
      location: settlement.name,
      latitude: settlement.latitude,
      longitude: settlement.longitude,
    });
    closeMenu();
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        closeMenu();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    if (open && selectedRegion && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, selectedRegion]);

  const displayValue = value?.trim() ? value.trim() : null;
  const triggerLabel = loading
    ? "Зареждане на локации…"
    : displayValue ?? "Изберете населено място";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        disabled={disabled || loading || Boolean(error)}
        className={`${FIELD_CLASS} ${open ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={displayValue && !loading ? "text-slate-900" : "text-slate-400"}>
          {triggerLabel}
        </span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {error && !loading ? (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          {loading ? (
            <p className="px-3 py-4 text-sm text-slate-600">Зареждане на локации…</p>
          ) : null}

          {error && !loading ? (
            <p className="px-3 py-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && !error && !selectedRegion ? (
            <div className="max-h-72 overflow-y-auto p-2">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Избери област
              </p>
              {regions.map((region) => (
                <button
                  key={region.region}
                  type="button"
                  className={LIST_ITEM_CLASS}
                  onClick={() => handleSelectRegion(region)}
                >
                  {region.region}
                </button>
              ))}
            </div>
          ) : null}

          {!loading && !error && selectedRegion ? (
            <div className="flex max-h-80 flex-col">
              <div className="border-b border-slate-100 p-2">
                <button
                  type="button"
                  className="mb-2 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    setSelectedRegion(null);
                    setSearchQuery("");
                  }}
                >
                  ← Назад
                </button>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {selectedRegion.region}
                </p>
                <label className="sr-only" htmlFor="location-picker-search">
                  Търси населено място
                </label>
                <input
                  ref={searchInputRef}
                  id="location-picker-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търси населено място…"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="max-h-56 overflow-y-auto p-2">
                {filteredSettlements.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-500">Няма намерени населени места.</p>
                ) : (
                  filteredSettlements.map((settlement) => {
                    const isSelected =
                      displayValue === settlement.name &&
                      Number(latitude) === Number(settlement.latitude) &&
                      Number(longitude) === Number(settlement.longitude);

                    return (
                      <button
                        key={`${settlement.name}-${settlement.latitude}-${settlement.longitude}`}
                        type="button"
                        className={`${LIST_ITEM_CLASS} ${isSelected ? "bg-emerald-50 font-medium text-emerald-900" : ""}`}
                        onClick={() => handleSelectSettlement(settlement)}
                      >
                        <span>{settlement.name}</span>
                        {settlement.type ? (
                          <span className="ml-2 text-xs text-slate-500">{settlement.type}</span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
