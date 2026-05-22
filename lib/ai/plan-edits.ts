import type { CuratedPlace } from "@/lib/curated-import";
import {
  getCuratedById,
  isPrishtinaPlace,
  toCandidate,
} from "@/lib/ai/curated-data";
import type { BuiltPlan, CandidateForAi } from "@/lib/ai/types";
import {
  restaggerBuiltPlan,
  type ResolvedPlanSchedule,
} from "@/lib/plan-schedule";

type PlanStop = BuiltPlan["stops"][number];

export type PlanEditKind = "delete" | "replace" | "add";

export type ParsedPlanEdit =
  | { kind: "delete"; index: number }
  | { kind: "replace"; index: number; query: string }
  | { kind: "add"; query: string; index?: number };

/** Parse delete / replace / add commands (SQ + EN). Returns null → use Gemini replan. */
export function parsePlanEditRequest(
  text: string,
  stopCount: number,
  options?: { stopNames?: string[] }
): ParsedPlanEdit | null {
  const t = text.trim().toLowerCase();
  if (!t || stopCount < 1) return null;

  // Swap in place (same order): "change the first", "first disappears, put another cafe"
  const replace = parseReplaceEdit(t, stopCount, options?.stopNames);
  if (replace) return replace;

  const deleteRe =
    /\b(delete|remove|drop|cancel|fshij|fshije|hiq|hiqe|heq|heqe|largoj|largo|largoje)\b/i;
  if (deleteRe.test(t)) {
    const idx = resolveStopIndex(t, stopCount);
    if (idx == null) return null;
    return { kind: "delete", index: idx };
  }

  const addRe = /\b(add|include|insert|shto|shtoni|vendos|vendose|put)\b/i;
  if (addRe.test(t)) {
    const query = extractAddQuery(t);
    if (!query) return null;
    let index: number | undefined;
    const after = t.match(
      /\b(?:after|pas)\s+(?:stop\s*)?(first|second|third|fourth|last|\d+)/i
    );
    const before = t.match(
      /\b(?:before|para)\s+(?:stop\s*)?(first|second|third|fourth|last|\d+)/i
    );
    if (after) {
      const i = resolveStopIndex(after[0], stopCount);
      if (i != null) index = Math.min(i + 1, stopCount);
    } else if (before) {
      const i = resolveStopIndex(before[0], stopCount);
      if (i != null) index = i;
    }
    return { kind: "add", query, index };
  }

  return null;
}

/** Same slot: remove stop N and put a new one (keeps order). */
function parseReplaceEdit(
  t: string,
  stopCount: number,
  stopNames?: string[]
): ParsedPlanEdit | null {
  const replaceVerb =
    /\b(replace|swap|switch|change|ndërro|nderro|ndrysho|ndryshoje|zëvendëso|zevendeso)\b/i;

  // "first one to disappear and put another / add a cafe / vendos një kafe"
  const disappearSwap = t.match(
    /\b(first|second|third|fourth|last|\d+|1st|2nd|3rd|të parë|te pare|të dytë|e parë|e dytë)[\w\s]*(?:stop|place|one|ndales[aë]?n?)?[\w\s]*(?:disappear|gone|zhduk|zhduket|largoj|heq|hiq|fshij)[\w\s]*(?:and|&|pastaj|then|,)?.{0,40}?(?:put|add|vendos|shto|me|with|nga)\s+(.+)/i
  );
  if (disappearSwap) {
    const idx = resolveStopIndex(disappearSwap[1], stopCount);
    const query = extractReplaceQuery(disappearSwap[2]);
    if (idx != null) return { kind: "replace", index: idx, query };
  }

  // "first disappears, put another cafe" / "another one should be put" (same slot)
  if (
    /\b(disappear|zhduk|zhduket)\b/i.test(t) &&
    /\b(another|different|tjetër|tjeter|put|add|vendos|shto)\b/i.test(t)
  ) {
    const idx = resolveStopIndex(t, stopCount);
    if (idx == null) return null;
    const afterTarget = t.match(
      /\b(?:put|add|vendos|shto|me|with|nga|to|for)\s+(?:another\s+)?(.+)/i
    );
    const query = afterTarget
      ? extractReplaceQuery(afterTarget[1])
      : "another place";
    return { kind: "replace", index: idx, query };
  }

  if (!replaceVerb.test(t)) return null;

  const changeTo = t.match(
    /\b(?:change|ndrysho|ndryshoje|replace|swap|ndërro|nderro|zëvendëso)\b[\w\s]*?(?:the\s+)?(?:stop\s*)?(first|second|third|fourth|last|\d+)(?:\s+stop|\s+one|\s+place)?\s*(?:to|into|with|me|nga|for)\s+(.+)/i
  );
  if (changeTo) {
    const idx = resolveStopIndex(changeTo[1], stopCount);
    const query = extractReplaceQuery(changeTo[2]);
    if (idx != null) return { kind: "replace", index: idx, query };
  }

  const withMatch = t.match(
    /\b(?:replace|swap|switch|ndërro|nderro|zëvendëso|zevendeso)\s+(?:the\s+)?(?:stop\s*)?(first|second|third|fourth|last|\d+)(?:\s+stop)?\s*(?:with|me|nga)\s+(.+)/i
  );
  if (withMatch) {
    const idx = resolveStopIndex(withMatch[1], stopCount);
    const query = extractReplaceQuery(withMatch[2]);
    if (idx != null) return { kind: "replace", index: idx, query };
  }

  const swapMatch = t.match(
    /\bswap\s+(?:the\s+)?(first|second|third|fourth|last|\d+)(?:\s+stop)?\s*(?:with|for|me)?\s*(.*)/i
  );
  if (swapMatch) {
    const idx = resolveStopIndex(swapMatch[1], stopCount);
    const query = extractReplaceQuery(swapMatch[2] || "another place");
    if (idx != null) return { kind: "replace", index: idx, query };
  }

  const replaceName = t.match(/\breplace\s+(.+?)\s+with\s+(.+)/i);
  if (replaceName) {
    const fromName = replaceName[1].trim();
    const query = extractReplaceQuery(replaceName[2]);
    const idx = findStopIndexByNameHint(fromName, stopNames);
    if (idx != null) return { kind: "replace", index: idx, query };
  }

  // "change the first" / "change the first place" (no new place named → swap in same slot)
  if (/\b(change|ndrysho|ndryshoje)\b/i.test(t)) {
    const idx = resolveStopIndex(t, stopCount);
    const inlineQuery = t.match(
      /\b(?:with|me|nga|to|for|put|add|vendos|shto)\s+(?:another\s+)?(.+)/i
    );
    if (idx != null) {
      const query = inlineQuery
        ? extractReplaceQuery(inlineQuery[1])
        : "another place";
      return { kind: "replace", index: idx, query };
    }
  }

  // "change the place in my plan" → replace 1st stop, keep order
  if (
    /\b(change|ndrysho|ndryshoje)\b/i.test(t) &&
    /\b(plan|itinerary|day|route|order|udhëtim|udhetim|planin)\b/i.test(t)
  ) {
    const idx = resolveStopIndex(t, stopCount) ?? 0;
    const inlineQuery = t.match(
      /\b(?:with|me|nga|to|for|put|add|vendos|shto)\s+(?:another\s+)?(.+)/i
    );
    const query = inlineQuery
      ? extractReplaceQuery(inlineQuery[1])
      : "another place";
    return { kind: "replace", index: idx, query };
  }

  return null;
}

function extractReplaceQuery(fragment: string): string {
  const q = extractAddQuery(fragment);
  if (q && q.length <= 48 && !/\b(disappear|change|first|second|plan)\b/i.test(q)) {
    return q;
  }
  if (/\b(another|different|tjetër|tjeter|something else|diçka tjetër)\b/i.test(fragment)) {
    return "another place";
  }
  return "another place";
}

function findStopIndexByNameHint(
  hint: string,
  stopNames?: string[]
): number | null {
  if (!stopNames?.length) return null;
  const h = hint.toLowerCase();
  const i = stopNames.findIndex(
    (n) =>
      n.toLowerCase().includes(h) ||
      h.includes(n.toLowerCase().slice(0, Math.min(8, n.length)))
  );
  return i >= 0 ? i : null;
}

function resolveStopIndex(fragment: string, stopCount: number): number | null {
  const t = fragment.toLowerCase();
  const num = t.match(/(\d+)/);
  if (num) {
    const n = parseInt(num[1], 10);
    if (n >= 1 && n <= stopCount) return n - 1;
  }
  if (/\b(first|1st|parë|pare|parën|paren|të par|te par|e parë|e pare)\b/.test(t))
    return 0;
  if (/\b(second|2nd|dytë|dyte|dytën|dyten|të dyt|te dyt|e dytë)\b/.test(t))
    return 1;
  if (/\b(third|3rd|tretë|trete|tretën|të tret|te tret|e tretë)\b/.test(t))
    return 2;
  if (/\b(fourth|4th|katërt|katert|të katërt)\b/.test(t)) return 3;
  if (/\b(last|fundit|të fundit|te fundit|e fundit)\b/.test(t))
    return stopCount - 1;
  return null;
}

function extractAddQuery(t: string): string | null {
  const stripped = t
    .replace(
      /\b(add|include|insert|shto|shtoni|vendos|a|an|the|please|pls|stop|ndales[aë]?n?)\b/gi,
      " "
    )
    .replace(/\b(after|before|pas|para)\s+(?:stop\s*)?(first|second|third|last|\d+)\b/gi, " ")
    .trim();
  if (stripped.length >= 2) return stripped;
  if (/\b(food|restaurant|dinner|lunch|ngren|darkë|darke)\b/i.test(t))
    return "restaurant";
  if (/\b(cafe|coffee|kafe|kafene)\b/i.test(t)) return "cafe";
  if (/\b(bar|nightlife|club|drink)\b/i.test(t)) return "bar";
  if (/\b(culture|museum|gallery|kultur)\b/i.test(t)) return "culture";
  if (/\b(nature|park|germia)\b/i.test(t)) return "nature";
  return null;
}

function pickPlaceForQuery(
  query: string,
  pool: CandidateForAi[],
  excludeIds: Set<string>
): CandidateForAi | null {
  const available = pool.filter(
    (c) => !excludeIds.has(c.place_id.toLowerCase())
  );
  if (!available.length) return null;

  const q = query.toLowerCase().trim();
  if (!q || q.includes("different") || q.includes("another") || q.includes("tjeter") || q.includes("tjetër")) {
    return available[Math.floor(Math.random() * available.length)];
  }

  const byName = available.find((c) => c.name.toLowerCase().includes(q));
  if (byName) return byName;

  const categoryMap: Record<string, string[]> = {
    cafe: ["cafe", "coffee", "kafe", "kafene", "kafene"],
    restaurant: [
      "restaurant",
      "food",
      "dinner",
      "lunch",
      "restorant",
      "ngren",
      "darkë",
      "darke",
      "brunch",
    ],
    bar: ["bar", "nightlife", "club", "drink", "beer"],
    culture: ["culture", "museum", "gallery", "kultur", "historic"],
    nature: ["nature", "park", "germia", "natyr", "trail"],
    attraction: ["attraction", "sight", "monument"],
  };

  for (const [cat, keys] of Object.entries(categoryMap)) {
    if (keys.some((k) => q.includes(k))) {
      const hit = available.find(
        (c) =>
          c.category === cat ||
          (cat === "bar" && (c.category === "nightlife" || c.category === "bar"))
      );
      if (hit) return hit;
    }
  }

  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (words.length) {
    const ranked = available
      .map((c) => {
        const name = c.name.toLowerCase();
        const score = words.filter((w) => name.includes(w)).length;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    if (ranked[0]) return ranked[0].c;
  }

  return available[0];
}

function stopFromCandidate(c: CandidateForAi, curated: CuratedPlace[]): PlanStop {
  const row = getCuratedById(curated, c.place_id);
  return {
    place_id: c.place_id,
    arrival_time: "12:00 PM",
    why_this_place:
      row?.curated_tip ||
      row?.description?.slice(0, 120) ||
      `${c.name} fits your updated plan.`,
    what_to_do:
      c.category === "restaurant"
        ? "Enjoy a meal here."
        : c.category === "cafe"
          ? "Coffee and a slow start."
          : `Explore ${c.name}.`,
    stay_minutes: c.avg_duration_min || 60,
    transport_mode: "WALK",
  };
}

export function applyStructuredPlanEdit(
  plan: BuiltPlan,
  edit: ParsedPlanEdit,
  pool: CandidateForAi[],
  curated: CuratedPlace[],
  schedule?: ResolvedPlanSchedule
): BuiltPlan | null {
  const exclude = new Set(plan.stops.map((s) => s.place_id.toLowerCase()));
  let stops = [...plan.stops];

  if (edit.kind === "delete") {
    if (stops.length <= 1) return null;
    if (edit.index < 0 || edit.index >= stops.length) return null;
    stops.splice(edit.index, 1);
  } else if (edit.kind === "replace") {
    if (edit.index < 0 || edit.index >= stops.length) return null;
    const currentId = stops[edit.index].place_id.toLowerCase();
    exclude.delete(currentId);
    const pick = pickPlaceForQuery(edit.query, pool, exclude);
    if (!pick) return null;
    stops[edit.index] = {
      ...stopFromCandidate(pick, curated),
      transport_mode: stops[edit.index].transport_mode,
    };
  } else if (edit.kind === "add") {
    const pick = pickPlaceForQuery(edit.query, pool, exclude);
    if (!pick) return null;
    const newStop = stopFromCandidate(pick, curated);
    const at =
      edit.index != null
        ? Math.max(0, Math.min(edit.index, stops.length))
        : stops.length;
    stops.splice(at, 0, newStop);
  }

  if (stops.length < 1) return null;

  const draft = { title: plan.title, stops };
  if (schedule) {
    return restaggerBuiltPlan(
      draft,
      schedule.startHour24,
      schedule.startMinute
    );
  }
  return restaggerBuiltPlan(draft, 10, 0);
}

export function tryStructuredPlanEdit(
  changeRequest: string,
  currentPlan: BuiltPlan,
  curated: CuratedPlace[],
  schedule?: ResolvedPlanSchedule
): { plan: BuiltPlan; editKind: PlanEditKind } | null {
  const stopNames = currentPlan.stops.map((s) => {
    const row = getCuratedById(curated, s.place_id);
    return row?.name || s.place_id;
  });
  const parsed = parsePlanEditRequest(changeRequest, currentPlan.stops.length, {
    stopNames,
  });
  if (!parsed) return null;

  const pool = curated.filter(isPrishtinaPlace).map(toCandidate);
  const updated = applyStructuredPlanEdit(
    currentPlan,
    parsed,
    pool,
    curated,
    schedule
  );
  if (!updated) return null;

  return { plan: updated, editKind: parsed.kind };
}
