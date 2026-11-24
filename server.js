
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
  "/assets/logo.svg": "assets/logo.svg"
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".svg": "image/svg+xml"
};

const server = http.createServer((req, res) => {
  let requestPath;

  try {
    requestPath = new URL(req.url, "http://localhost").pathname;
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  // Forward authentication requests to the Back-End VM.
  if (
    requestPath === "/api/register" ||
    requestPath === "/api/login"
  ) {
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST" });
      return res.end("Method Not Allowed");
    }

    let totalBytes = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > 10240) {
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      const body = Buffer.concat(chunks);

      const proxyRequest = http.request(
        {
          hostname: BACKEND_HOST,
          port: BACKEND_PORT,
          path: requestPath,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": body.length
          },
          timeout: 10000
        },
        (proxyResponse) => {
          res.writeHead(proxyResponse.statusCode, {
            "Content-Type":
              proxyResponse.headers["content-type"] ||
              "application/json"
          });

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

    return;
  }

  // Serve existing Front-End files.
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }

  const file = routes[requestPath];

  if (!file) {
    res.writeHead(404);
    return res.end("Page Not Found");
  }

  const filePath = path.join(__dirname, file);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      console.error("File error:", error.message);
      res.writeHead(500);
      return res.end("File could not be loaded");
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(file)]
    });

    if (req.method === "HEAD") {
      return res.end();
    }

    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Cyvatrix server running on port ${PORT}`);
});
