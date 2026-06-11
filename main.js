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
const DAF_YOMI_START = new Date("2020-01-05"); // תחילת מחזור עדכני (דוגמה)

const dafYomi = [
  { masechet: "ברכות", dapim: 63 },
  { masechet: "שבת", dapim: 156 },
  { masechet: "עירובין", dapim: 104 },
  { masechet: "פסחים", dapim: 120 },
  { masechet: "שקלים", dapim: 21 },
  { masechet: "יומא", dapim: 87 },
  { masechet: "סוכה", dapim: 55 },
  { masechet: "ביצה", dapim: 39 },
  { masechet: "ראש השנה", dapim: 34 },
  { masechet: "תענית", dapim: 30 },
  { masechet: "מגילה", dapim: 31 },
  { masechet: "מועד קטן", dapim: 28 },
  { masechet: "חגיגה", dapim: 26 }
];

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
    <h2>דף יומי</h2>
    <button id="loginBtn">התחבר עם Google</button>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    await signInWithPopup(auth, provider);
  };
}

// ---------------- APP ----------------
function renderApp(user) {
  console.log("👤 renderApp:", user.email);

  appDiv.innerHTML = `
  <div style="direction: rtl; font-family: Arial; padding: 16px">

    <h2>שלום ${user.displayName}</h2>
    <p>${user.email}</p>

    <button id="logoutBtn">התנתק</button>

    <button id="todayBtn">📅 הדף היומי האמיתי</button>

    <button id="progressBtn">📊 ההתקדמות שלי</button>

    <hr/>

    <h3>📚 מסכתות</h3>
    <div id="masechtot"></div>
  </div>
`;

  document.getElementById("todayBtn").onclick = () => {
  const today = getTodayDafYomi();
  if (!today) return;

  openMasechet(today.masechet);

  setTimeout(() => {
    console.log("📅 היום:", today);
  }, 300);
};
  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
  };

  document.getElementById("progressBtn").onclick = loadProgress;

  loadMasechtot();
}

// ---------------- PROGRESS ----------------
async function loadProgress() {
  const user = auth.currentUser;
  if (!user) return;

  console.log("📊 loading progress...");

  const snap = await getDocs(
    collection(db, "users", user.uid, "progress")
  );

  const data = {};

  snap.forEach(d => {
    const item = d.data();

    if (!data[item.masechet]) {
      data[item.masechet] = { learned: 0, skipped: 0 };
    }

    if (item.status === "learned") {
      data[item.masechet].learned++;
    } else {
      data[item.masechet].skipped++;
    }
  });

  renderProgress(data);
}

function renderProgress(data) {
  let html = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <button onclick="location.reload()">⬅ חזור</button>
      <h2>📊 ההתקדמות שלי</h2>
  `;

  for (const name in data) {
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
  }

  html += `</div>`;
  appDiv.innerHTML = html;
}

// ---------------- MASECHTOT ----------------
function loadMasechtot() {
  const container = document.getElementById("masechtot");

  container.innerHTML = Object.keys(masechetPages)
    .map(name => `
      <div onclick="openMasechet('${name}')" style="
        padding:10px;
        margin:5px;
        border:1px solid #ccc;
        border-radius:8px;
        cursor:pointer;
      ">
        📘 ${name}
        <div style="color:gray;font-size:12px;">
          ${masechetPages[name]} דפים
        </div>
      </div>
    `).join("");
}

//הצגת הדף של היום על פי חישוב מתחילת המחזור
function getTodayDafYomi() {
  const today = new Date();
  const diffDays = Math.floor((today - DAF_YOMI_START) / (1000 * 60 * 60 * 24));

  let counter = diffDays;

  for (const m of dafYomi) {
    if (counter < m.dapim) {
      return {
        masechet: m.masechet,
        daf: counter + 2
      };
    }
    counter -= m.dapim;
  }

  return null;
}
// ---------------- OPEN MASECHET ----------------
window.openMasechet = function(name) {
  const total = masechetPages[name];

  const dapim = Array.from(
    { length: total },
    (_, i) => `דף ${i + 1}`
  );

  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <button onclick="location.reload()">⬅ חזור</button>

      <h2>${name}</h2>
      <p style="color:gray">${total} דפים</p>

      <div id="dapim"></div>
    </div>
  `;

  document.getElementById("dapim").innerHTML = dapim.map(daf => `
    <div style="padding:10px;margin:5px;border:1px solid #ddd;border-radius:8px;">
      📄 ${daf}
      <button onclick="markLearned('${name}','${daf}')">✔ למדתי</button>
      <button onclick="markSkipped('${name}','${daf}')">⏭ דילגתי</button>
    </div>
  `).join("");
};

// ---------------- SAVE ----------------
window.markLearned = async function(masechet, daf) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid, "progress", `${masechet}_${daf}`),
    { masechet, daf, status: "learned", timestamp: Date.now() }
  );

  console.log("✔ נשמר למדתי");
};

window.markSkipped = async function(masechet, daf) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid, "progress", `${masechet}_${daf}`),
    { masechet, daf, status: "skipped", timestamp: Date.now() }
  );

  console.log("⏭ נשמר דילוג");
};

// ---------------- AUTH ----------------
onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
