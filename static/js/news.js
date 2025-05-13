// Dynamically load TradingView widget script
function loadTradingViewScript(callback) {
  var script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
  script.async = true;
  script.onload = callback;
  document.body.appendChild(script);
}

const feedUrl = "https://news.google.com/rss/search?q=business+india&hl=en-IN&gl=IN&ceid=IN:en";

async function loadRSSFeed(url) {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const parser = new DOMParser();
    const xml = parser.parseFromString(data.contents, "text/xml");
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
