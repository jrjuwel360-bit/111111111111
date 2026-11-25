// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "unmute",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "মিউট খুলুন (গ্রুপ-অ্যাডমিন)",
  commandCategory: "group",
  usages: "[reply|@mention|id]",
  cooldowns: 3
};

module.exports.run = async ({ api, event, args }) => {
  const uid = U.resolveTarget(event, args);
  if (!uid) return api.sendMessage("↩️ যার মিউট খুলবেন তার মেসেজে রিপ্লাই দিন বা মেনশন করুন।", event.threadID, event.messageID);
  try { await api.unmuteUser(uid, event.threadID); api.sendMessage("🔊 আনমিউট হয়েছে।", event.threadID, event.messageID); }
  catch (e) { api.sendMessage("❌ পারিনি — বটকে অ্যাডমিন (Restrict members) করুন।", event.threadID, event.messageID); }
};
