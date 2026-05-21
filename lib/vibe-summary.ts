import OpenAI from "openai";
import { parseJson } from "@/lib/utils";

type ReviewInput = {
  comment: string | null;
  vibeTags: string;
};

const TEMPLATES: Record<string, string[]> = {
  cozy: [
    "Feels like a quiet corner with warm light and unhurried conversation",
    "Feels like settling into a soft chair with something hot in your hands",
  ],
  energetic: [
    "Feels like the room hums before the night really starts",
    "Feels like bass in your chest and lights that won't quit",
  ],
  romantic: [
    "Feels like candlelight and voices kept low on purpose",
    "Feels like an evening meant for two, not a crowd",
  ],
  adventurous: [
    "Feels like the trail opens wider with every step forward",
    "Feels like fresh air and the promise of something unseen",
  ],
  chill: [
    "Feels like time slows down and nobody checks their phone",
    "Feels like afternoon light that asks nothing of you",
  ],
  trendy: [
    "Feels like the crowd already knows what's next",
    "Feels like design details people photograph without asking",
  ],
  traditional: [
    "Feels like recipes and rituals passed down without a brochure",
    "Feels like stone, wood, and stories older than the menu",
  ],
  scenic: [
    "Feels like the view steals the conversation for a minute",
    "Feels like you came for the place and stayed for the panorama",
  ],
  default: [
    "Feels like a spot locals mention before tourists find the listing",
    "Feels like the kind of place you remember by mood, not just name",
  ],
};

export async function generateVibeSummary(
  placeName: string,
  placeVibes: string[],
  reviews: ReviewInput[]
): Promise<string> {
  const allTags: string[] = [...placeVibes];
  const comments: string[] = [];
  for (const r of reviews) {
    const tags = parseJson<string[]>(r.vibeTags, []);
    allTags.push(...tags);
    if (r.comment) comments.push(r.comment);
  }

  const tagCounts: Record<string, number> = {};
  for (const t of allTags) {
    const k = t.toLowerCase();
    tagCounts[k] = (tagCounts[k] || 0) + 1;
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Write one atmospheric sentence (max 25 words) starting with 'Feels like:' describing the mood of a place in Kosovo. No quotes.",
          },
          {
            role: "user",
            content: `Place: ${placeName}. Vibe tags: ${topTags.join(", ")}. Review snippets: ${comments.slice(0, 5).join(" | ")}`,
          },
        ],
        max_tokens: 80,
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (text) return text.startsWith("Feels like") ? text : `Feels like: ${text}`;
    } catch {
      /* fallback */
    }
  }

  const primary = topTags[0] || "default";
  const pool = TEMPLATES[primary] || TEMPLATES.default;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick;
}
