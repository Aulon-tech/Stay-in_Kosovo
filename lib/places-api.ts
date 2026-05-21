export type PlacesResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export function parsePlacesList<T>(data: T[] | PlacesResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function fetchPlacesList(query: string): Promise<{
  items: PlaceListItem[];
  hasMore: boolean;
  total: number;
}> {
  const res = await fetch(`/api/places?${query}`);
  if (!res.ok) throw new Error("Failed to load places");
  const data = await res.json();
  if (Array.isArray(data)) {
    return { items: data, hasMore: false, total: data.length };
  }
  return {
    items: data.items,
    hasMore: data.hasMore,
    total: data.total,
  };
}

export type PlaceListItem = {
  id: string;
  name: string;
  category: string;
  vibes: string[];
  images: string[];
  avgRating: number;
  lat: number;
  lng: number;
  distanceKm?: number | null;
  feelsLike?: string | null;
};
