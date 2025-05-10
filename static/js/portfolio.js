import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
    import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
// utility to format INR
function formatINR(x) {
  return '₹' + Number(x).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

let allHoldings = [];

// fetch & render
async function loadHoldings() {
  const btn = document.getElementById('refresh-btn');
  btn.disabled = true;
  btn.textContent = 'Refreshing…';

  try {
    const res = await fetch('/api/zerodha/holdings');
    const payload = await res.json();
    if (payload.error) {
      alert('Error: ' + payload.error);
      return;
    }
    allHoldings = payload.holdings;
    renderSummary();
    applyFilters();       // re-apply any active filters/tabs
  } catch (err) {
    console.error(err);
    alert('Failed to refresh data.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Refresh Data';
  }
}

// compute summary and write into DOM
function renderSummary() {
  let invested = 0,
    current = 0,
    dayChange = 0;
  allHoldings.forEach(h => {
    invested += h.quantity * h.average_price;
    current += h.current_value;
    dayChange += h.day_change;
  });
  const overallReturn = current - invested;
  const overallPct = invested > 0 ? (overallReturn / invested * 100) : 0;

  document.getElementById('current-value').textContent = formatINR(current);
  document.getElementById('invested-amount').textContent = formatINR(invested);

  const todayEl = document.getElementById('today-change');
  const overallEl = document.getElementById('overall-returns');
  const overallPctEl = document.getElementById('overall-returns-pct');

  todayEl.textContent = (dayChange >= 0 ? '+' : '') + formatINR(dayChange);
  todayEl.className = dayChange >= 0 ? 'summary-change positive' : 'summary-change negative';

  overallEl.textContent = (overallReturn >= 0 ? '+' : '') + formatINR(overallReturn);
  overallEl.className = overallReturn >= 0 ? 'summary-value positive' : 'summary-value negative';

  overallPctEl.textContent = (overallPct >= 0 ? '+' : '') + overallPct.toFixed(2) + '%';
  overallPctEl.className = overallPct >= 0 ? 'summary-change positive' : 'summary-change negative';
}


// build table rows
function renderTable(data) {
  const tbody = document.getElementById('holdings-tbody');
  tbody.innerHTML = '';
  data.forEach(h => {
    const retPct = parseFloat(h.returns_percent) || 0;
    const retAmt = parseFloat(h.total_returns) || 0;
    const isPositive = val => val >= 0 ? 'positive' : 'negative';

    const row = document.createElement('tr');
    row.dataset.type = h.type;
    row.dataset.broker = h.broker.toLowerCase();
    row.innerHTML = `
      <td class="stock-name">
        <div class="stock-icon">
          ${h.type === 'mutual-funds' ? 'MF' : h.instrument.slice(0, 3).toUpperCase()}
        </div>
        <div class="instrument-details">
          <div class="instrument-title">${h.name || h.instrument}</div>
          ${h.name ? `<div class="instrument-subtitle">${h.instrument}</div>` : ''}
        </div>
      </td>

      <td><span class="broker-tag">${h.broker}</span></td>

      <td class="quantity-col">
        <span class="quantity-main">${h.quantity}</span>
        <span class="quantity-sub">shares</span>
      </td>

      <td>${formatINR(h.average_price)}</td>
      <td>${formatINR(h.current_price)}</td>
      <td>${formatINR(h.current_value)}</td>

      <td class="${isPositive(retAmt)}">
        ${retAmt >= 0 ? '+' : ''}${formatINR(retAmt)}<br>
        <small>(${retPct >= 0 ? '+' : ''}${retPct.toFixed(2)}%)</small>
      </td>

      <td class="${isPositive(h.day_change)}">
        ${h.day_change >= 0 ? '+' : ''}${formatINR(h.day_change)}<br>
        <small>(${((h.day_change / (h.current_value - h.day_change)) * 100).toFixed(2)}%)</small>
      </td>

      <td><button class="action-btn">Details</button></td>
    `;
    tbody.appendChild(row);
  });
}


// filtering/sorting/searching
function applyFilters() {
  let filtered = allHoldings.slice();

  // tab filter
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if (activeTab !== 'all') {
    filtered = filtered.filter(h => h.type === activeTab);
  }

  // broker filter
  const broker = document.getElementById('broker-filter').value;
  if (broker !== 'all') {
    filtered = filtered.filter(h => h.broker.toLowerCase() === broker);
  }

  // search filter
  const q = document.getElementById('search-input').value.toLowerCase();
  if (q) {
    filtered = filtered.filter(h => h.instrument.toLowerCase().includes(q));
  }

  // sort
  const sortBy = document.getElementById('sort-filter').value;
  if (sortBy === 'alpha') {
    filtered.sort((a, b) => a.instrument.localeCompare(b.instrument));
  } else if (sortBy === 'value') {
    filtered.sort((a, b) => b.current_value - a.current_value);
  } else if (sortBy === 'returns') {
    filtered.sort((a, b) => b.returns_percent - a.returns_percent);
  } else if (sortBy === 'change') {
    filtered.sort((a, b) => b.day_change - a.day_change);
  }

  renderTable(filtered);
}

// tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    applyFilters();
  });
});

// other filters
['broker-filter', 'sort-filter'].forEach(id =>
  document.getElementById(id).addEventListener('change', applyFilters)
);
document.getElementById('search-input')
  .addEventListener('input', applyFilters);

// refresh button
document.getElementById('refresh-btn')
  .addEventListener('click', loadHoldings);

// initial load
document.addEventListener('DOMContentLoaded', loadHoldings);

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
    auth.onAuthStateChanged(function(user) {
    if (!user) {
    // User is not signed in, redirect to login page
    window.location.href = "/"; // or wherever your login page is
  }
});
}