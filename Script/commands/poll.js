// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "poll",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "পোল বানান",
  commandCategory: "group",
  usages: "প্রশ্ন | অপশন১ | অপশন২ ...",
  cooldowns: 10
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const parts = args.join(" ").split("|").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return api.sendMessage("📊 ব্যবহার: poll প্রশ্ন | অপশন১ | অপশন২ | ...", threadID, messageID);
  try { await api.telegram("sendPoll", { chat_id: threadID, question: parts[0].slice(0, 300), options: parts.slice(1, 11).map((o) => o.slice(0, 100)), is_anonymous: false, reply_parameters: { message_id: mid(messageID), allow_sending_without_reply: true } }); }
  catch (e) { return api.sendMessage("❌ " + e.message, threadID, messageID); }
};
