"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * MR JUWEL — Telegram Bot (Juwel.js)
 * মেসেঞ্জার বটের Mirai/Goat কমান্ডগুলো টেলিগ্রামে চালানোর রানার।
 *
 *   TELEGRAM_BOT_TOKEN=...  ADMIN_IDS=123456789  node Juwel.js
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("./MR_JUWEL/telegram");
const compat = require("./MR_JUWEL/compat");
const credit = require("./MR_JUWEL/credit");
const fbcompat = require("./MR_JUWEL/fbcompat");
const banner = require("./MR_JUWEL/banner");
const keepalive = require("./MR_JUWEL/keepalive");
const solo = require("./includes/solo");
const reactions = require("./includes/reactions");

// ক্রেডিট-লক: রানারের ফাইলে ক্রেডিট বদলানো থাকলে বট চালু হবে না
{
  const bad = credit.verifyOwnSources(__dirname);
  if (bad.length) {
    console.error("❌ Credit mismatch, system disabled.\n👑 Credit: " + credit.CREDIT + "\n   ফাইল: " + bad.join(", "));
    process.exit(1);
  }
}

console.log(banner.big());

process.on("unhandledRejection", (e) => console.log("[unhandledRejection]", e && e.message ? e.message : e));
process.on("uncaughtException", (e) => console.log("[uncaughtException]", e && e.stack ? e.stack : e));

/* ───────────── কনফিগ (env > config.json) ───────────── */
let fileCfg = {};
try { fileCfg = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8")); } catch (_) {}
const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== "" ? process.env[k] : fileCfg[k] !== undefined ? fileCfg[k] : d);

const TOKEN = process.env.JUWEL_BOT_TOKEN || env("TELEGRAM_BOT_TOKEN", ""); // JUWEL_BOT_TOKEN বা TELEGRAM_BOT_TOKEN — দুটোর যেকোনোটা
// বট-অ্যাডমিন: config.json-এর ADMIN_IDS + (GitHub/Render/Railway) ENV ADMIN_IDS — দুটোই মেলানো হয়
const ADMIN_IDS = [...new Set([process.env.JUWEL_UID, process.env.ADMIN_IDS, fileCfg.ADMIN_IDS].flatMap((v) => String(v || "").split(/[\s,]+/)).filter(Boolean))];
const ADMIN_NAMES = String(env("ADMIN_NAMES", "")).split("|").map((x) => x.trim()).filter(Boolean);
const PREFIXES = String(env("PREFIX", "/")).split(/[\s,]+/).filter(Boolean);
const BOTNAME = env("BOTNAME", "MR JUWEL BOT");
const LANGUAGE = env("LANGUAGE", "en");
const SKIP = new Set(String(env("SKIP_COMMANDS", "juwelalert,reaction-px")).split(/[\s,]+/).filter(Boolean));
const NO_PREFIX = String(env("NO_PREFIX", "1")) !== "0";
const NOTIFY_START = String(env("NOTIFY_START", "1")) !== "0";
const DATA_FILE = path.join(__dirname, "data", "db.json");

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN পাওয়া যায়নি। @BotFather থেকে টোকেন নিয়ে env/Secret-এ দিন।");
  process.exit(1);
}

const tg = createClient(TOKEN);
const store = compat.createStore(DATA_FILE);
const { Users, Threads, Currencies } = store;
const models = {};
const avatars = fbcompat.install({ tg, store });

/* ───────────── আপটাইম: রিস্টার্টের পরেও চলতে থাকে ─────────────
 * startedAt ও heartbeat data/db.json-এ থাকে (GitHub Actions ক্যাশে রান থেকে রানে যায়)।
 * শেষ heartbeat UPTIME_GAP_MIN মিনিটের মধ্যে হলে ধরে নেওয়া হয় বট "একটানা" চলছে → আপটাইম বজায় থাকে।
 * তার চেয়ে বেশি সময় বন্ধ থাকলে (বট সত্যিই বন্ধ ছিল) আপটাইম নতুন করে শুরু হয়। */
const UPTIME_GAP_MS = Number(env("UPTIME_GAP_MIN", 45)) * 60 * 1000;
const meta = (store.raw.meta = store.raw.meta || {});
const bootNow = Date.now();
const continued = !!(meta.startedAt && meta.lastBeat && bootNow - meta.lastBeat >= 0 && bootNow - meta.lastBeat < UPTIME_GAP_MS);
if (!continued) { meta.startedAt = bootNow; meta.stats = { cmds: 0, msgs: 0 }; }
meta.lastBeat = bootNow;
meta.restarts = continued ? (meta.restarts || 0) + 1 : 0;
process.__powerUptimePatched = true; // includes/power.js নিজের আপটাইম বসাবে না
process.uptime = () => (Date.now() - meta.startedAt) / 1000;
global.__uptimeStats = meta.stats = meta.stats || { cmds: 0, msgs: 0 };
setInterval(() => { meta.lastBeat = Date.now(); meta.stats = global.__uptimeStats; store.touch(); }, 30000).unref();
const fmtUp = (ms) => { const t = Math.floor(ms / 1000); return `${Math.floor(t / 86400)}d ${Math.floor((t % 86400) / 3600)}h ${Math.floor((t % 3600) / 60)}m`; };

/* ───────────── গ্লোবাল (Mirai কমান্ডগুলো যা আশা করে) ───────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
global.config = { ADMIN_NAMES, PREFIX: PREFIXES[0], ADMINBOT: ADMIN_IDS, NDH: ADMIN_IDS, BOTNAME, language: LANGUAGE, version: "1.0.0", DeveloperMode: false, adminOnly: false, adminPaOnly: false, EXTRA_PREFIXES: PREFIXES.slice(1), CHANNEL: { name: env("CHANNEL_NAME", "বিডি বট টিম (BD Bot Team)"), url: env("CHANNEL_URL", "") } };
global.configModule = {};
global.moduleData = {};
global.data = { userBanned: new Map(), threadBanned: new Map(), threadData: new Map(), threadInfo: new Map(), commandBanned: new Map(), allThreadID: [], allUserID: [], userName: new Map(), threadAllowNSFW: [], botID: "" };
global.client = { commands: new Map(), aliases: new Map(), events: new Map(), cooldowns: new Map(), handleReply: [], handleReaction: [], handleSchedule: [], api: null, configPath: path.join(__dirname, "config.json") };
// power.js "bot on" দিলে timeStart রিসেট করে → সেটাই আপটাইম রিসেট
Object.defineProperty(global.client, "timeStart", { get: () => meta.startedAt, set: (v) => { meta.startedAt = v; store.touch(); }, enumerable: true });
global.nodemodule = new Proxy({}, { get: (t, k) => { if (typeof k !== "string") return undefined; if (!(k in t)) t[k] = require(k); return t[k]; } });
global.getText = () => "";
global.utils = {
  throwError(command, threadID, messageID) {
    const cmd = global.client.commands.get(command);
    return global.client.api.sendMessage(`⚠️ ভুল ব্যবহার! সঠিক নিয়ম:\n${PREFIXES[0]}${command} ${(cmd && cmd.config.usages) || ""}`.trim(), threadID, messageID);
  },
  async downloadFile(url, dest) { const r = await fetch(url); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); },
  randomString(n = 8) { const c = "abcdefghijklmnopqrstuvwxyz0123456789"; let s = ""; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; },
  async getUID(link) { return null; },
};
global.isDeveloper = (id) => ADMIN_IDS.includes(String(id));

let api; // main() এ বসবে
let power = null; // বট অন/অফ গেট

/* ───────────── কমান্ড লোডার ───────────── */
const loadReport = { loaded: [], skipped: [], total: 0 };

function wrapGoat(mod) {
  // GoatBot স্টাইল (onStart/onChat) → Mirai ইন্টারফেস
  const c = mod.config;
  if (c.credits === undefined && c.author !== undefined) c.credits = c.author;
  c.hasPermssion = c.hasPermssion ?? c.role ?? 0;
  c.cooldowns = c.cooldowns ?? c.countDown ?? 1;
  c.commandCategory = c.commandCategory ?? c.category ?? "other";
  const message = (event) => ({
    reply: (m, cb) => api.sendMessage(m, event.threadID, cb, event.messageID),
    send: (m, tid, cb) => api.sendMessage(m, tid || event.threadID, cb),
    unsend: (mid) => api.unsendMessage(mid),
    reaction: (e, mid) => api.setMessageReaction(e, mid || event.messageID),
    err: (m) => api.sendMessage("❌ " + (m && m.message ? m.message : m), event.threadID, event.messageID),
  });
  const getLang = (m) => (key, ...v) => { let s = ((m.langs && (m.langs[LANGUAGE] || m.langs.en)) || {})[key] || key; v.forEach((x, i) => (s = s.replace(new RegExp("%" + (i + 1), "g"), x))); return s; };
  if (typeof mod.onStart === "function" && typeof mod.run !== "function")
    mod.run = (o) => mod.onStart({ ...o, message: message(o.event), usersData: Users, threadsData: Threads, role: o.permssion, commandName: c.name, prefix: PREFIXES[0], getLang: getLang(mod) });
  if (typeof mod.onChat === "function" && typeof mod.handleEvent !== "function")
    mod.handleEvent = (o) => mod.onChat({ ...o, message: message(o.event), usersData: Users, threadsData: Threads, getLang: getLang(mod), prefix: PREFIXES[0], commandName: c.name });
  if (typeof mod.onReply === "function" && typeof mod.handleReply !== "function")
    mod.handleReply = (o) => mod.onReply({ ...o, message: message(o.event), Reply: o.handleReply, usersData: Users, threadsData: Threads, getLang: getLang(mod), commandName: c.name });
}

function loadCommands() {
  const dir = path.join(__dirname, "Script", "commands");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort();
  loadReport.total = files.length;
  for (const file of files) {
    const base = file.replace(/\.js$/, "");
    if (SKIP.has(base)) { loadReport.skipped.push({ file, reason: "SKIP_COMMANDS-এ আছে" }); continue; }
    let mod;
    try {
      mod = require(path.join(dir, file));
    } catch (e) {
      loadReport.skipped.push({ file, reason: String(e.message || e).split("\n")[0].slice(0, 120) });
      continue;
    }
    try {
      if (!mod || !mod.config || typeof mod.config.name !== "string") { loadReport.skipped.push({ file, reason: "config.name নেই" }); continue; }
      wrapGoat(mod);
      if (!credit.ok(mod.config.credits)) { loadReport.skipped.push({ file, reason: "ক্রেডিট মেলেনি (Credit mismatch)" }); continue; }
      if (typeof mod.run !== "function" && typeof mod.handleEvent !== "function") { loadReport.skipped.push({ file, reason: "run/handleEvent নেই" }); continue; }
      const name = mod.config.name.toLowerCase();
      if (global.client.commands.has(name)) { loadReport.skipped.push({ file, reason: "নাম ডুপ্লিকেট: " + name }); continue; }
      global.client.commands.set(name, mod);
      for (const a of [].concat(mod.config.aliases || [])) global.client.aliases.set(String(a).toLowerCase(), name);
      if (mod.config.envConfig) global.configModule[mod.config.name] = mod.config.envConfig;
      if (typeof mod.onLoad === "function") { try { Promise.resolve(mod.onLoad({ api, models, Users, Threads, Currencies })).catch(() => {}); } catch (_) {} }
      loadReport.loaded.push(name);
      banner.loaded(loadReport.loaded.length, files.length, name);
    } catch (e) {
      loadReport.skipped.push({ file, reason: String(e.message || e).slice(0, 120) });
    }
  }
}

let _sim = null;
try { _sim = require("string-similarity"); } catch (_) {}
function diceRating(a, b) {
  const bg = (t) => { const m = new Map(); for (let i = 0; i < t.length - 1; i++) { const g = t.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
  const A = bg(a), B = bg(b); let hit = 0;
  for (const [g, n] of A) hit += Math.min(n, B.get(g) || 0);
  return (2 * hit) / (a.length + b.length - 2);
}
function suggestCommand(name) {
  const all = [...global.client.commands.keys(), ...global.client.aliases.keys()].map(String);
  if (!all.length) return null;
  let best = null, rate = 0;
  if (_sim) { const r = _sim.findBestMatch(name, all); best = r.bestMatch.target; rate = r.bestMatch.rating; }
  else for (const c of all) { const r = diceRating(name, c); if (r > rate) { rate = r; best = c; } }
  if (!best || rate < 0.4) return null;
  const real = global.client.commands.has(best) ? best : global.client.aliases.get(best);
  return real && global.client.commands.has(real) ? real : null;
}

function adminNames() {
  if (ADMIN_NAMES.length) return ADMIN_NAMES.join(" • ");
  return ADMIN_IDS.map((id) => (store.raw.users && store.raw.users[id] && store.raw.users[id].name) || id).join(" • ") || "—";
}

// গ্রুপের অ্যাডমিনদের ইউজারনেম চিনে রাখি, যাতে @মেনশন কাজ করে
const adminSeen = new Map();
async function learnAdmins(chat) {
  if (!String(chat).startsWith("-")) return;
  if (Date.now() - (adminSeen.get(chat) || 0) < 30 * 60 * 1000) return;
  adminSeen.set(chat, Date.now());
  try { for (const a of await tg.call("getChatAdministrators", { chat_id: chat })) compat.rememberUser(store, a.user, chat); } catch (_) {}
}

const resolveCommand = (n) => global.client.commands.get(n) || global.client.commands.get(global.client.aliases.get(n));

function makeGetText(cmd) {
  return (...v) => {
    const langs = cmd.languages || {};
    const table = langs[LANGUAGE] || langs.en || {};
    let s = table[v[0]] || "";
    for (let i = v.length - 1; i > 0; i--) s = s.replace(new RegExp("%" + i, "g"), v[i]);
    return s;
  };
}

/* ───────────── পারমিশন / কুলডাউন ───────────── */
const adminCache = new Map();
async function isGroupAdmin(chat, uid) {
  const c = adminCache.get(chat);
  if (c && Date.now() - c.t < 60000) return c.ids.includes(uid);
  try {
    const admins = await tg.call("getChatAdministrators", { chat_id: chat });
    const ids = admins.map((a) => String(a.user.id));
    adminCache.set(chat, { t: Date.now(), ids });
    return ids.includes(uid);
  } catch (_) { return false; }
}

/* ───────────── মেসেজ ডিসপ্যাচ ───────────── */
let BOT_USERNAME = "";
function parsePrefix(body) {
  for (const p of PREFIXES) if (body.startsWith(p)) return p;
  return "";
}

async function onMessage(msg) {
  if (msg.from && msg.from.is_bot) return;
  // সার্ভিস ইভেন্ট (জয়েন/লিভ)
  const memberEvents = compat.buildMemberEvents({ store, msg });
  for (const ev of memberEvents) await runHandleEvents(ev);
  if (!msg.text && !msg.caption && !msg.photo && !msg.video && !msg.audio && !msg.voice && !msg.document && !msg.sticker && !msg.animation && !msg.location) return;

  const event = await compat.buildMessageEvent({ tg, store, msg, botId: global.data.botID });
  const { threadID, senderID } = event;
  if (!global.data.allThreadID.includes(threadID)) global.data.allThreadID.push(threadID);
  if (!global.data.allUserID.includes(senderID)) global.data.allUserID.push(senderID);
  global.data.userName.set(senderID, event.senderName);

  reactions.trackIncoming(event);
  await learnAdmins(threadID);
  try { if (solo.gate(api, event, ADMIN_IDS)) return; } catch (e) { console.log("[solo]", e.message); }
  if (power) { try { if (power.gate(api, event)) return; } catch (e) { console.log("[power]", e.message); } }

  const body = event.body.trim();
  const prefix = parsePrefix(body);

  const wantAvatars = () => avatars.prefetch([senderID, ...Object.keys(event.mentions || {}), event.messageReply && event.messageReply.senderID, ...(event.body.match(/\b\d{6,15}\b/g) || [])]);

  // ① handleReply
  if (event.messageReply) {
    const idx = global.client.handleReply.findIndex((h) => h.messageID === event.messageReply.messageID);
    if (idx !== -1) {
      const h = global.client.handleReply[idx];
      const cmd = global.client.commands.get(h.name);
      if (cmd && typeof cmd.handleReply === "function") {
        await wantAvatars();
        try { await cmd.handleReply({ api, event, models, Users, Threads, Currencies, handleReply: h, getText: makeGetText(cmd) }); } catch (e) { console.log("[handleReply]", h.name, e.message); }
        return;
      }
    }
  }

  // ② handleEvent (সব মেসেজে)
  runHandleEvents(event);

  // ③ কমান্ড
  let name = "", args = [];
  const words = body.slice(prefix.length).trim().split(/\s+/);
  if (prefix) {
    name = (words.shift() || "").toLowerCase();
    if (name.includes("@")) { const [n, bot] = name.split("@"); if (BOT_USERNAME && bot !== BOT_USERNAME.toLowerCase()) return; name = n; }
    args = words;
  } else {
    // no-prefix কমান্ড
    const first = (words[0] || "").toLowerCase();
    const c = resolveCommand(first);
    if (!c) return;
    // আপনার মেসেঞ্জার বটের নিয়ম: কমান্ডে usePrefix true/false দেওয়া থাকলে সেটাই, নইলে গ্লোবাল (NO_PREFIX=0 দিলে বন্ধ)
    const per = c.config.usePrefix;
    const allowNoPrefix = per === true || per === false ? per : NO_PREFIX;
    if (!allowNoPrefix) return;
    name = first; args = words.slice(1);
  }
  if (!name) return;
  const cmd = resolveCommand(name);
  if (!cmd || typeof cmd.run !== "function") {
    if (prefix) {
      const sg = suggestCommand(name);
      const P = prefix || PREFIXES[0];
      const text = sg
        ? `╭──────────────╮\n│ ⚠️ 𝗪𝗥𝗢𝗡𝗚 𝗖𝗠𝗗 \n╰──────────────╯\n❌ "${name}" নামে কোনো কমান্ড বটে নেই 🤦‍♂️\n✅ সঠিক কমান্ড হবে: "${P}${sg}"`
        : `╭──────────────╮\n│ ⚠️ 𝗪𝗥𝗢𝗡𝗚 𝗖𝗠𝗗 \n╰──────────────╯\n❌ "${name}" নামে কোনো কমান্ড বটে নেই 🤦‍♂️\n💡 কমান্ডের তালিকা দেখতে ${P}help লিখো`;
      await api.sendMessage(text, threadID, event.messageID);
    }
    return;
  }

  // @ইউজারনেম চেনা না গেলে স্পষ্ট করে জানাই (আগে শুধু "কাউকে মেনশন করো" আসত)
  if (event.unresolved && event.unresolved.length && !Object.keys(event.mentions || {}).length) {
    return api.sendMessage(`⚠️ ${event.unresolved.join(", ")} কে আমি চিনতে পারছি না (সে এখনো এই গ্রুপে কিছু লেখেনি)।\n✅ সমাধান: তার যেকোনো মেসেজে রিপ্লাই করে কমান্ড দিন, অথবা তার ইউজার আইডি (সংখ্যা) লিখুন।`, threadID, event.messageID);
  }

  // বট অ্যাডমিন না হলে ও Group Privacy চালু থাকলে সাধারণ লেখা দেখা যায় না — গ্রুপে একবার জানাই
  if (event.isGroup && privacyOn) {
    const th = store.thread(threadID);
    if (!th.privHint) {
      th.privHint = 1; store.touch();
      try {
        const m = await tg.call("getChatMember", { chat_id: threadID, user_id: global.data.botID });
        if (!["administrator", "creator"].includes(m.status)) api.sendMessage("⚠️ আমি এখানে অ্যাডমিন না, তাই সবার সাধারণ লেখা ('বট', প্রিফিক্স ছাড়া কমান্ড) দেখতে পাচ্ছি না — শুধু /কমান্ড দেখছি।\n✅ গ্রুপ অ্যাডমিন আমাকে অ্যাডমিন করে দিলে সবাই সব ব্যবহার করতে পারবে।", threadID);
      } catch (_) {}
    }
  }

  const isAdmin = ADMIN_IDS.includes(senderID);
  let permssion = 0;
  if (event.isGroup && (await isGroupAdmin(threadID, senderID))) permssion = 1;
  if (isAdmin) permssion = 3;
  const need = cmd.config.hasPermssion ?? cmd.config.hasPermission ?? cmd.config.permission ?? 0;
  const effective = isAdmin ? 3 : permssion;
  if (need > effective) {
    const who = event.senderName || "বন্ধু";
    const text = need >= 2
      ? `╭──────────────╮\n  🚫 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗 \n╰──────────────╯\n👤 ${who}, এটা কমান্ড শুধু আমার বস  🐸\n👑 বট অ্যাডমিন: ${adminNames()} ব্যাবহার করতে পারবে🎀🙌\n⌨️ প্রিফিক্স: ${PREFIXES.join(" ")}\n🤖 বট: ${BOTNAME}`
      : `╭──────────────╮\n  🚫 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗 \n╰──────────────╯\n👤 ${who}, এটা কমান্ড শুধু গ্রুপ অ্যাডমিন ব্যবহার করতে পারবে 🛡️`;
    return api.sendMessage(text, threadID, event.messageID);
  }

  const cmdName = cmd.config.name;
  if (!global.client.cooldowns.has(cmdName)) global.client.cooldowns.set(cmdName, new Map());
  const stamps = global.client.cooldowns.get(cmdName);
  const wait = (cmd.config.cooldowns || 1) * 1000;
  const now = Date.now();
  if (!isAdmin && stamps.has(senderID) && now < stamps.get(senderID) + wait)
    return api.sendMessage(`⏳ ${Math.ceil((stamps.get(senderID) + wait - now) / 1000)} সেকেন্ড পরে আবার চেষ্টা করুন।`, threadID, event.messageID);
  stamps.set(senderID, now);

  api.sendTypingIndicator(threadID);
  try {
    await wantAvatars();
    await cmd.run({ api, event, args, models, Users, Threads, Currencies, permssion: effective, getText: makeGetText(cmd), commandName: cmdName, usedName: name });
  } catch (e) {
    console.log("[COMMAND ERROR]", cmdName, e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n") : e);
    api.sendMessage(`❌ "${cmdName}" চালাতে সমস্যা হয়েছে: ${e && e.message ? e.message : e}`, threadID, event.messageID);
  }
}

const warned = new Set();
const warnOnce = (tag, name, msg) => { const k = tag + name + msg; if (warned.has(k)) return; warned.add(k); console.log(`[${tag}] ${name}: ${String(msg).split("\n")[0]} (এই এরর আর দেখানো হবে না)`); };

async function runHandleEvents(event) {
  // Mirai-র মতো: সব handleEvent একসাথে (একটা আটকে থাকলে বাকিগুলো থামে না)
  const jobs = [];
  for (const [name, cmd] of global.client.commands) {
    if (typeof cmd.handleEvent !== "function") continue;
    jobs.push(
      Promise.resolve()
        .then(() => cmd.handleEvent({ api, event, models, Users, Threads, Currencies, getText: makeGetText(cmd) }))
        .catch((e) => warnOnce("handleEvent", name, e && e.message))
    );
  }
  await Promise.all(jobs);
}

async function onReaction(r) {
  const chat = String(r.chat.id);
  const mid = compat.makeMid(chat, r.message_id);
  const emoji = (r.new_reaction || []).map((x) => x.emoji).filter(Boolean)[0] || "";
  const event = { type: "message_reaction", threadID: chat, messageID: mid, userID: r.user ? String(r.user.id) : "", senderID: r.user ? String(r.user.id) : "", reaction: emoji };
  try { if (await reactions.handle({ api, event, adminIds: ADMIN_IDS })) return; } catch (e) { console.log("[reactions]", e.message); }
  for (const h of global.client.handleReaction.filter((x) => x.messageID === mid)) {
    const cmd = global.client.commands.get(h.name);
    if (cmd && typeof cmd.handleReaction === "function") {
      try { await cmd.handleReaction({ api, event, models, Users, Threads, Currencies, handleReaction: h, getText: makeGetText(cmd) }); } catch (e) { console.log("[handleReaction]", h.name, e.message); }
    }
  }
}

/* handleReply/Reaction লিস্ট বেড়ে মেমোরি না খায় */
setInterval(() => {
  for (const k of ["handleReply", "handleReaction"]) { const a = global.client[k]; if (a.length > 500) a.splice(0, a.length - 500); }
}, 60000).unref();

/* ───────────── মেইন ───────────── */
let running = true;
let offset = 0;

let privacyOn = false;
async function countGroups() {
  const ids = Object.keys(store.raw.threads || {}).filter((id) => id.startsWith("-"));
  let alive = 0, dead = 0;
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(ids.slice(i, i + 10).map(async (id) => {
      try {
        const m = await tg.call("getChatMember", { chat_id: id, user_id: global.data.botID });
        if (m && !["left", "kicked"].includes(m.status)) alive++; else dead++;
      } catch (e) { if (e.code === 400 || e.code === 403) dead++; else alive++; }
    }));
  }
  return { alive, dead, total: ids.length };
}

async function main() {
  const me = await tg.call("getMe");
  BOT_USERNAME = me.username || "";
  global.data.botID = String(me.id);
  api = compat.createApi({ tg: Object.assign(tg, {}), botInfo: me, store });
  global.client.api = api;
  try { power = require("./includes/power"); power.guardApi(api); } catch (e) { console.log("[power] লোড হয়নি:", e.message); }
  reactions.trackSend(api);
  solo.setMe(me);
  banner.say(`${banner.NAME}  🤖 @${me.username} (${me.id}) চালু হচ্ছে…`);

  loadCommands();
  banner.say(`${banner.NAME}  ✅ কমান্ড লোড: ${loadReport.loaded.length}টি, স্কিপ: ${loadReport.skipped.length}টি`);
  if (process.env.SHOW_SKIPPED === "1") for (const s of loadReport.skipped) console.log(`   ⏭  ${s.file} — ${s.reason}`);
  if (!ADMIN_IDS.length) console.log("⚠️  ADMIN_IDS সেট নেই — অ্যাডমিন-কমান্ড কেউ চালাতে পারবে না।");

  try { await tg.call("deleteWebhook", { drop_pending_updates: false }); } catch (_) {}
  try {
    const list = [];
    for (const [name, cmd] of global.client.commands) {
      if (typeof cmd.run !== "function" || !/^[a-z0-9_]{1,32}$/.test(name)) continue;
      if (String(cmd.config.commandCategory || "").toLowerCase() === "nsfw") continue;
      if ((cmd.config.hasPermssion || 0) > 0) continue;
      list.push({ command: name, description: String(cmd.config.description || cmd.config.commandCategory || name).replace(/\s+/g, " ").slice(0, 100) || name });
      if (list.length >= 100) break;
    }
    await tg.call("setMyCommands", { commands: list });
  } catch (e) { console.log("[setMyCommands]", e.message); }

  const ka = keepalive.start();
  const groups = await countGroups();
  const platform = process.env.GITHUB_ACTIONS ? "GitHub Actions" : process.env.RENDER ? "Render" : process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID ? "Railway" : "Local/Other";
  privacyOn = me.can_read_all_group_messages === false;
  if (privacyOn) console.log("⚠️ Group Privacy চালু — গ্রুপে সাধারণ লেখা (যেমন 'বট') বট দেখতে পাবে না। BotFather → /setprivacy → Disable।");
  if (NOTIFY_START) {
    const head = continued ? `🔄 ${BOTNAME} রিস্টার্ট হয়ে আবার চালু (আপটাইম বজায় আছে: ${fmtUp(Date.now() - meta.startedAt)})` : `✅ ${BOTNAME} চালু হয়েছে`;
    const warn = privacyOn ? "\n\n⚠️ Group Privacy চালু আছে: গ্রুপে 'বট' লিখলে বট দেখতে পাবে না, শুধু /কমান্ড ও রিপ্লাই দেখবে।\nসমাধান: @BotFather → /mybots → বট → Bot Settings → Group Privacy → Turn off, তারপর বটকে গ্রুপ থেকে সরিয়ে আবার অ্যাড করুন।" : "";
    for (const id of ADMIN_IDS) api.sendMessage(`${head}\n👥 গ্রুপ: ${groups.alive}টি\n📦 কমান্ড: ${loadReport.loaded.length}টি${loadReport.skipped.length ? " | স্কিপ: " + loadReport.skipped.length + "টি" : ""}${warn}`, id);
  }

  const shutdown = async (sig) => {
    if (!running) return;
    running = false;
    console.log(`\n🛑 ${sig} — বন্ধ হচ্ছে…`);
    meta.lastBeat = Date.now(); meta.stats = global.__uptimeStats;
    store.save();
    try { if (offset) await tg.call("getUpdates", { offset, timeout: 0 }); } catch (_) {}
    if (NOTIFY_START) await Promise.all(ADMIN_IDS.map((id) => api.sendMessage(`🔁 ${BOTNAME}: ৬ ঘণ্টার সাইকেল শেষ, রিস্টার্ট হচ্ছে — আপটাইম ধরে রাখা হয়েছে (${fmtUp(Date.now() - meta.startedAt)})`, id))).catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  banner.final([
    ["👑 Owner", banner.NAME],
    ["🛡 মালিকের নাম", adminNames()],
    ["🏷 বটের নাম", BOTNAME],
    ["🤖 Bot", `${me.first_name} (@${me.username})`],
    ["🆔 Bot ID", me.id],
    ["✅ Telegram", "কানেক্টেড — polling চালু"],
    ["👥 গ্রুপে চালু", `${groups.alive}টি${groups.dead ? ` (বাদ: ${groups.dead}টি যেখানে বট নেই)` : ""}`],
    ["👤 পরিচিত ইউজার", Object.keys(store.raw.users || {}).length],
    ["📦 কমান্ড", `${loadReport.loaded.length}টি লোড, ${loadReport.skipped.length}টি স্কিপ`],
    ["⌨️ প্রিফিক্স", PREFIXES.join(" ") + (NO_PREFIX ? "  (নো-প্রিফিক্সও চালু)" : "")],
    ["🛡 বট-অ্যাডমিন", ADMIN_IDS.join(", ") || "নেই"],
    ["🕒 চালু হয়েছে", new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }) + " (BD)"],
    ["⚡ লোড সময়", ((Date.now() - bootNow) / 1000).toFixed(1) + " সেকেন্ড"],
    ["⏱ আপটাইম", fmtUp(Date.now() - meta.startedAt) + (continued ? " (বজায় আছে)" : " (নতুন)")],
    ["🌐 হোস্ট", platform + (ka.mode !== "off" ? ` • keepalive: ${ka.mode}` : "")],
    ["🔒 Group Privacy", privacyOn ? "চালু ⚠️ (BotFather → /setprivacy → Disable)" : "বন্ধ ✅"],
  ]);

  let backoff = 1000;
  while (running) {
    try {
      const updates = await tg.call("getUpdates", { offset, timeout: Number(process.env.POLL_TIMEOUT || 30), allowed_updates: ["message", "message_reaction"] });
      backoff = 1000;
      for (const u of updates) {
        offset = u.update_id + 1;
        if (u.message) onMessage(u.message).catch((e) => console.log("[onMessage]", e && e.message));
        else if (u.message_reaction) onReaction(u.message_reaction).catch((e) => console.log("[onReaction]", e && e.message));
      }
    } catch (e) {
      if (!running) break;
      if (e.code === 409) { console.log("⚠️ আরেকটা ইনস্ট্যান্স polling করছে (409) — ১০ সেকেন্ড অপেক্ষা"); await sleep(10000); continue; }
      if (e.code === 401) { console.error("❌ টোকেন ভুল (401)। বন্ধ হচ্ছে।"); process.exit(1); }
      console.log("[poll]", e.message);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 30000);
    }
  }
}

main().catch((e) => { console.error("❌ স্টার্ট ব্যর্থ:", e.message); process.exit(1); });
