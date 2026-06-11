import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

console.log("🚀 APP START");

const appDiv = document.getElementById("app");

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
  const masechtot = [
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

  container.innerHTML = masechtot.map(name => `
    <div onclick="openMasechet('${name}')" style="
      padding:10px;
      margin:5px;
      border:1px solid #ccc;
      border-radius:8px;
      cursor:pointer;
    ">
      📘 ${name}
    </div>
  `).join("");
}

// ---------------- OPEN MASECHET ----------------
window.openMasechet = function(name) {
  console.log("📖 open masechet:", name);

  const dapim = Array.from({length: 10}, (_, i) => `דף ${i+2}`);

  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">

      <button onclick="location.reload()">⬅ חזור</button>

      <h2>מסכת ${name}</h2>

      <div id="dapim"></div>
    </div>
  `;

  document.getElementById("dapim").innerHTML = dapim.map(daf => `
    <div style="
      padding:10px;
      margin:5px;
      border:1px solid #ddd;
      border-radius:8px;
    ">
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
