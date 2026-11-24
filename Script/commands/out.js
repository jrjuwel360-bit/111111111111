// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../lib/tgutil");
module.exports.config = {
  name: "out",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "বট গ্রুপ থেকে বের হবে (বট-অ্যাডমিন)",
  commandCategory: "admin",
  usages: "[গ্রুপ আইডি]",
  cooldowns: 5
};

module.exports.config.aliases = ["leave"];
module.exports.run = async ({ api, event, args }) => {
  const id = /^-?\d{5,}$/.test(args[0] || "") ? args[0] : event.threadID;
  if (!String(id).startsWith("-")) return api.sendMessage("❌ এটা গ্রুপ নয়।", event.threadID, event.messageID);
  try { if (id !== event.threadID) await api.sendMessage("👋 বট এই গ্রুপ ছেড়ে যাচ্ছে।", id).catch(() => {}); else await api.sendMessage("👋 বিদায়!", id).catch(() => {}); await api.leaveChat(id); }
  catch (e) { api.sendMessage("❌ বের হতে পারিনি: " + e.message, event.threadID, event.messageID); }
};
