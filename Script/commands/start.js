// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../lib/tgutil");
module.exports.config = {
  name: "start",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "বট চালু/স্বাগত বার্তা",
  commandCategory: "telegram",
  usages: "",
  cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
  const P = global.config.PREFIX || "/";
  const name = event.senderName || "বন্ধু";
  const text = `👋 হ্যালো, ${name}!\n\n🤖 আমি ${global.config.BOTNAME || "MR JUWEL BOT"}\n📜 সব কমান্ড দেখতে: ${P}help\n💬 কথা বলতে লিখুন: বট`;
  return api.sendMessage(text, event.threadID, event.messageID);
};
