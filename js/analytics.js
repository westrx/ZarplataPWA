// Аналитика: график помесячно (градиент+сетка), структура по категориям,
// накопленный год, сравнение год-к-году, рекорды, цель, тепловая карта, история

const CATEGORY_COLORS = { 'Основная': '#9d4edd', 'Подработка': '#06d6a0', 'Премия': '#ffd166', 'Другое': '#00b4d8' };
const PIE_FALLBACK = ['#ef476f', '#8ecae6', '#ffb703', '#bde0fe', '#a3b18a'];

function renderAnalytics() {
  const periodEl = document.getElementById('stats-period');
  const periodVal = periodEl ? periodEl.value : '6';
  const currency = getCurrency();
  const records = periodVal === 'all' ? getHistory() : getFilteredHistory(parseInt(periodVal, 10));
  const grouped = groupDataForChart(records, currency);
  const keys = Object.keys(grouped).sort();
  const labels = keys.map(k => grouped[k].label);
  const values = keys.map(k => grouped[k].total);

  const skeleton = document.getElementById('chart-skeleton');
  const chartCard = document.getElementById('chart-container');
  const hasData = values.some(v => v > 0);
  if (skeleton) skeleton.style.display = hasData ? 'none' : 'flex';
  if (chartCard) chartCard.style.display = hasData ? 'block' : 'none';
  if (hasData) drawChart(labels, values, grouped, keys, currency);

  updateTrendsAndForecast(values, currency);
  updateStats(values, currency);
  renderHistoryList();
  renderRecordsRow(currency);
  renderGoal(currency);
  renderYoY(records, currency);
  renderCategoryPie(records, currency);
  renderCumulative(currency);
  renderHeatmap(currency);
}

function niceCeil(v) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const step = pow / 2;
  return Math.ceil(v / step) * step;
}

function roundTopRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawChart(labels, values, grouped, keys, currency) {
  const canvas = document.getElementById('salaryChart');
  if (!canvas) return;
  const container = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(container.clientWidth - 12, 200);
  const cssH = Math.min(Math.max(cssW * 9 / 16, 180), 400);
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const padding = { top: 20, right: 8, bottom: 30, left: 8 };
  const chartW = cssW - padding.left - padding.right;
  const chartH = cssH - padding.top - padding.bottom;
  const niceMax = niceCeil(Math.max(...values, 1));
  const groupW = chartW / values.length;

  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = padding.top + chartH * i / 4;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(cssW - padding.right, y); ctx.stroke();
  }

  values.forEach((v, i) => {
    const h = v > 0 ? Math.max((v / niceMax) * chartH, 3) : 0;
    const barW = Math.min(groupW * 0.55, 64);
    const x = padding.left + groupW * i + (groupW - barW) / 2;
    const y = padding.top + chartH - h;
    if (h > 0) {
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, '#b15ad6');
      grad.addColorStop(1, '#7b2cbf');
      ctx.fillStyle = grad;
      roundTopRect(ctx, x, y, barW, h, 6);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px -apple-system, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], padding.left + groupW * i + groupW / 2, cssH - 10);
  });

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const idx = Math.floor((mx - padding.left) / groupW);
    if (idx < 0 || idx >= values.length || values[idx] <= 0) { hideChartTooltip(); return; }
    const g = grouped[keys[idx]];
    const lines = [`<b>${g.label}</b>`, ...g.paymentsList];
    if (g.card > 0) lines.push(`На карту: ${formatMoney(g.card, currency)}`);
    if (g.cash > 0) lines.push(`В конверте: ${formatMoney(g.cash, currency)}`);
    lines.push(`Итого: ${formatMoney(g.total, currency)}`);
    showChartTooltip(e.clientX, e.clientY, lines.join('<br>'));
  };
  canvas.onmouseleave = hideChartTooltip;
}

function showChartTooltip(x, y, html) {
  if (!chartTooltip) return;
  chartTooltip.innerHTML = html;
  chartTooltip.style.left = Math.min(x + 12, window.innerWidth - 300) + 'px';
  chartTooltip.style.top = Math.max(y - 20, 50) + 'px';
  chartTooltip.classList.add('visible');
}

function hideChartTooltip() { if (chartTooltip) chartTooltip.classList.remove('visible'); }

function updateTrendsAndForecast(values, currency) {
  const trendEl = document.getElementById('trend-container');
  const forecastEl = document.getElementById('forecast-container');
  if (!trendEl || !forecastEl) return;
  if (values.length < 2) { trendEl.innerHTML = ''; forecastEl.innerHTML = ''; return; }
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const diff = last - prev;
  const pct = prev !== 0 ? Math.round((diff / prev) * 100) : 0;
  const up = diff >= 0;
  trendEl.innerHTML = `<div class="card" style="padding:12px 16px;"><span style="color:${up ? 'var(--c-main)' : '#ff6b6b'};font-weight:700;">${up ? '▲' : '▼'} ${formatMoney(Math.abs(diff), currency)} (${up ? '+' : ''}${pct}%)</span> <span style="color:var(--text-secondary);font-size:14px;">к прошлому месяцу</span></div>`;
  const recent = values.slice(-3);
  const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
  forecastEl.innerHTML = `<div class="card" style="padding:12px 16px;"><span style="color:var(--accent-purple);font-weight:700;">Прогноз на следующий месяц: ~${formatMoney(avg, currency)}</span></div>`;
}

function updateStats(values, currency) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  if (!values.length) { set('stat-avg', '-'); set('stat-median', '-'); set('stat-min', '-'); set('stat-max', '-'); return; }
  const sorted = values.slice().sort((a, b) => a - b);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  set('stat-avg', formatMoney(avg, currency));
  set('stat-median', formatMoney(median, currency));
  set('stat-min', formatMoney(sorted[0], currency));
  set('stat-max', formatMoney(sorted[sorted.length - 1], currency));
}

function renderHistoryList() {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;
  const history = getHistory();
  if (!history.length) {
    historyList.innerHTML = '<div class="card"><div class="empty">Пока нет записей.<br>Добавьте первую выплату на вкладке «Ввод».</div></div>';
    return;
  }
  const currency = getCurrency();
  historyList.innerHTML = history.map((item, index) => {
    const rows = [];
    if (item.card > 0) rows.push(`<div class="history-payment-row t-${item.kind === 'advance' ? 'advance' : 'main'}"><span class="history-payment-label">${item.kind === 'advance' ? 'Аванс на карту' : 'На карту'}</span><span class="history-payment-value">${formatMoney(item.card, currency)}</span></div>`);
    if (item.cash > 0) rows.push(`<div class="history-payment-row t-cash"><span class="history-payment-label">В конверте</span><span class="history-payment-value">${formatMoney(item.cash, currency)}</span></div>`);
    if (item.vacation > 0) rows.push(`<div class="history-payment-row t-vacation"><span class="history-payment-label">Отпускные</span><span class="history-payment-value">${formatMoney(item.vacation, currency)}</span></div>`);
    if (item.debt > 0) rows.push(`<div class="history-payment-row t-debt"><span class="history-payment-label">Долг (не получено)</span><span class="history-payment-value">${formatMoney(item.debt, currency)}</span></div>`);
    const d = parseLocalDate(item.receivedDate);
    const dateStr = d ? d.toLocaleDateString('ru-RU') : (item.receivedDate || '');
    return `<div class="card" style="padding:10px 16px;">
      <button class="action-btn edit-btn" onclick="openEditModal(${index})">✏️</button>
      <button class="action-btn delete-btn" onclick="deleteHistoryItem(${index})">×</button>
      <div class="history-payments-vertical-list">${rows.join('')}</div>
      <div class="history-card-footer"><span>${KIND_LABELS[item.kind] || 'Выплата'}</span><span>•</span><span>${item.category || 'Основная'}</span><span>•</span><span>${dateStr}</span></div>
    </div>`;
  }).join('');
}

function renderRecordsRow(currency) {
  const el = document.getElementById('records-row');
  if (!el) return;
  const info = getRecordsInfo();
  const debt = getOpenDebt(getHistory());
  const badges = [];
  if (info.bestKey) {
    const [y, m] = info.bestKey.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    badges.push(`<span class="record-badge gold">🏆 Рекорд: ${label} — ${formatMoney(info.bestAmount, currency)}</span>`);
  }
  if (info.streak >= 2) badges.push(`<span class="record-badge green">📈 Рост ${info.streak} мес. подряд</span>`);
  if (debt > 0) badges.push(`<span class="record-badge">⚠️ Долг: ${formatMoney(debt, currency)}</span>`);
  el.innerHTML = badges.join('');
}

function renderGoal(currency) {
  const card = document.getElementById('goal-card');
  if (!card) return;
  const goal = getGoal();
  if (!goal || !goal.amount) { card.style.display = 'none'; return; }
  const now = new Date();
  const year = now.getFullYear();
  let progress = 0;
  getHistory().forEach(r => {
    const d = parseLocalDate(r.receivedDate);
    if (d && d.getFullYear() === year) progress += recordReceived(r);
  });
  const pct = Math.min(100, Math.round(progress / goal.amount * 100));
  const [gy, gm] = goal.month.split('-').map(Number);
  let monthsLeft = (gy - year) * 12 + (gm - 1 - now.getMonth()) + 1;
  if (monthsLeft < 0) monthsLeft = 0;
  const doneMonths = now.getMonth() + 1;
  const avgYear = progress / doneMonths;
  const projected = progress + avgYear * monthsLeft;
  const ok = projected >= goal.amount;
  card.style.display = 'block';
  card.className = 'card';
  card.innerHTML = `
    <div class="block-title">Цель: ${formatMoney(goal.amount, currency)} к ${new Date(gy, gm - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</div>
    <div class="goal-progress"><div style="width:${pct}%"></div></div>
    <div class="goal-numbers"><span>Накоплено ${formatMoney(progress, currency)} (${pct}%)</span><span>${ok ? 'По темпу успеешь' : 'Не хватит ~' + formatMoney(goal.amount - projected, currency)}</span></div>`;
}

function renderYoY(records, currency) {
  const box = document.getElementById('yoy-container');
  const list = document.getElementById('yoy-list');
  if (!box || !list) return;
  const yoy = getYearOverYear(records);
  if (!yoy.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  list.innerHTML = yoy.slice(-12).map(r => {
    const [y, m] = r.key.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    const cls = r.diffPct >= 0 ? 'up' : 'down';
    return `<div class="yoy-row"><span>${label}</span><span style="color:var(--text-secondary)">${formatMoney(r.prev, currency)} → ${formatMoney(r.cur, currency)}</span><span class="yoy-diff ${cls}">${r.diffPct >= 0 ? '+' : ''}${r.diffPct}%</span></div>`;
  }).join('');
}

function renderCategoryPie(records, currency) {
  const card = document.getElementById('category-card');
  const canvas = document.getElementById('categoryChart');
  const legend = document.getElementById('category-legend');
  if (!card || !canvas || !legend) return;
  const cats = getCategoryBreakdown(records);
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e[1], 0);
  if (!entries.length || total <= 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const size = 160;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);
  let angle = -Math.PI / 2;
  entries.forEach((e, i) => {
    const slice = (e[1] / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, angle, angle + slice);
    ctx.arc(size / 2, size / 2, size / 4, angle + slice, angle, true);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[e[0]] || PIE_FALLBACK[i % PIE_FALLBACK.length];
    ctx.fill();
    angle += slice;
  });
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-main') || '#fff';
  ctx.font = '700 16px -apple-system, Roboto, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(formatMoney(total, currency), size / 2, size / 2);
  legend.innerHTML = entries.map((e, i) => {
    const pct = Math.round(e[1] / total * 100);
    const color = CATEGORY_COLORS[e[0]] || PIE_FALLBACK[i % PIE_FALLBACK.length];
    return `<div class="cat-legend-row"><span class="sw" style="background:${color}"></span><span>${e[0]}</span><span class="pct">${pct}%</span></div>`;
  }).join('');
}

function renderCumulative(currency) {
  const card = document.getElementById('cumulative-card');
  const canvas = document.getElementById('cumulativeChart');
  if (!card || !canvas) return;
  const year = new Date().getFullYear();
  const months = getYearCumulative(year);
  if (!getHistory().length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(canvas.parentElement.clientWidth - 32, 220);
  const cssH = 160;
  canvas.width = cssW * dpr; canvas.height = cssH * dpr;
  canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  const now = new Date();
  const upto = (year === now.getFullYear()) ? now.getMonth() : 11;
  const data = months.slice(0, upto + 1);
  const maxAcc = Math.max(...data.map(m => m.acc), 1);
  const padL = 10, padR = 10, padT = 14, padB = 22;
  const W = cssW - padL - padR, H = cssH - padT - padB;
  const px = i => padL + (data.length === 1 ? W / 2 : (W * i) / (data.length - 1));
  const py = v => padT + H - (v / maxAcc) * H;
  // сетка
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  for (let i = 1; i <= 3; i++) { const y = padT + H * i / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke(); }
  // area
  const grad = ctx.createLinearGradient(0, padT, 0, padT + H);
  grad.addColorStop(0, 'rgba(157,78,221,0.45)');
  grad.addColorStop(1, 'rgba(157,78,221,0.02)');
  ctx.beginPath();
  ctx.moveTo(px(0), py(data[0].acc));
  data.forEach((m, i) => ctx.lineTo(px(i), py(m.acc)));
  ctx.lineTo(px(data.length - 1), padT + H);
  ctx.lineTo(px(0), padT + H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  // line
  ctx.beginPath();
  data.forEach((m, i) => { i === 0 ? ctx.moveTo(px(i), py(m.acc)) : ctx.lineTo(px(i), py(m.acc)); });
  ctx.strokeStyle = '#b15ad6';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // points + labels
  ctx.font = '10px -apple-system, Roboto, sans-serif';
  ctx.textAlign = 'center';
  data.forEach((m, i) => {
    ctx.fillStyle = '#b15ad6';
    ctx.beginPath(); ctx.arc(px(i), py(m.acc), 3, 0, Math.PI * 2); ctx.fill();
    if (data.length <= 8 || i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(months[m.month] ? new Date(year, m.month, 1).toLocaleString('ru-RU', { month: 'short' }) : '', px(i), cssH - 8);
    }
  });
}

function renderHeatmap(currency) {
  const card = document.getElementById('heatmap-card');
  const box = document.getElementById('heatmap');
  if (!card || !box) return;
  const year = new Date().getFullYear();
  if (!getHistory().length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const daySums = {};
  getHistory().forEach(r => {
    const d = parseLocalDate(r.receivedDate);
    if (!d || d.getFullYear() !== year) return;
    const k = toISODate(d);
    daySums[k] = (daySums[k] || 0) + recordReceived(r);
  });
  const cellInfo = (sum) => {
    if (!sum) return ['', ''];
    if (sum >= 100000) return ['h4', formatMoney(sum, currency)];
    if (sum >= 50000) return ['h3', formatMoney(sum, currency)];
    if (sum >= 20000) return ['h2', formatMoney(sum, currency)];
    return ['h1', formatMoney(sum, currency)];
  };
  let html = '<div class="heatmap-grid">';
  const jan1 = new Date(year, 0, 1);
  const startOffset = (jan1.getDay() + 6) % 7;
  let cursor = new Date(year, 0, 1 - startOffset);
  const dec31 = new Date(year, 11, 31);
  while (cursor <= dec31) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + d);
      if (date > dec31) { html += '<div class="hm-cell" style="visibility:hidden"></div>'; continue; }
      if (date.getFullYear() !== year) { html += '<div class="hm-cell" style="visibility:hidden"></div>'; continue; }
      const k = toISODate(date);
      const [cls, label] = cellInfo(daySums[k] || 0);
      html += `<div class="hm-cell ${cls}" title="${date.toLocaleDateString('ru-RU')}${label ? ' — ' + label : ''}"></div>`;
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  html += '</div>';
  box.innerHTML = html;
}
