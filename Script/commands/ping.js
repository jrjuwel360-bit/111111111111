// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "ping",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "বটের রেসপন্স টাইম",
  commandCategory: "info",
  usages: "",
  cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
  const t = Date.now();
  api.sendMessage("🏓 ...", event.threadID, (err, info) => {
    if (err || !info) return;
    const ms = Date.now() - t;
    api.editMessage("🏓 পং! " + ms + "ms\n⏱ আপটাইম: " + U.fmtUp(process.uptime()), info.messageID);
  }, event.messageID);
};
