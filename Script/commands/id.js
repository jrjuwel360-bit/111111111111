// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "id",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "আপনার/রিপ্লাই করা মানুষের/চ্যাটের আইডি দেখুন",
  commandCategory: "info",
  usages: "[reply]",
  cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
  const lines = [];
  const r = event.messageReply;
  if (r) {
    lines.push("👤 রিপ্লাই করা ইউজার আইডি: " + r.senderID);
  } else {
    lines.push("👤 আপনার আইডি: " + event.senderID);
    const u = event.raw && event.raw.from && event.raw.from.username;
    if (u) lines.push("🔗 ইউজারনেম: @" + u);
  }
  lines.push((event.isGroup ? "👥 গ্রুপ আইডি: " : "💬 চ্যাট আইডি: ") + event.threadID);
  return api.sendMessage(lines.join("\n"), event.threadID, event.messageID);
};
