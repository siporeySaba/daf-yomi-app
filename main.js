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

// DATA
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

// SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(reg => {
    console.log('✅ Service Worker registered');
  }).catch(err => {
    console.log('❌ Service Worker registration failed:', err);
  });
}

// BACK BUTTON
window.addEventListener('popstate', () => {
  if (appDiv.innerHTML.includes('stickyHeader') === false) {
    renderApp(auth.currentUser);
  }
});

// LOGIN
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

// APP
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

async function loadTodayDaf() {
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
    const focusDaf = `דף ${focusDafStr}`;

    console.log(`Today: ${focusMasechet} ${focusDaf}`);
    await openMasechet(focusMasechet, focusDaf);
  } catch (err) {
    console.error("Error:", err);
    showToast("שגיאה בטעינת הדף היומי");
  }
}

function loadMasechtot() {
  const container = document.getElementById("masechtot");

  container.innerHTML = Object.keys(masechetPages)
    .map(name => `
      <div class="card" onclick="openMasechet('${name}')">
        📘 ${name}
      </div>
    `).join("");
}

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

  window.history.pushState({ page: 'masechet', masechet: name }, '', '#masechet');

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

    const bgColor = status === "learned" ? "#10b981"
      : status === "skipped" ? "#dc2626"
        : "white";

    const textColor = (status === "learned" || status === "skipped") ? "white" : "inherit";

    return `
      <div id="card-${dafStr}"
        class="card"
        data-status="${status}"
        style="display:flex; justify-content:space-between; align-items:center; direction:rtl; background:${bgColor}; padding:6px 12px; margin:3px 0; border-radius:8px;">
        <span id="text-${dafStr}" style="color:${textColor}; font-weight:${status ? '600' : '400'}">
          📄 דף ${dafStr}
        </span>
        <div style="display:flex; gap:6px;">
          <button onclick="markLearned('${name}','${dafStr}')" title="למדתי">✔️</button>
          <button onclick="markSkipped('${name}','${dafStr}')" title="דילגתי">⏭️</button>
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
    console.log("🔍 Starting focus search for:", focusDaf);
    
    setTimeout(() => {
      console.log("⏱️ setTimeout triggered, looking for cards...");
      
      const cards = document.querySelectorAll('[id^="card-"]');
      console.log("📋 Total cards found:", cards.length);
      
      let found = false;
      
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardText = card.textContent;
        const cardId = card.id;
        
        console.log(`Card ${i}: ID="${cardId}", Text="${cardText}"`);
        
        if (cardText.includes(focusDaf)) {
          console.log("✅ MATCH FOUND! Card text includes:", focusDaf);
          console.log("📍 Scrolling to card...");
          
          found = true;
          
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          console.log("🎨 Setting background to yellow...");
          
          card.style.background = "#fef08a";
          card.style.transition = "background 2s ease";
          
          setTimeout(() => {
            const status = card.getAttribute("data-status");
            console.log("📊 Card status:", status);
            
            const finalBg = status === "learned" ? "#10b981" : status === "skipped" ? "#dc2626" : "white";
            console.log("🔄 Reverting background to:", finalBg);
            
            card.style.background = finalBg;
          }, 2000);
          
          break;
        }
      }
      
      if (!found) {
        console.log("❌ NO MATCH FOUND! Looking for focusDaf:", focusDaf);
        console.log("📌 All card texts:");
        cards.forEach((card, i) => {
          console.log(`  Card ${i}: "${card.textContent.trim()}"`);
        });
      }
    }, 200);
    
    console.log("✨ Focus logic set up");
  }
};

async function loadProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const progressSnap = await getDocs(collection(db, "users", user.uid, "progress"));
  const progress = {};
  
  progressSnap.forEach(d => {
    const data = d.data();
    const masechet = data.masechet;
    if (!progress[masechet]) progress[masechet] = { learned: 0, skipped: 0 };
    if (data.status === "learned") progress[masechet].learned++;
    else if (data.status === "skipped") progress[masechet].skipped++;
  });

  const masechtosList = Object.entries(masechetPages).map(([name, dapim]) => ({ name, dapim }));

  let totalLearned = 0, totalSkipped = 0, totalDapim = 0;

  const rows = masechtosList.map(m => {
    const total = m.dapim - 1;
    const learned = progress[m.name]?.learned || 0;
    const skipped = progress[m.name]?.skipped || 0;
    const percent = Math.round((learned / total) * 100);

    totalLearned += learned;
    totalSkipped += skipped;
    totalDapim += total;

    return `
      <div class="progress-row">
        <div class="progress-masechet">📖 ${m.name}</div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
        </div>
        <div class="progress-stats">
          <span class="learned">✅ ${learned}</span>
          <span class="separator">/</span>
          <span class="total">${total}</span>
          <span class="percent">${percent}%</span>
        </div>
      </div>
    `;
  }).join("");

  const totalPercent = Math.round((totalLearned / totalDapim) * 100);

  appDiv.innerHTML = `
    <div style="direction:rtl; padding:16px;">
      <button onclick="goBack()" style="margin-bottom:20px;">⬅ חזור</button>

      <h2>📊 התקדמותך</h2>

      <div class="progress-summary">
        <div class="summary-card">
          <div class="summary-label">נלמדו</div>
          <div class="summary-number" style="color:#10b981;">${totalLearned}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">דולגו</div>
          <div class="summary-number" style="color:#ef4444;">${totalSkipped}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">סה״כ</div>
          <div class="summary-number">${totalDapim}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">אחוז</div>
          <div class="summary-number" style="color:#4f46e5;">${totalPercent}%</div>
        </div>
      </div>

      <div class="progress-list">
        ${rows}
      </div>
    </div>
  `;
}

window.loadProgress = loadProgress;

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

window.markAll = async function(masechet, status) {
  const user = auth.currentUser;
  if (!user) return;

  const total = masechetPages[masechet];

  for (let i = 2; i <= total; i++) {
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

function updateProgressUI(masechet) {
  const cards = document.querySelectorAll(`[id^="card-"]`);

  let learned = 0;

  cards.forEach(c => {
    if (c.style.background === "rgb(16, 185, 129)") {
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

function updateCardUI(daf, status) {
  const card = document.getElementById(`card-${daf}`);
  const text = document.getElementById(`text-${daf}`);

  if (!card || !text) return;

  if (status === "learned") {
    card.style.background = "#10b981";
    text.style.color = "white";
  } else {
    card.style.background = "#dc2626";
    text.style.color = "white";
  }
}

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

window.goBack = function () {
  renderApp(auth.currentUser);
  window.history.back();
};

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 2500);
}

onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
