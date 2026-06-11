import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { db } from "./firebase.js";

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

    <button id="progressBtn">📊 ההתקדמות שלי</button>

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
document.getElementById("progressBtn").onclick = () => {
  loadProgress();
};

};

//קריאת נתונים מה DB
async function loadProgress() {
  const user = auth.currentUser;
  if (!user) return;

  console.log("📊 loading real progress...");

  const snap = await getDocs(
    collection(db, "users", user.uid, "progress")
  );

  const data = {};

  snap.forEach(doc => {
    const item = doc.data();

    if (!data[item.masechet]) {
      data[item.masechet] = {
        learned: 0,
        skipped: 0
      };
    }

    if (item.status === "learned") {
      data[item.masechet].learned++;
    } else {
      data[item.masechet].skipped++;
    }
  });

  // הצגה יפה של הנתונים בהתקדמות אישית
  renderProgress(data);
}

function renderProgress(data) {
  let html = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <button onclick="location.reload()">⬅ חזור</button>
      <h2>📊 ההתקדמות שלי</h2>
  `;

  Object.keys(data).forEach(name => {
    const d = data[name];
    const total = masechetPages[name] || 1;

    const percent = Math.round((d.learned / total) * 100);

    html += `
      <div style="border:1px solid #ccc; margin:10px; padding:10px; border-radius:8px;">
        <h3>${name}</h3>
        <p>✔ למדתי: ${d.learned}</p>
        <p>⏭ דילגתי: ${d.skipped}</p>
        <p>📊 התקדמות: ${percent}%</p>
      </div>
    `;
  });

  html += `</div>`;
  appDiv.innerHTML = html;
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
    📘 ${name}
    <div style="color:gray; font-size:12px;">
      ${masechetPages[name]} דפים
    </div>
  </div>
`).join("");}
// ---------------- OPEN MASECHET ----------------
window.openMasechet = function(name) {
  const total = masechetPages[name];

  console.log("📖 open masechet:", name, "total:", total);

  const start = 2;

  // 🔥 כאן התיקון הקריטי
  const dapim = Array.from(
    { length: total },
    (_, i) => `דף ${start + i}`
  );

  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <button onclick="location.reload()">⬅ חזור</button>

      <h2>מסכת ${name}</h2>
      <p style="color:gray">${total} דפים</p>

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
//שמירת למדתי

window.markLearned = async function(masechet, daf) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid, "progress", `${masechet}_${daf}`),
    {
      masechet,
      daf,
      status: "learned",
      timestamp: Date.now()
    }
  );

  console.log("✔ נשמר למדתי:", masechet, daf);
};

//שמירת דילגתי
window.markSkipped = async function(masechet, daf) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid, "progress", `${masechet}_${daf}`),
    {
      masechet,
      daf,
      status: "skipped",
      timestamp: Date.now()
    }
  );

  console.log("⏭ נשמר דילוג:", masechet, daf);
};
// ---------------- AUTH ----------------
onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
