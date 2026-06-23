/**
 * Development command dispatcher and full-site hot reload proxy.
 *
 * `pnpm dev` starts one index server on port 3030 and proxies each discovered
 * deck to its own Slidev dev server. `pnpm dev <deck-slug>` delegates to the
 * single-deck Slidev runner instead.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  createServer as createHttpServer,
  request as httpRequest,
} from "node:http";
import { watch } from "node:fs";
import {
  createServer as createNetServer,
  connect as netConnect,
} from "node:net";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  discoverDecks,
  readDeck,
  renderDeckCards,
  root,
  siteDir,
  slidevBin,
  sortDecks,
} from "./shared.mjs";

const host = "localhost";
const sitePort = 3030;
const firstDeckPort = 3031;
const args = process.argv.slice(2);

if (args[0] === "--") {
  args.shift();
}

const singleDeckSlug =
  args[0] && !args[0].startsWith("-") ? args.shift() : undefined;

if (singleDeckSlug) {
  if (args[0] === "--") {
    args.shift();
  }

  const result = spawnSync(
    process.execPath,
    [join(root, "scripts", "slidev-deck.mjs"), "dev", singleDeckSlug, ...args],
    {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    },
  );

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

if (args.length > 0) {
  console.error(
    "Full-site dev mode does not accept Slidev options. Use `pnpm dev <deck-slug> -- <options>` for a single deck.",
  );
  process.exit(1);
}

async function renderHomePage(startupDecks) {
  const decks = sortDecks(
    await Promise.all(startupDecks.map((deck) => readDeck(deck.slug))),
  );
  const template = await readFile(join(siteDir, "index.html"), "utf8");

  return injectDevReload(
    template
      .replaceAll("{{BASE_PATH}}", "/")
      .replace("{{DECK_CARDS}}", renderDeckCards(decks)),
  );
}

async function renderNotFoundPage() {
  const template = await readFile(join(siteDir, "404.html"), "utf8");
  return injectDevReload(template.replaceAll("{{BASE_PATH}}", "/"));
}

function injectDevReload(html) {
  const script = `<script>
(() => {
  const events = new EventSource("/__dev/events");
  events.addEventListener("reload", () => window.location.reload());
})();
</script>`;

  return html.includes("</body>")
    ? html.replace("</body>", `${script}\n  </body>`)
    : `${html}\n${script}`;
}

async function ensurePortAvailable(port) {
  await new Promise((resolve, reject) => {
    const server = createNetServer();

    server.once("error", () => {
      reject(new Error(`Port ${port} is already in use.`));
    });
    server.once("listening", () => {
      server.close(resolve);
    });
    server.listen(port, host);
  });
}

async function ensurePortsAvailable(decks) {
  const ports = [sitePort, ...decks.map((_, index) => firstDeckPort + index)];

  for (const port of ports) {
    await ensurePortAvailable(port);
  }
}

function startSlidevDeck(deck, port) {
  const entry = relative(root, deck.entry);
  const child = spawn(
    slidevBin,
    [entry, "--port", String(port), "--base", `/${deck.route}/`],
    {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    },
  );

  child.once("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const normalStop =
      code === 0 || signal === "SIGINT" || signal === "SIGTERM";

    if (!normalStop) {
      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      console.error(
        `Slidev dev server for "${deck.slug}" stopped with ${reason}.`,
      );
    }

    shutdown(normalStop ? 0 : 1);
  });

  return child;
}

function proxyHttpRequest(req, res, targetPort) {
  const proxy = httpRequest(
    {
      hostname: host,
      port: targetPort,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: `${host}:${targetPort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxy.once("error", (error) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Deck dev server is not ready: ${error.message}`);
  });

  req.pipe(proxy);
}

function proxyWebSocket(req, socket, head, targetPort) {
  const upstream = netConnect(targetPort, host, () => {
    const headers = {
      ...req.headers,
      host: `${host}:${targetPort}`,
    };

    upstream.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${Object.entries(
        headers,
      )
        .map(([key, value]) => `${key}: ${value}`)
        .join("\r\n")}\r\n\r\n`,
    );
    upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  upstream.once("error", () => {
    socket.destroy();
  });
}

function getDeckRoute(url, routeByPath) {
  const pathname = new URL(url, `http://${host}:${sitePort}`).pathname;
  const [, route] = pathname.split("/");

  return routeByPath.get(route);
}

function watchDevFiles(decks, broadcastReload) {
  const paths = [
    join(siteDir, "index.html"),
    join(siteDir, "404.html"),
    join(siteDir, "styles.css"),
    ...decks.flatMap((deck) => [
      join(root, "decks", deck.slug, "deck.json"),
      join(root, "decks", deck.slug, "slides.md"),
    ]),
  ];
  const watchers = [];

  for (const filePath of paths) {
    const watcher = watch(filePath, (eventType) => {
      if (eventType === "change" || eventType === "rename") {
        broadcastReload();
      }
    });
    watchers.push(watcher);
  }

  return () => {
    for (const watcher of watchers) {
      watcher.close();
    }
  };
}

const children = [];
const eventClients = new Set();
let closeWatchers = () => {};
let server;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  closeWatchers();

  for (const client of eventClients) {
    client.end();
  }
  eventClients.clear();

  for (const child of children) {
    child.kill("SIGTERM");
  }

  if (server) {
    server.close(() => process.exit(code));
    return;
  }

  process.exit(code);
}

async function main() {
  const startupDecks = await discoverDecks();
  await ensurePortsAvailable(startupDecks);

  const routeByPath = new Map(
    startupDecks.map((deck, index) => [
      deck.route,
      { deck, port: firstDeckPort + index },
    ]),
  );
  for (const { deck, port } of routeByPath.values()) {
    children.push(startSlidevDeck(deck, port));
  }

  closeWatchers = watchDevFiles(startupDecks, () => {
    for (const client of eventClients) {
      client.write("event: reload\ndata: reload\n\n");
    }
  });

  server = createHttpServer(async (req, res) => {
    try {
      if (req.url === "/__dev/events") {
        res.writeHead(200, {
          "cache-control": "no-cache",
          "content-type": "text/event-stream",
          connection: "keep-alive",
        });
        res.write("\n");
        eventClients.add(res);
        req.once("close", () => eventClients.delete(res));
        return;
      }

      if (req.url === "/styles.css") {
        res.writeHead(200, { "content-type": "text/css; charset=utf-8" });
        res.end(await readFile(join(siteDir, "styles.css"), "utf8"));
        return;
      }

      const route = getDeckRoute(req.url ?? "/", routeByPath);

      if (route) {
        const pathname = new URL(req.url ?? "/", `http://${host}:${sitePort}`)
          .pathname;

        if (pathname === `/${route.deck.route}`) {
          res.writeHead(302, { location: `/${route.deck.route}/` });
          res.end();
          return;
        }

        proxyHttpRequest(req, res, route.port);
        return;
      }

      if (req.url === "/" || req.url === "/index.html") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(await renderHomePage(startupDecks));
        return;
      }

      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(await renderNotFoundPage());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(message);
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const route = getDeckRoute(req.url ?? "/", routeByPath);

    if (!route) {
      socket.destroy();
      return;
    }

    proxyWebSocket(req, socket, head, route.port);
  });

  server.listen(sitePort, host, () => {
    console.log(`Slidev site dev server: http://${host}:${sitePort}/`);
    for (const { deck, port } of routeByPath.values()) {
      console.log(`- /${deck.route}/ -> http://${host}:${port}/${deck.route}/`);
    }
  });
}

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
});
