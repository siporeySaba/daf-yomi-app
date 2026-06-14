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
    <div style="direction: rtl;">
      <div style="padding:20px 16px; text-align:center; background:white; border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0; font-size:24px;">שלום, ${user.displayName}!</h2>
      </div>

      <div class="stickyHeader" style="padding:12px 16px;">
        <div style="display:flex; gap:10px; justify-content:center;">
          <button id="todayBtn" class="primary-btn" style="flex:1; max-width:160px; padding:10px;">📅 הדף היומי</button>
          <button id="progressBtn" class="secondary-btn" style="flex:1; max-width:160px; padding:10px;">📊 התקדמות</button>
          <button id="logoutBtn" class="secondary-btn" style="flex:1; max-width:160px; padding:10px;">🚪 התנתק</button>
        </div>

        <div id="todayDafDisplay" style="
          text-align:center;
          background:#f9fafb;
          padding:10px;
          border-radius:8px;
          font-size:13px;
          color:#666;
          margin-top:10px;
          border:1px solid #e5e7eb;
        ">
          ⏳ טוען דף יומי...
        </div>
      </div>

<div style="padding-top:10px; padding-left:16px; padding-right:16px;">
<h3>📚 מסכתות</h3>
        <div id="masechtot"></div>
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);
  document.getElementById("todayBtn").onclick = loadTodayDaf;
  document.getElementById("progressBtn").onclick = loadProgress;

  loadTodayDafDisplay();
  loadMasechtot();
}

async function loadTodayDafDisplay() {
  try {
    const startDate = new Date(2026, 5, 14);
    const startMasechet = "חולין";
    const startDaf = 45;

    const today = new Date();
    const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    const masechtosList = Object.entries(masechetPages).map(([name, dapim]) => ({ name, dapim }));

    let startIndex = masechtosList.findIndex(m => m.name === startMasechet);
    let currentDaf = startDaf + daysPassed;

    let masechetIndex = startIndex;
    let dafNumber = currentDaf;

    while (dafNumber > masechtosList[masechetIndex].dapim) {
      dafNumber -= masechtosList[masechetIndex].dapim;
      masechetIndex = (masechetIndex + 1) % masechtosList.length;
    }

    const focusMasechet = masechtosList[masechetIndex].name;
    const focusDafStr = toGemaraDaf(dafNumber);

    const displayEl = document.getElementById("todayDafDisplay");
    if (displayEl) {
      displayEl.innerHTML = `📖 <strong>הדף היומי:</strong> ${focusMasechet} דף ${focusDafStr}`;
      displayEl.style.color = "#333";
    }
  } catch (err) {
    console.error("Error loading today's daf display:", err);
  }
}

// ---------------- TODAY DAF ----------------
async function loadTodayDaf() {
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(`https://www.hebcal.com/daf?cfg=json&date=${today}`);
  const data = await res.json();

  const [masechet, daf] = data.hebrew.split(" ");

  alert(`📅 היום: ${masechet} דף ${daf}`);

  await openMasechet(masechet, daf);
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
window.openMasechet = async function(name, focusDaf = null) {
  const user = auth.currentUser;
  const total = masechetPages[name];
  if (!total) {
    appDiv.innerHTML = `
      <div class="card">
        <button onclick="goBack()">⬅ חזור</button>
        <p>❌ לא נמצא מידע על המסכת: ${name}</p>
      </div>
    `;
    return;
  }

  // טעינת סטטוס קיים מ-Firestore
  const progressSnap = await getDocs(collection(db, "users", user.uid, "progress"));
  const saved = {};
  progressSnap.forEach(d => {
    const data = d.data();
    if (data.masechet === name) {
      saved[data.daf] = data.status;
    }
  });

  const learnedCount = Object.values(saved)
    .filter(v => v === "learned")
    .length;

  const percent = Math.round((learnedCount / (total - 1)) * 100);

  const dapim = Array.from({ length: total - 1 }, (_, i) => {
    const dafNumber = i + 2;
    const dafStr = toGemaraDaf(dafNumber);
    const status = saved[dafStr];

    const bgColor = status === "learned" ? "#d1fae5"
      : status === "skipped" ? "#fee2e2"
        : "white";

    return `
      <div id="card-${dafStr}"
        class="card"
        style="display:flex; justify-content:space-between; direction:rtl; background:${bgColor}">
        <span id="text-${dafStr}">
          📄 דף ${dafStr}
        </span>
        <div>
          <button onclick="markLearned('${name}','${dafStr}')">✔ למדתי</button>
          <button onclick="markSkipped('${name}','${dafStr}')">⏭ דילגתי</button>
        </div>
      </div>
    `;
  });

  appDiv.innerHTML = `
    <div style="direction:rtl">
      <div class="stickyHeader">
        <button onclick="goBack()">
          ⬅ חזרה
        </button>

        <div style="flex:1">
          <h2 style="margin:0">${name}</h2>
          <div class="progressOuter">
            <div class="progressInner" id="progressBar" style="width:${percent}%"></div>
          </div>
          <small id="progressText">
            ${learnedCount} / ${total - 1} דפים (${percent}%)
          </small>
        </div>

        <button onclick="markAll('${name}','learned')" title="סימן הכל כנלמד">
          ✅
        </button>

        <button onclick="markAll('${name}','skipped')" title="סימן הכל כדולג">
          ⏭
        </button>
      </div>

      <div style="padding-top:70px">
        <h2>${name}</h2>
        ${dapim.join("")}
      </div>
    </div>
  `;

  if (focusDaf) {
    setTimeout(() => {
      const el = document.getElementById(`card-${focusDaf}`);

      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        el.style.background = "#fef08a";
      }
    }, 100);
  }
};

// ---------------- MARK DAF ----------------
window.markLearned = async function(masechet, daf) {
  await saveDafStatus(masechet, daf, "learned");
  updateCardUI(daf, "learned");
  updateProgressUI(masechet);
};

window.markSkipped = async function(masechet, daf) {
  await saveDafStatus(masechet, daf, "skipped");
  updateCardUI(daf, "skipped");
  updateProgressUI(masechet);
};

// סימון כל הדפים במסכת
window.markAll = async function(masechet, status) {
  const user = auth.currentUser;
  if (!user) return;

  const total = masechetPages[masechet];
  const cards = document.querySelectorAll(`[id^="card-"]`);

  // סימון כל דף
  for (let i = 2; i < total; i++) {
    const dafStr = toGemaraDaf(i);
    const ref = doc(db, "users", user.uid, "progress", `${masechet}_${dafStr}`);
    await setDoc(ref, {
      masechet,
      daf: dafStr,
      status,
      timestamp: new Date().toISOString()
    });

    updateCardUI(dafStr, status);
  }

  updateProgressUI(masechet);
  showToast(status === "learned" ? "✅ כל המסכת סומנה כנלמדה" : "⏭ כל המסכת סומנה כדולגה");
};

// עדכון Progress Bar בזמן אמת
function updateProgressUI(masechet) {
  const cards = document.querySelectorAll(`[id^="card-"]`);

  let learned = 0;

  cards.forEach(c => {
    if (c.style.background === "rgb(209, 250, 229)") {
      learned++;
    }
  });

  const total = masechetPages[masechet] - 1;
  const percent = Math.round((learned / total) * 100);

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (progressBar) {
    progressBar.style.width = percent + "%";
  }

  if (progressText) {
    progressText.innerText = `${learned} / ${total} דפים (${percent}%)`;
  }
}

// עדכון כרטיס בזמן אמת
function updateCardUI(daf, status) {
  const card = document.getElementById(`card-${daf}`);
  const text = document.getElementById(`text-${daf}`);

  if (!card || !text) return;

  if (status === "learned") {
    card.style.background = "#d1fae5";
  } else {
    card.style.background = "#fee2e2";
  }
}

// שמירה בFirestore
async function saveDafStatus(masechet, daf, status) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid, "progress", `${masechet}_${daf}`);
  await setDoc(ref, {
    masechet,
    daf,
    status,
    timestamp: new Date().toISOString()
  });

  showToast(status === "learned" ? "✅ כל הכבוד, עוד דף לאוסף" : "⏭ בעזרת ה' תזכה להשלים");
}

// ---------------- BACK ----------------
window.goBack = function () {
  renderApp(auth.currentUser);
};

// ----------- TOAST -----------
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 2500);
}

// ---------------- AUTH ----------------
onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
