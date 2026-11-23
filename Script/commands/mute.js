// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../lib/tgutil");
module.exports.config = {
  name: "mute",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "কাউকে মিউট করুন (গ্রুপ-অ্যাডমিন)",
  commandCategory: "group",
  usages: "[reply|@mention|id] [10m|2h|1d]",
  cooldowns: 3
};

module.exports.run = async ({ api, event, args }) => {
  if (!event.isGroup) return api.sendMessage("❌ এটা শুধু গ্রুপে চলে।", event.threadID, event.messageID);
  const uid = U.resolveTarget(event, args);
  if (!uid) return api.sendMessage("↩️ যাকে মিউট করবেন তার মেসেজে রিপ্লাই দিন বা মেনশন করুন।\nউদাহরণ: mute 10m", event.threadID, event.messageID);
  const dur = args.map(U.parseDuration).find((x) => x) || null; // না দিলে চিরতরে
  try {
    await api.muteUser(uid, event.threadID, dur);
    api.sendMessage("🔇 মিউট করা হয়েছে" + (dur ? " (" + U.fmtDur(dur) + ")" : " (আনমিউট না করা পর্যন্ত)"), event.threadID, event.messageID);
  } catch (e) { api.sendMessage("❌ পারিনি — বটকে অ্যাডমিন (Restrict members) করুন; অ্যাডমিনকে মিউট করা যায় না।", event.threadID, event.messageID); }
};
