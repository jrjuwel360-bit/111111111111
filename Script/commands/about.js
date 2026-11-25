// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "about",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "বট সম্পর্কে তথ্য",
  commandCategory: "info",
  usages: "",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const up = U.fmtUp(process.uptime());
  const text = `╔═══ ✨ ABOUT ✨ ═══╗\n🤖 বট: ${global.config.BOTNAME || "MR JUWEL BOT"}\n📦 কমান্ড: ${global.client.commands.size}টি\n⏱ আপটাইম: ${up}\n👑 ক্রেডিট: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐\n╚══════════════╝`;
  return api.sendMessage(text, event.threadID, event.messageID);
};
