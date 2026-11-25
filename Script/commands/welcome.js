// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "welcome",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "নতুন সদস্য এলে স্বাগত বার্তা (on/off)",
  commandCategory: "group",
  usages: "[on|off]",
  cooldowns: 3
};

module.exports.run = async ({ api, event, args, Threads }) => {
  const sub = String(args[0] || "").toLowerCase();
  const t = await Threads.getData(event.threadID);
  t.data = t.data || {};
  if (sub !== "on" && sub !== "off") return api.sendMessage("👋 ওয়েলকাম এখন: " + (t.data.welcome === false ? "বন্ধ ❌" : "চালু ✅") + "\nবদলাতে: welcome on / welcome off", event.threadID, event.messageID);
  t.data.welcome = sub === "on";
  await Threads.setData(event.threadID, { data: t.data });
  api.sendMessage(sub === "on" ? "✅ ওয়েলকাম চালু হয়েছে।" : "❌ ওয়েলকাম বন্ধ হয়েছে।", event.threadID, event.messageID);
};
module.exports.handleEvent = async ({ api, event, Threads }) => {
  if (event.logMessageType !== "log:subscribe") return;
  const t = await Threads.getData(event.threadID);
  if (t.data && t.data.welcome === false) return;
  const added = (event.logMessageData.addedParticipants || []).filter((p) => String(p.userFbId) !== String(api.getCurrentUserID()));
  if (!added.length) return;
  const names = added.map((p) => p.fullName).join(", ");
  const info = await api.getThreadInfo(event.threadID).catch(() => null);
  const text = `🌸 স্বাগতম, ${names}!\n🏠 ${info ? info.threadName : "গ্রুপ"}-এ আপনাকে পেয়ে আমরা আনন্দিত।\n📜 কমান্ড দেখতে: ${global.config.PREFIX || "/"}help`;
  return api.sendMessage(text, event.threadID);
};
