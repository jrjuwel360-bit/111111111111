// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "unwarn",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "একটা warn কমান্ বা সব মুছুন",
  commandCategory: "group",
  usages: "[reply | @mention | id] [all]",
  cooldowns: 3,
  aliases: ["resetwarn","clearwarn"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args, Threads }) => {
  const { threadID, messageID } = event;
  const uid = U.resolveTarget(event, args);
  if (!uid) return api.sendMessage("⚠️ রিপ্লাই/মেনশন করুন।", threadID, messageID);
  const d = (await Threads.getData(threadID)) || {}; d.warns = d.warns || {};
  if (args.includes("all")) delete d.warns[uid]; else if (d.warns[uid]) { d.warns[uid]--; if (!d.warns[uid]) delete d.warns[uid]; }
  await Threads.setData(threadID, { warns: d.warns });
  return api.sendMessage("✅ এখন warn: " + (d.warns[uid] || 0) + "/3", threadID, messageID);
};
