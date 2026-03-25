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

export function buildCategoryLookup(categories: ServiceCatalogCategory[], preferEs: boolean) {
  const parentLabelById = new Map<string, string>();
  const subLabelById = new Map<string, string>();
  const parentIdBySubId = new Map<string, string>();

  for (const c of categories) {
    if (!c?.id) continue;
    const pid = String(c.id);
    const pl = localizedCatalogName(c, preferEs);
    parentLabelById.set(pid, pl || pid);
    for (const s of c.subcategories ?? []) {
      if (!s?.id) continue;
      const sid = String(s.id);
      subLabelById.set(sid, localizedCatalogName(s, preferEs) || sid);
      parentIdBySubId.set(sid, pid);
    }
  }

  function rowCategoryDisplay(
    serviceCategoryId: string | null | undefined,
    fallbackParent: string | null | undefined,
    fallbackSub: string | null | undefined
  ): { parent: string; sub: string } {
    if (!serviceCategoryId) {
      return { parent: fallbackParent?.trim() || "—", sub: fallbackSub?.trim() || "—" };
    }
    const sid = String(serviceCategoryId);
    if (subLabelById.has(sid)) {
      const parentId = parentIdBySubId.get(sid);
      const parent =
        parentId != null ? parentLabelById.get(parentId) ?? fallbackParent ?? "—" : fallbackParent ?? "—";
      const sub = subLabelById.get(sid) ?? fallbackSub ?? "—";
      return { parent, sub };
    }
    if (parentLabelById.has(sid)) {
      return {
        parent: parentLabelById.get(sid) ?? fallbackParent ?? "—",
        sub: fallbackSub?.trim() || "—",
      };
    }
    return { parent: fallbackParent?.trim() || "—", sub: fallbackSub?.trim() || "—" };
  }

  return { rowCategoryDisplay };
}
