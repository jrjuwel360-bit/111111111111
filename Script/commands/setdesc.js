// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "setdesc",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "গ্রুপের ডেসক্রিপশন বদলান",
  commandCategory: "group",
  usages: "নতুন বিবরণ",
  cooldowns: 10,
  aliases: ["setdescription"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  try { await api.telegram("setChatDescription", { chat_id: threadID, description: args.join(" ").slice(0, 255) }); return api.sendMessage("✅ ডেসক্রিপশন আপডেট হয়েছে।", threadID, messageID); } catch (e) { return api.sendMessage("❌ " + e.message, threadID, messageID); }
};
