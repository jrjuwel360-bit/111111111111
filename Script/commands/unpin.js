// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../lib/tgutil");
module.exports.config = {
  name: "unpin",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "পিন করা মেসেজ খুলুন (রিপ্লাই করলে সেটা, নইলে সব)",
  commandCategory: "group",
  usages: "[reply]",
  cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
  if (!event.isGroup) return api.sendMessage("❌ এটা শুধু গ্রুপে চলে।", event.threadID, event.messageID);
  try { await api.unpinMessage(event.threadID, event.messageReply && event.messageReply.messageID); api.sendMessage("📌 আনপিন হয়েছে।", event.threadID, event.messageID); }
  catch (e) { api.sendMessage("❌ পারিনি — বটকে অ্যাডমিন (Pin messages) করুন।", event.threadID, event.messageID); }
};
