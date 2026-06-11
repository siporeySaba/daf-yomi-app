import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD51xwSJ2Z-xQtOmqVpYHIwjiE5NwGjNy4",
  authDomain: "daf-yomi-app-c8bf6.firebaseapp.com",
  projectId: "daf-yomi-app-c8bf6",
  storageBucket: "daf-yomi-app-c8bf6.firebasestorage.app",
  messagingSenderId: "781781233558",
  appId: "1:781781233558:web:5bc2c87e9f39e47bbd77b7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
