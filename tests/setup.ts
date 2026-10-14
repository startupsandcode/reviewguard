// Shared test setup: isolated temp JSON store per test.
import fs from "fs";
import os from "os";
import path from "path";
import { seedDb } from "../data/seed.js";

export function useTempDb(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reviewguard-test-"));
  const file = path.join(dir, "reviews.json");
  fs.writeFileSync(file, JSON.stringify(seedDb(), null, 2), "utf8");
  process.env.REVIEWGUARD_DATA_PATH = file;
  return file;
}
