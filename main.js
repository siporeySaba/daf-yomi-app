import { app, auth, provider } from "./firebase.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const appDiv = document.getElementById("app");

appDiv.innerHTML = `
  <h2>דף יומי</h2>
  <button id="googleLogin">התחבר עם Google</button>
`;

document.getElementById("googleLogin").onclick = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    appDiv.innerHTML = `
      <h3>שלום ${user.displayName}</h3>
      <p>${user.email}</p>
    `;
  } catch (e) {
    console.log(e);
    alert("שגיאה בהתחברות עם Google");
  }
};
