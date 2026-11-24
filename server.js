
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const BACKEND_HOST = "192.168.145.128";
const BACKEND_PORT = 5000;

const routes = {
  "/": "index.html",
  "/index.html": "index.html",
  "/login.html": "login.html",
  "/register.html": "register.html",
  "/css/style.css": "css/style.css",
  "/js/script.js": "js/script.js",
  "/js/register.js": "js/register.js",
  "/js/login.js": "js/login.js",
  "/assets/logo.svg": "assets/logo.svg"
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".svg": "image/svg+xml"
};

// Only these API endpoints are allowed through the proxy.
const apiRoutes = {
  "/api/register": "POST",
  "/api/login": "POST",
  "/api/me": "GET",
  "/api/logout": "POST"
};

function proxyApi(req, res, requestPath) {
  let totalBytes = 0;
  let tooLarge = false;
  const chunks = [];

  req.on("data", (chunk) => {
    totalBytes += chunk.length;

    if (totalBytes > 10240) {
      tooLarge = true;
      return;
    }

    chunks.push(chunk);
  });

  req.on("end", () => {
    if (tooLarge) {
      res.writeHead(413, {
        "Content-Type": "application/json"
      });

      return res.end(JSON.stringify({
        message: "Request body too large."
      }));
    }

    const body = Buffer.concat(chunks);

    const headers = {};

    if (req.method === "POST") {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = body.length;
    }

    // Forward browser session cookies to the Back-End.
    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }

    const proxyRequest = http.request(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: requestPath,
        method: req.method,
        headers,
        timeout: 10000
      },
      (proxyResponse) => {
        const responseHeaders = {
          "Content-Type":
            proxyResponse.headers["content-type"] ||
            "application/json",
          "Cache-Control": "no-store"
        };

        // Forward JWT session cookies to the browser.
        if (proxyResponse.headers["set-cookie"]) {
          responseHeaders["Set-Cookie"] =
            proxyResponse.headers["set-cookie"];
        }

        res.writeHead(
          proxyResponse.statusCode || 502,
          responseHeaders
        );

        proxyResponse.pipe(res);
      }
    );

    proxyRequest.on("timeout", () => {
      proxyRequest.destroy(
        new Error("Back-End request timed out")
      );
    });

    proxyRequest.on("error", (error) => {
      console.error("Proxy error:", error.message);

      if (!res.headersSent) {
        res.writeHead(502, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          message: "Back-End server unavailable."
        }));
      } else {
        res.destroy();
      }
    });

    proxyRequest.end(body);
  });

  req.on("error", (error) => {
    console.error("Incoming request error:", error.message);

    if (!res.headersSent) {
      res.writeHead(400);
      res.end("Bad Request");
    }
  });
}

const server = http.createServer((req, res) => {
  let requestPath;

  try {
    requestPath = new URL(req.url, "http://localhost").pathname;
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  // API Proxy
  if (Object.hasOwn(apiRoutes, requestPath)) {
    if (req.method !== apiRoutes[requestPath]) {
      res.writeHead(405, {
        Allow: apiRoutes[requestPath]
      });
      return res.end("Method Not Allowed");
    }

    return proxyApi(req, res, requestPath);
  }

  // Static Front-End files
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }

  const file = routes[requestPath];

  if (!file) {
    res.writeHead(404);
    return res.end("Page Not Found");
  }

  fs.readFile(path.join(__dirname, file), (error, data) => {
    if (error) {
      console.error("File error:", error.message);
      res.writeHead(500);
      return res.end("File could not be loaded");
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(file)]
    });

    res.end(req.method === "HEAD" ? undefined : data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Cyvatrix server running on port ${PORT}`);
});
