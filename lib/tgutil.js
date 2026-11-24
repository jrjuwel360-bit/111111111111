"use strict";
// টেলিগ্রাম কমান্ডগুলোর কমন হেল্পার

const channel = () => (global.config && global.config.CHANNEL) || { name: "বিডি বট টিম (BD Bot Team)", url: "" };
const channelLine = () => { const c = channel(); return `📢 ${c.name}${c.url ? "\n🔗 " + c.url : ""}`; };

// টেক্সটের সাথে চ্যানেল-বাটন (URL সেট থাকলে)
async function sendWithChannel(api, threadID, text, replyMid) {
  const c = channel();
  if (!c.url) return api.sendMessage(text, threadID, replyMid);
  const params = { chat_id: String(threadID), text, link_preview_options: { is_disabled: true }, reply_markup: { inline_keyboard: [[{ text: "📢 " + c.name, url: c.url }]] } };
  if (replyMid) { const id = Number(String(replyMid).split(":").pop()); if (id) params.reply_parameters = { message_id: id, allow_sending_without_reply: true }; }
  return api.telegram("sendMessage", params);
}

// রিপ্লাই > মেনশন > সংখ্যার আইডি
function resolveTarget(event, args) {
  if (event.messageReply && event.messageReply.senderID && !event.mentions[event.messageReply.senderID]) {
    const keys = Object.keys(event.mentions || {});
    if (keys.length) return keys[0];
    return event.messageReply.senderID;
  }
  const keys = Object.keys(event.mentions || {});
  if (keys.length) return keys[0];
  const n = (args || []).find((a) => /^\d{5,15}$/.test(a));
  return n || null;
}

// "10m" "2h" "1d" "30s" → সেকেন্ড (না থাকলে null)
function parseDuration(str) {
  const m = /^(\d+)\s*(s|m|h|d)$/i.exec(String(str || "").trim());
  if (!m) return null;
  return Number(m[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[m[2].toLowerCase()];
}
const fmtDur = (sec) => (sec % 86400 === 0 ? sec / 86400 + " দিন" : sec % 3600 === 0 ? sec / 3600 + " ঘণ্টা" : sec % 60 === 0 ? sec / 60 + " মিনিট" : sec + " সেকেন্ড");

const fmtUp = (sec) => { sec = Math.floor(sec); return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h ${Math.floor((sec % 3600) / 60)}m ${sec % 60}s`; };

module.exports = { channel, channelLine, sendWithChannel, resolveTarget, parseDuration, fmtDur, fmtUp };
