import { auth, provider } from "./firebase.js";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

console.log("🚀 MAIN.JS LOADED");

const appDiv = document.getElementById("app");

// התחברות
function renderLogin() {
  console.log("🔐 renderLogin");

  appDiv.innerHTML = `
    <h2>דף יומי</h2>
    <button id="loginBtn">התחבר עם Google</button>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    console.log("🔑 login clicked");
    await signInWithPopup(auth, provider);
  };
}

// אפליקציה
function renderApp(user) {
  console.log("👤 renderApp:", user);

  appDiv.innerHTML = `
    <div style="direction: rtl; font-family: Arial; padding: 16px">
      <h2>שלום ${user.displayName}</h2>
      <p>${user.email}</p>

      <button id="logoutBtn">התנתק</button>

      <hr/>

      <div>📚 האפליקציה נטענה בהצלחה</div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    console.log("🚪 logout clicked");
    await signOut(auth);
  };
}

// מצב התחברות
console.log("⏳ waiting auth state...");

onAuthStateChanged(auth, (user) => {
  console.log("🔄 auth state changed:", user);

  if (user) {
    renderApp(user);
  } else {
    renderLogin();
  }
});
