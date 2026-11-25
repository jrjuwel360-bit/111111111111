// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "invitelink",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "গ্রুপের ইনভাইট লিংক",
  commandCategory: "group",
  usages: "",
  cooldowns: 10,
  aliases: ["grouplink","glink"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  try { const link = await api.telegram("exportChatInviteLink", { chat_id: threadID }); return api.sendMessage("🔗 " + link, threadID, messageID); }
  catch (e) { return api.sendMessage("❌ লিংক পাইনি: " + e.message + "\n(বট অ্যাডমিন হতে হবে)", threadID, messageID); }
};
