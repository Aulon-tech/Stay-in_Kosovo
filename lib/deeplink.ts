export function googleMapsDirectionsUrl(
  toLat: number,
  toLng: number,
  toName?: string
) {
  const dest = encodeURIComponent(`${toLat},${toLng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${
    toName ? `&destination_place_id=${encodeURIComponent(toName)}` : ""
  }`;
}

export function wazeDirectionsUrl(toLat: number, toLng: number) {
  return `https://waze.com/ul?ll=${toLat}%2C${toLng}&navigate=yes`;
}
