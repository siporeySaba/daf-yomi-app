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

console.log("🚀 APP START");

const appDiv = document.getElementById("app");

// ---------------- LOGIN ----------------
function renderLogin() {
  appDiv.innerHTML = `
    <div style="padding:20px; text-align:center">
      <h2>דף יומי</h2>
      <button class="primary-btn" id="loginBtn">התחבר עם Google</button>
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

// ---------------- API (הדף היומי) ----------------
async function loadTodayDaf() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const res = await fetch(`https://www.hebcal.com/daf?cfg=json&date=${today}`);
    const data = await res.json();

    const [masechet, daf] = data.hebrew.split(" ");

    alert(`📅 היום: ${masechet} דף ${daf}`);

    openMasechet(masechet);
  } catch (e) {
    console.error("API error:", e);
  }
}

// ---------------- MASECHTOT ----------------
function loadMasechtot() {
  const list = [
    "ברכות","שבת","עירובין","פסחים","שקלים",
    "יומא","סוכה","ביצה","ראש השנה","תענית",
    "מגילה","מועד קטן","חגיגה",
    "יבמות","כתובות","נדרים","נזיר","סוטה",
    "גיטין","קידושין",
    "בבא קמא","בבא מציעא","בבא בתרא",
    "סנהדרין","מכות","שבועות","עבודה זרה",
    "הוריות","זבחים","מנחות","חולין","בכורות",
    "ערכין","תמורה","כריתות","מעילה","נדה"
  ];

  const container = document.getElementById("masechtot");

  container.innerHTML = list.map(name => `
    <div class="card" onclick="openMasechet('${name}')">
      📘 ${name}
    </div>
  `).join("");
}

// ---------------- OPEN MASECHET ----------------
window.openMasechet = function(name) {
  appDiv.innerHTML = `
    <div class="card">
      <button onclick="location.reload()">⬅ חזור</button>
      <h2>${name}</h2>
      <div id="loading">טוען...</div>
    </div>
  `;

  console.log("📖 open:", name);
};

// ---------------- PROGRESS (נשאיר ריק כרגע אם צריך) ----------------
async function loadProgress() {
  alert("עוד בשלב שדרוג");
}

// ---------------- AUTH ----------------
onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
