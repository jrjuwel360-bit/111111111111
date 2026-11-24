// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../lib/tgutil");
module.exports.config = {
  name: "pin",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "রিপ্লাই করা মেসেজ পিন করুন (গ্রুপ-অ্যাডমিন)",
  commandCategory: "group",
  usages: "[reply]",
  cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
  if (!event.isGroup) return api.sendMessage("❌ এটা শুধু গ্রুপে চলে।", event.threadID, event.messageID);
  if (!event.messageReply) return api.sendMessage("↩️ যে মেসেজ পিন করবেন তাতে রিপ্লাই দিয়ে লিখুন: pin", event.threadID, event.messageID);
  try { await api.pinMessage(event.messageReply.messageID); }
  catch (e) { return api.sendMessage("❌ পিন করতে পারিনি — বটকে গ্রুপে অ্যাডমিন (Pin messages অনুমতি) করুন।", event.threadID, event.messageID); }
};
