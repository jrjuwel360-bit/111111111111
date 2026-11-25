// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "groupinfo",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "গ্রুপের তথ্য (নাম, আইডি, সদস্য, অ্যাডমিন)",
  commandCategory: "info",
  usages: "",
  cooldowns: 10,
  aliases: ["ginfo","chatinfo"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  if (!event.isGroup) return api.sendMessage("ℹ️ এটা গ্রুপে ব্যবহার করুন।", threadID, messageID);
  const chat = await api.telegram("getChat", { chat_id: threadID });
  let count = "?"; try { count = await api.telegram("getChatMemberCount", { chat_id: threadID }); } catch (_) {}
  let admins = []; try { admins = await api.telegram("getChatAdministrators", { chat_id: threadID }); } catch (_) {}
  const names = admins.filter((a) => !a.user.is_bot).slice(0, 15).map((a) => (a.status === "creator" ? "👑 " : "🛡 ") + [a.user.first_name, a.user.last_name].filter(Boolean).join(" "));
  const text = [
    "╭─── 👥 GROUP INFO ───╮",
    "📛 নাম: " + (chat.title || "—"),
    "🆔 আইডি: " + chat.id,
    "🏷 টাইপ: " + chat.type,
    chat.username ? "🔗 @" + chat.username : "",
    "👤 সদস্য: " + count,
    "🛡 অ্যাডমিন: " + admins.length,
    chat.description ? "📝 " + chat.description.slice(0, 200) : "",
    names.length ? "\n" + names.join("\n") : "",
    "╰──────────────────╯",
  ].filter(Boolean).join("\n");
  return api.sendMessage(text, threadID, messageID);
};
