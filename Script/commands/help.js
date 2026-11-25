// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const { ok: creditOk, CREDIT } = require("../../MR_JUWEL/credit");

module.exports.config = {
  name: "help",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "All commands, 120 per page (reply with a page number to switch) + command info",
  commandCategory: "system",
  usages: "[page number | command name]",
  cooldowns: 3
};

const PER_PAGE = 120;
const AUTO_DELETE = 5 * 60 * 1000; // ৫ মিনিট পর মেসেজ অটো ডিলিট (শেষ পেজ-বদল থেকে গোনা)
const timers = new Map();

// ── 𝙼𝚘𝚗𝚘 𝙵𝚘𝚗𝚝 ──
function toMono(text) {
  return Array.from(String(text)).map((c) => {
    const code = c.codePointAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d670 + code - 65);
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d68a + code - 97);
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7f6 + code - 48);
    return c;
  }).join("");
}

const getPrefix = () => (global.config && global.config.PREFIX) || "/";

function allNames() {
  return [...new Set([...global.client.commands.keys()].map((n) => String(n || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function renderPage(page, names, mono = true) {
  const total = Math.max(1, Math.ceil(names.length / PER_PAGE));
  page = Math.min(Math.max(1, page), total);
  const start = (page - 1) * PER_PAGE;
  const slice = names.slice(start, start + PER_PAGE);
  const pad = String(names.length).length;
  const m = mono ? toMono : (x) => String(x);
  const list = slice.map((n, i) => `【${m(String(start + i + 1).padStart(pad, "0"))}】 ➜ ${m(n)}`).join("\n");
  const text =
`┏━━━━━━━━━━━━━━━━┓
   ✿ ${toMono("COMMAND LIST")} ✿
┗━━━━━━━━━━━━━━━━┛
${list}
┏━━━━━━━━━━━━━━━━┓
  📄 ${toMono("Page")}: ${toMono(page)}/${toMono(total)}   ✦ ${toMono("Total")}: ${toMono(names.length)}
  📌 ${toMono("Info")}: ${toMono(getPrefix() + "help")} ${toMono("<cmd>")}
${total > 1 ? `  ↩️ এই মেসেজে রিপ্লাই করে পেজ নম্বর (1-${total}) লিখুন\n` : ""}┗━━━━━━━━━━━━━━━━┛`;
  return { text, page, total };
}

function fit(page, names) {
  let r = renderPage(page, names, true);
  if (r.text.length > 3900) r = renderPage(page, names, false);
  return r;
}

function scheduleDelete(api, mid, handleReplyList) {
  if (timers.has(mid)) clearTimeout(timers.get(mid));
  timers.set(mid, setTimeout(() => {
    timers.delete(mid);
    try { api.unsendMessage(mid); } catch (_) {}
    const i = handleReplyList.findIndex((h) => h.messageID === mid && h.name === "help");
    if (i !== -1) handleReplyList.splice(i, 1);
  }, AUTO_DELETE));
  if (timers.get(mid).unref) timers.get(mid).unref();
}

function creditBlocked(api, event) {
  if (creditOk(module.exports.config.credits)) return false;
  api.sendMessage("❌ Credit mismatch, system disabled.\n👑 Credit: " + CREDIT, event.threadID, event.messageID);
  return true;
}

function sendCommandInfo(api, event, commandName) {
  const { threadID, messageID } = event;
  const { commands, aliases } = global.client;
  const key = commandName.toLowerCase();
  const cmd = commands.get(key) || commands.get(aliases.get(key));
  const prefix = getPrefix();
  if (!cmd) {
    return api.sendMessage(`❌ 「 ${commandName} 」 নামে কোনো কমান্ড নেই!\n📌 সব কমান্ড: ${prefix}help`, threadID, messageID);
  }
  const cfg = cmd.config || {};
  const permMap = { 0: "👤 " + toMono("All User"), 1: "🛡️ " + toMono("Group Admin"), 2: "👑 " + toMono("Bot Admin"), 3: "🔱 " + toMono("Owner") };
  const perm = permMap[cfg.hasPermssion] || permMap[0];
  const text =
`╔════════════════╗
║  ✨ ${toMono("COMMAND INFO")} ✨
╠════════════════╣
║ 🔖 ${toMono("Name")} ⇢ ${toMono(cfg.name || commandName)}
║ 📄 ${toMono("Usage")} ⇢ ${cfg.usages || "No usage"}
║ 📜 ${toMono("Desc")} ⇢ ${cfg.description || "No description"}
║ 🔑 ${toMono("Perm")} ⇢ ${perm}
║ 👨‍💻 ${toMono("Credit")} ⇢ ${cfg.credits || "Unknown"}
║ 📂 ${toMono("Category")} ⇢ ${toMono(cfg.commandCategory || "system")}
║ ⏳ ${toMono("Cooldown")} ⇢ ${toMono(cfg.cooldowns || 0)}s
╠════════════════╣
║ ⚙ ${toMono("Prefix")} ⇢ ${toMono(prefix)}
║ 👑 ${toMono("Owner")} ⇢ ${CREDIT}
╚════════════════╝`;
  return api.sendMessage(text, threadID, messageID);
}

module.exports.run = async function ({ api, event, args }) {
  if (creditBlocked(api, event)) return;
  const { threadID, messageID, senderID } = event;
  const arg = (args && args[0] ? String(args[0]) : "").trim();
  if (arg && !/^\d+$/.test(arg)) return sendCommandInfo(api, event, arg);

  const names = allNames();
  const r = fit(arg ? Number(arg) : 1, names);
  return api.sendMessage(r.text, threadID, (err, info) => {
    if (err || !info) return;
    if (r.total > 1) global.client.handleReply.push({ name: "help", messageID: info.messageID, author: senderID, threadID });
    scheduleDelete(api, info.messageID, global.client.handleReply);
  }, messageID);
};

// ── রিপ্লাইতে পেজ নম্বর লিখলে একই মেসেজ এডিট হয়ে সেই পেজ দেখায় ──
module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (creditBlocked(api, event)) return;
  if (String(event.senderID) !== String(handleReply.author)) return;
  const names = allNames();
  const total = Math.max(1, Math.ceil(names.length / PER_PAGE));
  const n = parseInt(String(event.body || "").trim(), 10);
  if (!n || n < 1 || n > total) {
    return api.sendMessage(`⚠️ 1 থেকে ${total}-এর মধ্যে পেজ নম্বর লিখুন।`, event.threadID, event.messageID);
  }
  const r = fit(n, names);
  api.editMessage(r.text, handleReply.messageID, (err) => {
    if (err && !/not modified/i.test(err.message)) console.log("[help] edit error:", err.message);
  });
  scheduleDelete(api, handleReply.messageID, global.client.handleReply);
};
