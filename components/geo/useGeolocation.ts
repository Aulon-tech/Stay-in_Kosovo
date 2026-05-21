"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { PRISHTINA } from "@/lib/utils";

export function useGeolocation() {
  const { setLocation, setLoading, setError } = useAppStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLocation(PRISHTINA.lat, PRISHTINA.lng);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setLocation(PRISHTINA.lat, PRISHTINA.lng);
        setError("Using default location (Prishtina)");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setLocation, setLoading, setError]);
}
