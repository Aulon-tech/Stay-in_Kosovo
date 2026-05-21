export type WeatherSnapshot = {
  tempC: number;
  code: string;
  label: string;
};

export async function fetchWeather(
  lat: number,
  lng: number
): Promise<WeatherSnapshot> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    const data = await res.json();
    const temp = data?.current?.temperature_2m ?? 18;
    const code = String(data?.current?.weather_code ?? 0);
    const label =
      Number(code) <= 3
        ? "clear"
        : Number(code) <= 48
          ? "cloudy"
          : Number(code) <= 67
            ? "rain"
            : "wind";
    return { tempC: temp, code, label };
  } catch {
    return { tempC: 18, code: "0", label: "clear" };
  }
}
