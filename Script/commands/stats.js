// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "stats",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "বট কতজন ইউজার/গ্রুপে চলছে",
  commandCategory: "info",
  usages: "",
  cooldowns: 10
};

module.exports.run = async ({ api, event, Users, Threads }) => {
  const users = (await Users.getAll()).length;
  const th = await Threads.getAll();
  const groups = th.filter((t) => String(t.threadID).startsWith("-")).length;
  api.sendMessage(`📊 বট পরিসংখ্যান\n👤 ইউজার: ${users}\n👥 গ্রুপ: ${groups}\n💬 প্রাইভেট চ্যাট: ${th.length - groups}\n⏱ আপটাইম: ${U.fmtUp(process.uptime())}`, event.threadID, event.messageID);
};
