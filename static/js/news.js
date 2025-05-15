import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
    import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Dynamically load TradingView widget script
function loadTradingViewScript(callback) {
  var script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
  script.async = true;
  script.onload = callback;
  document.body.appendChild(script);
}

const feedUrl = '/get-news';

async function loadRSSFeed(url) {
  try {
    const response = await fetch(url);
    const str = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(str, "application/xml");
    const items = xml.querySelectorAll("item");

    const container = document.getElementById("news-container");
    container.innerHTML = "";

    items.forEach((item, index) => {
      if (index >= 12) return;
      const title = item.querySelector("title").textContent;
      const link = item.querySelector("link").textContent;
      const description = item.querySelector("description").textContent;

      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        <h3>${title}</h3>
        <p>${description.replace(/<[^>]*>/g, '').slice(0, 120)}...</p>
        <a href="${link}" target="_blank">Read more</a>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading news:", err);
  }
}

loadRSSFeed(feedUrl);

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
  auth.onAuthStateChanged(function(user) {
    if (!user) {
    // User is not signed in, redirect to login page
    window.location.href = "/";
  }
});