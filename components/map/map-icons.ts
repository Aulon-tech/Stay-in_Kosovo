import L from "leaflet";

export const userLocationIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const placeMarkerIcon = L.divIcon({
  className: "place-marker",
  html: '<div style="width:12px;height:12px;background:#0E6E6E;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export const placeMarkerSelectedIcon = L.divIcon({
  className: "place-marker-selected",
  html: '<div style="width:16px;height:16px;background:#EBA33D;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export const calendarEventIcon = L.divIcon({
  className: "event-marker",
  html: '<div style="width:11px;height:11px;background:#3D7AE8;border:2px solid white;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>',
  iconSize: [11, 11],
  iconAnchor: [5, 5],
});
