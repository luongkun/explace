// Client xác thực — gọi API của server.js.
// Lưu token + thông tin user vào localStorage của trình duyệt.
(function () {
  const TOKEN_KEY = "archive_token";
  const USER_KEY = "archive_user";

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function cachedUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  }

  function setSession(t, u) {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function api(path, opts = {}) {
    const headers = {};
    if (opts.headers) Object.assign(headers, opts.headers);
    if (typeof opts.body === "string") headers["Content-Type"] = "application/json";
    const t = token();
    if (t) headers["Authorization"] = "Bearer " + t;

    let res;
    try {
      res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body });
    } catch {
      return { status: 0, data: { error: "Không kết nối được máy chủ." } };
    }
    let data = null;
    try { data = await res.json(); } catch {}
    return { status: res.status, data };
  }

  async function login(username, password) {
    const { status, data } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (status === 200) {
      setSession(data.token, data.user);
      return { ok: true, user: data.user };
    }
    return { ok: false, error: (data && data.error) || "Đăng nhập thất bại." };
  }

  async function logout() {
    if (token()) {
      try { await api("/api/logout", { method: "POST" }); } catch {}
    }
    clearSession();
  }

  async function me() {
    if (!token()) return null;
    const { status, data } = await api("/api/me");
    if (status === 200 && data.user) {
      setSession(token(), data.user);
      return data.user;
    }
    clearSession();
    return null;
  }

  function current() {
    return cachedUser();
  }

  function isAdmin() {
    const u = cachedUser();
    return !!(u && u.isAdmin);
  }

  window.Auth = { api, login, logout, me, current, isAdmin, token };
})();
