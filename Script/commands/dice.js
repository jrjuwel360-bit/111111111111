// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "dice",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "ডাইস/গেম ইমোজি ছুঁড়ুন 🎲🎯🏀⚽🎳🎰",
  commandCategory: "game",
  usages: "[🎲|🎯|🏀|⚽|🎳|🎰]",
  cooldowns: 3,
  aliases: ["roll"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const e = ["🎲", "🎯", "🏀", "⚽", "🎳", "🎰"].find((x) => (args[0] || "").includes(x)) || "🎲";
  try { await api.telegram("sendDice", { chat_id: threadID, emoji: e, reply_parameters: { message_id: mid(messageID), allow_sending_without_reply: true } }); }
  catch (er) { return api.sendMessage("❌ " + er.message, threadID, messageID); }
};
