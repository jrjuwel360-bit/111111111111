// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "admins",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "গ্রুপের অ্যাডমিন তালিকা",
  commandCategory: "group",
  usages: "",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  if (!event.isGroup) return api.sendMessage("❌ এটা শুধু গ্রুপে চলে।", event.threadID, event.messageID);
  try {
    const info = await api.getThreadInfo(event.threadID);
    const lines = info.userInfo.map((u, i) => (i + 1) + ". " + (u.name || u.id) + " (" + u.id + ")");
    api.sendMessage("👑 " + info.threadName + " — অ্যাডমিন (" + lines.length + ")\n\n" + lines.join("\n"), event.threadID, event.messageID);
  } catch (e) { api.sendMessage("❌ তালিকা আনতে পারিনি।", event.threadID, event.messageID); }
};
