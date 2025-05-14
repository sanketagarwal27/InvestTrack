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

// fetch & render holdings
async function loadHoldings() {
  const btn = document.getElementById('refresh-btn');
  btn.disabled = true;
  btn.textContent = 'Refreshing…';

  try {
    const res = await fetch('/api/zerodha/holdings');
    const payload = await res.json();
    console.log('Raw Holdings:', payload.holdings);

    if (payload.error) {
      alert('Zerodha Broker not connected. Please connect to Zerodha first.');
      return;
    }

    const seen = new Set();
    allHoldings = payload.holdings.filter(h => {
      // Create a composite key (normalize case & trim whitespace)
      const key = `${h.instrument.trim().toLowerCase()}|${h.broker.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    renderSummary();
    applyFilters(); // re-apply any active filters/tabs
  } catch (err) {
    console.error(err);
    alert('Failed to refresh data.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Refresh Data';
  }
}

let chart;  // Declare the chart object globally

// Fetch stock data from Twelve Data API
async function fetchStockData(symbol) {
  const apiKey = 'b4ead0d7e1f04eb5b695f3b7b82be8e5';  // Replace with your Twelve Data API key
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok') {
      return data.values.map(item => ({
        x: item.datetime,
        y: parseFloat(item.close),
      }));
    } else {
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    console.error(error);
    alert('Error fetching stock data.');
    return [];
  }
}

// Function to create and show the chart inside the modal
async function showChart(symbol) {
  const data = await fetchStockData(symbol);

  if (data.length > 0) {
    const ctx = document.getElementById('stock-chart').getContext('2d');

    // Destroy the previous chart instance before creating a new one
    if (chart) {
      chart.destroy();
    }

    // Create the new chart
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: `${symbol} Stock Price`,
          data: data,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1,
        }]
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'll'
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Price (INR)'
            }
          }
        }
      }
    });

    // Show the chart modal
    document.getElementById('chart-modal').style.display = 'block';
  } else {
    alert('No data available for this symbol.');
  }
}

// Close the chart modal when the user clicks the close button
function closeChartModal() {
  document.getElementById('chart-modal').style.display = 'none';
}

// Compute summary and write into DOM
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

// Build table rows
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

      <td><button class="action-btn" onclick="showChart('${h.instrument}')">Details</button></td>

    `;
    tbody.appendChild(row);
  });
}

// Filtering/sorting/searching
function applyFilters() {
  let filtered = allHoldings.slice();

  // Tab filter
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  if (activeTab !== 'all') {
    filtered = filtered.filter(h => h.type === activeTab);
  }

  // Broker filter
  const broker = document.getElementById('broker-filter').value;
  if (broker !== 'all') {
    filtered = filtered.filter(h => h.broker.toLowerCase() === broker);
  }

  // Search filter
  const q = document.getElementById('search-input').value.toLowerCase();
  if (q) {
    filtered = filtered.filter(h => h.instrument.toLowerCase().includes(q));
  }

  // Sort
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

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    applyFilters();
  });
});

// Other filters
['broker-filter', 'sort-filter'].forEach(id =>
  document.getElementById(id).addEventListener('change', applyFilters)
);
document.getElementById('search-input')
  .addEventListener('input', applyFilters);

// Refresh button
document.getElementById('refresh-btn')
  .addEventListener('click', loadHoldings);

// Initial load
document.addEventListener('DOMContentLoaded', loadHoldings);

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

(function() {
  const script1 = document.createElement('script');
  script1.type = "module"; // Set type to 'module' for Firebase ES module compatibility
  script1.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  script1.onload = () => {
    const script2 = document.createElement
  ('script');
    script2.type = "module";
    script2.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
    document.body.appendChild(script2);
    }
    document.body.appendChild(script1);
    })()