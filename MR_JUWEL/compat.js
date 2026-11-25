"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * Mirai-compat লেয়ার: টেলিগ্রামের উপরে Mirai/Facebook-style `api`, `event`, Users/Threads/Currencies বানায়,
 * যাতে Script/commands/*.js ফাইলগুলো প্রায় অপরিবর্তিত চলে।
 *
 * ID কনভেনশন:
 *   threadID  = টেলিগ্রাম chat id (স্ট্রিং)
 *   senderID  = টেলিগ্রাম user id (স্ট্রিং)
 *   messageID = "<chatId>:<messageId>"   (unsendMessage ইত্যাদির জন্য চ্যাট আইডি সঙ্গে রাখা হয়)
 */
const fs = require("fs");
const path = require("path");
const { prepareAttachment } = require("./telegram");

const MAX_TEXT = 4096;
const MAX_CAPTION = 1024;

const splitMid = (mid) => {
  const s = String(mid);
  const i = s.lastIndexOf(":");
  return i === -1 ? { chat: null, id: Number(s) } : { chat: s.slice(0, i), id: Number(s.slice(i + 1)) };
};
const makeMid = (chat, id) => `${chat}:${id}`;

function chunkText(text) {
  const out = [];
  let t = String(text);
  while (t.length > MAX_TEXT) {
    let cut = t.lastIndexOf("\n", MAX_TEXT);
    if (cut < MAX_TEXT / 2) cut = MAX_TEXT;
    out.push(t.slice(0, cut));
    t = t.slice(cut);
  }
  if (t.length || !out.length) out.push(t);
  return out;
}

/* ───────────────────────── JSON ডাটাবেস (Users / Threads / Currencies) ───────────────────────── */
function createStore(file) {
  let db = { users: {}, threads: {} };
  try { db = Object.assign(db, JSON.parse(fs.readFileSync(file, "utf8"))); } catch (_) {}
  let timer = null;
  const save = () => {
    try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file + ".tmp", JSON.stringify(db)); fs.renameSync(file + ".tmp", file); } catch (e) { console.error("[db] save error:", e.message); }
  };
  const touch = () => { if (!timer) timer = setTimeout(() => { timer = null; save(); }, 3000); };
  const user = (id) => (db.users[id] = db.users[id] || { name: "User " + id, money: 0, exp: 0, data: {} });
  const thread = (id) => (db.threads[id] = db.threads[id] || { threadInfo: {}, data: {} });

  const Users = {
    async getData(id) { return user(String(id)); },
    async setData(id, o) { Object.assign(user(String(id)), o); touch(); return user(String(id)); },
    async createData(id, o) { return Users.setData(id, o || {}); },
    async delData(id) { delete db.users[id]; touch(); },
    async getNameUser(id) { return user(String(id)).name; },
    async getAll() { return Object.entries(db.users).map(([userID, u]) => ({ userID, ...u })); },
  };
  const Threads = {
    async getData(id) { return thread(String(id)); },
    async setData(id, o) { Object.assign(thread(String(id)), o); touch(); return thread(String(id)); },
    async createData(id, o) { return Threads.setData(id, o || {}); },
    async delData(id) { delete db.threads[id]; touch(); },
    async getInfo(id) { return thread(String(id)).threadInfo || {}; },
    async getAll() { return Object.entries(db.threads).map(([threadID, t]) => ({ threadID, ...t })); },
  };
  const Currencies = {
    async getData(id) { const u = user(String(id)); return { money: u.money, exp: u.exp, data: u.data }; },
    async setData(id, o) { Object.assign(user(String(id)), o); touch(); return user(String(id)); },
    async increaseMoney(id, n) { user(String(id)).money += Number(n) || 0; touch(); return true; },
    async decreaseMoney(id, n) { const u = user(String(id)); if (u.money < n) return false; u.money -= Number(n) || 0; touch(); return true; },
    async getAll() { return Object.entries(db.users).map(([userID, u]) => ({ userID, money: u.money, exp: u.exp })); },
  };
  return { Users, Threads, Currencies, raw: db, user, thread, save, touch };
}

/* ───────────────────────── api অবজেক্ট ───────────────────────── */
function createApi({ tg, botInfo, store }) {
  const adminCache = new Map(); // chatId → {t, ids}

  const unsupported = (name) =>
    function () {
      const cb = [...arguments].reverse().find((a) => typeof a === "function");
      const err = new Error(`'${name}' ফেসবুক-ওনলি ফিচার, টেলিগ্রামে নেই।`);
      err.unsupported = true;
      if (!unsupported.seen.has(name)) { unsupported.seen.add(name); console.log(`[compat] api.${name}() সাপোর্টেড নয় — স্কিপ করা হলো`); }
      if (cb) { try { cb(err); } catch (_) {} }
      return Promise.resolve(null);
    };
  unsupported.seen = new Set();

  // callback + promise দুটোই সাপোর্ট
  const dual = (fn) =>
    function (...args) {
      const cbIndex = args.findIndex((a) => typeof a === "function");
      const cb = cbIndex >= 0 ? args[cbIndex] : null;
      const p = Promise.resolve().then(() => fn(...args.filter((a) => typeof a !== "function")));
      if (!cb) return p;
      p.then((r) => cb(null, r), (e) => cb(e));
      return p.catch(() => null);
    };

  async function sendOne(chat, text, files, replyTo) {
    const base = { chat_id: chat };
    if (replyTo) base.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };
    const results = [];
    if (!files.length) {
      for (const part of chunkText(text)) {
        results.push(await tg.call("sendMessage", { ...base, text: part, link_preview_options: { is_disabled: true } }));
        delete base.reply_parameters;
      }
      return results[results.length - 1];
    }
    // একাধিক ছবি/ভিডিও → অ্যালবাম
    if (files.length > 1 && files.length <= 10 && files.every((f) => f.kind === "photo" || f.kind === "video")) {
      const media = files.map((f, i) => ({ type: f.kind, media: `attach://f${i}`, ...(i === 0 && text && text.length <= MAX_CAPTION ? { caption: text } : {}) }));
      const fobj = {}; files.forEach((f, i) => (fobj["f" + i] = f.file));
      const r = await tg.call("sendMediaGroup", { ...base, media }, fobj);
      if (text && text.length > MAX_CAPTION) await tg.call("sendMessage", { chat_id: chat, text: text.slice(0, MAX_TEXT) });
      return r[0];
    }
    let last, first = true;
    for (const f of files) {
      const cap = first && text && text.length <= MAX_CAPTION ? text : undefined;
      last = await tg.call(f.method, { ...base, caption: cap }, { [f.field]: f.file });
      delete base.reply_parameters;
      first = false;
    }
    if (text && text.length > MAX_CAPTION) last = await tg.call("sendMessage", { chat_id: chat, text: text.slice(0, MAX_TEXT) });
    return last;
  }

  async function doSend(msg, threadID, replyMid) {
    if (typeof msg === "string" || typeof msg === "number") msg = { body: String(msg) };
    msg = msg || {};
    const chat = String(threadID);
    let text = msg.body == null ? "" : String(msg.body);
    if (msg.url) text += (text ? "\n" : "") + msg.url;
    let reply;
    if (replyMid) { const m = splitMid(replyMid); if (!m.chat || m.chat === chat) reply = m.id; }

    if (msg.location && msg.location.latitude != null) {
      await tg.call("sendLocation", { chat_id: chat, latitude: msg.location.latitude, longitude: msg.location.longitude });
    }
    const atts = [].concat(msg.attachment || []).filter(Boolean);
    const files = [];
    for (const a of atts) { try { files.push(await prepareAttachment(a)); } catch (e) { console.log("[compat] অ্যাটাচমেন্ট বাদ:", e.message); } }
    if (!text && !files.length) text = msg.sticker ? "🙂" : "…";
    const sent = await sendOne(chat, text, files, reply);
    return { messageID: makeMid(chat, sent.message_id), threadID: chat, timestamp: Date.now() };
  }

  const isThreadLike = (v) => typeof v === "string" || typeof v === "number";

  const api = {
    sendMessage(msg, threadID, a3, a4) {
      let cb = null, reply = null;
      if (typeof a3 === "function") { cb = a3; reply = a4; }
      else { reply = a3; if (typeof a4 === "function") cb = a4; }
      if (Array.isArray(threadID)) threadID = threadID[0];
      const p = doSend(msg, threadID, isThreadLike(reply) ? reply : null);
      if (cb) { p.then((info) => cb(null, info), (e) => { console.log("[sendMessage]", e.message); cb(e); }); return p.catch(() => null); }
      return p;
    },
    sendMessageMqtt(msg, threadID, replyTo) { return api.sendMessage(msg, threadID, replyTo); },
    unsendMessage: dual(async (mid) => { const m = splitMid(mid); return tg.call("deleteMessage", { chat_id: m.chat, message_id: m.id }); }),
    editMessage: dual(async (text, mid) => { const m = splitMid(mid); return tg.call("editMessageText", { chat_id: m.chat, message_id: m.id, text: String(text).slice(0, MAX_TEXT) }); }),
    setMessageReaction: dual(async (emoji, mid) => {
      const m = splitMid(mid);
      return tg.call("setMessageReaction", { chat_id: m.chat, message_id: m.id, reaction: emoji ? [{ type: "emoji", emoji }] : [] });
    }),
    getCurrentUserID() { return String(botInfo.id); },
    getUserInfo: dual(async (ids) => {
      const list = [].concat(ids).map(String);
      const out = {};
      for (const id of list) {
        let u = store.raw.users[id];
        if (!u || !u.seen) {
          try { const c = await tg.call("getChat", { chat_id: id }); store.user(id).name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.title || id; store.user(id).username = c.username; u = store.user(id); } catch (_) { u = store.user(id); }
        }
        out[id] = { name: u.name, firstName: (u.name || "").split(" ")[0], vanity: u.username || "", gender: 0, type: "user", isFriend: false, profileUrl: u.username ? `https://t.me/${u.username}` : "", thumbSrc: "" };
      }
      return out;
    }),
    getThreadInfo: dual(async (tid) => {
      const chat = String(tid);
      const c = await tg.call("getChat", { chat_id: chat });
      const isGroup = c.type !== "private";
      let admins = [];
      let count = 1;
      if (isGroup) {
        try { admins = await tg.call("getChatAdministrators", { chat_id: chat }); } catch (_) {}
        try { count = await tg.call("getChatMemberCount", { chat_id: chat }); } catch (_) {}
        adminCache.set(chat, { t: Date.now(), ids: admins.map((a) => String(a.user.id)) });
      }
      const known = Object.keys(store.thread(chat).members || {});
      const info = {
        threadID: chat,
        threadName: c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || chat,
        isGroup,
        participantIDs: [...new Set([...admins.map((a) => String(a.user.id)), ...known])],
        adminIDs: admins.map((a) => ({ id: String(a.user.id) })),
        userInfo: admins.map((a) => ({ id: String(a.user.id), name: [a.user.first_name, a.user.last_name].filter(Boolean).join(" ") })),
        memberCount: count, emoji: "", color: null, nicknames: {}, approvalMode: false, imageSrc: null,
      };
      store.thread(chat).threadInfo = info;
      return info;
    }),
    removeUserFromGroup: dual(async (uid, tid) => {
      await tg.call("banChatMember", { chat_id: String(tid), user_id: Number(uid) });
      return tg.call("unbanChatMember", { chat_id: String(tid), user_id: Number(uid), only_if_banned: true });
    }),
    changeAdminStatus: dual(async (tid, uid, status) => {
      const on = !!status;
      return tg.call("promoteChatMember", { chat_id: String(tid), user_id: Number(uid), can_delete_messages: on, can_restrict_members: on, can_pin_messages: on, can_invite_users: on, can_manage_chat: on });
    }),
    setTitle: dual(async (title, tid) => tg.call("setChatTitle", { chat_id: String(tid), title: String(title).slice(0, 128) })),
    sendTypingIndicator(tid, cb) {
      tg.call("sendChatAction", { chat_id: String(tid), action: "typing" }).catch(() => {});
      if (typeof cb === "function") cb();
      return () => {};
    },
    markAsRead: dual(async () => true),
    markAsReadAll: dual(async () => true),
    setOptions() {},
    getAppState() { return []; },
    getFriendsList: dual(async () => []),
    getThreadList: dual(async () => Object.entries(store.raw.threads).map(([id, t]) => ({ threadID: id, name: (t.threadInfo && t.threadInfo.threadName) || id, isGroup: id.startsWith("-"), participants: [] }))),
    logout: dual(async () => true),
    listen() { return () => {}; },
  };
  // ── টেলিগ্রাম-নেটিভ এক্সট্রা (নতুন কমান্ডগুলোর জন্য) ──
  api.telegram = (method, params, files) => tg.call(method, params || {}, files || null);
  api.pinMessage = dual(async (mid, silent) => { const m = splitMid(mid); return tg.call("pinChatMessage", { chat_id: m.chat, message_id: m.id, disable_notification: !!silent }); });
  api.unpinMessage = dual(async (tid, mid) => tg.call("unpinChatMessage", Object.assign({ chat_id: String(tid) }, mid ? { message_id: splitMid(mid).id } : {})));
  api.banUser = dual(async (uid, tid) => tg.call("banChatMember", { chat_id: String(tid), user_id: Number(uid) }));
  api.unbanUser = dual(async (uid, tid) => tg.call("unbanChatMember", { chat_id: String(tid), user_id: Number(uid), only_if_banned: true }));
  api.muteUser = dual(async (uid, tid, seconds) => tg.call("restrictChatMember", { chat_id: String(tid), user_id: Number(uid), permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false }, until_date: seconds ? Math.floor(Date.now() / 1000) + Number(seconds) : 0 }));
  api.unmuteUser = dual(async (uid, tid) => tg.call("restrictChatMember", { chat_id: String(tid), user_id: Number(uid), permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true, can_invite_users: true } }));
  api.leaveChat = dual(async (tid) => tg.call("leaveChat", { chat_id: String(tid) }));
  api.getChatMember = dual(async (tid, uid) => tg.call("getChatMember", { chat_id: String(tid), user_id: Number(uid) }));
  api.sendTyping = api.sendTypingIndicator;
  api.stopTyping = () => {};

  return new Proxy(api, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k !== "string" || k === "then" || k === "toJSON" || k === "inspect" || k.startsWith("_")) return undefined;
      const f = unsupported(k);
      t[k] = f;
      return f;
    },
  });
}

/* ───────────────────────── আপডেট → Mirai event ───────────────────────── */
function displayName(u) { return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || String(u.id); }

function rememberUser(store, u, chatId) {
  if (!u || u.is_bot) return;
  const rec = store.user(String(u.id));
  rec.name = displayName(u); rec.username = u.username; rec.seen = true;
  if (u.username) store.raw.usernames = Object.assign(store.raw.usernames || {}, { [u.username.toLowerCase()]: String(u.id) });
  if (chatId && String(chatId).startsWith("-")) {
    const t = store.thread(String(chatId));
    t.members = t.members || {};
    t.members[String(u.id)] = 1;
  }
  store.touch();
}

async function attachmentsOf(tg, m) {
  const list = [];
  const push = async (type, obj, extra = {}) => {
    const a = { type, ID: obj.file_unique_id, name: obj.file_name || "", ...extra };
    try { if (!obj.file_size || obj.file_size < 20 * 1024 * 1024) { const f = await tg.call("getFile", { file_id: obj.file_id }); a.url = tg.fileUrl(f.file_path); } } catch (_) {}
    list.push(a);
  };
  if (m.photo && m.photo.length) await push("photo", m.photo[m.photo.length - 1], { width: m.photo[m.photo.length - 1].width, height: m.photo[m.photo.length - 1].height });
  if (m.video) await push("video", m.video);
  if (m.animation) await push("animated_image", m.animation);
  if (m.audio) await push("audio", m.audio);
  if (m.voice) await push("audio", m.voice);
  if (m.document) await push("file", m.document);
  if (m.sticker) await push("sticker", m.sticker, { stickerID: m.sticker.file_unique_id });
  if (m.location) list.push({ type: "location", latitude: m.location.latitude, longitude: m.location.longitude });
  return list;
}

function mentionsOf(store, m) {
  const text = m.text || m.caption || "";
  const ents = m.entities || m.caption_entities || [];
  const out = {};
  for (const e of ents) {
    if (e.type === "text_mention" && e.user) out[String(e.user.id)] = text.substr(e.offset, e.length);
    else if (e.type === "mention") {
      const uname = text.substr(e.offset + 1, e.length - 1).toLowerCase();
      const id = (store.raw.usernames || {})[uname];
      if (id) out[id] = "@" + uname;
    }
  }
  return out;
}

// চেনা যায়নি এমন @ইউজারনেম (সে এখনো বটের সামনে কিছু লেখেনি)
function unresolvedOf(store, m) {
  const text = m.text || m.caption || "";
  const out = [];
  for (const e of m.entities || m.caption_entities || []) {
    if (e.type !== "mention") continue;
    const u = text.substr(e.offset + 1, e.length - 1).toLowerCase();
    if (!(store.raw.usernames || {})[u]) out.push("@" + u);
  }
  return out;
}

async function buildMessageEvent({ tg, store, msg, botId }) {
  const chat = String(msg.chat.id);
  rememberUser(store, msg.from, chat);
  // ফোরাম-টপিকের ভেতরের মেসেজ টপিক-রুটকে "রিপ্লাই" দেখায় — ওটা আসল রিপ্লাই নয়
  const rep = msg.reply_to_message && !(msg.is_topic_message && msg.reply_to_message.message_id === msg.message_thread_id) ? msg.reply_to_message : null;
  if (rep) rememberUser(store, rep.from, chat);
  const mentions = mentionsOf(store, msg);
  // নাম/@ছাড়া শুধু রিপ্লাই দিলে রিপ্লাই-করা মানুষটাকেই মেনশন ধরি (ফেসবুক বটের "কাউকে মেনশন করো" সমস্যা)
  if (rep && rep.from && !rep.from.is_bot && String(rep.from.id) !== String(botId) && !Object.keys(mentions).length) {
    mentions[String(rep.from.id)] = displayName(rep.from);
  }
  const ev = {
    type: rep ? "message_reply" : "message",
    threadID: chat,
    senderID: String(msg.from ? msg.from.id : chat),
    messageID: makeMid(chat, msg.message_id),
    body: msg.text || msg.caption || "",
    isGroup: msg.chat.type !== "private",
    attachments: await attachmentsOf(tg, msg),
    mentions,
    unresolved: unresolvedOf(store, msg),
    timestamp: (msg.date || 0) * 1000,
    senderName: msg.from ? displayName(msg.from) : "",
    chatType: msg.chat.type,
    messageThreadId: msg.message_thread_id,
    raw: msg,
  };
  if (rep) {
    ev.messageReply = {
      messageID: makeMid(chat, rep.message_id),
      threadID: chat,
      senderID: String(rep.from ? rep.from.id : chat),
      body: rep.text || rep.caption || "",
      attachments: await attachmentsOf(tg, rep),
      mentions: mentionsOf(store, rep),
      isGroup: ev.isGroup,
    };
  }
  return ev;
}

function buildMemberEvents({ store, msg }) {
  const chat = String(msg.chat.id);
  const out = [];
  const base = { threadID: chat, author: String(msg.from ? msg.from.id : ""), senderID: String(msg.from ? msg.from.id : ""), messageID: makeMid(chat, msg.message_id), isGroup: true, body: "", attachments: [], mentions: {}, timestamp: (msg.date || 0) * 1000 };
  if (msg.new_chat_members && msg.new_chat_members.length) {
    msg.new_chat_members.forEach((u) => rememberUser(store, u, chat));
    out.push({ ...base, type: "event", logMessageType: "log:subscribe", logMessageData: { addedParticipants: msg.new_chat_members.map((u) => ({ userFbId: String(u.id), fullName: displayName(u) })) } });
  }
  if (msg.left_chat_member) {
    out.push({ ...base, type: "event", logMessageType: "log:unsubscribe", logMessageData: { leftParticipantFbId: String(msg.left_chat_member.id) } });
    const t = store.thread(chat); if (t.members) delete t.members[String(msg.left_chat_member.id)];
  }
  if (msg.new_chat_title) out.push({ ...base, type: "event", logMessageType: "log:thread-name", logMessageData: { name: msg.new_chat_title } });
  return out;
}

module.exports = { createStore, createApi, buildMessageEvent, buildMemberEvents, splitMid, makeMid, displayName, rememberUser };
