import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } 
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
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');
    const googleLoginBtn = document.getElementById('google-login-btn');

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
        
        return isValid;
    }
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const email = emailInput.value;
            const password = passwordInput.value;
            
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log('User logged in:', userCredential.user);
                    localStorage.setItem('isLoggedIn', 'true');
                    alert("Login successful! Redirecting...");
                    window.location.href = '/dashboard';
                })
                .catch((error) => {
                    console.error('Login error:', error.message);
                    alert("Login failed: " + error.message);
                });
        }
    });

    // Google Authentication
    googleLoginBtn.addEventListener('click', function() {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Google Sign-In successful:", result.user);
                localStorage.setItem('isLoggedIn', 'true');
                alert("Login successful with Google! Redirecting...");
                window.location.href = '/dashboard';
            })
            .catch((error) => {
                console.error("Google Sign-In failed:", error.message);
                alert("Google Sign-In failed: " + error.message);
            });
    });
});
