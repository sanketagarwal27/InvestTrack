import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } 
from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZRMJK5t2E_6n5sh8d4dTpx8A-Qi849jk",
  authDomain: "algorangerz.firebaseapp.com",
  projectId: "algorangerz",
  storageBucket: "algorangerz.firebasestorage.app",
  messagingSenderId: "944282008720",
  appId: "1:944282008720:web:d95cae525389f633acec15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signup-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const confirmPasswordError = document.getElementById('confirm-password-error');
  const googleSignupBtn = document.getElementById('google-signup');

  function validateForm() {
    let isValid = true;

    if (!emailInput.value.trim()) {
      emailError.style.display = 'block';
      isValid = false;
    } else {
      emailError.style.display = 'none';
    }

    if (passwordInput.value.length < 6) {
      passwordError.style.display = 'block';
      isValid = false;
    } else {
      passwordError.style.display = 'none';
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
      confirmPasswordError.style.display = 'block';
      isValid = false;
    } else {
      confirmPasswordError.style.display = 'none';
    }

    return isValid;
  }

  // Email and Password Signup
  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateForm()) {
      const email = emailInput.value;
      const password = passwordInput.value;

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log("User signed up:", userCredential.user);
          alert("Signup successful! Redirecting to login...");
          window.location.href = '/index';
        })
        .catch((error) => {
          alert("Signup failed: " + error.message);
        });
    }
  });

  // Google Signup
  googleSignupBtn.addEventListener('click', function() {
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("Google signup successful:", result.user);
        alert("Signup successful! Redirecting to dashboard...");
        window.location.href = '/dashboard';
      })
      .catch((error) => {
        console.error("Google signup failed:", error.message);
        alert("Google signup failed: " + error.message);
      });
  });
});
