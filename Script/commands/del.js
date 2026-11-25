// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "del",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "রিপ্লাই করা মেসেজ মুছুন (গ্রুপ-অ্যাডমিন)",
  commandCategory: "group",
  usages: "[reply]",
  cooldowns: 2
};

module.exports.config.aliases = ["delete", "rm"];
module.exports.run = async ({ api, event }) => {
  if (!event.messageReply) return api.sendMessage("↩️ যে মেসেজ মুছবেন তাতে রিপ্লাই দিয়ে লিখুন: del", event.threadID, event.messageID);
  try { await api.unsendMessage(event.messageReply.messageID); await api.unsendMessage(event.messageID); }
  catch (e) { api.sendMessage("❌ মুছতে পারিনি — বটকে অ্যাডমিন (Delete messages) করুন।", event.threadID, event.messageID); }
};
