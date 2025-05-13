    import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
    import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
  document.addEventListener('DOMContentLoaded', () => {
  const zerodhaCard = document.getElementById('zerodha-connect');
  const badge       = zerodhaCard.querySelector('.broker-status');
  const connected   = zerodhaCard.dataset.connected === 'true';

  zerodhaCard.addEventListener('click', () => {
    if (!connected) {
      // not yet connected → start login
      window.location.href = '/login/zerodha';
    } else {
      // already connected → confirm and logout
      if (confirm('Disconnect from Zerodha?')) {
        window.location.href = '/logout/zerodha';
      }
    }
  });
});

document.getElementById("view-portfolio-btn").addEventListener("click", function() {
    window.location.href = "/portfolio";
});

document.getElementById("home-redirect-btn").addEventListener("click", function() {
    window.location.href = "/dashboard";
    });

// Dynamically load Firebase SDK
// Dynamically load Firebase SDK as an ES module
(function() {
    const script1 = document.createElement('script');
    script1.type = "module"; // Set type to 'module' for Firebase ES module compatibility
    script1.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
    script1.onload = () => {
        const script2 = document.createElement('script');
        script2.type = "module"; // Set type to 'module'
        script2.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
        script2.onload = initializeFirebase;
        document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
})();

function initializeFirebase() {

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

    // Add the logout functionality
    document.getElementById("logout-btn").addEventListener("click", function() {
        signOut(auth).then(function() {
            // Redirect to login page after successful logout
            window.location.href = "/"; // Replace with your login page URL
        }).catch(function(error) {
            // Handle errors here
            console.error("Error signing out: ", error);
        });
    });
    auth.onAuthStateChanged(function(user) {
    if (!user) {
    // User is not signed in, redirect to login page
    window.location.href = "/";
  }
});
}