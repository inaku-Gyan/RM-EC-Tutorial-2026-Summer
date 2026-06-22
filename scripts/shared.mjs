/**
 * Shared deck discovery, validation, rendering, and Slidev process helpers.
 *
 * Both the production build and full-site dev proxy use this module so they
 * agree on which `decks/<slug>/` directories are valid Slidev decks.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const decksDir = resolve(root, "decks");
export const siteDir = resolve(root, "site");
export const distDir = resolve(root, "dist");
export const slidevBin = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "slidev.cmd" : "slidev",
);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pathLikePattern = /[\\/]|\.md$/i;
const allowedDeckConfigKeys = new Set(["$schema", "order", "visibility"]);
const visibilityValues = new Set(["listed", "hidden", "disabled"]);

export function normalizeBasePath(value) {
  const raw = value?.trim() || "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderDeckCards(decks, basePath = "/") {
  return decks
    .map((deck) => {
      const href = `${basePath}${deck.slug}/`;

      return `<a class="deck-card" href="${escapeHtml(href)}">
  <span class="deck-card__route">/${escapeHtml(deck.slug)}/</span>
  <strong>${escapeHtml(deck.title)}</strong>
  <span>${escapeHtml(deck.description)}</span>
</a>`;
    })
    .join("\n");
}

export async function resolveDeckCommandArgs(args, { command, usage }) {
  if (args[0] === "--") {
    args.shift();
  }

  const slug = args[0] && !args[0].startsWith("-") ? args.shift() : undefined;

  if (!slug) {
    throw new Error(usage);
  }

  if (args[0] === "--") {
    args.shift();
  }

  return {
    args,
    deck: await resolveDeckSlug(slug, command),
  };
}

export function runSlidev(args) {
  return spawnSync(slidevBin, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${relative(root, filePath)} is not valid JSON: ${message}`,
    );
  }
}

async function readSlideFrontmatter(filePath) {
  const contents = await readFile(filePath, "utf8");
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    throw new Error(
      `${relative(root, filePath)} must start with YAML frontmatter.`,
    );
  }

  try {
    return parseYaml(match[1]) ?? {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${relative(root, filePath)} frontmatter is not valid YAML: ${message}`,
    );
  }
}

function normalizeDescription(value) {
  return String(value).trim().replace(/\s+/g, " ");
}

function getVisibility(metadata) {
  return metadata.visibility ?? "listed";
}

function validateDeckConfig(slug, metadata) {
  if (!slugPattern.test(slug)) {
    throw new Error(
      `Invalid deck directory "${slug}". Use lowercase letters, numbers, and single hyphens.`,
    );
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${slug}/deck.json must be a JSON object.`);
  }

  const unknownKeys = Object.keys(metadata).filter(
    (key) => !allowedDeckConfigKeys.has(key),
  );

  if (unknownKeys.length > 0) {
    throw new Error(
      `${slug}/deck.json may only define $schema, order, and visibility. Move title and info to slides.md frontmatter.`,
    );
  }

  if (metadata.$schema !== undefined && typeof metadata.$schema !== "string") {
    throw new Error(`${slug}/deck.json $schema must be a string.`);
  }

  if (!Number.isInteger(metadata.order) || metadata.order < 1) {
    throw new Error(`${slug}/deck.json order must be a positive integer.`);
  }

  if (!visibilityValues.has(getVisibility(metadata))) {
    throw new Error(
      `${slug}/deck.json visibility must be one of: listed, hidden, disabled.`,
    );
  }
}

function validateSlideMetadata(entry, frontmatter) {
  if (
    !frontmatter ||
    typeof frontmatter !== "object" ||
    Array.isArray(frontmatter)
  ) {
    throw new Error(
      `${relative(root, entry)} frontmatter must be a YAML object.`,
    );
  }

  if (
    !frontmatter.title ||
    typeof frontmatter.title !== "string" ||
    !frontmatter.title.trim()
  ) {
    throw new Error(
      `${relative(root, entry)} frontmatter must define a string title.`,
    );
  }

  if (
    !frontmatter.info ||
    typeof frontmatter.info !== "string" ||
    !frontmatter.info.trim()
  ) {
    throw new Error(
      `${relative(root, entry)} frontmatter must define a string info description.`,
    );
  }
}

function validateDeck(deck) {
  if (!slugPattern.test(deck.slug)) {
    throw new Error(
      `Invalid deck directory "${deck.slug}". Use lowercase letters, numbers, and single hyphens.`,
    );
  }

  if (!existsSync(deck.entry)) {
    throw new Error(`${deck.slug} is missing slides.md.`);
  }
}

async function readDeckConfig(slug) {
  const deckDir = join(decksDir, slug);
  const metadataPath = join(deckDir, "deck.json");

  if (!existsSync(metadataPath)) {
    throw new Error(`${relative(root, deckDir)} is missing deck.json.`);
  }

  const metadata = await readJson(metadataPath);
  validateDeckConfig(slug, metadata);

  return {
    order: metadata.order,
    visibility: getVisibility(metadata),
  };
}

export async function readDeck(slug) {
  const deckDir = join(decksDir, slug);
  const entry = join(deckDir, "slides.md");
  const metadata = await readDeckConfig(slug);

  if (metadata.visibility === "disabled") {
    throw new Error(`Deck "${slug}" is disabled in ${slug}/deck.json.`);
  }

  const deck = { slug, entry };
  validateDeck(deck);

  const frontmatter = await readSlideFrontmatter(entry);
  validateSlideMetadata(entry, frontmatter);

  return {
    slug,
    title: frontmatter.title.trim(),
    description: normalizeDescription(frontmatter.info),
    order: metadata.order,
    visibility: metadata.visibility,
    entry,
  };
}

export async function resolveDeckSlug(value, command) {
  if (!value) {
    throw new Error(`Usage: pnpm ${command} <deck-slug>`);
  }

  if (pathLikePattern.test(value)) {
    throw new Error(
      `Deck arguments use directory slugs, not slide paths. Use \`pnpm ${command} <deck-slug>\`, such as \`pnpm ${command} demo-one\`.`,
    );
  }

  if (!slugPattern.test(value)) {
    throw new Error(
      `Invalid deck slug "${value}". Use lowercase letters, numbers, and single hyphens.`,
    );
  }

  const deckDir = join(decksDir, value);
  const metadataPath = join(deckDir, "deck.json");

  if (!existsSync(metadataPath)) {
    throw new Error(
      `Deck "${value}" was not found. Expected ${relative(root, metadataPath)}.`,
    );
  }

  return readDeck(value);
}

export function sortDecks(decks) {
  return decks.sort((left, right) => {
    const order = (left.order ?? 9999) - (right.order ?? 9999);
    return order || left.slug.localeCompare(right.slug);
  });
}

export async function discoverDecks() {
  const entries = await readdir(decksDir, { withFileTypes: true });
  const decks = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const metadata = await readDeckConfig(entry.name);

    if (metadata.visibility !== "listed") {
      continue;
    }

    decks.push(await readDeck(entry.name));
  }

  if (decks.length === 0) {
    throw new Error(
      "No listed decks found. Add decks/<slug>/deck.json or set visibility to listed.",
    );
  }

  return sortDecks(decks);
}
