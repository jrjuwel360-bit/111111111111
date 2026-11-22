"use strict";
/**
 * MR JUWEL — Telegram Bot
 * মেসেঞ্জার বটের Mirai/Goat কমান্ডগুলো টেলিগ্রামে চালানোর রানার।
 *
 *   TELEGRAM_BOT_TOKEN=...  ADMIN_IDS=123456789  node bot.js
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("./lib/telegram");
const compat = require("./lib/compat");

process.on("unhandledRejection", (e) => console.log("[unhandledRejection]", e && e.message ? e.message : e));
process.on("uncaughtException", (e) => console.log("[uncaughtException]", e && e.stack ? e.stack : e));

/* ───────────── কনফিগ (env > config.json) ───────────── */
let fileCfg = {};
try { fileCfg = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8")); } catch (_) {}
const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== "" ? process.env[k] : fileCfg[k] !== undefined ? fileCfg[k] : d);

const TOKEN = env("TELEGRAM_BOT_TOKEN", "");
const ADMIN_IDS = String(env("ADMIN_IDS", "")).split(/[\s,]+/).filter(Boolean);
const PREFIXES = String(env("PREFIX", "/")).split(/[\s,]+/).filter(Boolean);
const BOTNAME = env("BOTNAME", "MR JUWEL BOT");
const LANGUAGE = env("LANGUAGE", "en");
const SKIP = new Set(String(env("SKIP_COMMANDS", "juwelalert,reaction-px")).split(/[\s,]+/).filter(Boolean));
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

/* ───────────── গ্লোবাল (Mirai কমান্ডগুলো যা আশা করে) ───────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
global.config = { PREFIX: PREFIXES[0], ADMINBOT: ADMIN_IDS, NDH: ADMIN_IDS, BOTNAME, language: LANGUAGE, version: "1.0.0", DeveloperMode: false, adminOnly: false, adminPaOnly: false, EXTRA_PREFIXES: PREFIXES.slice(1) };
global.configModule = {};
global.moduleData = {};
global.data = { userBanned: new Map(), threadBanned: new Map(), threadData: new Map(), threadInfo: new Map(), commandBanned: new Map(), allThreadID: [], allUserID: [], userName: new Map(), threadAllowNSFW: [], botID: "" };
global.client = { commands: new Map(), aliases: new Map(), events: new Map(), cooldowns: new Map(), handleReply: [], handleReaction: [], handleSchedule: [], api: null, configPath: path.join(__dirname, "config.json"), timeStart: Date.now() };
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

/* ───────────── কমান্ড লোডার ───────────── */
const loadReport = { loaded: [], skipped: [] };

function wrapGoat(mod) {
  // GoatBot স্টাইল (onStart/onChat) → Mirai ইন্টারফেস
  const c = mod.config;
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
      if (typeof mod.run !== "function" && typeof mod.handleEvent !== "function") { loadReport.skipped.push({ file, reason: "run/handleEvent নেই" }); continue; }
      const name = mod.config.name.toLowerCase();
      if (global.client.commands.has(name)) { loadReport.skipped.push({ file, reason: "নাম ডুপ্লিকেট: " + name }); continue; }
      global.client.commands.set(name, mod);
      for (const a of [].concat(mod.config.aliases || [])) global.client.aliases.set(String(a).toLowerCase(), name);
      if (mod.config.envConfig) global.configModule[mod.config.name] = mod.config.envConfig;
      if (typeof mod.onLoad === "function") { try { Promise.resolve(mod.onLoad({ api, models, Users, Threads, Currencies })).catch(() => {}); } catch (_) {} }
      loadReport.loaded.push(name);
    } catch (e) {
      loadReport.skipped.push({ file, reason: String(e.message || e).slice(0, 120) });
    }
  }
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

  const event = await compat.buildMessageEvent({ tg, store, msg });
  const { threadID, senderID } = event;
  if (!global.data.allThreadID.includes(threadID)) global.data.allThreadID.push(threadID);
  if (!global.data.allUserID.includes(senderID)) global.data.allUserID.push(senderID);
  global.data.userName.set(senderID, event.senderName);

  const body = event.body.trim();
  const prefix = parsePrefix(body);

  // ① handleReply
  if (event.messageReply) {
    const idx = global.client.handleReply.findIndex((h) => h.messageID === event.messageReply.messageID);
    if (idx !== -1) {
      const h = global.client.handleReply[idx];
      const cmd = global.client.commands.get(h.name);
      if (cmd && typeof cmd.handleReply === "function") {
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
    if (!c || !(c.config.usePrefix === false || c.config.hasPrefix === false)) return;
    name = first; args = words.slice(1);
  }
  if (!name) return;
  const cmd = resolveCommand(name);
  if (!cmd || typeof cmd.run !== "function") {
    if (prefix && !event.isGroup) await api.sendMessage(`❌ "${name}" নামে কোনো কমান্ড নেই। তালিকা দেখতে ${PREFIXES[0]}help লিখুন।`, threadID, event.messageID);
    return;
  }

  const isAdmin = ADMIN_IDS.includes(senderID);
  let permssion = 0;
  if (event.isGroup && (await isGroupAdmin(threadID, senderID))) permssion = 1;
  if (isAdmin) permssion = 3;
  const need = cmd.config.hasPermssion ?? cmd.config.hasPermission ?? cmd.config.permission ?? 0;
  const effective = isAdmin ? 3 : permssion;
  if (need > effective) return api.sendMessage("⛔ এই কমান্ড ব্যবহারের অনুমতি আপনার নেই।", threadID, event.messageID);

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
    await cmd.run({ api, event, args, models, Users, Threads, Currencies, permssion: effective, getText: makeGetText(cmd), commandName: cmdName, usedName: name });
  } catch (e) {
    console.log("[COMMAND ERROR]", cmdName, e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n") : e);
    api.sendMessage(`❌ "${cmdName}" চালাতে সমস্যা হয়েছে: ${e && e.message ? e.message : e}`, threadID, event.messageID);
  }
}

const warned = new Set();
const warnOnce = (tag, name, msg) => { const k = tag + name + msg; if (warned.has(k)) return; warned.add(k); console.log(`[${tag}] ${name}: ${String(msg).split("\n")[0]} (এই এরর আর দেখানো হবে না)`); };

async function runHandleEvents(event) {
  for (const [name, cmd] of global.client.commands) {
    if (typeof cmd.handleEvent !== "function") continue;
    try { await cmd.handleEvent({ api, event, models, Users, Threads, Currencies, getText: makeGetText(cmd) }); } catch (e) { warnOnce("handleEvent", name, e.message); }
  }
}

async function onReaction(r) {
  const chat = String(r.chat.id);
  const mid = compat.makeMid(chat, r.message_id);
  const emoji = (r.new_reaction || []).map((x) => x.emoji).filter(Boolean)[0] || "";
  const event = { type: "message_reaction", threadID: chat, messageID: mid, userID: r.user ? String(r.user.id) : "", senderID: r.user ? String(r.user.id) : "", reaction: emoji };
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

async function main() {
  const me = await tg.call("getMe");
  BOT_USERNAME = me.username || "";
  global.data.botID = String(me.id);
  api = compat.createApi({ tg: Object.assign(tg, {}), botInfo: me, store });
  global.client.api = api;
  console.log(`🤖 @${me.username} (${me.id}) চালু হচ্ছে…`);

  loadCommands();
  console.log(`✅ কমান্ড লোড: ${loadReport.loaded.length}টি, স্কিপ: ${loadReport.skipped.length}টি`);
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

  if (NOTIFY_START) for (const id of ADMIN_IDS) api.sendMessage(`✅ ${BOTNAME} চালু হয়েছে\n📦 কমান্ড: ${loadReport.loaded.length}টি`, id);

  if (process.env.PORT) {
    require("http").createServer((q, s) => { s.writeHead(200); s.end("ok"); }).listen(process.env.PORT, () => console.log("🌐 health server :" + process.env.PORT));
  }

  const shutdown = async (sig) => {
    if (!running) return;
    running = false;
    console.log(`\n🛑 ${sig} — বন্ধ হচ্ছে…`);
    store.save();
    try { if (offset) await tg.call("getUpdates", { offset, timeout: 0 }); } catch (_) {}
    if (NOTIFY_START) await Promise.all(ADMIN_IDS.map((id) => api.sendMessage(`🛑 ${BOTNAME} বন্ধ হচ্ছে (${sig})`, id))).catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

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
