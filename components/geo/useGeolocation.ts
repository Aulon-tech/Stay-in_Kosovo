"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { PRIZREN_ITP } from "@/lib/utils";

export function useGeolocation() {
  const { setLocation, setLoading, setError } = useAppStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLocation(PRIZREN_ITP.lat, PRIZREN_ITP.lng);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setLocation(PRIZREN_ITP.lat, PRIZREN_ITP.lng);
        setError("Using default location (ITP Prizren)");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setLocation, setLoading, setError]);
}
