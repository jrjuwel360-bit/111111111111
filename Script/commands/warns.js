// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "warns",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "মেম্বারের warn সংখ্যা দেখুন",
  commandCategory: "group",
  usages: "[reply | @mention | id]",
  cooldowns: 3,
  aliases: ["warnlist"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args, Threads }) => {
  const { threadID, messageID } = event;
  const d = (await Threads.getData(threadID)) || {};
  const w = d.warns || {};
  const uid = U.resolveTarget(event, args);
  if (uid) return api.sendMessage("⚠️ " + uid + " — warn: " + (w[uid] || 0) + "/3", threadID, messageID);
  const rows = Object.entries(w).map(([k, v]) => k + " → " + v + "/3");
  return api.sendMessage(rows.length ? "📋 WARN তালিকা:\n" + rows.join("\n") : "✅ কারো warn নেই।", threadID, messageID);
};
