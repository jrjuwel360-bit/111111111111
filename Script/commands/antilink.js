// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "antilink",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "লিংক দিলে মেসেজ অটো ডিলিট (অ্যাডমিন বাদে) — on/off",
  commandCategory: "group",
  usages: "on | off",
  cooldowns: 3
};
const mid = (m) => Number(String(m).split(":").pop());

const cache = new Map();
async function isAdminIn(api, tid, uid) {
  const k = tid + ":" + uid, c = cache.get(k);
  if (c && Date.now() - c.t < 5 * 60 * 1000) return c.v;
  let v = false;
  try { const m = await api.telegram("getChatMember", { chat_id: tid, user_id: Number(uid) }); v = ["creator", "administrator"].includes(m.status); } catch (_) {}
  cache.set(k, { v, t: Date.now() });
  return v;
}
module.exports.run = async ({ api, event, args, Threads }) => {
  const { threadID, messageID } = event;
  const a = (args[0] || "").toLowerCase();
  if (!["on", "off"].includes(a)) { const d = (await Threads.getData(threadID)) || {}; return api.sendMessage("🔗 Anti-Link এখন: " + (d.antilink ? "ON ✅" : "OFF ❌") + "\nব্যবহার: antilink on | off", threadID, messageID); }
  await Threads.setData(threadID, { antilink: a === "on" });
  return api.sendMessage("🔗 Anti-Link " + (a === "on" ? "চালু ✅ (বটকে অ্যাডমিন করতে হবে)" : "বন্ধ ❌"), threadID, messageID);
};
module.exports.handleEvent = async ({ api, event, Threads }) => {
  if (!event.isGroup || !event.body || event.type === "log:subscribe") return;
  if (!/(https?:\/\/|www\.|t\.me\/|[a-z0-9-]+\.(com|net|org|xyz|me|io|link)\b)/i.test(event.body)) return;
  const d = (await Threads.getData(event.threadID)) || {};
  if (!d.antilink) return;
  if ((global.config.ADMINBOT || []).includes(String(event.senderID))) return;
  if (await isAdminIn(api, event.threadID, event.senderID)) return;
  try { await api.unsendMessage(event.messageID); api.sendMessage("🚫 " + (event.senderName || "") + ", এই গ্রুপে লিংক দেওয়া নিষেধ।", event.threadID); } catch (_) {}
};
