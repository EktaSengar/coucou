const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");   // site/ — this file lives in site/tools/
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".png": "image/png", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".md": "text/markdown" };
http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, "404.html"), (e2, d2) => {
        res.writeHead(404, { "Content-Type": "text/html" }); res.end(d2 || "404");
      });
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(8766, () => console.log("serving on 8766"));
