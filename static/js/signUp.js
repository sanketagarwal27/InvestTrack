import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZRMJK5t2E_6n5sh8d4dTpx8A-Qi849jk",
  authDomain: "algorangerz.firebaseapp.com",
  projectId: "algorangerz",
  storageBucket: "algorangerz.firebasestorage.app",
  messagingSenderId: "944282008720",
  appId: "1:944282008720:web:d95cae525389f633acec15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("signup-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Account created! Please log in.");
      window.location.href = "/";
    })
    .catch((err) => {
      alert("Signup failed: " + err.message);
    });