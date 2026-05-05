import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "@/utils/constants";
import { filterGlobalSearchHits, type GlobalSearchHit } from "@/utils/globalSearchIndex";
import type { NavItemId } from "@/utils/constants";

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => filterGlobalSearchHits(query), [query]);
  const showPanel = open && query.trim().length > 0;

  const goTo = useCallback(
    (hit: GlobalSearchHit) => {
      navigate(hit.path);
      setQuery("");
      setOpen(false);
      setHighlighted(0);
    },
    [navigate],
  );

  useEffect(() => {
    if (!showPanel) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [showPanel]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) {
      if (e.key === "Enter" && query.trim().length > 0) {
        const first = filterGlobalSearchHits(query)[0];
        if (first) {
          e.preventDefault();
          goTo(first);
        }
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && hits.length > 0) {
      e.preventDefault();
      const hit = hits[Math.min(highlighted, hits.length - 1)];
      if (hit) goTo(hit);
    }
  };

  const iconFor = (navId: NavItemId) => NAV_ITEMS.find((n) => n.id === navId)?.icon ?? "•";

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-1 rounded-lg border border-mordobo-border bg-mordobo-bg focus-within:ring-2 focus-within:ring-mordobo-accent/50">
        <input
          type="search"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          placeholder={t("nav.searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="py-2 px-4 w-[280px] bg-transparent rounded-lg text-sm text-mordobo-text placeholder:text-mordobo-textMuted focus:outline-none"
        />
        {query.length > 0 && (
          <button
            type="button"
            className="mr-2 p-1 rounded text-mordobo-textMuted hover:text-mordobo-text hover:bg-mordobo-surfaceHover/80"
            aria-label={t("globalSearch.clear")}
            onClick={() => {
              setQuery("");
              setHighlighted(0);
            }}
          >
            ×
          </button>
        )}
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute right-0 top-full mt-1 w-[min(100vw-2rem,360px)] max-h-[min(70vh,320px)] overflow-y-auto rounded-xl border border-mordobo-border bg-mordobo-surface shadow-lg z-50 py-1"
        >
          {hits.length === 0 ? (
            <div className="px-4 py-3 text-sm text-mordobo-textMuted">{t("globalSearch.noResults")}</div>
          ) : (
            hits.map((hit, index) => (
              <button
                key={`${hit.path}-${hit.sectionKey ?? ""}`}
                type="button"
                role="option"
                aria-selected={index === highlighted}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  index === highlighted ? "bg-mordobo-accentDim text-mordobo-text" : "text-mordobo-text hover:bg-mordobo-bg"
                }`}
                onMouseEnter={() => setHighlighted(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goTo(hit)}
              >
                <span className="text-base shrink-0">{iconFor(hit.navId)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-mordobo-text">{t(`nav.${hit.navId}`)}</span>
                  {hit.sectionKey ? (
                    <span className="block text-xs text-mordobo-textMuted truncate">{t(hit.sectionKey)}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
