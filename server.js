
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const routes = {
  "/": "index.html",
  "/index.html": "index.html",
  "/login.html": "login.html",
  "/register.html": "register.html",
  "/css/style.css": "css/style.css",
  "/js/script.js": "js/script.js",
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

    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Cyvatrix server running on port ${PORT}`);
});
