/** Default image when business skips photo URLs at signup */
export const DEFAULT_BUSINESS_PHOTO =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";

export function normalizeHttpUrl(
  value: string | undefined | null
): string | undefined {
  if (!value?.trim()) return undefined;
  const t = value.trim();
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    new URL(withProto);
    return withProto;
  } catch {
    return undefined;
  }
}

export function normalizePhotoUrls(urls: string[]): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    const n = normalizeHttpUrl(raw);
    if (n) out.push(n);
  }
  return out.length ? out : [DEFAULT_BUSINESS_PHOTO];
}

export function normalizeWebsite(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return normalizeHttpUrl(value);
}
