// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../lib/tgutil");
module.exports.config = {
  name: "broadcast",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "সব গ্রুপ/চ্যাটে বার্তা পাঠান (বট-অ্যাডমিন)",
  commandCategory: "admin",
  usages: "<বার্তা>",
  cooldowns: 30
};

module.exports.config.aliases = ["notice", "noti"];
module.exports.run = async ({ api, event, args, Threads }) => {
  const msg = args.join(" ").trim();
  if (!msg) return api.sendMessage("✏️ ব্যবহার: broadcast <বার্তা>", event.threadID, event.messageID);
  const list = (await Threads.getAll()).map((t) => t.threadID);
  api.sendMessage("📣 " + list.length + "টি চ্যাটে পাঠানো শুরু হচ্ছে…", event.threadID, event.messageID);
  let ok = 0, fail = 0;
  for (const id of list) {
    try { await api.sendMessage("📢 " + (global.config.BOTNAME || "Notice") + "\n\n" + msg, id); ok++; } catch (_) { fail++; }
    await new Promise((r) => setTimeout(r, 350));
  }
  api.sendMessage(`✅ পাঠানো: ${ok} | ❌ ব্যর্থ: ${fail}`, event.threadID);
};
