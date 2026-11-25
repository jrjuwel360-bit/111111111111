"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * রিঅ্যাকশন ফিচার (মেসেঞ্জার বটের handleReaction থেকে):
 *   🦵  বট-অ্যাডমিন দিলে → অন্যের মেসেজে: তাকে কিক (বট গ্রুপ-অ্যাডমিন হলে) | বটের মেসেজে: বট গ্রুপ ছাড়বে
 *   ❌ 🤬 😡 😠 😤  → সেই মেসেজ আনসেন্ড (বটের মেসেজ পাঠানোর ২ সেকেন্ড পর থেকে)
 * ⚠️ টেলিগ্রামে রিঅ্যাকশন আপডেট পেতে বটকে গ্রুপের অ্যাডমিন করতে হবে।
 */
const UNSEND_DELAY = 2000;
const UNSEND = ["❌", "🤬", "😡", "😠", "😤"];
const MAXMAP = 5000;

function remember(map, k, v) { map.set(k, v); if (map.size > MAXMAP) map.delete(map.keys().next().value); }
if (!global.__botMsgTime) global.__botMsgTime = new Map(); // বটের পাঠানো মেসেজ → সময়
if (!global.__msgOwner) global.__msgOwner = new Map();      // মেসেজ → পাঠানোর ইউজার

function trackSend(api) {
  if (api.__sendTracked) return;
  api.__sendTracked = true;
  const orig = api.sendMessage;
  api.sendMessage = function (...args) {
    const i = args.findIndex((a, n) => n > 0 && typeof a === "function");
    const note = (err, info) => { if (!err && info && info.messageID) remember(global.__botMsgTime, String(info.messageID), Date.now()); };
    if (i !== -1) { const cb = args[i]; args[i] = function (err, info) { note(err, info); return cb.apply(this, arguments); }; }
    const r = orig.apply(api, args);
    if (r && typeof r.then === "function") r.then((info) => note(null, info)).catch(() => {});
    return r;
  };
}
function trackIncoming(event) { if (event && event.messageID) remember(global.__msgOwner, String(event.messageID), String(event.senderID)); }

/** true ফেরত দিলে রিঅ্যাকশনটা এখানেই সামলানো হয়েছে */
async function handle({ api, event, adminIds }) {
  const emoji = event.reaction || "";
  if (!emoji) return false;
  const tag = "[react]";
  const botID = String(global.data.botID);
  const reactor = String(event.userID || "");
  const mid = String(event.messageID);

  if (emoji.includes("🦵")) {
    if (!adminIds.includes(reactor)) return true;
    const tid = String(event.threadID);
    if (!tid.startsWith("-")) return true; // শুধু গ্রুপ
    const fromBot = global.__botMsgTime.has(mid);
    const owner = fromBot ? botID : global.__msgOwner.get(mid);
    if (!owner) { console.log(tag, "মেসেজের মালিক চেনা গেল না (বট চালুর আগের মেসেজ)"); return true; }
    if (owner === botID) { try { await api.leaveChat(tid); console.log(tag, "বট গ্রুপ ছেড়েছে:", tid); } catch (e) { console.log(tag, "leave error:", e.message); } return true; }
    if (adminIds.includes(owner)) { console.log(tag, "বট-অ্যাডমিনকে কিক করা যায় না"); return true; }
    try { await api.removeUserFromGroup(owner, tid); console.log(tag, "কিক:", owner); } catch (e) { console.log(tag, "kick error:", e.message, "(বট গ্রুপ-অ্যাডমিন তো?)"); }
    return true;
  }

  if (UNSEND.some((r) => emoji.includes(r))) {
    const sentAt = global.__botMsgTime.get(mid);
    if (sentAt && Date.now() - sentAt < UNSEND_DELAY) return true;
    try { await api.unsendMessage(mid); } catch (e) { console.log(tag, "unsend error:", e.message); }
    return true;
  }
  return false;
}
module.exports = { handle, trackSend, trackIncoming };
