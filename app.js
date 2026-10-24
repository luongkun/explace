let archive = null;

const state = { path: [], query: "", sortKey: "name", sortAsc: true, version: 0 };

const els = {
  breadcrumb: document.getElementById("breadcrumb"),
  search: document.getElementById("search"),
  stats: document.getElementById("stats"),
  list: document.getElementById("filelist"),
  empty: document.getElementById("empty"),
  footer: document.getElementById("footer")
};

const ICONS = {
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-4.5-4.5L9 18"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9Z"/></svg>',
  audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M3 8l2-4h14l2 4"/><path d="M3 8h18"/><path d="M10 12h4"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>',
  exe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3"/><path d="M13 15h4"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="m8 11 4 4 4-4"/><path d="M4 19h16"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>'
};

const TYPE_COLOR = {
  folder: "var(--gold)",
  image: "var(--blue)",
  video: "var(--purple)",
  audio: "var(--pink)",
  archive: "var(--orange)",
  code: "var(--green)",
  doc: "var(--cyan)",
  exe: "var(--red)",
  file: "var(--muted)"
};

const EXT = {
  image: new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "avif"]),
  video: new Set(["mp4", "mkv", "mov", "avi", "webm", "flv", "wmv"]),
  audio: new Set(["mp3", "wav", "flac", "ogg", "m4a", "aac", "opus"]),
  archive: new Set(["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"]),
  code: new Set(["js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "h", "hpp", "cs", "go", "rs", "rb", "php", "html", "css", "scss", "json", "xml", "yml", "yaml", "md", "sh", "bat", "sql"]),
  doc: new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv", "odt"]),
  exe: new Set(["exe", "msi", "apk", "dmg", "jar", "appimage", "deb", "rpm"])
};

function typeOf(name) {
  const i = name.lastIndexOf(".");
  if (i <= 0) return "file";
  const ext = name.slice(i + 1).toLowerCase();
  for (const key of Object.keys(EXT)) {
    if (EXT[key].has(ext)) return key;
  }
  return "file";
}

function formatSize(bytes) {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / Math.pow(1024, i);
  return (i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)) + " " + units[i];
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function currentVersion() {
  return archive.versions[state.version];
}

function currentFolder() {
  return state.path.length
    ? state.path[state.path.length - 1]
    : { name: archive.name, children: currentVersion().entries };
}

function totalStats(entries) {
  let files = 0, bytes = 0;
  for (const e of entries) {
    if (e.type === "folder") {
      const s = totalStats(e.children);
      files += s.files;
      bytes += s.bytes;
    } else {
      files++;
      bytes += e.size || 0;
    }
  }
  return { files, bytes };
}

function renderBreadcrumb() {
  const parts = [{ name: archive.name, depth: -1 }]
    .concat(state.path.map((f, i) => ({ name: f.name, depth: i })));
  els.breadcrumb.innerHTML = "";
  parts.forEach((p, i) => {
    if (i) {
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "/";
      els.breadcrumb.appendChild(sep);
    }
    const btn = document.createElement("button");
    btn.className = "crumb" + (i === parts.length - 1 ? " current" : "");
    btn.textContent = p.name;
    btn.addEventListener("click", () => {
      state.path = state.path.slice(0, p.depth + 1);
      render();
    });
    els.breadcrumb.appendChild(btn);
  });
}

function renderStats(folder) {
  const entries = folder.children;
  const folders = entries.filter((e) => e.type === "folder").length;
  const files = entries.filter((e) => e.type !== "folder").length;
  const bytes = entries.reduce((s, e) => s + (e.size || 0), 0);
  els.stats.textContent = `${folders} thư mục · ${files} file · ${formatSize(bytes)}`;
}

function rowFor(e) {
  const isFolder = e.type === "folder";
  const type = typeOf(e.name);
  const tr = document.createElement("tr");
  tr.className = "row" + (isFolder ? " folder" : "");

  const tdName = document.createElement("td");
  tdName.className = "cell-name";
  const icon = document.createElement("span");
  icon.className = "icon";
  icon.style.color = TYPE_COLOR[type];
  icon.innerHTML = ICONS[type];
  const fname = document.createElement("span");
  fname.className = "fname";
  fname.textContent = e.name;
  fname.title = e.name;
  tdName.appendChild(icon);
  tdName.appendChild(fname);

  const tdSize = document.createElement("td");
  tdSize.className = "cell-size";
  tdSize.textContent = isFolder ? `${e.children.length} mục` : formatSize(e.size);

  const tdDate = document.createElement("td");
  tdDate.className = "cell-date";
  tdDate.textContent = e.date ? formatDate(e.date) : "—";

  const tdAction = document.createElement("td");
  tdAction.className = "cell-action";

  if (isFolder) {
    const chev = document.createElement("span");
    chev.className = "chev";
    chev.innerHTML = ICONS.chevron;
    tdAction.appendChild(chev);
    const open = () => {
      state.path.push(e);
      render();
    };
    tr.addEventListener("click", open);
    tr.tabIndex = 0;
    tr.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") open();
    });
  } else {
    const a = document.createElement("a");
    a.className = "dl";
    a.href = e.url || "#";
    a.setAttribute("download", e.name);
    a.title = "Tải xuống";
    a.innerHTML = ICONS.download;
    a.addEventListener("click", (ev) => ev.stopPropagation());
    tdAction.appendChild(a);
  }

  tr.appendChild(tdName);
  tr.appendChild(tdSize);
  tr.appendChild(tdDate);
  tr.appendChild(tdAction);
  return tr;
}

function renderRows(folder) {
  const q = state.query.trim().toLowerCase();
  let entries = folder.children.slice();
  if (q) entries = entries.filter((e) => e.name.toLowerCase().includes(q));

  entries.sort((a, b) => {
    const af = a.type === "folder", bf = b.type === "folder";
    if (af !== bf) return af ? -1 : 1;
    let av, bv;
    if (state.sortKey === "size") { av = a.size || 0; bv = b.size || 0; }
    else if (state.sortKey === "date") { av = a.date || ""; bv = b.date || ""; }
    else { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    if (av < bv) return state.sortAsc ? -1 : 1;
    if (av > bv) return state.sortAsc ? 1 : -1;
    return 0;
  });

  els.list.innerHTML = "";
  els.empty.hidden = entries.length !== 0;
  for (const e of entries) els.list.appendChild(rowFor(e));
}

function renderSortIndicators() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    const active = th.dataset.sort === state.sortKey;
    th.classList.toggle("active", active);
    th.querySelector(".dir").textContent = active ? (state.sortAsc ? "↑" : "↓") : "";
  });
}

function render() {
  const folder = currentFolder();
  renderVersions();
  renderBreadcrumb();
  renderStats(folder);
  renderRows(folder);
  renderSortIndicators();
}

function renderFooter() {
  const s = totalStats(currentVersion().entries);
  els.footer.textContent =
    `${archive.name} · ${currentVersion().label} · ${s.files} file · ${formatSize(s.bytes)} · cập nhật ${archive.updated || "—"}`;
}

const versionBtn = document.getElementById("version-btn");
const versionMenu = document.getElementById("version-menu");
const versionLabel = document.getElementById("version-label");

function renderVersions() {
  versionLabel.textContent = currentVersion().label;
  versionMenu.innerHTML = "";
  archive.versions.forEach((v, i) => {
    const li = document.createElement("li");
    li.className = "version-item" + (i === state.version ? " selected" : "");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", String(i === state.version));

    const label = document.createElement("span");
    label.textContent = v.label;

    const check = document.createElement("span");
    check.className = "v-check";
    check.innerHTML = ICONS.check;

    li.appendChild(label);
    li.appendChild(check);
    li.addEventListener("click", () => selectVersion(i));
    versionMenu.appendChild(li);
  });
}

function setVersionOpen(open) {
  versionMenu.hidden = !open;
  versionBtn.setAttribute("aria-expanded", String(open));
}

function selectVersion(i) {
  setVersionOpen(false);
  if (i === state.version) return;
  state.version = i;
  state.path = [];
  render();
  renderFooter();
}

versionBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  setVersionOpen(versionMenu.hidden);
});

document.addEventListener("click", () => {
  setVersionOpen(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setVersionOpen(false);
  }
});

document.querySelectorAll("th.sortable").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (key === state.sortKey) state.sortAsc = !state.sortAsc;
    else { state.sortKey = key; state.sortAsc = true; }
    render();
  });
});

els.search.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== els.search) {
    e.preventDefault();
    els.search.focus();
  }
});

function init() {
  archive = window.ARCHIVE;
  render();
  renderFooter();
}

init();
