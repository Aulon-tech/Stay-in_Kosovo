/**
 * Quick check before import.
 * Usage: npm run verify:dataset
 */
import fs from "fs";
import path from "path";
import { loadCuratedJson } from "../lib/curated-import";

async function main() {
  const root = process.cwd();
  const jsonPath = [
    process.env.DATASET_PATH,
    path.join(root, "data", "json.txt"),
    path.join(root, "data", "places_curated_cleaned.json"),
    path.join(root, "data", "places_curated.json"),
    path.join(root, "places_curated.json"),
  ].find((p) => p && fs.existsSync(p));

  if (jsonPath) {
    const rows = loadCuratedJson(jsonPath);
    const cats: Record<string, number> = {};
    for (const r of rows) {
      const c = (r.category || "other").toLowerCase();
      cats[c] = (cats[c] || 0) + 1;
    }
    console.log(`places_curated.json: ${rows.length} places`);
    console.log("Categories:", cats);
    console.log("Sample:", rows[0]?.name, rows[0]?.vibes);
    return;
  }

  const dbPath = path.join(root, "data", "places_final.db");
  if (!fs.existsSync(dbPath)) {
    console.error("No dataset found (places_curated.json or places_final.db)");
    process.exit(1);
  }

  const Database = (await import("better-sqlite3")).default;
  const db = new Database(dbPath, { readonly: true });
  const count = db.prepare("SELECT COUNT(*) AS n FROM places").get() as {
    n: number;
  };
  db.close();
  console.log(`places_final.db: ${count.n} rows`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
