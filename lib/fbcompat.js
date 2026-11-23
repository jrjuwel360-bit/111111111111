"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * ফেসবুক প্রোফাইল-ছবির লিংক (graph.facebook.com/<uid>/picture) → টেলিগ্রাম প্রোফাইল-ছবি।
 * love / pair / kiss / hug ... ধরনের কমান্ড FB-র লিংক থেকে ছবি টানে; টেলিগ্রাম UID দিয়ে সেটা কাজ করে না।
 * এখানে Node-এর https.request/get ও fetch প্যাচ করে ওই লিংক চুপচাপ টেলিগ্রামের ছবিতে ঘুরিয়ে দেওয়া হয়।
 * ছবি না থাকলে নামের আদ্যক্ষর দিয়ে একটা ডিফল্ট অ্যাভাটার ব্যবহার হয়।
 */
const https = require("https");
const http = require("http");
const { URL } = require("url");

const FB_HOST = /(^|\.)graph\.facebook\.com$/i;
const PIC_PATH = /\/(?:v[\d.]+\/)?(\d{5,20})\/picture/;
const TTL = 40 * 60 * 1000; // টেলিগ্রামের file_path ≥১ ঘণ্টা বৈধ থাকে

function fbUid(a) {
  let host, p;
  if (typeof a === "string") { try { const u = new URL(a); host = u.hostname; p = u.pathname; } catch (_) { return null; } }
  else if (a instanceof URL) { host = a.hostname; p = a.pathname; }
  else if (a && typeof a === "object") { host = a.hostname || String(a.host || "").split(":")[0]; p = a.path || a.pathname || ""; }
  else return null;
  if (!host || !FB_HOST.test(host)) return null;
  const m = PIC_PATH.exec(p);
  return m ? m[1] : null;
}

function install({ tg, store }) {
  const cache = new Map(); // uid → { url: URL|null, t }
  const origHttpsRequest = https.request, origHttpsGet = https.get;
  const origHttpRequest = http.request, origHttpGet = http.get;

  const fallbackUrl = (uid) => {
    const name = (store.raw.users[uid] && store.raw.users[uid].name) || "U";
    const ini = Array.from(String(name).replace(/[^\p{L}\p{N} ]/gu, "")).slice(0, 2).join("") || "U";
    return new URL(`https://ui-avatars.com/api/?name=${encodeURIComponent(ini)}&size=720&background=random&color=fff&format=png`);
  };
  const targetFor = (uid) => { const c = cache.get(uid); return c && c.url ? c.url : fallbackUrl(uid); };

  async function ensure(uid) {
    uid = String(uid);
    const c = cache.get(uid);
    if (c && Date.now() - c.t < TTL) return;
    let url = null;
    try {
      const r = await tg.call("getUserProfilePhotos", { user_id: Number(uid), limit: 1 });
      if (r && r.total_count > 0 && r.photos[0] && r.photos[0].length) {
        const sizes = r.photos[0];
        const f = await tg.call("getFile", { file_id: sizes[sizes.length - 1].file_id });
        url = new URL(tg.fileUrl(f.file_path));
      }
    } catch (_) {}
    cache.set(uid, { url, t: Date.now() });
  }
  const prefetch = (ids) => Promise.all([...new Set(ids.filter(Boolean).map(String))].slice(0, 8).map(ensure));

  function buildArgs(args, t) {
    let base = {};
    if (args[0] && typeof args[0] === "object" && !(args[0] instanceof URL)) base = { ...args[0] };
    const second = typeof args[1] === "object" && args[1] ? args[1] : null;
    if (second) base = { ...second, ...base };
    const cb = args.find((x) => typeof x === "function");
    const o = { ...base };
    const isHttps = t.protocol === "https:";
    o.protocol = t.protocol; o.hostname = t.hostname; o.host = t.hostname;
    o.port = t.port ? Number(t.port) : isHttps ? 443 : 80;
    o.path = t.pathname + t.search;
    o.headers = { ...(base.headers || {}), host: t.host };
    delete o.servername; delete o.socketPath; delete o.href;
    if (!isHttps) delete o.agent;
    return { o, cb, lib: isHttps ? "https" : "http" };
  }

  const wrap = (name, origHttps, origHttp) =>
    function (...args) {
      const uid = fbUid(args[0]);
      if (!uid) return origHttps.apply(https, args);
      const t = targetFor(uid);
      const { o, cb, lib } = buildArgs(args, t);
      const fn = lib === "https" ? origHttps : origHttp;
      return cb ? fn.call(lib === "https" ? https : http, o, cb) : fn.call(lib === "https" ? https : http, o);
    };
  https.request = wrap("request", origHttpsRequest, origHttpRequest);
  https.get = wrap("get", origHttpsGet, origHttpGet);

  if (typeof globalThis.fetch === "function") {
    const origFetch = globalThis.fetch;
    globalThis.fetch = function (input, init) {
      const s = typeof input === "string" ? input : input instanceof URL ? input.href : null;
      const uid = s && fbUid(s);
      return origFetch.call(this, uid ? targetFor(uid).href : input, init);
    };
  }
  return { prefetch, ensure, targetFor };
}

module.exports = { install, fbUid };
