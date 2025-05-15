import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } 
from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB__n2ZBYNh9-Z-xirdBiFZuSLCk6vR_tk",
    authDomain: "investtrack-8acfe.firebaseapp.com",
    projectId: "investtrack-8acfe",
    storageBucket: "investtrack-8acfe.firebasestorage.app",
    messagingSenderId: "513418535963",
    appId: "1:513418535963:web:47a76705f61492c563c4be",
    measurementId: "G-NQC36B1KZ6"
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

    //forgot password
    const forgotPasswordLink = document.getElementById('forgot');

    forgotPasswordLink.addEventListener("click",function(event){
      event.preventDefault();
      const email = document.getElementById('username').value;
      sendPasswordResetEmail(auth, email)
  .then(() => {
    // Password reset email sent!
    alert('Reset Email Sent');
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(errorMessage);
    // ..
  });
    })
    // Google Authentication
    googleLoginBtn.addEventListener('click', function() {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Google Sign-In successful:", result.user);
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = '/dashboard';
            })
            .catch((error) => {
                console.error("Google Sign-In failed:", error.message);
                alert("Google Sign-In failed: " + error.message);
            });
    });
});
