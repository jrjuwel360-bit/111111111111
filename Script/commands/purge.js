// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "purge",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "রিপ্লাই করা মেসেজ থেকে এখন পর্যন্ত সব মেসেজ মুছুন (সর্বোচ্চ ১০০)",
  commandCategory: "group",
  usages: "[reply]",
  cooldowns: 10,
  aliases: ["clear","clean"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply } = event;
  if (!messageReply) return api.sendMessage("⚠️ যে মেসেজ থেকে মুছবেন তাতে রিপ্লাই করে লিখুন।", threadID, messageID);
  const from = mid(messageReply.messageID), to = mid(messageID);
  const ids = []; for (let i = Math.max(from, to - 99); i <= to; i++) ids.push(i);
  try { await api.telegram("deleteMessages", { chat_id: threadID, message_ids: ids }); }
  catch (e) { return api.sendMessage("❌ মুছতে পারিনি: " + e.message + "\n(বটকে মেসেজ ডিলিটের অধিকারসহ অ্যাডমিন করুন)", threadID, messageID); }
};
