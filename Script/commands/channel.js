// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "channel",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "আমাদের চ্যানেল/টিম",
  commandCategory: "telegram",
  usages: "",
  cooldowns: 5
};

module.exports.config.aliases = ["team", "bdbotteam", "চ্যানেল"];
module.exports.run = async ({ api, event }) => {
  const c = U.channel();
  return U.sendWithChannel(api, event.threadID, "📢 " + c.name + "\n\nআমাদের সাথে থাকুন, নতুন আপডেট ও বট পেতে চ্যানেলে জয়েন করুন।", event.messageID);
};
