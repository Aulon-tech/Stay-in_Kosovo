import { create } from "zustand";
import { PRISHTINA } from "@/lib/utils";

type Filters = {
  category: string;
  vibe: string;
  distance: number | null;
  price: number | null;
  openNow: boolean;
};

type LocationState = {
  lat: number;
  lng: number;
  loading: boolean;
  error: string | null;
  filters: Filters;
  showEvents: boolean;
  showTransit: boolean;
  draftItineraryId: string | null;
  pendingStops: { placeId: string; placeName?: string }[];
  setLocation: (lat: number, lng: number) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  setShowEvents: (v: boolean) => void;
  setShowTransit: (v: boolean) => void;
  addPendingStop: (placeId: string, placeName?: string) => void;
  clearPendingStops: () => void;
  setDraftItineraryId: (id: string | null) => void;
};

const defaultFilters: Filters = {
  category: "",
  vibe: "",
  distance: null,
  price: null,
  openNow: false,
};

export const useAppStore = create<LocationState>((set) => ({
  lat: PRISHTINA.lat,
  lng: PRISHTINA.lng,
  loading: false,
  error: null,
  filters: { ...defaultFilters },
  showEvents: true,
  showTransit: false,
  draftItineraryId: null,
  pendingStops: [],
  setLocation: (lat, lng) => set({ lat, lng, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setShowEvents: (showEvents) => set({ showEvents }),
  setShowTransit: (showTransit) => set({ showTransit }),
  addPendingStop: (placeId, placeName) =>
    set((s) => {
      if (s.pendingStops.some((p) => p.placeId === placeId)) return s;
      return {
        pendingStops: [...s.pendingStops, { placeId, placeName }],
      };
    }),
  clearPendingStops: () => set({ pendingStops: [] }),
  setDraftItineraryId: (draftItineraryId) => set({ draftItineraryId }),
}));
