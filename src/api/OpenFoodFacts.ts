export type Product = {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  caloriesPer100g?: number;

  quantity?: string;
  nutrigrade?: string;
  ingredients?: string;
  allergens?: string;
  fatPer100g?: number;
  saturatedFatPer100g?: number;
  carbsPer100g?: number;
  sugarsPer100g?: number;
  proteinsPer100g?: number;
  saltPer100g?: number;
};
function normalizeAllergenTags(raw?: string): string | undefined {
  if (!raw) return undefined;

  const tokens = raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const cleaned = tokens
    .map((t) => {
      // "en:milk" -> "milk", "pl:nuts" -> "nuts"
      const parts = t.split(":");
      return parts.length > 1 ? parts.slice(1).join(":") : t;
    })
    .filter(Boolean);

  const unique = Array.from(new Set(cleaned));

  return unique.length ? unique.join(", ") : undefined;
}

type OpenFoodFactsApiResponse = {
  status: number;
  status_verbose: string;
  code: string;
  product?: {
    product_name?: string;
    product_name_en?: string;

    brands?: string;
    image_front_url?: string;

    quantity?: string;
    nutriscore_grade?: string;

    ingredients_text?: string;
    ingredients_text_en?: string;

    allergens?: string;
    allergens_en?: string;

    nutriments?: {
      "energy-kcal_100g"?: number;
      "energy_100g"?: number;
      fat_100g?: number;
      "saturated-fat_100g"?: number;
      carbohydrates_100g?: number;
      sugars_100g?: number;
      proteins_100g?: number;
      salt_100g?: number;
    };
  };
};


type OpenFoodFactsSearchV1Response = {
  products?: Array<{
    code?: string;
    product_name?: string;
    product_name_en?: string;

    brands?: string;
    image_front_url?: string;

    quantity?: string;
    nutriscore_grade?: string;

    ingredients_text?: string;
    ingredients_text_en?: string;

    allergens?: string;
    allergens_en?: string;

    nutriments?: {
      "energy-kcal_100g"?: number;
      "energy_100g"?: number;
      fat_100g?: number;
      "saturated-fat_100g"?: number;
      carbohydrates_100g?: number;
      sugars_100g?: number;
      proteins_100g?: number;
      salt_100g?: number;
    };
  }>;
};

/**
 * Simple "product database" based on the public OpenFoodFacts API.
 * Returns a unified Product model or null if nothing was found.
 */
export async function fetchProductByBarcode(
  barcode: string
): Promise<Product | null> {
  if (!barcode) return null;

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );

    const data: OpenFoodFactsApiResponse = await res.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;
    const nutriments = p.nutriments ?? {};

    const kcal =
      nutriments["energy-kcal_100g"] ??
      (typeof nutriments["energy_100g"] === "number"
        ? Math.round(nutriments["energy_100g"] / 4.184)
        : undefined);

    const name =
      p.product_name_en?.trim() ||
      p.product_name?.trim() ||
      "Unknown product";

    const ingredients =
      p.ingredients_text_en?.trim() || p.ingredients_text?.trim();

    const rawAllergens = p.allergens_en ?? p.allergens;
    const allergens = normalizeAllergenTags(rawAllergens);

    return {
      code: data.code,
      name,
      brand: p.brands,
      imageUrl: p.image_front_url,
      caloriesPer100g: kcal,

      quantity: p.quantity,
      nutrigrade: p.nutriscore_grade,
      ingredients,
      allergens,
      fatPer100g: nutriments.fat_100g,
      saturatedFatPer100g: nutriments["saturated-fat_100g"],
      carbsPer100g: nutriments.carbohydrates_100g,
      sugarsPer100g: nutriments.sugars_100g,
      proteinsPer100g: nutriments.proteins_100g,
      saltPer100g: nutriments.salt_100g,
    };
  } catch (err) {
    console.warn("OpenFoodFacts error (barcode)", err);
    return null;
  }
}


/**
 * Search for a product by name.
 * Uses the v1 search API (cgi/search.pl), which supports full-text search.
 * Returns the first matching product or null.
 */
export async function fetchProductByName(
  name: string
): Promise<Product | null> {
  const query = name.trim();
  if (!query) return null;

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=1`;

    const res = await fetch(url);

    if (!res.ok) {
      console.warn("OpenFoodFacts name search HTTP error", res.status);
      return null;
    }

    const data: OpenFoodFactsSearchV1Response = await res.json();

    const p = data.products && data.products[0];
    if (!p) {
      return null;
    }

    const nutriments = p.nutriments ?? {};

    const kcal =
      nutriments["energy-kcal_100g"] ??
      (typeof nutriments["energy_100g"] === "number"
        ? Math.round(nutriments["energy_100g"] / 4.184)
        : undefined);

    const productName =
      p.product_name_en?.trim() ||
      p.product_name?.trim() ||
      "Unknown product";

    const ingredients =
      p.ingredients_text_en?.trim() || p.ingredients_text?.trim();

    const rawAllergens = p.allergens_en ?? p.allergens;
    const allergens = normalizeAllergenTags(rawAllergens);

    return {
      code: p.code ?? "",
      name: productName,
      brand: p.brands,
      imageUrl: p.image_front_url,
      caloriesPer100g: kcal,

      quantity: p.quantity,
      nutrigrade: p.nutriscore_grade,
      ingredients,
      allergens,
      fatPer100g: nutriments.fat_100g,
      saturatedFatPer100g: nutriments["saturated-fat_100g"],
      carbsPer100g: nutriments.carbohydrates_100g,
      sugarsPer100g: nutriments.sugars_100g,
      proteinsPer100g: nutriments.proteins_100g,
      saltPer100g: nutriments.salt_100g,
    };
  } catch (err) {
    console.warn("OpenFoodFacts error (name search)", err);
    return null;
  }
}
