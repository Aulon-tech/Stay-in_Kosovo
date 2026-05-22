import type { ParsedIntent } from "@/lib/ai/types";

/** Mosques, churches, cathedrals — not date-night destinations. */
export function isReligiousOrWorshipPlace(input: {
  name?: string | null;
  description?: string | null;
  id?: string | null;
  curated_tip?: string | null;
}): boolean {
  const name = (input.name || "").toLowerCase();
  if (/\bchurchill\b/.test(name)) return false;

  const text = `${name} ${(input.description || "").toLowerCase()} ${(input.id || "").toLowerCase()} ${(input.curated_tip || "").toLowerCase()}`;

  if (
    /\b(mosque|xhami|xhamia|jamia|masjid|cathedral|synagogue|tekke|teqe)\b/.test(
      text
    )
  ) {
    return true;
  }
  if (/\b(church|kisha)\b/.test(text) && !/\bchurchill\b/.test(text)) {
    return true;
  }
  if (/\b(the-great-mosque|mother-theresa-cathedral)\b/.test(text)) {
    return true;
  }
  return false;
}

export function intentWantsDateNight(intent: ParsedIntent): boolean {
  const vibeHit = intent.vibes.some((v) =>
    /romantic|date|intimate|couple|anniversary/.test(v.toLowerCase())
  );
  if (vibeHit) return true;
  const blob = `${intent.summary_en} ${intent.specific_requests.join(" ")}`.toLowerCase();
  return /romantic|date night|intimate|couple|dinner for two|anniversary/.test(blob);
}

export function isDateNightVibeTag(vibe?: string | null): boolean {
  if (!vibe) return false;
  const v = vibe.toLowerCase();
  return v === "romantic" || v.includes("date") || v.includes("intimate");
}
