// Archive server — Node.js + SQLite (node:sqlite), không cần dependency ngoài.
// Chạy:  node server.js   →  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "archive.db");
const FILES_DIR = path.join(ROOT, "files");

fs.mkdirSync(FILES_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    salt TEXT NOT NULL,
    hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function seedAdmin() {
  const exists = db.prepare("SELECT id FROM users WHERE is_admin = 1 LIMIT 1").get();
  if (exists) return;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  db.prepare("INSERT INTO users (username, name, salt, hash, is_admin, created_at) VALUES (?,?,?,?,1,?)")
    .run(username, "Quản trị viên", salt, hash, Date.now());
  if (!process.env.ADMIN_PASSWORD) {
    console.log("[!] Tài khoản admin mặc định: admin / admin123  (đổi mật khẩu trong trang Quản lý)");
  }
}
seedAdmin();

const DEFAULT_ARCHIVE = {
  name: "My Archive",
  updated: "2026-10-24",
  versions: [
    {
      label: "1.8.9",
      entries: [
        {
          type: "folder",
          name: "Phần mềm",
          children: [
            { type: "file", name: "TickSync-1.8.9.jar", size: 15400000, date: "2026-10-24", url: "files/TickSync-1.8.9.jar" },
            { type: "file", name: "setup.exe", size: 48200000, date: "2026-10-22", url: "files/setup.exe" }
          ]
        },
        { type: "file", name: "notes.txt", size: 1024, date: "2026-10-23", url: "files/notes.txt" }
      ]
    },
    {
      label: "1.21",
      entries: [
        {
          type: "folder",
          name: "Phần mềm",
          children: [
            { type: "file", name: "TickSync-1.21.jar", size: 18900000, date: "2026-10-24", url: "files/TickSync-1.21.jar" }
          ]
        },
        { type: "file", name: "changelog.txt", size: 2300, date: "2026-10-24", url: "files/changelog.txt" }
      ]
    }
  ]
};

function getArchive() {
  const row = db.prepare("SELECT value FROM meta WHERE key = 'archive'").get();
  if (row) {
    try { return JSON.parse(row.value); } catch {}
  }
  const a = JSON.parse(JSON.stringify(DEFAULT_ARCHIVE));
  setArchive(a);
  return a;
}

function setArchive(a) {
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('archive', ?)").run(JSON.stringify(a));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getAuthUser(req) {
  const h = req.headers["authorization"] || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const s = db.prepare("SELECT user_id FROM sessions WHERE token = ?").get(m[1]);
  if (!s) return null;
  return db.prepare("SELECT id, username, name, is_admin FROM users WHERE id = ?").get(s.user_id) || null;
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        req.destroy();
        reject(new Error("Payload quá lớn."));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseJson(buf, res) {
  try { return JSON.parse(buf.toString("utf8")); }
  catch { json(res, 400, { error: "JSON không hợp lệ." }); return null; }
}

function verifyHash(password, salt, hash) {
  const h = hashPassword(password, salt);
  const a = Buffer.from(h, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".jar": "application/java-archive",
  ".exe": "application/octet-stream",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function serveStatic(req, res, urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split("?")[0]); }
  catch { return json(res, 400, { error: "URL không hợp lệ." }); }
  if (p === "/") p = "/index.html";
  const full = path.normalize(path.join(ROOT, p));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    return json(res, 403, { error: "Forbidden" });
  }
  fs.readFile(full, (err, data) => {
    if (err) return json(res, 404, { error: "Not found" });
    const ext = path.extname(full).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": data.length
    });
    res.end(data);
  });
}

async function handleLogin(req, res) {
  const data = parseJson(await readBody(req, 1024 * 1024), res);
  if (!data) return;
  const username = String(data.username || "").trim();
  const password = String(data.password || "");
  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!row) return json(res, 401, { error: "Tài khoản không tồn tại." });
  if (!verifyHash(password, row.salt, row.hash)) return json(res, 401, { error: "Mật khẩu không đúng." });
  if (!row.is_admin) return json(res, 403, { error: "Tài khoản này không có quyền đăng nhập." });
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)").run(token, row.id, Date.now());
  return json(res, 200, { token, user: { username: row.username, name: row.name, isAdmin: !!row.is_admin } });
}

function handleLogout(req, res) {
  const h = req.headers["authorization"] || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) db.prepare("DELETE FROM sessions WHERE token = ?").run(m[1]);
  return json(res, 200, { ok: true });
}

function handleMe(req, res) {
  const user = getAuthUser(req);
  if (!user) return json(res, 401, { error: "Chưa đăng nhập." });
  return json(res, 200, { user: { username: user.username, name: user.name, isAdmin: !!user.is_admin } });
}

async function handleSaveArchive(req, res) {
  const user = getAuthUser(req);
  if (!user || !user.is_admin) return json(res, 401, { error: "Yêu cầu đăng nhập quản trị viên." });
  const data = parseJson(await readBody(req, 5 * 1024 * 1024), res);
  if (!data) return;
  if (!data || !Array.isArray(data.versions)) return json(res, 400, { error: "Cấu trúc archive không hợp lệ." });
  data.updated = today();
  setArchive(data);
  return json(res, 200, { ok: true, archive: data });
}

async function handleUpload(req, res, url) {
  const user = getAuthUser(req);
  if (!user || !user.is_admin) return json(res, 401, { error: "Yêu cầu đăng nhập quản trị viên." });
  const q = new URL(url, "http://localhost").searchParams;
  const version = q.get("version");
  const name = q.get("name");
  const folderPath = q.get("path") || "";
  if (!version || !name) return json(res, 400, { error: "Thiếu version hoặc tên file." });

  const buf = await readBody(req, 500 * 1024 * 1024);
  if (!buf || buf.length === 0) return json(res, 400, { error: "Không có dữ liệu file." });

  const safeName = path.basename(name.replace(/[\\/:*?"<>|]/g, "_"));
  if (!safeName) return json(res, 400, { error: "Tên file không hợp lệ." });
  fs.writeFileSync(path.join(FILES_DIR, safeName), buf);

  const archive = getArchive();
  const v = archive.versions.find((x) => x.label === version);
  if (!v) return json(res, 400, { error: "Phiên bản không tồn tại." });

  const entry = { type: "file", name: safeName, size: buf.length, date: today(), url: "files/" + safeName };
  const folders = folderPath.split("/").map((s) => s.trim()).filter(Boolean);
  let list = v.entries;
  for (const fname of folders) {
    let folder = list.find((e) => e.type === "folder" && e.name === fname);
    if (!folder) {
      folder = { type: "folder", name: fname, children: [] };
      list.push(folder);
    }
    list = folder.children;
  }
  const idx = list.findIndex((e) => e.type === "file" && e.name === safeName);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);

  archive.updated = today();
  setArchive(archive);
  return json(res, 200, { ok: true, archive });
}

async function handlePassword(req, res) {
  const user = getAuthUser(req);
  if (!user || !user.is_admin) return json(res, 401, { error: "Yêu cầu đăng nhập." });
  const data = parseJson(await readBody(req, 1024 * 1024), res);
  if (!data) return;
  const current = String(data.currentPassword || "");
  const next = String(data.newPassword || "");
  if (next.length < 6) return json(res, 400, { error: "Mật khẩu mới phải có ít nhất 6 ký tự." });
  const row = db.prepare("SELECT salt, hash FROM users WHERE id = ?").get(user.id);
  if (!verifyHash(current, row.salt, row.hash)) return json(res, 400, { error: "Mật khẩu hiện tại không đúng." });
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(next, salt);
  db.prepare("UPDATE users SET salt = ?, hash = ? WHERE id = ?").run(salt, hash, user.id);
  return json(res, 200, { ok: true });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const p = url.pathname;

    if (p.startsWith("/api/")) {
      const r = p.slice(4);
      if (req.method === "POST" && r === "/login") return handleLogin(req, res);
      if (req.method === "POST" && r === "/logout") return handleLogout(req, res);
      if (req.method === "GET" && r === "/me") return handleMe(req, res);
      if (req.method === "GET" && r === "/archive") return json(res, 200, getArchive());
      if (req.method === "POST" && r === "/archive") return handleSaveArchive(req, res);
      if (req.method === "POST" && r === "/upload") return handleUpload(req, res, req.url);
      if (req.method === "POST" && r === "/password") return handlePassword(req, res);
      return json(res, 404, { error: "Not found" });
    }

    return serveStatic(req, res, req.url);
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "Lỗi máy chủ." });
  }
});

server.listen(PORT, () => {
  console.log(`Archive server đang chạy: http://localhost:${PORT}`);
});
