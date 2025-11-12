// Shopee category API response types

export interface ShopeeCategoryPath {
  category_id: number;
  category_name: string;
}

export interface ShopeeCategory {
  category_id: number;
  category_name: string;
  images: string[];
  path: ShopeeCategoryPath[];
}

export interface ShopeeCategoryApiData {
  global_cats: ShopeeCategory[];
  total: number;
}

export interface ShopeeCategoryApiResponse {
  data: ShopeeCategoryApiData;
}
