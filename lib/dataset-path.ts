import fs from "fs";
import path from "path";

/** Same search order as scripts/import-prishtina-dataset.ts */
export function resolveCuratedDatasetPath(root = process.cwd()): string | null {
  const env = process.env.DATASET_PATH;
  const candidates = [
    env,
    path.join(root, "data", "json.txt"),
    path.join(root, "data", "places_curated.json"),
    path.join(root, "places_curated.json"),
    path.join(root, "data", "places_curated_cleaned.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}
