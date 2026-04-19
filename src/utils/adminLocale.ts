import type { TFunction } from "i18next";
import type { ServiceCatalogCategory } from "@/types";

/** Normalize API enum strings: UPPER_SNAKE, lower, spaces → underscored key. */
export function normalizeEnumKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
}

export function prefersSpanishLanguage(language: string | undefined): boolean {
  return (language ?? "").toLowerCase().startsWith("es");
}

/**
 * Stable key from a human-readable category/subcategory label (for i18n lookup).
 * Not used for API status enums — use {@link normalizeEnumKey} for those.
 */
export function slugifyCatalogLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\//g, " ")
    .replace(/&/g, "and")
    .replace(/,/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Pick EN/ES catalog label for filters and tables (matches Services & Categories). */
export function localizedCatalogName(
  item: { name?: string | null; name_en?: string | null; name_es?: string | null },
  preferEs: boolean
): string {
  const en = item.name_en?.trim();
  const es = item.name_es?.trim();
  const fallback = item.name?.trim();
  if (preferEs) {
    return es || en || fallback || "";
  }
  return en || es || fallback || "";
}

type CatalogNamed = {
  name?: string | null;
  name_en?: string | null;
  name_es?: string | null;
  name_key?: string | null;
};

/** Resolve catalog row / filter label using DB EN/ES fields plus `catalog.names.*` fallbacks. */
export function catalogItemDisplayName(t: TFunction, item: CatalogNamed, preferEs: boolean): string {
  const fromFields = localizedCatalogName(item, preferEs);
  const keysToTry: string[] = [];
  const nk = item.name_key?.trim();
  if (nk) keysToTry.push(`catalog.names.${nk}`);
  const fromEnOrName = slugifyCatalogLabel(item.name_en?.trim() || item.name?.trim() || "");
  if (fromEnOrName) keysToTry.push(`catalog.names.${fromEnOrName}`);
  const fromDisplay = slugifyCatalogLabel(fromFields);
  if (fromDisplay) {
    const k = `catalog.names.${fromDisplay}`;
    if (!keysToTry.includes(k)) keysToTry.push(k);
  }
  for (const key of keysToTry) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return fromFields;
}

/** Translate a freeform English (or mixed) category string from API when not in the tree. */
export function translateFreeformCatalogName(t: TFunction, raw: string | null | undefined): string {
  const s = raw?.trim();
  if (!s || s === "—" || s === "-") return "—";
  const nk = slugifyCatalogLabel(s);
  if (!nk) return s;
  const key = `catalog.names.${nk}`;
  const translated = t(key);
  return translated !== key ? translated : s;
}

export function buildCategoryLookup(
  categories: ServiceCatalogCategory[],
  preferEs: boolean,
  t: TFunction
) {
  const parentLabelById = new Map<string, string>();
  const subLabelById = new Map<string, string>();
  const parentIdBySubId = new Map<string, string>();

  for (const c of categories) {
    if (!c?.id) continue;
    const pid = String(c.id);
    const pl = catalogItemDisplayName(t, c, preferEs);
    parentLabelById.set(pid, pl || pid);
    for (const s of c.subcategories ?? []) {
      if (!s?.id) continue;
      const sid = String(s.id);
      subLabelById.set(sid, catalogItemDisplayName(t, s, preferEs) || sid);
      parentIdBySubId.set(sid, pid);
    }
  }

  function rowCategoryDisplay(
    serviceCategoryId: string | null | undefined,
    fallbackParent: string | null | undefined,
    fallbackSub: string | null | undefined
  ): { parent: string; sub: string } {
    if (!serviceCategoryId) {
      return {
        parent: translateFreeformCatalogName(t, fallbackParent),
        sub: translateFreeformCatalogName(t, fallbackSub),
      };
    }
    const sid = String(serviceCategoryId);
    if (subLabelById.has(sid)) {
      const parentId = parentIdBySubId.get(sid);
      const parent =
        parentId != null
          ? parentLabelById.get(parentId) ?? translateFreeformCatalogName(t, fallbackParent)
          : translateFreeformCatalogName(t, fallbackParent);
      const sub = subLabelById.get(sid) ?? translateFreeformCatalogName(t, fallbackSub);
      return { parent, sub };
    }
    if (parentLabelById.has(sid)) {
      return {
        parent: parentLabelById.get(sid) ?? translateFreeformCatalogName(t, fallbackParent),
        sub: translateFreeformCatalogName(t, fallbackSub),
      };
    }
    return {
      parent: translateFreeformCatalogName(t, fallbackParent),
      sub: translateFreeformCatalogName(t, fallbackSub),
    };
  }

  return { rowCategoryDisplay };
}
