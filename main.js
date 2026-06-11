import {
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { db, auth, provider } from "./firebase.js";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { toGemaraDaf } from "./gemaraRenderer.js";

console.log("🚀 APP START");

const appDiv = document.getElementById("app");

// ---------------- DATA ----------------
const masechetPages = {
  "ברכות": 64,
  "שבת": 157,
  "עירובין": 105,
  "פסחים": 121,
  "שקלים": 22,
  "יומא": 88,
  "סוכה": 56,
  "ביצה": 40,
  "ראש השנה": 35,
  "תענית": 31,
  "מגילה": 32,
  "מועד קטן": 29,
  "חגיגה": 27,
  "יבמות": 122,
  "כתובות": 112,
  "נדרים": 91,
  "נזיר": 66,
  "סוטה": 49,
  "גיטין": 90,
  "קידושין": 82,
  "בבא קמא": 119,
  "בבא מציעא": 119,
  "בבא בתרא": 176,
  "סנהדרין": 113,
  "מכות": 24,
  "שבועות": 49,
  "עבודה זרה": 76,
  "הוריות": 14,
  "זבחים": 120,
  "מנחות": 110,
  "חולין": 142,
  "בכורות": 61,
  "ערכין": 34,
  "תמורה": 34,
  "כריתות": 28,
  "מעילה": 22,
  "נדה": 73
};

// ---------------- LOGIN ----------------
function renderLogin() {
  appDiv.innerHTML = `
    <div style="padding:20px; text-align:center">
      <h2>דף יומי</h2>
      <button id="loginBtn">התחבר עם Google</button>
    </div>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    await signInWithPopup(auth, provider);
  };
}

// ---------------- APP ----------------
function renderApp(user) {
  appDiv.innerHTML = `
    <div style="direction: rtl; padding:16px">
      <div class="card">
        <h2>שלום ${user.displayName}</h2>
        <p>${user.email}</p>

        <button id="todayBtn" class="primary-btn">📅 הדף היומי</button>
        <button id="progressBtn" class="secondary-btn">📊 התקדמות</button>
        <button id="logoutBtn" class="secondary-btn">התנתק</button>
      </div>

      <h3>📚 מסכתות</h3>
      <div id="masechtot"></div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);
  document.getElementById("todayBtn").onclick = loadTodayDaf;
  document.getElementById("progressBtn").onclick = loadProgress;

  loadMasechtot();
}

// ---------------- TODAY DAF ----------------
async function loadTodayDaf() {
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(`https://www.hebcal.com/daf?cfg=json&date=${today}`);
  const data = await res.json();

  const [masechet, daf] = data.hebrew.split(" ");

  alert(`📅 היום: ${masechet} דף ${daf}`);

  openMasechet(masechet);
}

// ---------------- MASECHTOT ----------------
function loadMasechtot() {
  const container = document.getElementById("masechtot");

  container.innerHTML = Object.keys(masechetPages)
    .map(name => `
      <div class="card" onclick="openMasechet('${name}')">
        📘 ${name}
      </div>
    `).join("");
}

// ---------------- OPEN MASECHET ----------------
window.openMasechet = function(name) {
  const total = masechetPages[name];

  console.log("📖 open:", name, "total:", total);

  if (!total) {
    appDiv.innerHTML = `
      <div class="card">
        <button onclick="goBack()">⬅ חזור</button>
        <p>❌ לא נמצא מידע על המסכת: ${name}</p>
      </div>
    `;
    return;
  }

  const dapim = Array.from({ length: total }, (_, i) => {
    const dafNumber = i + 2;

    return `
      <div class="card" style="display:flex; justify-content:space-between;">
        <span>📄 דף ${toGemaraDaf(dafNumber)}</span>

        <div>
          <button onclick="markLearned('${name}','${toGemaraDaf(dafNumber)}')">✔ למדתי</button>
          <button onclick="markSkipped('${name}','${toGemaraDaf(dafNumber)}')">⏭ דילגתי</button>
        </div>
      </div>
    `;
  });

  appDiv.innerHTML = `
    <div class="card">
      <button onclick="goBack()">⬅ חזור</button>
      <h2>${name}</h2>
      <div>${dapim.join("")}</div>
    </div>
  `;
};

// ---------------- BACK ----------------
window.goBack = function () {
  renderApp(auth.currentUser);
};

// ---------------- AUTH ----------------
onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
