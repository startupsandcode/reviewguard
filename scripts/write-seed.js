// Writes a fresh demo seed to data/reviews.json. Safe to re-run; it only
// overwrites the local demo file. Run: npm run seed
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { seedDb } from "../data/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "data", "reviews.json");
fs.writeFileSync(out, JSON.stringify(seedDb(), null, 2) + "\n", "utf8");
console.log("wrote", out);
