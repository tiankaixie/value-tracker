const API = '/api/items';
let items = [];

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Helpers
function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

function costPerDay(item) {
  return item.price / daysSince(item.purchaseDate);
}

function formatMoney(n) {
  return n < 0.01 ? '<$0.01' : '$' + n.toFixed(2);
}

function costClass(cpd) {
  if (cpd < 1) return 'excellent';
  if (cpd < 5) return 'good';
  return 'high';
}

// Value score: how much value extracted
function valueScore(item) {
  const days = daysSince(item.purchaseDate);
  if (item.expectedYears) {
    // If expected lifespan set, score is % of lifespan used
    const expectedDays = item.expectedYears * 365;
    return Math.min(100, (days / expectedDays) * 100);
  }
  // Fallback: reaches 100 when cost/day drops below $0.10
  const target = item.price / 0.10;
  return Math.min(100, (days / target) * 100);
}

function expectedCostPerDay(item) {
  if (item.expectedYears) return item.price / (item.expectedYears * 365);
  return null;
}

function valueBarColor(score) {
  if (score > 66) return 'var(--green)';
  if (score > 33) return 'var(--yellow)';
  return 'var(--red)';
}

// Fetch & render
async function loadItems() {
  const res = await fetch(API);
  items = await res.json();
  renderDashboard();
  if (typeof renderChart === 'function') renderChart();
}

function getCategories() {
  return [...new Set(items.map(i => i.category).filter(Boolean))];
}

function renderDashboard() {
  const sortBy = document.getElementById('sortBy').value;
  const filterCat = document.getElementById('filterCategory').value;

  // Update category filter
  const catSelect = document.getElementById('filterCategory');
  const cats = getCategories();
  const currentVal = catSelect.value;
  catSelect.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  catSelect.value = currentVal;

  // Update datalist
  const dl = document.getElementById('categoryList');
  if (dl) dl.innerHTML = cats.map(c => `<option value="${c}">`).join('');

  let filtered = filterCat ? items.filter(i => i.category === filterCat) : [...items];

  // Sort
  const sorters = {
    costPerDay: (a, b) => costPerDay(a) - costPerDay(b),
    costPerDayDesc: (a, b) => costPerDay(b) - costPerDay(a),
    price: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    date: (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate),
    dateOld: (a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  filtered.sort(sorters[sortBy] || sorters.costPerDay);

  // Stats
  const statsRow = document.getElementById('statsRow');
  if (filtered.length > 0) {
    const totalValue = filtered.reduce((s, i) => s + i.price, 0);
    const totalDaily = filtered.reduce((s, i) => s + costPerDay(i), 0);
    const avgCpd = totalDaily / filtered.length;
    const bestItem = [...filtered].sort((a, b) => costPerDay(a) - costPerDay(b))[0];
    statsRow.innerHTML = `
      <div class="stat-card"><div class="label">Total Invested</div><div class="value">$${totalValue.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Daily Burn</div><div class="value">${formatMoney(totalDaily)}</div></div>
      <div class="stat-card"><div class="label">Avg Cost/Day</div><div class="value">${formatMoney(avgCpd)}</div></div>
      <div class="stat-card"><div class="label">Best Value</div><div class="value" style="font-size:1rem">${bestItem.name}</div></div>
    `;
  } else {
    statsRow.innerHTML = '';
  }

  // Items
  const list = document.getElementById('itemsList');
  const empty = document.getElementById('emptyMsg');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = filtered.map((item, idx) => {
    const cpd = costPerDay(item);
    const ecpd = expectedCostPerDay(item);
    const days = daysSince(item.purchaseDate);
    const vs = valueScore(item);
    const barColor = valueBarColor(vs);
    const notesHtml = item.notes ? `<div class="item-notes">${esc(item.notes)}</div>` : '';
    const expectedHtml = ecpd ? `<div class="expected-label">target: ${formatMoney(ecpd)}/day</div>` : '';
    const lifespanHtml = item.expectedYears ? `<span>${item.expectedYears}yr expected</span>` : '';
    return `
      <div class="item-card" style="animation-delay:${idx * 0.05}s; border-left-color: ${barColor}">
        <div class="item-info">
          <h3>${esc(item.name)}</h3>
          <div class="item-meta">
            <span>$${item.price.toLocaleString()}</span>
            <span>${days.toLocaleString()} days owned</span>
            ${lifespanHtml}
            <span class="category-tag">${esc(item.category)}</span>
          </div>
          ${notesHtml}
          <div class="value-bar" style="margin-top:8px" title="Value score: ${vs.toFixed(0)}%">
            <div class="value-bar-fill" style="width:${vs}%; background:${barColor}"></div>
          </div>
        </div>
        <div class="item-right">
          <div class="cost-per-day ${costClass(cpd)}">${formatMoney(cpd)}</div>
          <div class="cost-label">per day</div>
          ${expectedHtml}
          <div class="item-actions">
            <button onclick="editItem('${item.id}')" title="Edit">✏️</button>
            <button onclick="deleteItem('${item.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

// Add form
document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('itemName').value,
    price: document.getElementById('itemPrice').value,
    purchaseDate: document.getElementById('itemDate').value,
    category: document.getElementById('itemCategory').value || 'Uncategorized',
    expectedYears: document.getElementById('itemExpectedYears').value || null,
    notes: document.getElementById('itemNotes').value || '',
  };
  await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  e.target.reset();
  document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];
  // Switch to dashboard
  document.querySelector('[data-tab="dashboard"]').click();
  loadItems();
});

// Set default date
document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];

// Delete
async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  loadItems();
}

// Edit
function editItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  document.getElementById('editId').value = id;
  document.getElementById('editName').value = item.name;
  document.getElementById('editPrice').value = item.price;
  document.getElementById('editDate').value = item.purchaseDate;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editExpectedYears').value = item.expectedYears || '';
  document.getElementById('editNotes').value = item.notes || '';
  document.getElementById('editModal').style.display = 'flex';
}

document.getElementById('editCancel').addEventListener('click', () => {
  document.getElementById('editModal').style.display = 'none';
});

document.getElementById('editSave').addEventListener('click', async () => {
  const id = document.getElementById('editId').value;
  const body = {
    name: document.getElementById('editName').value,
    price: document.getElementById('editPrice').value,
    purchaseDate: document.getElementById('editDate').value,
    category: document.getElementById('editCategory').value,
    expectedYears: document.getElementById('editExpectedYears').value || null,
    notes: document.getElementById('editNotes').value || '',
  };
  await fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  document.getElementById('editModal').style.display = 'none';
  loadItems();
});

// Sort/filter change
document.getElementById('sortBy').addEventListener('change', renderDashboard);
document.getElementById('filterCategory').addEventListener('change', renderDashboard);

// Export
document.getElementById('exportBtn').addEventListener('click', () => {
  window.open('/api/export');
});
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  window.open('/api/export/csv');
});

// What If calculator
const wfPrice = document.getElementById('wfPrice');
const wfYears = document.getElementById('wfYears');
function calcWhatIf() {
  const price = parseFloat(wfPrice.value);
  const years = parseFloat(wfYears.value);
  const result = document.getElementById('wfResult');
  if (!price || !years) { result.style.display = 'none'; return; }
  result.style.display = 'block';
  const daily = price / (years * 365);
  document.getElementById('wfDaily').textContent = formatMoney(daily) + '/day';
  document.getElementById('wfBreakdown').innerHTML = `
    $${(price / (years * 12)).toFixed(2)}/month · $${(price / (years * 52)).toFixed(2)}/week
  `;
  // Timeline
  const milestones = [0.5, 1, 2, 3, 5, 7, 10].filter(y => y <= years * 2);
  document.getElementById('wfTimeline').innerHTML = '<h3 style="margin-bottom:12px;font-size:0.9rem;color:var(--text2)">Cost/Day Over Time</h3>' +
    milestones.map(y => {
      const cpd = price / (y * 365);
      return `<div class="wf-timeline-row">
        <span class="yr">${y} year${y !== 1 ? 's' : ''}</span>
        <span class="cost-per-day ${costClass(cpd)}">${formatMoney(cpd)}</span>
      </div>`;
    }).join('');
}
wfPrice.addEventListener('input', calcWhatIf);
wfYears.addEventListener('input', calcWhatIf);

// Close modal on backdrop click
document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) document.getElementById('editModal').style.display = 'none';
});

// Chart
function renderChart() {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas || items.length === 0) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = 400 * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth, H = 400;
  ctx.clearRect(0, 0, W, H);

  const sorted = [...items].sort((a, b) => costPerDay(b) - costPerDay(a));
  const maxCpd = Math.max(...sorted.map(costPerDay));
  const barW = Math.min(60, (W - 60) / sorted.length - 4);
  const startX = 50;

  // Grid lines
  ctx.strokeStyle = '#2a2a3e';
  ctx.fillStyle = '#8888a8';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = 30 + (H - 80) * (i / 4);
    const val = maxCpd * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(45, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.fillText('$' + val.toFixed(2), 42, y + 4);
  }

  sorted.forEach((item, i) => {
    const cpd = costPerDay(item);
    const barH = (cpd / maxCpd) * (H - 80);
    const x = startX + i * (barW + 4);
    const y = H - 50 - barH;

    // Bar
    const cls = costClass(cpd);
    ctx.fillStyle = cls === 'excellent' ? '#00b894' : cls === 'good' ? '#fdcb6e' : '#e17055';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Label
    ctx.fillStyle = '#8888a8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + barW / 2, H - 38);
    ctx.rotate(-0.5);
    const label = item.name.length > 10 ? item.name.slice(0, 9) + '…' : item.name;
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

// Re-render chart when tab shown
const origTabClick = document.querySelectorAll('.tab');
origTabClick.forEach(tab => {
  tab.addEventListener('click', () => { if (tab.dataset.tab === 'charts') setTimeout(renderChart, 50); });
});

// Import
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const importItems = data.items || data;
    if (!Array.isArray(importItems)) throw new Error('Invalid format');
    for (const item of importItems) {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, price: item.price, purchaseDate: item.purchaseDate, category: item.category })
      });
    }
    loadItems();
    alert(`Imported ${importItems.length} items!`);
  } catch (err) { alert('Import failed: ' + err.message); }
  e.target.value = '';
});

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Init
loadItems();
