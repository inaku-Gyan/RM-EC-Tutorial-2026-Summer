/**
 * Single-deck Slidev development runner.
 *
 * This is used by `pnpm dev <deck-slug>` when the caller wants one deck with
 * native Slidev hot reload and no site proxy.
 */
import { relative } from "node:path";
import { resolveDeckCommandArgs, root, runSlidev } from "./shared.mjs";

const args = process.argv.slice(2);

if (args[0] === "dev") {
  args.shift();
}

let deck;
let slidevArgs;

try {
  ({ args: slidevArgs, deck } = await resolveDeckCommandArgs(args, {
    command: "dev",
    usage: `Usage: node ${relative(root, process.argv[1])} dev <deck-slug> [-- <slidev-options>]`,
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const result = runSlidev([relative(root, deck.entry), "--open", ...slidevArgs]);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
