// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "warn",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "মেম্বারকে সতর্ক করুন (৩ বারে অটো কিক)",
  commandCategory: "group",
  usages: "[reply | @mention | id] [কারণ]",
  cooldowns: 3,
  aliases: ["সতর্ক"]
};
const mid = (m) => Number(String(m).split(":").pop());

function db(Threads) { return Threads; }
async function getWarns(Threads, tid) { const d = await Threads.getData(tid); d.warns = d.warns || {}; return d; }

module.exports.run = async ({ api, event, args, Threads }) => {
  const { threadID, messageID } = event;
  const uid = U.resolveTarget(event, args);
  if (!uid) return api.sendMessage("⚠️ যাকে সতর্ক করবেন তার মেসেজে রিপ্লাই করুন বা মেনশন করুন।", threadID, messageID);
  if ((global.config.ADMINBOT || []).includes(String(uid))) return api.sendMessage("🚫 বট-অ্যাডমিনকে warn করা যায় না।", threadID, messageID);
  const d = await getWarns(Threads, threadID);
  d.warns[uid] = (d.warns[uid] || 0) + 1;
  const n = d.warns[uid];
  const reason = args.filter((a) => !/^\d{5,15}$/.test(a) && !a.startsWith("@")).join(" ");
  if (n >= 3) {
    delete d.warns[uid];
    await Threads.setData(threadID, { warns: d.warns });
    try { await api.removeUserFromGroup(uid, threadID); return api.sendMessage("⛔ ৩টা warn পূর্ণ — ইউজারকে গ্রুপ থেকে কিক করা হয়েছে।", threadID, messageID); }
    catch (e) { return api.sendMessage("⚠️ ৩টা warn পূর্ণ, কিন্তু কিক করতে পারিনি (বটকে অ্যাডমিন করুন): " + e.message, threadID, messageID); }
  }
  await Threads.setData(threadID, { warns: d.warns });
  return api.sendMessage("⚠️ WARN " + n + "/3" + (reason ? "\n📝 কারণ: " + reason : "") + "\n🆔 " + uid + "\n৩ বার হলে কিক হবে।", threadID, messageID);
};
