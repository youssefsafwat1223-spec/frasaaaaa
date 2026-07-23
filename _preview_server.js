// minimal static server for previewing تجربة_العميل
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "تجربة_العميل");
const PORT = 8791;
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".wasm":"application/wasm",
  ".task":"application/octet-stream", ".tflite":"application/octet-stream",
  ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml" };
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(fp, (err,data)=>{
    if (err){ res.writeHead(404); return res.end("not found: "+p); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, ()=> console.log("preview on http://localhost:"+PORT));
