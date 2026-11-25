// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
const U = require("../../MR_JUWEL/tgutil");
module.exports.config = {
  name: "promote",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "মেম্বারকে গ্রুপ-অ্যাডমিন বানান",
  commandCategory: "group",
  usages: "[reply | @mention | id]",
  cooldowns: 3,
  aliases: ["addmin"]
};
const mid = (m) => Number(String(m).split(":").pop());

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const uid = U.resolveTarget(event, args);
  if (!uid) return api.sendMessage("⚠️ রিপ্লাই করুন বা মেনশন/আইডি দিন।", threadID, messageID);
  const on = true;
  try {
    await api.telegram("promoteChatMember", { chat_id: threadID, user_id: Number(uid), can_manage_chat: on, can_delete_messages: on, can_restrict_members: on, can_pin_messages: on, can_invite_users: on, can_change_info: false, can_promote_members: false });
    return api.sendMessage(on ? "🛡 অ্যাডমিন বানানো হয়েছে: " + uid : "⬇️ অ্যাডমিন থেকে সরানো হয়েছে: " + uid, threadID, messageID);
  } catch (e) { return api.sendMessage("❌ পারিনি: " + e.message + "\n(বটকে 'নতুন অ্যাডমিন যোগ' অধিকারসহ অ্যাডমিন হতে হবে)", threadID, messageID); }
};
