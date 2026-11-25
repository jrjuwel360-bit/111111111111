"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ক্রেডিট-লক: এই ক্রেডিট বদলালে বট চালু হবে না / কমান্ড লোড হবে না।
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const sha = (s) => crypto.createHash("sha256").update(String(s == null ? "" : s).normalize("NFC")).digest("hex");
const ok = (s) => sha(s) === CREDIT_HASH;

// রানারের নিজের ফাইলগুলোর মাথায় "// Credit : ..." লাইন থাকতে হবে এবং সেটা অপরিবর্তিত থাকতে হবে
const OWN_FILES = ["Juwel.js", "MR_JUWEL/keepalive.js", "MR_JUWEL/banner.js", "includes/solo.js", "includes/reactions.js", "MR_JUWEL/telegram.js", "MR_JUWEL/compat.js", "MR_JUWEL/fbcompat.js", "MR_JUWEL/credit.js"];
function verifyOwnSources(root) {
  const bad = [];
  if (!ok(CREDIT)) bad.push("MR_JUWEL/credit.js (CREDIT)");
  for (const f of OWN_FILES) {
    try {
      const head = fs.readFileSync(path.join(root, f), "utf8").split("\n").slice(0, 6).join("\n");
      const m = head.match(/Credit\s*:\s*(.+)/);
      if (!m || !ok(m[1].trim())) bad.push(f);
    } catch (_) { bad.push(f + " (পাওয়া যায়নি)"); }
  }
  return bad;
}

module.exports = { CREDIT, CREDIT_HASH, ok, sha, verifyOwnSources };
