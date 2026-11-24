"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/**
 * Minimal Telegram Bot API client — zero dependencies (Node 18+ built-in fetch/FormData).
 * Base URL can be overridden with TELEGRAM_API_BASE (used by the local test server).
 */
const path = require("path");

const BASE = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/+$/, "");

class TelegramError extends Error {
  constructor(method, body, status) {
    super(`Telegram ${method} failed: ${(body && body.description) || status}`);
    this.method = method;
    this.code = (body && body.error_code) || status;
    this.parameters = (body && body.parameters) || {};
  }
}

function createClient(token) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN সেট করা নেই।");
  const url = (m) => `${BASE}/bot${token}/${m}`;

  async function call(method, params = {}, files = null, signal) {
    let init;
    if (files && Object.keys(files).length) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      }
      for (const [field, f] of Object.entries(files)) {
        fd.append(field, new Blob([f.buffer], { type: f.mime || "application/octet-stream" }), f.filename || "file");
      }
      init = { method: "POST", body: fd, signal };
    } else {
      const clean = {};
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) clean[k] = v;
      init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(clean), signal };
    }
    let res;
    try {
      res = await fetch(url(method), init);
    } catch (e) {
      if (e.name === "AbortError") throw e;
      throw new Error(`Telegram ${method} network error: ${e.cause && e.cause.code ? e.cause.code : e.message}`);
    }
    let body = null;
    try { body = await res.json(); } catch (_) {}
    if (!res.ok || !body || body.ok !== true) {
      const err = new TelegramError(method, body, res.status);
      // rate-limit: একবার অপেক্ষা করে আবার চেষ্টা
      if (err.code === 429 && err.parameters.retry_after && !call._retried) {
        await new Promise((r) => setTimeout(r, (err.parameters.retry_after + 1) * 1000));
        call._retried = true;
        try { return await call(method, params, files, signal); } finally { call._retried = false; }
      }
      throw err;
    }
    return body.result;
  }

  const fileUrl = (filePath) => `${BASE}/file/bot${token}/${filePath}`;
  return { call, TelegramError, fileUrl, token };
}

// ───────── ফাইল ডিটেকশন (স্ট্রিম/বাফার → টেলিগ্রাম মেথড) ─────────
async function toBuffer(src) {
  if (Buffer.isBuffer(src)) return src;
  if (src instanceof Uint8Array) return Buffer.from(src);
  if (src && typeof src.on === "function") {
    const chunks = [];
    for await (const c of src) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    return Buffer.concat(chunks);
  }
  throw new Error("অচেনা অ্যাটাচমেন্ট টাইপ");
}

function sniff(buf, nameHint = "") {
  const h = buf.subarray(0, 16);
  const ext = path.extname(nameHint).toLowerCase();
  const is = (...b) => b.every((x, i) => h[i] === x);
  if (is(0xff, 0xd8, 0xff)) return { kind: "photo", ext: ".jpg", mime: "image/jpeg" };
  if (is(0x89, 0x50, 0x4e, 0x47)) return { kind: "photo", ext: ".png", mime: "image/png" };
  if (is(0x47, 0x49, 0x46, 0x38)) return { kind: "animation", ext: ".gif", mime: "image/gif" };
  if (h.subarray(0, 4).toString() === "RIFF" && h.subarray(8, 12).toString() === "WEBP") return { kind: "photo", ext: ".webp", mime: "image/webp" };
  if (h.subarray(4, 8).toString() === "ftyp") {
    if (ext === ".m4a" || ext === ".mp3") return { kind: "audio", ext: ".m4a", mime: "audio/mp4" };
    return { kind: "video", ext: ".mp4", mime: "video/mp4" };
  }
  if (h.subarray(0, 3).toString() === "ID3" || (h[0] === 0xff && (h[1] & 0xe0) === 0xe0)) return { kind: "audio", ext: ".mp3", mime: "audio/mpeg" };
  if (h.subarray(0, 4).toString() === "OggS") return { kind: "voice", ext: ".ogg", mime: "audio/ogg" };
  if (is(0x1a, 0x45, 0xdf, 0xa3)) return { kind: "video", ext: ".webm", mime: "video/webm" };
  if (h.subarray(0, 4).toString() === "%PDF") return { kind: "document", ext: ".pdf", mime: "application/pdf" };
  if (ext === ".mp4" || ext === ".mov") return { kind: "video", ext, mime: "video/mp4" };
  if (ext === ".mp3" || ext === ".m4a" || ext === ".wav") return { kind: "audio", ext, mime: "audio/mpeg" };
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") return { kind: "photo", ext, mime: "image/" + ext.slice(1) };
  return { kind: "document", ext: ext || ".bin", mime: "application/octet-stream" };
}

const METHOD = { photo: ["sendPhoto", "photo"], video: ["sendVideo", "video"], audio: ["sendAudio", "audio"], animation: ["sendAnimation", "animation"], voice: ["sendVoice", "voice"], document: ["sendDocument", "document"] };

// Telegram ছবির সীমা: ১০MB; বেশি হলে ডকুমেন্ট হিসেবে পাঠাই
async function prepareAttachment(src) {
  const buffer = await toBuffer(src);
  const hint = (src && (src.path || src.filename || src.name)) || "";
  const info = sniff(buffer, String(hint));
  let kind = info.kind;
  if (kind === "photo" && buffer.length > 10 * 1024 * 1024) kind = "document";
  const base = hint ? path.basename(String(hint)) : "";
  const filename = base && path.extname(base) ? base : `file${info.ext}`;
  return { kind, method: METHOD[kind][0], field: METHOD[kind][1], file: { buffer, mime: info.mime, filename } };
}

module.exports = { createClient, prepareAttachment, TelegramError };
