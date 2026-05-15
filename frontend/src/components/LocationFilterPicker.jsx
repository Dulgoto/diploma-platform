import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FIELD_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60";

const LIST_ITEM_CLASS =
  "w-full rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-emerald-50 hover:text-emerald-900";

const SELECTED_ITEM_CLASS = "bg-emerald-50 font-medium text-emerald-900";

export function getSettlementNamesForRegion(regions, regionName) {
  if (!Array.isArray(regions) || !regionName) {
    return new Set();
  }
  const trimmed = String(regionName).trim();
  if (!trimmed) {
    return new Set();
  }
  const found = regions.find((entry) => entry.region === trimmed);
  if (!found?.settlements) {
    return new Set();
  }
  return new Set(
    found.settlements
      .map((settlement) => settlement.name)
      .filter((name) => typeof name === "string" && name.trim() !== ""),
  );
}

function getTriggerLabel(selectedRegion, selectedLocation, loading) {
  if (loading) {
    return "Зареждане на локации…";
  }
  const location = selectedLocation?.trim();
  const region = selectedRegion?.trim();
  if (location) {
    return location;
  }
  if (region) {
    return region;
  }
  return "Цялата страна";
}

export default function LocationFilterPicker({
  selectedRegion = "",
  selectedLocation = "",
  onChange,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const regionValue = selectedRegion?.trim() ?? "";
  const locationValue = selectedLocation?.trim() ?? "";

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
    if (!activeRegion?.settlements) {
      return [];
    }
    const query = searchQuery.trim().toLocaleLowerCase("bg");
    if (!query) {
      return activeRegion.settlements;
    }
    return activeRegion.settlements.filter((settlement) =>
      settlement.name.toLocaleLowerCase("bg").includes(query),
    );
  }, [activeRegion, searchQuery]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveRegion(null);
    setSearchQuery("");
  }, []);

  function openMenu() {
    if (disabled || loading || error) {
      return;
    }
    setOpen(true);
    setActiveRegion(null);
    setSearchQuery("");
  }

  function handleSelectWholeCountry() {
    onChange?.({ region: "", location: "" });
    closeMenu();
  }

  function handleBrowseRegion(region) {
    setActiveRegion(region);
    setSearchQuery("");
  }

  function handleSelectWholeRegion() {
    if (!activeRegion?.region) {
      return;
    }
    onChange?.({ region: activeRegion.region, location: "" });
    closeMenu();
  }

  function handleSelectSettlement(settlement) {
    if (!activeRegion?.region) {
      return;
    }
    onChange?.({
      region: activeRegion.region,
      location: settlement.name,
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
    if (open && activeRegion && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, activeRegion]);

  const triggerLabel = getTriggerLabel(selectedRegion, selectedLocation, loading);
  const isWholeCountry = !regionValue && !locationValue;

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
        <span className={loading ? "text-slate-400" : "text-slate-900"}>
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

          {!loading && !error && !activeRegion ? (
            <div className="max-h-72 overflow-y-auto p-2">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Избери област
              </p>
              <button
                type="button"
                className={`${LIST_ITEM_CLASS} ${isWholeCountry ? SELECTED_ITEM_CLASS : ""}`}
                onClick={handleSelectWholeCountry}
              >
                Цялата страна
              </button>
              {regions.map((region) => {
                const isRegionOnly =
                  regionValue === region.region && !locationValue;

                return (
                  <button
                    key={region.region}
                    type="button"
                    className={`${LIST_ITEM_CLASS} ${isRegionOnly ? SELECTED_ITEM_CLASS : ""}`}
                    onClick={() => handleBrowseRegion(region)}
                  >
                    {region.region}
                  </button>
                );
              })}
            </div>
          ) : null}

          {!loading && !error && activeRegion ? (
            <div className="flex max-h-80 flex-col">
              <div className="border-b border-slate-100 p-2">
                <button
                  type="button"
                  className="mb-2 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    setActiveRegion(null);
                    setSearchQuery("");
                  }}
                >
                  ← Назад
                </button>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {activeRegion.region}
                </p>
                <label className="sr-only" htmlFor="location-filter-search">
                  Търси населено място
                </label>
                <input
                  ref={searchInputRef}
                  id="location-filter-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търси населено място…"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="max-h-56 overflow-y-auto p-2">
                <button
                  type="button"
                  className={`${LIST_ITEM_CLASS} ${
                    regionValue === activeRegion.region && !locationValue ? SELECTED_ITEM_CLASS : ""
                  }`}
                  onClick={handleSelectWholeRegion}
                >
                  Цялата област
                </button>
                {filteredSettlements.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-500">Няма намерени населени места.</p>
                ) : (
                  filteredSettlements.map((settlement) => {
                    const isSelected =
                      regionValue === activeRegion.region && locationValue === settlement.name;

                    return (
                      <button
                        key={`${settlement.name}-${settlement.latitude}-${settlement.longitude}`}
                        type="button"
                        className={`${LIST_ITEM_CLASS} ${isSelected ? SELECTED_ITEM_CLASS : ""}`}
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
