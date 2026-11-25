// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "userinfo",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "ইউজারের তথ্য (আইডি, নাম, ইউজারনেম, রোল)",
  commandCategory: "info",
  usages: "[reply | @mention | id]",
  cooldowns: 5,
  aliases: ["uinfo","whois","ui"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const uid = U.resolveTarget(event, args) || event.senderID;
  let m = null;
  try { m = await api.telegram("getChatMember", { chat_id: threadID, user_id: Number(uid) }); } catch (_) {}
  const u = (m && m.user) || {};
  const rec = (await (global.client.Users || {}).getData?.(uid)) || {};
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || (event.mentions && event.mentions[uid]) || (uid === event.senderID ? event.senderName : "") || "অজানা";
  const role = { creator: "👑 গ্রুপ ওনার", administrator: "🛡 গ্রুপ অ্যাডমিন", member: "👤 সদস্য", restricted: "🔇 সীমিত", left: "🚪 গ্রুপে নেই", kicked: "⛔ ব্যান" }[m && m.status] || "—";
  const isBotAdmin = (global.config.ADMINBOT || []).includes(String(uid));
  const text = [
    "╭─── 👤 USER INFO ───╮",
    "📛 নাম: " + name,
    "🆔 আইডি: " + uid,
    u.username ? "🔗 ইউজারনেম: @" + u.username : "🔗 ইউজারনেম: নেই",
    u.is_bot ? "🤖 টাইপ: বট" : "🙋 টাইপ: মানুষ",
    "📌 রোল: " + role + (isBotAdmin ? " • ⚡ বট-অ্যাডমিন" : ""),
    u.language_code ? "🌐 ভাষা: " + u.language_code : "",
    "╰────────────────╯",
  ].filter(Boolean).join("\n");
  try {
    const ph = await api.telegram("getUserProfilePhotos", { user_id: Number(uid), limit: 1 });
    const fid = ph && ph.photos && ph.photos[0] && ph.photos[0][ph.photos[0].length - 1].file_id;
    if (fid) return api.telegram("sendPhoto", { chat_id: threadID, photo: fid, caption: text, reply_parameters: { message_id: mid(messageID), allow_sending_without_reply: true } });
  } catch (_) {}
  return api.sendMessage(text, threadID, messageID);
};
