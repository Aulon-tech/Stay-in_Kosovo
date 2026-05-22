import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { join } from "path";
import { NEXT_DIST_DIR } from "./next-dist-path.mjs";

function removeDir(dir) {
  if (!existsSync(dir)) return;
  rmSync(dir, { recursive: true, force: true });
  console.log(`Removed ${dir}`);
}

const projectRoot = process.cwd();
removeDir(join(projectRoot, ".next"));
removeDir(join(projectRoot, NEXT_DIST_DIR));
removeDir(join(projectRoot, "node_modules", ".cache"));

if (process.platform === "win32") {
  for (const port of [3000, 3001]) {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const pid = line.trim().split(/\s+/).at(-1);
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`Stopped process ${pid} on port ${port}`);
        } catch {
          /* already gone */
        }
      }
    } catch {
      /* port free */
    }
  }
}

console.log("Cache cleared — run: npm run dev");
