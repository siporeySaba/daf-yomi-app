import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const appDiv = document.getElementById("app");

function renderLogin() {
  appDiv.innerHTML = `
    <h2>דף יומי</h2>
    <button id="loginBtn">התחבר עם Google</button>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    await signInWithPopup(auth, provider);
  };
}

function renderApp(user) {
  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">

      <h2>שלום ${user.displayName} 👋</h2>
      <p>${user.email}</p>

      <hr/>

      <button id="todayBtn">📅 הדף היומי של היום</button>
      <button id="logoutBtn" style="margin-right:10px;">התנתק</button>

      <hr/>

      <h3>📚 מסכתות</h3>
      <div id="masechtot">
        טוען מסכתות...
      </div>

    </div>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
  };

  document.getElementById("todayBtn").onclick = () => {
    alert("כאן נבנה דף יומי יומי אמיתי 🔥");
  };

  loadMasechtot();
}

function loadMasechtot() {
  const masechtot = [
    "ברכות", "שבת", "עירובין", "פסחים", "שקלים",
    "יומא", "סוכה", "ביצה", "ראש השנה", "תענית",
    "מגילה", "מועד קטן", "חגיגה",
    "יבמות", "כתובות", "נדרים", "נזיר", "סוטה",
    "גיטין", "קידושין",
    "בבא קמא", "בבא מציעא", "בבא בתרא",
    "סנהדרין", "מכות", "שבועות", "עבודה זרה",
    "הוריות", "זבחים", "מנחות", "חולין", "בכורות",
    "ערכין", "תמורה", "כריתות", "מעילה", "נדה"
  ];

  const container = document.getElementById("masechtot");

  container.innerHTML = masechtot.map(name => `
    <div style="
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

onAuthStateChanged(auth, (user) => {
  if (user) renderApp(user);
  else renderLogin();
});
