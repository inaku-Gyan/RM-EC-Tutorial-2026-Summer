/**
 * Static site builder for all discovered decks.
 *
 * Generates `dist/` with a deck index, redirect helpers, shared site assets,
 * and one Slidev static build per `decks/<slug>/slides.md`.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  discoverDecks,
  distDir,
  escapeHtml,
  normalizeBasePath,
  renderDeckCards,
  root,
  runSlidev,
  siteDir,
} from "./shared.mjs";

function renderRedirectPage(target, title) {
  const escapedTarget = escapeHtml(target);
  const escapedTitle = escapeHtml(title);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${escapedTarget}" />
    <link rel="canonical" href="${escapedTarget}" />
    <title>Redirecting to ${escapedTitle}</title>
    <script>
      window.location.replace(${JSON.stringify(target)});
    </script>
  </head>
  <body>
    <p>
      Redirecting to <a href="${escapedTarget}">${escapedTitle}</a>.
    </p>
  </body>
</html>
`;
}

async function renderHomePage(decks, basePath) {
  const template = await readFile(join(siteDir, "index.html"), "utf8");

  return template
    .replaceAll("{{BASE_PATH}}", escapeHtml(basePath))
    .replace("{{DECK_CARDS}}", renderDeckCards(decks, basePath));
}

async function renderNotFoundPage(basePath) {
  const template = await readFile(join(siteDir, "404.html"), "utf8");

  return template.replaceAll("{{BASE_PATH}}", escapeHtml(basePath));
}

function runSlidevBuild(deck, basePath) {
  const outputDir = join(distDir, deck.slug);
  const deckBase = `${basePath}${deck.slug}/`;
  const entry = relative(root, deck.entry);
  const output = relative(root, outputDir);

  console.log(`Building ${entry} -> ${output}/`);

  const result = runSlidev([
    "build",
    entry,
    "--out",
    outputDir,
    "--base",
    deckBase,
    "--router-mode",
    "hash",
  ]);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Slidev build failed for "${deck.slug}".`);
  }
}

async function main() {
  const decks = await discoverDecks();
  const basePath = normalizeBasePath(process.env.BASE_PATH);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(join(siteDir, "styles.css"), join(distDir, "styles.css"));

  for (const deck of decks) {
    runSlidevBuild(deck, basePath);
    await writeFile(
      join(distDir, `${deck.slug}.html`),
      renderRedirectPage(`${basePath}${deck.slug}/`, deck.title),
    );
  }

  await writeFile(
    join(distDir, "index.html"),
    await renderHomePage(decks, basePath),
  );
  await writeFile(
    join(distDir, "404.html"),
    await renderNotFoundPage(basePath),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
