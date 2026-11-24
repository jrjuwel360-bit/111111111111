"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * solo / allbot — একই গ্রুপে একাধিক বট থাকলে শুধু একটা (মাস্টার) বট চালু রাখা।
 *
 * যে বটগুলোতে এই কোড আছে, সবাই বট-অ্যাডমিনের (ADMIN_IDS) মেসেজ নিজে দেখে একই সিদ্ধান্ত নেয়:
 *   allbot stop [সময়]      → এই গ্রুপে মাস্টার বাদে সব বট চুপ (সময় না দিলে ২৪ ঘণ্টা; যেমন 30m, 2h, 1d)
 *   allbot on               → সব বট আবার চালু
 *   allbot status           → অবস্থা দেখা
 *   allbot setmaster <বটের আইডি বা @ইউজারনেম>   → মাস্টার বট ঠিক করা (সংখ্যা/ইউজারনেম বটের নিজের getMe থেকে মেলে)
 *   allbot delmaster <আইডি/@ইউজারনেম>
 * প্রিফিক্স সহ (/allbot stop) বা ছাড়া (allbot stop) — দুভাবেই চলবে।
 * ⚠️ বটগুলোকে গ্রুপে অন্যের মেসেজ দেখতে হলে BotFather-এ Group Privacy বন্ধ থাকতে হবে।
 */
const fs = require("fs");
const path = require("path");
const credit = require("../lib/credit");

const FILE = path.join(__dirname, "..", "data", "solo.json");
const DEFAULT_MS = 24 * 3600 * 1000;
let st = { threads: {}, masters: [] };
try { st = Object.assign(st, JSON.parse(fs.readFileSync(FILE, "utf8"))); } catch (_) {}
const save = () => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(st)); } catch (_) {} };

let me = { id: "", username: "" };
const setMe = (m) => { me = { id: String(m.id), username: String(m.username || "").toLowerCase() }; };
const isMaster = () => st.masters.some((m) => m === me.id || (me.username && m === me.username));
const norm = (v) => String(v || "").trim().replace(/^@/, "").toLowerCase();

function dur(s) {
  const m = String(s || "").match(/^(\d+)\s*(s|m|h|d)?$/i);
  if (!m) return null;
  return Number(m[1]) * ({ s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[(m[2] || "m").toLowerCase()]);
}
const left = (ms) => { const t = Math.ceil(ms / 60000); return t >= 60 ? `${Math.floor(t / 60)}h ${t % 60}m` : `${t}m`; };
const frame = (title, lines) => `╭──────────────╮\n  ${title}\n╰──────────────╯\n${lines.join("\n")}`;

/** true = এই মেসেজ বট আর প্রসেস করবে না */
function gate(api, event, adminIds) {
  if (!credit.ok(credit.CREDIT)) return false;
  const tid = String(event.threadID);
  const body = String(event.body || "").trim();
  const m = body.match(/^[\/!.]?allbot\s*(stop|on|status|setmaster|delmaster)(?:\s+(.+))?$/i);

  if (m && adminIds.includes(String(event.senderID))) {
    const act = m[1].toLowerCase(), arg = (m[2] || "").trim();
    const reply = (t) => api.sendMessage(t, tid, event.messageID);
    if (act === "setmaster" || act === "delmaster") {
      const who = norm(arg);
      if (!who) { if (isMaster()) reply("Usage: allbot setmaster <বটের আইডি বা @ইউজারনেম>"); return true; }
      if (act === "setmaster") { if (!st.masters.includes(who)) st.masters.push(who); } else st.masters = st.masters.filter((x) => x !== who);
      save();
      if (isMaster() || who === me.id || who === me.username) reply(frame("👑 MASTER", [act === "setmaster" ? `✅ ${arg} এখন মাস্টার বট` : `🗑 ${arg} আর মাস্টার না`]));
      return true;
    }
    if (act === "stop") {
      const ms = dur(arg) || DEFAULT_MS;
      st.threads[tid] = { until: Date.now() + ms };
      save();
      if (!isMaster()) reply(frame("🔇 ALLBOT STOP", [`এই গ্রুপে আমি ${left(ms)} চুপ থাকব`, "🔓 আগে চালু করতে: allbot on"]));
      return true;
    }
    if (act === "on") {
      const was = st.threads[tid];
      delete st.threads[tid]; save();
      if (!isMaster() && was) reply(frame("🔊 ALLBOT ON", ["আমি আবার চালু ✅"]));
      return true;
    }
    if (act === "status") {
      const t = st.threads[tid];
      const run = t && t.until > Date.now();
      reply(frame("📊 ALLBOT STATUS", [`🤖 @${me.username || me.id}${isMaster() ? " 👑 মাস্টার" : ""}`, run ? `🔇 বন্ধ (আর ${left(t.until - Date.now())})` : "🔊 চালু"]));
      return true;
    }
  }

  const t = st.threads[tid];
  if (t) {
    if (t.until <= Date.now()) { delete st.threads[tid]; save(); return false; }
    if (!isMaster()) return true; // সাইলেন্ট
  }
  return false;
}
module.exports = { gate, setMe };
