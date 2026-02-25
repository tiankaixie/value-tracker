const API = '/api/items';
let items = [];

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'charts') setTimeout(renderChart, 50);
  });
});

// Helpers
function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

function getUsageFraction(item) {
  return (item.daysPerWeek || 7) / 7;
}

function useDaysSince(item) {
  return daysSince(item.purchaseDate) * getUsageFraction(item);
}

function costPerDay(item) {
  return item.price / daysSince(item.purchaseDate);
}

function costPerUseDay(item) {
  return item.price / useDaysSince(item);
}

function formatMoney(n) {
  return n < 0.01 ? '<$0.01' : '$' + n.toFixed(2);
}

function costClass(cpd) {
  if (cpd < 1) return 'excellent';
  if (cpd < 5) return 'good';
  return 'high';
}

function valueScore(item) {
  const useDays = useDaysSince(item);
  if (item.expectedYears) {
    const expectedUseDays = item.expectedYears * 365 * getUsageFraction(item);
    return Math.min(100, (useDays / expectedUseDays) * 100);
  }
  const target = item.price / 0.10;
  return Math.min(100, (useDays / target) * 100);
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

  let filtered = filterCat ? items.filter(i => i.category === filterCat) : [...items];

  // Sort
  const sorters = {
    costPerDay: (a, b) => costPerUseDay(a) - costPerUseDay(b),
    costPerDayDesc: (a, b) => costPerUseDay(b) - costPerUseDay(a),
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
    const totalPerUse = filtered.reduce((s, i) => s + costPerUseDay(i), 0);
    const avgCpud = totalPerUse / filtered.length;
    const bestItem = [...filtered].sort((a, b) => costPerUseDay(a) - costPerUseDay(b))[0];
    statsRow.innerHTML = `
      <div class="stat-card"><div class="label">Total Invested</div><div class="value">$${totalValue.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Daily Burn</div><div class="value">${formatMoney(totalPerUse)}</div></div>
      <div class="stat-card"><div class="label">Avg $/Use</div><div class="value">${formatMoney(avgCpud)}</div></div>
      <div class="stat-card"><div class="label">Best Value</div><div class="value" style="font-size:1.0625rem">${bestItem.name}</div></div>
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
    const cpud = costPerUseDay(item);
    const cpd = costPerDay(item);
    const days = daysSince(item.purchaseDate);
    const vs = valueScore(item);
    const barColor = valueBarColor(vs);
    const dpw = item.daysPerWeek || 7;
    const usageLabel = dpw < 7 ? `<span>${dpw}d/wk</span>` : '';
    const notesHtml = item.notes ? `<div class="item-notes">${esc(item.notes)}</div>` : '';
    const lifespanHtml = item.expectedYears ? `<span>${item.expectedYears}yr expected</span>` : '';
    return `
      <div class="item-card" style="animation-delay:${idx * 0.04}s">
        <div class="item-info">
          <h3>${esc(item.name)}</h3>
          <div class="item-meta">
            <span>$${item.price.toLocaleString()}</span>
            <span>${days.toLocaleString()} days</span>
            ${usageLabel}
            ${lifespanHtml}
            ${item.category ? `<span class="category-tag">${esc(item.category)}</span>` : ''}
          </div>
          ${notesHtml}
          <div class="value-bar" style="margin-top:10px" title="Value: ${vs.toFixed(0)}%">
            <div class="value-bar-fill" style="width:${vs}%; background:${barColor}"></div>
          </div>
        </div>
        <div class="item-right">
          <div class="cost-per-day ${costClass(cpud)}">${formatMoney(cpud)}</div>
          <div class="cost-label">per use</div>
          <div class="cost-secondary">${formatMoney(cpd)}/day</div>
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
const wfDaysPerWeek = document.getElementById('wfDaysPerWeek');

function calcWhatIf() {
  const price = parseFloat(wfPrice.value);
  const years = parseFloat(wfYears.value);
  const dpw = parseFloat(wfDaysPerWeek.value) || 7;
  const result = document.getElementById('wfResult');
  if (!price || !years) { result.style.display = 'none'; return; }
  result.style.display = 'block';
  const usageFraction = dpw / 7;
  const dailyPerUse = price / (years * 365 * usageFraction);
  const dailyRaw = price / (years * 365);
  document.getElementById('wfDaily').textContent = formatMoney(dailyPerUse) + '/use';
  document.getElementById('wfBreakdown').innerHTML = `
    ${formatMoney(dailyRaw)}/day · $${(price / (years * 12)).toFixed(2)}/month · $${(price / (years * 52)).toFixed(2)}/week
  `;
  const milestones = [0.5, 1, 2, 3, 5, 7, 10].filter(y => y <= years * 2);
  document.getElementById('wfTimeline').innerHTML =
    '<h3>Cost per Use Over Time</h3>' +
    milestones.map(y => {
      const cpud = price / (y * 365 * usageFraction);
      return `<div class="wf-timeline-row">
        <span class="yr">${y} year${y !== 1 ? 's' : ''}</span>
        <span class="cost-per-day ${costClass(cpud)}">${formatMoney(cpud)}/use</span>
      </div>`;
    }).join('');
}

wfPrice.addEventListener('input', calcWhatIf);
wfYears.addEventListener('input', calcWhatIf);
wfDaysPerWeek.addEventListener('input', calcWhatIf);

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

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#98989d' : '#86868b';
  const greenColor = isDark ? '#30d158' : '#34c759';
  const yellowColor = isDark ? '#ff9f0a' : '#ff9500';
  const redColor = isDark ? '#ff453a' : '#ff3b30';

  const sorted = [...items].sort((a, b) => costPerUseDay(b) - costPerUseDay(a));
  const maxCpud = Math.max(...sorted.map(costPerUseDay));
  const barW = Math.min(56, (W - 60) / sorted.length - 6);
  const startX = 50;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = labelColor;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = 30 + (H - 80) * (i / 4);
    const val = maxCpud * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(45, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.fillText('$' + val.toFixed(2), 42, y + 4);
  }

  sorted.forEach((item, i) => {
    const cpud = costPerUseDay(item);
    const barH = (cpud / maxCpud) * (H - 80);
    const x = startX + i * (barW + 6);
    const y = H - 50 - barH;

    const cls = costClass(cpud);
    ctx.fillStyle = cls === 'excellent' ? greenColor : cls === 'good' ? yellowColor : redColor;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = labelColor;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + barW / 2, H - 38);
    ctx.rotate(-0.5);
    const label = item.name.length > 10 ? item.name.slice(0, 9) + '\u2026' : item.name;
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Init
loadItems();
