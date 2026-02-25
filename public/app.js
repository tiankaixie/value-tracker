const API = '/api/items';
let items = [];

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'charts') setTimeout(renderCharts, 50);
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

// Charts (Chart.js)
const chartInstances = {};

function destroyChart(key) {
  if (chartInstances[key]) { chartInstances[key].destroy(); delete chartInstances[key]; }
}

function chartColors() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    text: isDark ? '#f5f5f7' : '#1d1d1f',
    text2: isDark ? '#98989d' : '#86868b',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    green: isDark ? '#30d158' : '#34c759',
    blue: isDark ? '#0a84ff' : '#0071e3',
    yellow: isDark ? '#ff9f0a' : '#ff9500',
    red: isDark ? '#ff453a' : '#ff3b30',
    palette: isDark
      ? ['#0a84ff','#30d158','#ff9f0a','#ff453a','#bf5af2','#64d2ff','#ffd60a','#ac8e68']
      : ['#0071e3','#34c759','#ff9500','#ff3b30','#af52de','#5ac8fa','#ffcc00','#a2845e'],
  };
}

function chartFont() {
  return { family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" };
}

function renderCharts() {
  if (items.length === 0) return;
  const c = chartColors();
  const font = chartFont();

  // ── 1. Category Doughnut ──
  destroyChart('category');
  const catTotals = {};
  items.forEach(it => {
    const cat = it.category || 'Uncategorized';
    catTotals[cat] = (catTotals[cat] || 0) + it.price;
  });
  const catLabels = Object.keys(catTotals);
  const catData = Object.values(catTotals);
  chartInstances.category = new Chart(document.getElementById('chartCategory'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: c.palette.slice(0, catLabels.length),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: c.text2, font: { ...font, size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: $${ctx.parsed.toLocaleString()}`,
          },
        },
      },
    },
  });

  // ── 2. Value Score Distribution ──
  destroyChart('valueDist');
  const buckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
  const bucketLabels = ['0–20', '20–40', '40–60', '60–80', '80–100'];
  items.forEach(it => {
    const vs = Math.min(100, valueScore(it));
    const idx = Math.min(4, Math.floor(vs / 20));
    buckets[idx]++;
  });
  const barColors = [c.red, c.yellow, c.yellow, c.green, c.green];
  chartInstances.valueDist = new Chart(document.getElementById('chartValueDist'), {
    type: 'bar',
    data: {
      labels: bucketLabels,
      datasets: [{
        data: buckets,
        backgroundColor: barColors.map(col => col + '33'),
        borderColor: barColors,
        borderWidth: 1.5,
        borderRadius: 6,
        maxBarThickness: 48,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y} item${ctx.parsed.y !== 1 ? 's' : ''}` },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Value Score', color: c.text2, font: { ...font, size: 11 } },
          grid: { display: false },
          ticks: { color: c.text2, font: { ...font, size: 11 } },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: c.text2, font: { ...font, size: 11 } },
          grid: { color: c.grid },
          border: { display: false },
        },
      },
    },
  });

  // ── 3. Cost per Use Trend (top 5 most expensive) ──
  destroyChart('cpuTrend');
  const top5 = [...items].sort((a, b) => b.price - a.price).slice(0, 5);
  const months = [1, 3, 6, 12, 18, 24, 36, 48, 60];
  const trendDatasets = top5.map((item, i) => {
    const usageFrac = getUsageFraction(item);
    const data = months.map(m => {
      const useDays = m * 30 * usageFrac;
      return useDays > 0 ? +(item.price / useDays).toFixed(2) : null;
    });
    return {
      label: item.name,
      data,
      borderColor: c.palette[i],
      backgroundColor: c.palette[i] + '18',
      fill: false,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
    };
  });
  chartInstances.cpuTrend = new Chart(document.getElementById('chartCpuTrend'), {
    type: 'line',
    data: {
      labels: months.map(m => m >= 12 ? (m / 12) + 'y' : m + 'mo'),
      datasets: trendDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: c.text2, font: { ...font, size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 8 },
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}/use` },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Time Owned', color: c.text2, font: { ...font, size: 11 } },
          grid: { display: false },
          ticks: { color: c.text2, font: { ...font, size: 11 } },
          border: { display: false },
        },
        y: {
          title: { display: true, text: '$/Use', color: c.text2, font: { ...font, size: 11 } },
          beginAtZero: false,
          grid: { color: c.grid },
          ticks: {
            color: c.text2, font: { ...font, size: 11 },
            callback: v => '$' + v.toFixed(0),
          },
          border: { display: false },
        },
      },
    },
  });

  // ── 4. Monthly Cost Breakdown (stacked bar by category) ──
  destroyChart('monthlyCost');
  const categories = [...new Set(items.map(it => it.category || 'Uncategorized'))];
  // Each item's monthly cost = price / (daysSince / 30)
  // Or equivalently, cost per day * 30
  const monthlyCostByCat = {};
  categories.forEach(cat => {
    monthlyCostByCat[cat] = items
      .filter(it => (it.category || 'Uncategorized') === cat)
      .reduce((sum, it) => sum + costPerDay(it) * 30, 0);
  });
  chartInstances.monthlyCost = new Chart(document.getElementById('chartMonthlyCost'), {
    type: 'bar',
    data: {
      labels: ['Monthly Cost'],
      datasets: categories.map((cat, i) => ({
        label: cat,
        data: [+monthlyCostByCat[cat].toFixed(2)],
        backgroundColor: c.palette[i % c.palette.length] + '55',
        borderColor: c.palette[i % c.palette.length],
        borderWidth: 1.5,
        borderRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: c.text2, font: { ...font, size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 8 },
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.x.toFixed(2)}/mo` },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: c.grid },
          ticks: {
            color: c.text2, font: { ...font, size: 11 },
            callback: v => '$' + v,
          },
          border: { display: false },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { display: false },
          border: { display: false },
        },
      },
    },
  });
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Init
loadItems();
