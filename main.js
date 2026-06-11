import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

console.log("🚀 APP START");

const appDiv = document.getElementById("app");
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
let currentUser = null;

// ---------------- LOGIN ----------------
function renderLogin() {
  appDiv.innerHTML = `
    <h2>דף יומי</h2>
    <button id="loginBtn">התחבר עם Google</button>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    await signInWithPopup(auth, provider);
  };
}

// ---------------- APP ROOT ----------------
function renderApp(user) {
  console.log("TEST renderApp UI");

appDiv.innerHTML = "<h1>UI עובד</h1>";
  
  currentUser = user;

  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <h2>שלום ${user.displayName}</h2>
      <p>${user.email}</p>

      <button id="logoutBtn">התנתק</button>

      <hr/>

      <h3>📚 מסכתות</h3>
      <div id="masechtot"></div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
  };

  loadMasechtot();
}

// ---------------- MASECHTOT LIST ----------------
function loadMasechtot() {
  const masechtot = Object.keys(masechetPages);

  const container = document.getElementById("masechtot");

  container.innerHTML = masechtot.map(name => `
    <div onclick="openMasechet('${name}')" style="
      padding:10px;
      margin:5px;
      border:1px solid #ccc;
      border-radius:8px;
      cursor:pointer;
    ">
      📘 ${name} — ${masechetPages[name]} דפים
    </div>
  `).join("");
}
// ---------------- OPEN MASECHET ----------------
window.openMasechet = function(name) {
  const total = masechetPages[name];

  const dapim = Array.from(
    { length: total },
    (_, i) => `דף ${i + 2}`
  );

  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <button onclick="location.reload()">⬅ חזור</button>

      <h2>מסכת ${name}</h2>

      <div id="dapim"></div>
    </div>
  `;

  document.getElementById("dapim").innerHTML = dapim.map(daf => `
    <div style="padding:10px; margin:5px; border:1px solid #ddd; border-radius:8px;">
      📄 ${daf}
      <button onclick="markLearned('${name}','${daf}')">✔ למדתי</button>
      <button onclick="markSkipped('${name}','${daf}')">⏭ דילגתי</button>
    </div>
  `).join("");
};

// ---------------- ACTIONS (בהמשך נשמור ב-Firebase) ----------------
window.markLearned = function(masechet, daf) {
  console.log("✔ learned:", masechet, daf);
  alert("סומן כלמדתי (בינתיים רק דמו)");
};

window.markSkipped = function(masechet, daf) {
  console.log("⏭ skipped:", masechet, daf);
  alert("סומן כדילגתי (בינתיים רק דמו)");
};

// ---------------- AUTH ----------------
onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
