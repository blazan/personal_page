/**
 * Standalone seed script: `npm run seed`
 *
 * The app seeds itself on first boot, so this is only needed to create the
 * database ahead of time (for example, to inspect it before starting the
 * server) or to reset the content back to the shipped defaults.
 *
 * Usage:
 *   npm run seed          # create the database if it does not exist
 *   npm run seed -- --force  # delete the database and reseed from scratch
 */

import fs from "node:fs";
import path from "node:path";

// The database module reads DATA_DIR at import time, so set a default before
// requiring it. Callers can still override the variable in the environment.
process.env.DATA_DIR ??= path.join(process.cwd(), "data");

async function main() {
  const force = process.argv.includes("--force");
  const dataDir = path.resolve(process.env.DATA_DIR as string);
  const dbPath = path.join(dataDir, "portfolio.db");

  if (force && fs.existsSync(dbPath)) {
    // Remove the database and its WAL sidecar files so SQLite starts clean.
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      const file = dbPath + suffix;
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    }
    console.log(`Removed existing database at ${dbPath}`);
  }

  // Importing the module opens the connection, runs migrations and seeds the
  // default content when the database is empty.
  const { getContent, listProjects, listMessages } = await import("../src/lib/db");

  const content = getContent();
  const projects = listProjects();
  const messages = listMessages();

  console.log(`Database ready at ${dbPath}`);
  console.log(`  Hero headline : ${content.hero.headline}`);
  console.log(`  Metrics       : ${content.metrics.length}`);
  console.log(`  Projects      : ${projects.length}`);
  console.log(`  Messages      : ${messages.length}`);
  console.log("");
  console.log("Start the server with: npm run dev   (or)  npm run build && npm start");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
