import { app, auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const appDiv = document.getElementById("app");

appDiv.innerHTML = `
  <h2>התחברות</h2>

  <input id="email" placeholder="אימייל" />
  <br/><br/>

  <input id="password" type="password" placeholder="סיסמה" />
  <br/><br/>

  <button id="loginBtn">התחבר</button>
  <button id="registerBtn">הרשמה</button>
`;

document.getElementById("loginBtn").onclick = async () => {
  const email = email.value;
  const password = password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    appDiv.innerHTML = "התחברת בהצלחה ✔️";
  } catch (e) {
    alert("שגיאה בהתחברות");
    console.log(e);
  }
};

document.getElementById("registerBtn").onclick = async () => {
  const email = email.value;
  const password = password.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    appDiv.innerHTML = "נרשמת בהצלחה ✔️";
  } catch (e) {
    alert("שגיאה בהרשמה");
    console.log(e);
  }
};
