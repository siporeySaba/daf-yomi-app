import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  MASECHTOT, SEDARIM, BY_NAME, dafCount, dafList,
  dafYomiFor, sefariaUrl, hebrewDate, hebNumeral
} from "./schedule.js";
import { createStore } from "./store.js";

const appDiv = document.getElementById("app");

// -------------------------------
// ⚙️ SETTINGS (per device, optional features are OFF by default)
// -------------------------------
const SETTINGS_KEY = "dafyomi.settings";
const DEFAULT_SETTINGS = { theme: "auto", streak: false, reminder: false, reminderTime: "20:00" };

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
let settings = loadSettings();

function saveSettings(patch) {
  settings = { ...settings, ...patch };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  if (settings.theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", settings.theme);
}
applyTheme();

// -------------------------------
// 🔧 HELPERS
// -------------------------------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function countFor(m) {
  let learned = 0, skipped = 0;
  for (const d of dafList(m)) {
    const s = store.status(m.name, d.str);
    if (s === "learned") learned++;
    else if (s === "skipped") skipped++;
  }
  return { learned, skipped, total: dafCount(m) };
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function localDateKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function streakDays() {
  const days = new Set();
  for (const p of store.all()) {
    if (p.status === "learned" && p.timestamp) {
      const t = new Date(p.timestamp);
      if (!isNaN(t)) days.add(localDateKey(t));
    }
  }
  const d = new Date();
  if (!days.has(localDateKey(d))) d.setDate(d.getDate() - 1); // עוד לא למדו היום – הרצף עדיין לא נשבר
  let n = 0;
  while (days.has(localDateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// -------------------------------
// 🧭 ROUTER (hash based → כפתור "חזור" של הטלפון עובד)
// -------------------------------
let user = null;
let store = null;
let inAppNav = 0;

function go(hash) {
  inAppNav++;
  location.hash = hash;
}

function goBack() {
  if (inAppNav > 0) { inAppNav--; history.back(); }
  else location.replace("#/");
}

function parseRoute() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [path, query = ""] = h.split("?");
  const params = new URLSearchParams(query);
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "m" && BY_NAME[parts[1]]) return { view: "masechet", name: parts[1], focus: params.get("d") };
  if (parts[0] === "progress") return { view: "progress" };
  if (parts[0] === "settings") return { view: "settings" };
  return { view: "home" };
}

async function render() {
  closeSheet();
  if (!user) return;
  try {
    await store.ready();
  } catch (err) {
    console.error(err);
    appDiv.innerHTML = `
      <div class="empty">
        <p>לא הצלחנו לטעון את ההתקדמות שלך.</p>
        <button class="btn primary" data-action="retry">נסה שוב</button>
      </div>`;
    return;
  }
  const route = parseRoute();
  if (route.view === "masechet") renderMasechet(route.name, route.focus);
  else if (route.view === "progress") renderProgress();
  else if (route.view === "settings") renderSettings();
  else renderHome();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", () => {
  render();
});

// -------------------------------
// 🔐 LOGIN
// -------------------------------
function renderLogin() {
  appDiv.innerHTML = `
    <div class="login">
      <div class="login-logo">📖</div>
      <h1>מעקב דף יומי</h1>
      <p class="muted">${esc(hebrewDate())}</p>
      <button class="btn primary big" data-action="login">התחבר עם Google</button>
    </div>
  `;
}

async function login() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err?.code === "auth/popup-blocked" || err?.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
    } else if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
      console.error(err);
      showToast("ההתחברות נכשלה, נסה שוב");
    }
  }
}

// -------------------------------
// 🏠 HOME
// -------------------------------
function topBar(title, { back = false, sub = "" } = {}) {
  return `
    <header class="topbar">
      ${back
        ? `<button class="icon-btn" data-action="back" aria-label="חזרה">→</button>`
        : `<div class="brand">📖</div>`}
      <div class="topbar-title">
        <div class="title">${esc(title)}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ""}
      </div>
      ${back ? "" : `
        <button class="icon-btn" data-action="nav" data-to="#/progress" aria-label="התקדמות">📊</button>
        <button class="icon-btn" data-action="nav" data-to="#/settings" aria-label="הגדרות">⚙️</button>
      `}
    </header>
  `;
}

function statusLabel(s) {
  return s === "learned" ? "נלמד" : s === "skipped" ? "דולג" : "";
}

function renderHome() {
  const today = dafYomiFor();
  const todayStatus = store.status(today.masechet, today.str);
  const firstName = (user.displayName || "").split(" ")[0];

  const now = new Date();
  const [rh, rm] = (settings.reminderTime || "20:00").split(":").map(Number);
  const showReminder = settings.reminder && todayStatus !== "learned" &&
    (now.getHours() > rh || (now.getHours() === rh && now.getMinutes() >= rm));

  const streak = settings.streak ? streakDays() : 0;

  const sedarim = SEDARIM.map(seder => {
    const tiles = MASECHTOT.filter(m => m.seder === seder).map(m => {
      const c = countFor(m);
      const p = pct(c.learned, c.total);
      const isToday = m.name === today.masechet;
      const done = c.learned === c.total;
      return `
        <button class="m-tile${isToday ? " is-today" : ""}${done ? " is-done" : ""}"
                data-action="nav" data-to="#/m/${encodeURIComponent(m.name)}">
          ${isToday ? `<span class="badge">היום</span>` : done ? `<span class="badge done">✓</span>` : ""}
          <span class="m-name">${esc(m.name)}</span>
          <span class="m-bar"><span style="width:${p}%"></span></span>
          <span class="m-count">${c.learned}/${c.total}</span>
        </button>`;
    }).join("");
    return `
      <section class="seder">
        <h3>סדר ${esc(seder)}</h3>
        <div class="m-grid">${tiles}</div>
      </section>`;
  }).join("");

  appDiv.innerHTML = `
    ${topBar("דף יומי", { sub: esc(hebrewDate()) })}
    <main class="page">
      <p class="greeting">שלום${firstName ? `, ${esc(firstName)}` : ""} 👋</p>

      ${showReminder ? `<div class="banner">⏰ עוד לא סימנת את הדף של היום</div>` : ""}

      <section class="hero${todayStatus ? " " + todayStatus : ""}">
        <div class="hero-top">
          <span class="hero-label">הדף היומי</span>
          ${settings.streak ? `<span class="streak" title="ימי לימוד ברצף">🔥 ${streak}</span>` : ""}
        </div>
        <div class="hero-daf">${esc(today.masechet)} <strong>${hebNumeral(today.num)}</strong></div>
        ${todayStatus ? `<div class="chip ${todayStatus}">${todayStatus === "learned" ? "✓ נלמד" : "⏭ דולג"}</div>` : ""}
        <div class="hero-actions">
          ${todayStatus === "learned"
            ? `<button class="btn ghost" data-action="clear" data-m="${esc(today.masechet)}" data-d="${esc(today.str)}">בטל סימון</button>`
            : `<button class="btn primary" data-action="mark" data-status="learned" data-m="${esc(today.masechet)}" data-d="${esc(today.str)}">✓ למדתי</button>`}
          <a class="btn soft" href="${sefariaUrl(today.masechet, today.num)}" target="_blank" rel="noopener">📖 ספריא</a>
          <button class="btn soft" data-action="nav" data-to="#/m/${encodeURIComponent(today.masechet)}?d=${encodeURIComponent(today.str)}">למסכת ←</button>
        </div>
      </section>

      ${sedarim}
    </main>
  `;
}

// -------------------------------
// 📘 MASECHET
// -------------------------------
function renderMasechet(name, focus) {
  const m = BY_NAME[name];
  const today = dafYomiFor();
  const c = countFor(m);
  const p = pct(c.learned, c.total);

  const tiles = dafList(m).map(d => {
    const s = store.status(name, d.str);
    const isToday = name === today.masechet && d.str === today.str;
    return `
      <button class="d-tile${s ? " " + s : ""}${isToday ? " is-today" : ""}"
              id="daf-${d.num}" data-action="daf" data-num="${d.num}" data-d="${esc(d.str)}"
              aria-label="דף ${esc(d.str)} ${statusLabel(s)}">
        ${esc(d.str.replace("׳", ""))}
      </button>`;
  }).join("");

  appDiv.innerHTML = `
    <div class="sticky">
    ${topBar(name, { back: true, sub: `<span id="mProgress">${c.learned} / ${c.total} נלמדו · ${p}%</span>` })}
    <div class="m-head">
      <div class="bar"><span id="mBar" style="width:${p}%"></span></div>
      <div class="legend">
        <span><i class="dot learned"></i>נלמד</span>
        <span><i class="dot skipped"></i>דולג</span>
        <span><i class="dot today"></i>היום</span>
        <button class="link-btn" data-action="masechet-menu" data-m="${esc(name)}">סימון מרובה ⋯</button>
      </div>
    </div>
    </div>
    <main class="page">
      <div class="d-grid" data-m="${esc(name)}">${tiles}</div>
    </main>
  `;

  if (focus) {
    const el = [...appDiv.querySelectorAll(".d-tile")].find(t => t.dataset.d === focus);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("flash");
      });
    }
  }
}

function refreshMasechetUI(name) {
  const m = BY_NAME[name];
  const c = countFor(m);
  const p = pct(c.learned, c.total);
  appDiv.querySelectorAll(".d-tile").forEach(t => {
    const s = store.status(name, t.dataset.d);
    t.classList.toggle("learned", s === "learned");
    t.classList.toggle("skipped", s === "skipped");
  });
  const bar = document.getElementById("mBar");
  const txt = document.getElementById("mProgress");
  if (bar) bar.style.width = p + "%";
  if (txt) txt.textContent = `${c.learned} / ${c.total} נלמדו · ${p}%`;
}

// -------------------------------
// 📋 BOTTOM SHEET
// -------------------------------
function openSheet(html) {
  closeSheet();
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div>
    <div class="sheet" role="dialog">${html}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
}

function closeSheet() {
  document.querySelectorAll(".sheet-wrap").forEach(el => el.remove());
}

function dafSheet(name, dStr, num) {
  const s = store.status(name, dStr);
  openSheet(`
    <div class="sheet-title">${esc(name)} דף ${hebNumeral(num)}</div>
    ${s ? `<div class="chip ${s}">${s === "learned" ? "✓ נלמד" : "⏭ דולג"}</div>` : ""}
    <div class="sheet-actions">
      ${s !== "learned" ? `<button class="btn primary" data-action="mark" data-status="learned" data-m="${esc(name)}" data-d="${esc(dStr)}">✓ למדתי</button>` : ""}
      ${s !== "skipped" ? `<button class="btn soft" data-action="mark" data-status="skipped" data-m="${esc(name)}" data-d="${esc(dStr)}">⏭ דילגתי</button>` : ""}
      ${s ? `<button class="btn ghost" data-action="clear" data-m="${esc(name)}" data-d="${esc(dStr)}">↩ בטל סימון</button>` : ""}
      <a class="btn soft" href="${sefariaUrl(name, num)}" target="_blank" rel="noopener">📖 ללמוד בספריא</a>
    </div>
  `);
}

function masechetMenu(name) {
  openSheet(`
    <div class="sheet-title">סימון כל מסכת ${esc(name)}</div>
    <p class="muted small">הפעולה תחול על כל הדפים במסכת.</p>
    <div class="sheet-actions">
      <button class="btn primary" data-action="mark-all" data-status="learned" data-m="${esc(name)}">✓ סמן הכל כנלמד</button>
      <button class="btn soft" data-action="mark-all" data-status="skipped" data-m="${esc(name)}">⏭ סמן הכל כדולג</button>
      <button class="btn danger" data-action="mark-all" data-status="" data-m="${esc(name)}">↩ נקה את כל הסימונים</button>
    </div>
  `);
}

// -------------------------------
// 📊 PROGRESS
// -------------------------------
function renderProgress() {
  let learned = 0, skipped = 0, total = 0;
  const rows = MASECHTOT.map(m => {
    const c = countFor(m);
    learned += c.learned; skipped += c.skipped; total += c.total;
    const p = pct(c.learned, c.total);
    return `
      <button class="p-row" data-action="nav" data-to="#/m/${encodeURIComponent(m.name)}">
        <span class="p-name">${esc(m.name)}</span>
        <span class="bar"><span style="width:${p}%"></span></span>
        <span class="p-stats">${c.learned}/${c.total}</span>
      </button>`;
  }).join("");

  appDiv.innerHTML = `
    ${topBar("ההתקדמות שלי", { back: true })}
    <main class="page">
      <div class="stats">
        <div class="stat"><div class="stat-num learned">${learned}</div><div class="stat-label">נלמדו</div></div>
        <div class="stat"><div class="stat-num skipped">${skipped}</div><div class="stat-label">דולגו</div></div>
        <div class="stat"><div class="stat-num">${pct(learned, total)}%</div><div class="stat-label">מתוך ${total}</div></div>
        ${settings.streak ? `<div class="stat"><div class="stat-num">🔥 ${streakDays()}</div><div class="stat-label">ימים ברצף</div></div>` : ""}
      </div>
      <div class="p-list">${rows}</div>
    </main>
  `;
}

// -------------------------------
// ⚙️ SETTINGS
// -------------------------------
function renderSettings() {
  const t = settings.theme;
  appDiv.innerHTML = `
    ${topBar("הגדרות", { back: true })}
    <main class="page">
      <section class="panel">
        <h3>מראה</h3>
        <div class="segmented">
          <button class="${t === "auto" ? "on" : ""}" data-action="theme" data-v="auto">אוטומטי</button>
          <button class="${t === "light" ? "on" : ""}" data-action="theme" data-v="light">בהיר</button>
          <button class="${t === "dark" ? "on" : ""}" data-action="theme" data-v="dark">כהה</button>
        </div>
      </section>

      <section class="panel">
        <label class="toggle-row">
          <span>
            <strong>🔥 רצף ימי לימוד</strong>
            <span class="muted small">מציג כמה ימים ברציפות סימנת דף כנלמד</span>
          </span>
          <input type="checkbox" data-action="toggle" data-k="streak" ${settings.streak ? "checked" : ""}>
        </label>
      </section>

      <section class="panel">
        <label class="toggle-row">
          <span>
            <strong>⏰ תזכורת יומית</strong>
            <span class="muted small">אחרי השעה שתבחר, אם עוד לא סימנת את הדף של היום, תופיע הודעה במסך הבית</span>
          </span>
          <input type="checkbox" data-action="toggle" data-k="reminder" ${settings.reminder ? "checked" : ""}>
        </label>
        ${settings.reminder ? `
          <div class="reminder-opts">
            <label class="time-row">שעה
              <input type="time" value="${esc(settings.reminderTime)}" data-action="time">
            </label>
            <p class="muted small">כדי לקבל התראה גם כשהאפליקציה סגורה, הוסף תזכורת קבועה ליומן בטלפון:</p>
            <div class="sheet-actions">
              <a class="btn soft" href="${googleCalUrl()}" target="_blank" rel="noopener">📅 הוסף ליומן Google</a>
              <button class="btn soft" data-action="ics">📲 הורד ליומן (iPhone / אחר)</button>
            </div>
          </div>` : ""}
      </section>

      <section class="panel">
        <div class="muted small">מחובר בתור ${esc(user.displayName || user.email || "")}</div>
        <button class="btn ghost" data-action="logout">🚪 התנתק</button>
      </section>
    </main>
  `;
}

function nextReminder() {
  const [h, m] = (settings.reminderTime || "20:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d;
}

const pad = n => String(n).padStart(2, "0");
const localStamp = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const APP_URL = "https://siporeysaba.github.io/daf-yomi-app/";

function googleCalUrl() {
  const start = nextReminder();
  const end = new Date(start.getTime() + 30 * 60000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: "📖 דף יומי",
    details: `זמן ללמוד את הדף היומי\n${APP_URL}`,
    dates: `${localStamp(start)}/${localStamp(end)}`,
    recur: "RRULE:FREQ=DAILY",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function downloadIcs() {
  const start = nextReminder();
  const end = new Date(start.getTime() + 30 * 60000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//daf-yomi-app//HE",
    "BEGIN:VEVENT",
    `UID:dafyomi-reminder-${Date.now()}@daf-yomi-app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${localStamp(start)}`,
    `DTEND:${localStamp(end)}`,
    "RRULE:FREQ=DAILY",
    "SUMMARY:📖 דף יומי",
    `DESCRIPTION:זמן ללמוד את הדף היומי\\n${APP_URL}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:דף יומי", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "daf-yomi-reminder.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// -------------------------------
// 🖱️ ACTIONS (event delegation)
// -------------------------------
async function markDaf(name, dStr, status) {
  try {
    if (status) await store.set(name, dStr, status);
    else await store.clear(name, dStr);
    showToast(status === "learned" ? "✅ כל הכבוד, עוד דף לאוסף"
      : status === "skipped" ? "⏭ בעזרת ה' תזכה להשלים" : "↩ הסימון בוטל");
  } catch (err) {
    console.error(err);
    showToast("❌ השמירה נכשלה, בדוק חיבור לאינטרנט");
  }
}

async function markAll(name, status) {
  const m = BY_NAME[name];
  const msg = status === "learned" ? `לסמן את כל ${dafCount(m)} הדפים ב${name} כנלמדו?`
    : status === "skipped" ? `לסמן את כל ${dafCount(m)} הדפים ב${name} כדולגו?`
    : `למחוק את כל הסימונים ב${name}?`;
  if (!confirm(msg)) return;
  closeSheet();
  try {
    await store.setMany(name, dafList(m).map(d => d.str), status || null);
    showToast(status === "learned" ? "✅ כל המסכת סומנה כנלמדה"
      : status === "skipped" ? "⏭ כל המסכת סומנה כדולגה" : "↩ הסימונים נמחקו");
  } catch (err) {
    console.error(err);
    showToast("❌ השמירה נכשלה, בדוק חיבור לאינטרנט");
  }
  refreshMasechetUI(name);
}

function afterChange(name, close = true) {
  if (close) closeSheet();
  if (parseRoute().view === "masechet") refreshMasechetUI(name);
  else render();
}

document.addEventListener("click", async e => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action } = el.dataset;

  switch (action) {
    case "login": return login();
    case "logout": return signOut(auth).then(() => location.replace("#/"));
    case "retry": return render();
    case "nav": return go(el.dataset.to);
    case "back": return goBack();
    case "close-sheet": return closeSheet();
    case "daf": return dafSheet(el.closest(".d-grid").dataset.m, el.dataset.d, Number(el.dataset.num));
    case "masechet-menu": return masechetMenu(el.dataset.m);
    case "mark-all": return markAll(el.dataset.m, el.dataset.status);
    case "ics": return downloadIcs();
    case "theme":
      saveSettings({ theme: el.dataset.v });
      return renderSettings();
    case "mark":
    case "clear": {
      const name = el.dataset.m, dStr = el.dataset.d;
      el.disabled = true;
      const p = markDaf(name, dStr, action === "mark" ? el.dataset.status : null);
      afterChange(name); // עדכון מיידי במסך, השמירה ממשיכה ברקע
      await p;
      afterChange(name, false); // אם השמירה נכשלה – חוזר למצב הקודם
      return;
    }
  }
});

document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.action === "toggle") {
    saveSettings({ [el.dataset.k]: el.checked });
    renderSettings();
  } else if (el.dataset.action === "time") {
    saveSettings({ reminderTime: el.value || "20:00" });
    renderSettings();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSheet();
});

// -------------------------------
// 🚀 START
// -------------------------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(err =>
    console.warn("Service Worker registration failed:", err));
}

// מצב הדגמה מקומי לבדיקות בלבד (לא נוגע בנתונים אמיתיים)
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const demo = isLocal && new URLSearchParams(location.search).has("demo");

if (demo) {
  user = { uid: "demo", displayName: "משתמש הדגמה" };
  store = createStore("demo", { demo: true });
  render();
} else {
  onAuthStateChanged(auth, u => {
    user = u;
    if (u) {
      store = createStore(u.uid);
      render();
    } else {
      store = null;
      renderLogin();
    }
  });
}
