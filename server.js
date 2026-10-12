"use strict";

const http = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { attachSignaling, GRACE_MS } = require("./server/signaling");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function requestUrl(req) {
  const url = new URL(req.url || "/", "http://localhost");
  const path = `${url.pathname}${url.search}`;
  return {
    pathname: url.pathname,
    search: url.search || null,
    query: Object.fromEntries(url.searchParams),
    path,
    href: path,
    hash: url.hash || null,
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

app.prepare().then(() => {
  let signaling;

  const server = http.createServer((req, res) => {
    let pathname = "/";
    try {
      pathname = new URL(req.url || "/", "http://localhost").pathname;
    } catch {
      pathname = "/";
    }

    if (pathname.startsWith("/socket.io")) return;

    if (req.method === "POST" && pathname === "/api/end") {
      readBody(req)
        .then((raw) => signaling.endByToken(raw))
        .catch(() => {})
        .finally(() => {
          if (!res.writableEnded && !res.destroyed) {
            res.writeHead(204);
            res.end();
          }
        });
      return;
    }

    const parsedUrl = requestUrl(req);
    handle(req, res, parsedUrl).catch((err) => {
      console.error(err);
      if (!res.headersSent) res.statusCode = 500;
      res.end("Internal error");
    });
  });

  const io = new Server(server, {
    connectionStateRecovery: {
      maxDisconnectionDuration: GRACE_MS,
      skipMiddlewares: true,
    },
  });
  signaling = attachSignaling(io);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Close the other app or set PORT to another number.`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`[screnn] running at http://${hostname}:${port}`);
  });
});
