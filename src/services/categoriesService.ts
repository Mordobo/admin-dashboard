import { api } from "@/services/api";
import type {
  ServiceCatalogCategory,
  ServiceCatalogSubcategory,
  CreateCategoryPayload,
  ReorderPayload,
} from "@/types";

const ADMIN_CATEGORIES_BASE = "/api/admin/categories";

export async function getCategoriesTree(): Promise<ServiceCatalogCategory[]> {
  const { data } = await api.get<{ categories: ServiceCatalogCategory[] }>(ADMIN_CATEGORIES_BASE);
  return data?.categories ?? [];
}

export async function createCategory(payload: CreateCategoryPayload): Promise<ServiceCatalogCategory> {
  const { data } = await api.post<ServiceCatalogCategory>(ADMIN_CATEGORIES_BASE, payload);
  if (!data) throw new Error("No data returned");
  return data;
}

export async function createSubcategory(
  parentId: string,
  payload: CreateCategoryPayload
): Promise<ServiceCatalogSubcategory> {
  const { data } = await api.post<ServiceCatalogSubcategory>(
    `${ADMIN_CATEGORIES_BASE}/${parentId}/subcategories`,
    payload
  );
  if (!data) throw new Error("No data returned");
  return data;
}

export async function updateCategoryOrSubcategory(
  id: string,
  payload: Partial<CreateCategoryPayload>
): Promise<ServiceCatalogCategory | ServiceCatalogSubcategory> {
  const { data } = await api.put<ServiceCatalogCategory | ServiceCatalogSubcategory>(
    `${ADMIN_CATEGORIES_BASE}/${id}`,
    payload
  );
  if (!data) throw new Error("No data returned");
  return data;
}

export async function reorderCategories(payload: ReorderPayload): Promise<void> {
  await api.put(`${ADMIN_CATEGORIES_BASE}/reorder`, payload);
}

export async function deleteCategoryOrSubcategory(id: string): Promise<void> {
  await api.delete(`${ADMIN_CATEGORIES_BASE}/${id}`);
}
