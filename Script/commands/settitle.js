// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "settitle",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "গ্রুপের নাম বদলান",
  commandCategory: "group",
  usages: "নতুন নাম",
  cooldowns: 10,
  aliases: ["setgroupname"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const t = args.join(" ").trim();
  if (!t) return api.sendMessage("✏️ ব্যবহার: settitle নতুন নাম", threadID, messageID);
  try { await api.telegram("setChatTitle", { chat_id: threadID, title: t.slice(0, 128) }); } catch (e) { return api.sendMessage("❌ " + e.message, threadID, messageID); }
};
