/**
 * Single-deck Slidev export runner.
 *
 * This is used by `pnpm export <deck-slug>` to resolve a deck directory slug to
 * its `slides.md` entry before forwarding arguments to `slidev export`.
 */
import { relative } from "node:path";
import { resolveDeckCommandArgs, root, runSlidev } from "./shared.mjs";

const args = process.argv.slice(2);

let deck;
let slidevArgs;

try {
  ({ args: slidevArgs, deck } = await resolveDeckCommandArgs(args, {
    command: "export",
    usage: "Usage: pnpm export <deck-slug> [-- <slidev-export-options>]",
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const result = runSlidev(["export", relative(root, deck.entry), ...slidevArgs]);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
