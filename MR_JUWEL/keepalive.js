"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * Render Keepalive (জুয়েল কিপার)
 *  - PORT থাকলে (Render/Railway) ছোট health সার্ভার তোলে
 *  - RENDER_EXTERNAL_URL (Render নিজেই দেয়) বা KEEPALIVE_URL থেকে নিজের লিংকে প্রতি ৪ মিনিটে পিং করে
 *    → Render ফ্রি প্ল্যানে বট ঘুমিয়ে পড়ে না, আলাদা আপটাইম-সাইটে অ্যাড করতে হয় না।
 *  - GitHub Actions / লোকালে PORT ও URL না থাকায় কিছুই করে না।
 */
const http = require("http");
const https = require("https");

let started = false;
function start() {
  if (started) return { mode: "off" };
  started = true;
  const PORT = Number(process.env.PORT) || 0;
  const TARGET = String(process.env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL || "").trim();
  const EVERY = Number(process.env.KEEPALIVE_INTERVAL_MS) || 4 * 60 * 1000;
  const info = { mode: "off", port: PORT || null, target: TARGET || null };

  if (PORT) {
    const srv = http.createServer((q, s) => { s.writeHead(200, { "content-type": "text/plain; charset=utf-8" }); s.end("Bot is alive"); });
    srv.on("error", (e) => console.log(`[KEEPALIVE] server error: ${e.message}`));
    srv.listen(PORT, "0.0.0.0", () => console.log(`[KEEPALIVE] health সার্ভার চালু, পোর্ট ${PORT}`));
    info.mode = "health";
  }
  if (TARGET) {
    const ping = () => {
      const lib = TARGET.startsWith("https") ? https : http;
      const req = lib.get(TARGET, { timeout: 20000, headers: { "User-Agent": "juwel-keepalive" } }, (res) => { res.resume(); console.log(`[KEEPALIVE] ${new Date().toISOString()} → ${TARGET} (${res.statusCode})`); });
      req.on("timeout", () => req.destroy(new Error("timeout")));
      req.on("error", (e) => console.log(`[KEEPALIVE] ping failed: ${e.message}`));
    };
    setTimeout(() => { ping(); setInterval(ping, EVERY).unref(); }, 30 * 1000).unref();
    console.log(`[KEEPALIVE] চালু: ${TARGET} — প্রতি ${Math.round(EVERY / 60000)} মিনিটে সেল্ফ-পিং`);
    info.mode = "health+ping";
  }
  return info;
}
module.exports = { start };
