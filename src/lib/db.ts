// This module is server-only. It reads Node built-ins and native addons that
// cannot be bundled for the browser. It is imported exclusively from server
// components and route handlers, never from a "use client" module.

import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

import { SEED_CONTENT, SEED_PROJECTS } from "./seed-data";
import type { ContactMessage, Project, SiteContent } from "./types";

/**
 * SQLite access layer.
 *
 * Why SQLite: the site is read-mostly and served from a single container, so a
 * file-backed database gives sub-millisecond reads with no network hop and no
 * separate service to operate. The file lives on a Docker volume so it
 * survives container rebuilds.
 */

/** Directory holding the SQLite file. Overridable so tests can use a temp dir. */
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const DB_PATH = path.join(DATA_DIR, "portfolio.db");

/**
 * Next.js dev mode re-evaluates modules on hot reload. Caching the connection
 * on `globalThis` avoids leaking file handles and re-running migrations.
 */
declare global {
  // eslint-disable-next-line no-var
  var __portfolioDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);

  // WAL lets readers run concurrently with a writer, which keeps page loads
  // fast while an admin request is saving. NORMAL sync is durable enough here
  // and much cheaper than FULL.
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  // Wait rather than throw if another connection holds the write lock.
  db.pragma("busy_timeout = 5000");

  migrate(db);
  seedIfEmpty(db);

  return db;
}

/** Creates tables if they do not exist. Safe to run on every boot. */
function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT    NOT NULL UNIQUE,
      title       TEXT    NOT NULL,
      category    TEXT    NOT NULL,
      client      TEXT    NOT NULL,
      summary     TEXT    NOT NULL,
      outcome     TEXT    NOT NULL,
      challenge   TEXT    NOT NULL,
      strategy    TEXT    NOT NULL,
      tools       TEXT    NOT NULL DEFAULT '[]',
      results     TEXT    NOT NULL DEFAULT '[]',
      cover_image TEXT    NOT NULL DEFAULT '',
      year        TEXT    NOT NULL DEFAULT '',
      featured    INTEGER NOT NULL DEFAULT 0,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL,
      updated_at  TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_position ON projects(position, id);

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL,
      company    TEXT,
      message    TEXT    NOT NULL,
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
  `);
}

/**
 * Populates copy and sample projects the first time the database is created.
 * Runs inside a transaction so a crash mid-seed cannot leave half the content
 * behind, and is a no-op once the `content` row exists.
 */
function seedIfEmpty(db: Database.Database): void {
  const existing = db
    .prepare("SELECT 1 FROM settings WHERE key = 'content'")
    .get();

  if (existing) return;

  const insertSetting = db.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
  );
  const insertProject = db.prepare(`
    INSERT INTO projects
      (slug, title, category, client, summary, outcome, challenge, strategy,
       tools, results, cover_image, year, featured, position, created_at, updated_at)
    VALUES
      (@slug, @title, @category, @client, @summary, @outcome, @challenge, @strategy,
       @tools, @results, @cover_image, @year, @featured, @position, @created_at, @updated_at)
  `);

  const now = new Date().toISOString();

  const runSeed = db.transaction(() => {
    insertSetting.run("content", JSON.stringify(SEED_CONTENT), now);

    SEED_PROJECTS.forEach((project, index) => {
      insertProject.run({
        slug: project.slug,
        title: project.title,
        category: project.category,
        client: project.client,
        summary: project.summary,
        outcome: project.outcome,
        challenge: project.challenge,
        strategy: project.strategy,
        tools: JSON.stringify(project.tools),
        results: JSON.stringify(project.results),
        cover_image: project.coverImage,
        year: project.year,
        featured: project.featured ? 1 : 0,
        position: index,
        created_at: now,
        updated_at: now,
      });
    });
  });

  runSeed();
}

/** Opens (or reuses) the database connection. */
export function getDb(): Database.Database {
  if (!globalThis.__portfolioDb) {
    globalThis.__portfolioDb = createConnection();
  }
  return globalThis.__portfolioDb;
}

/** Raw row shape for the projects table (snake_case, JSON-encoded arrays). */
interface ProjectRow {
  id: number;
  slug: string;
  title: string;
  category: string;
  client: string;
  summary: string;
  outcome: string;
  challenge: string;
  strategy: string;
  tools: string;
  results: string;
  cover_image: string;
  year: string;
  featured: number;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Converts a database row into the camelCase domain object. */
function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    client: row.client,
    summary: row.summary,
    outcome: row.outcome,
    challenge: row.challenge,
    strategy: row.strategy,
    tools: safeParseArray(row.tools),
    results: safeParseArray(row.results),
    coverImage: row.cover_image,
    year: row.year,
    featured: row.featured === 1,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Parses a JSON array column. A malformed value degrades to an empty array so
 * one bad row cannot break the whole page render.
 */
function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

/** Returns all editable site copy, falling back to seed data if unset. */
export function getContent(): SiteContent {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = 'content'")
    .get() as { value: string } | undefined;

  if (!row) return SEED_CONTENT;

  try {
    // Merge with the seed so a newly added field still renders on databases
    // seeded by an older release.
    return { ...SEED_CONTENT, ...(JSON.parse(row.value) as SiteContent) };
  } catch {
    return SEED_CONTENT;
  }
}

/** Persists site copy. Only the keys present in `patch` are replaced. */
export function saveContent(patch: Partial<SiteContent>): SiteContent {
  const merged: SiteContent = { ...getContent(), ...patch };

  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES ('content', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(JSON.stringify(merged), new Date().toISOString());

  return merged;
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

/** All projects ordered by admin-defined position. */
export function listProjects(): Project[] {
  const rows = getDb()
    .prepare("SELECT * FROM projects ORDER BY position ASC, id ASC")
    .all() as ProjectRow[];
  return rows.map(rowToProject);
}

/** Only the projects flagged for the homepage grid. */
export function listFeaturedProjects(): Project[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM projects WHERE featured = 1 ORDER BY position ASC, id ASC",
    )
    .all() as ProjectRow[];
  return rows.map(rowToProject);
}

/** Looks a project up by its URL slug (used by the dedicated detail route). */
export function getProjectBySlug(slug: string): Project | null {
  const row = getDb()
    .prepare("SELECT * FROM projects WHERE slug = ?")
    .get(slug) as ProjectRow | undefined;
  return row ? rowToProject(row) : null;
}

/** Looks a project up by primary key (used by admin edit forms). */
export function getProjectById(id: number): Project | null {
  const row = getDb()
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : null;
}

/**
 * Turns a title into a URL-safe slug, appending a counter if the slug is
 * already taken so unique constraint violations cannot reach the user.
 */
export function slugify(title: string): string {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project";

  return base;
}

/** Returns a slug that is unique in the database, ignoring `excludeId`. */
export function uniqueSlug(title: string, excludeId?: number): string {
  const base = slugify(title);
  const db = getDb();
  const check = db.prepare(
    "SELECT id FROM projects WHERE slug = ? AND id IS NOT ?",
  );

  let candidate = base;
  let counter = 2;
  while (check.get(candidate, excludeId ?? null)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

/** Inserts a project, appending it to the end of the ordering. */
export function createProject(input: {
  slug: string;
  title: string;
  category: string;
  client: string;
  summary: string;
  outcome: string;
  challenge: string;
  strategy: string;
  tools: string[];
  results: string[];
  coverImage: string;
  year: string;
  featured: boolean;
}): Project {
  const db = getDb();
  const now = new Date().toISOString();

  const nextPosition =
    (
      db.prepare("SELECT MAX(position) AS max FROM projects").get() as {
        max: number | null;
      }
    ).max ?? -1;

  const result = db
    .prepare(
      `INSERT INTO projects
         (slug, title, category, client, summary, outcome, challenge, strategy,
          tools, results, cover_image, year, featured, position, created_at, updated_at)
       VALUES
         (@slug, @title, @category, @client, @summary, @outcome, @challenge, @strategy,
          @tools, @results, @cover_image, @year, @featured, @position, @created_at, @updated_at)`,
    )
    .run({
      slug: input.slug,
      title: input.title,
      category: input.category,
      client: input.client,
      summary: input.summary,
      outcome: input.outcome,
      challenge: input.challenge,
      strategy: input.strategy,
      tools: JSON.stringify(input.tools),
      results: JSON.stringify(input.results),
      cover_image: input.coverImage,
      year: input.year,
      featured: input.featured ? 1 : 0,
      position: nextPosition + 1,
      created_at: now,
      updated_at: now,
    });

  return getProjectById(Number(result.lastInsertRowid))!;
}

/** Updates every mutable field of an existing project. */
export function updateProject(
  id: number,
  input: {
    slug: string;
    title: string;
    category: string;
    client: string;
    summary: string;
    outcome: string;
    challenge: string;
    strategy: string;
    tools: string[];
    results: string[];
    coverImage: string;
    year: string;
    featured: boolean;
  },
): Project | null {
  const existing = getProjectById(id);
  if (!existing) return null;

  getDb()
    .prepare(
      `UPDATE projects SET
         slug = @slug, title = @title, category = @category, client = @client,
         summary = @summary, outcome = @outcome, challenge = @challenge,
         strategy = @strategy, tools = @tools, results = @results,
         cover_image = @cover_image, year = @year, featured = @featured,
         updated_at = @updated_at
       WHERE id = @id`,
    )
    .run({
      id,
      slug: input.slug,
      title: input.title,
      category: input.category,
      client: input.client,
      summary: input.summary,
      outcome: input.outcome,
      challenge: input.challenge,
      strategy: input.strategy,
      tools: JSON.stringify(input.tools),
      results: JSON.stringify(input.results),
      cover_image: input.coverImage,
      year: input.year,
      featured: input.featured ? 1 : 0,
      updated_at: new Date().toISOString(),
    });

  return getProjectById(id);
}

/** Deletes a project and compacts the remaining ordering. */
export function deleteProject(id: number): boolean {
  const db = getDb();
  const run = db.transaction(() => {
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    if (result.changes === 0) return false;

    // Re-number positions so ordering stays gap-free after a delete.
    const remaining = db
      .prepare("SELECT id FROM projects ORDER BY position ASC, id ASC")
      .all() as { id: number }[];
    const setPosition = db.prepare(
      "UPDATE projects SET position = ? WHERE id = ?",
    );
    remaining.forEach((row, index) => setPosition.run(index, row.id));
    return true;
  });

  return run();
}

/**
 * Reorders projects from an array of ids in the desired order.
 * Ids missing from the list keep their relative position at the end.
 */
export function reorderProjects(orderedIds: number[]): Project[] {
  const db = getDb();
  const run = db.transaction(() => {
    const setPosition = db.prepare(
      "UPDATE projects SET position = ?, updated_at = ? WHERE id = ?",
    );
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => setPosition.run(index, now, id));
  });
  run();
  return listProjects();
}

/* -------------------------------------------------------------------------- */
/* Contact messages                                                           */
/* -------------------------------------------------------------------------- */

/** Stores a contact-form submission. */
export function createMessage(input: {
  name: string;
  email: string;
  company: string | null;
  message: string;
}): ContactMessage {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO messages (name, email, company, message, is_read, created_at)
       VALUES (@name, @email, @company, @message, 0, @created_at)`,
    )
    .run({ ...input, created_at: now });

  return getMessageById(Number(result.lastInsertRowid))!;
}

interface MessageRow {
  id: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  is_read: number;
  created_at: string;
}

function rowToMessage(row: MessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  };
}

/** Newest-first inbox listing for the admin panel. */
export function listMessages(): ContactMessage[] {
  const rows = getDb()
    .prepare("SELECT * FROM messages ORDER BY created_at DESC, id DESC")
    .all() as MessageRow[];
  return rows.map(rowToMessage);
}

export function getMessageById(id: number): ContactMessage | null {
  const row = getDb()
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(id) as MessageRow | undefined;
  return row ? rowToMessage(row) : null;
}

/** Marks a message read/unread from the inbox. */
export function setMessageRead(id: number, isRead: boolean): boolean {
  const result = getDb()
    .prepare("UPDATE messages SET is_read = ? WHERE id = ?")
    .run(isRead ? 1 : 0, id);
  return result.changes > 0;
}

export function deleteMessage(id: number): boolean {
  return getDb().prepare("DELETE FROM messages WHERE id = ?").run(id).changes > 0;
}

/** Number of unread messages, used for the admin badge. */
export function countUnreadMessages(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM messages WHERE is_read = 0")
    .get() as { count: number };
  return row.count;
}

/**
 * Verifies the database is reachable and writable.
 *
 * Used by /api/health. A plain `SELECT 1` would still pass on a read-only or
 * full volume, so this also opens and rolls back a transaction, which is what
 * every write path ultimately depends on.
 */
export function ping(): void {
  const db = getDb();
  db.prepare("SELECT 1 AS ok").get();
  db.exec("BEGIN IMMEDIATE; ROLLBACK;");
}
