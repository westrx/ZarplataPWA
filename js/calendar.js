// Календарь: залитые точки — факт из истории, контурные — план по настройкам.
// Тап по дню показывает детали. Несколько точек в день лежат в ряд.

const CAL_KIND_ORDER = ['advance', 'main', 'vacation', 'cash', 'debt'];

function initCalendar() {
  const container = document.getElementById('calendar-container');
  if (!container) return;
  container.innerHTML = `
    <div class="calendar-header">
      <button class="cal-nav-btn" id="cal-prev">‹</button>
      <span id="cal-title"></span>
      <button class="cal-nav-btn" id="cal-next">›</button>
    </div>
    <div class="calendar-grid" id="cal-grid"></div>`;
  document.getElementById('cal-prev').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  });
  document.addEventListener('click', (e) => {
    const tip = document.getElementById('calendar-tooltip');
    if (tip && !e.target.closest('.calendar-day') && !e.target.closest('.calendar-tooltip')) tip.style.display = 'none';
  });
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const currency = getCurrency();
  const title = document.getElementById('cal-title');
  if (title) title.textContent = new Date(calendarYear, calendarMonth, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = (now.getFullYear() === calendarYear && now.getMonth() === calendarMonth);

  // Факт по истории
  const dayData = {};
  const ensure = (day) => { if (!dayData[day]) dayData[day] = { kinds: new Set(), card: 0, cash: 0, vacation: 0, debt: 0 }; return dayData[day]; };
  getHistory().forEach(r => {
    const d = parseLocalDate(r.receivedDate);
    if (d && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) {
      const dd = ensure(d.getDate());
      dd.card += r.card || 0;
      dd.cash += r.cash || 0;
      dd.vacation += r.vacation || 0;
      dd.debt += r.debt || 0;
      if (r.kind === 'advance' && r.card > 0) dd.kinds.add('advance');
      else if (r.kind === 'vacation' && r.vacation > 0) dd.kinds.add('vacation');
      else if (r.kind === 'debt' && r.debt > 0) dd.kinds.add('debt');
      else if (r.card > 0) dd.kinds.add('main');
      if (r.cash > 0) dd.kinds.add('cash');
    }
    if (r.kind === 'vacation' && r.vacation > 0 && r.vacationDate) {
      const vd = parseLocalDate(r.vacationDate);
      if (vd && vd.getMonth() === calendarMonth && vd.getFullYear() === calendarYear) {
        const dd = ensure(vd.getDate());
        dd.vacation += r.vacation;
        dd.kinds.add('vacation');
      }
    }
  });

  // План по настройкам
  const pd = getPaydaySettings();
  const planned = [];
  const addPlan = (day, kind) => { if (day) planned.push({ day: getActualPayday(day, calendarMonth, calendarYear), kind }); };
  addPlan(pd.advance, 'advance');
  addPlan(pd.main, 'main');
  addPlan(pd.cash, 'cash');
  const plannedByDay = {};
  planned.forEach(p => { (plannedByDay[p.day] = plannedByDay[p.day] || []).push(p.kind); });

  let html = '';
  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(w => { html += `<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:4px 0;">${w}</div>`; });
  for (let i = 0; i < startWeekday; i++) html += '<div></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const weekend = [5, 6].includes((startWeekday + d - 1) % 7);
    const actual = dayData[d];
    const kinds = [];
    CAL_KIND_ORDER.forEach(kind => {
      const hasActual = actual && actual.kinds.has(kind);
      const hasPlanned = plannedByDay[d] && plannedByDay[d].includes(kind);
      if (hasActual) kinds.push({ kind, planned: false });
      else if (hasPlanned) kinds.push({ kind, planned: true });
    });
    const dotsHtml = kinds.map(k => `<span class="dot ${k.kind}${k.planned ? ' planned' : ''}"></span>`).join('');
    const isToday = isCurrentMonth && now.getDate() === d;
    html += `<div class="calendar-day${weekend ? ' weekend' : ''}" data-day="${d}" onclick="onCalendarDayClick(this)"${isToday ? ' style="border:1px solid rgba(157,78,221,0.6);"' : ''}><span class="day-num">${d}</span><span class="dots">${dotsHtml}</span></div>`;
  }
  grid.innerHTML = html;
}

function onCalendarDayClick(el) {
  const tooltip = document.getElementById('calendar-tooltip');
  const day = parseInt(el.dataset.day, 10);
  const currency = getCurrency();
  const lines = [`<b>${day} ${new Date(calendarYear, calendarMonth, 1).toLocaleString('ru-RU', { month: 'long' })}</b>`];
  let has = false;

  // собираем факт по этому дню
  const sums = { card: 0, cash: 0, vacation: 0, debt: 0 };
  const kinds = new Set();
  getHistory().forEach(r => {
    const d = parseLocalDate(r.receivedDate);
    if (d && d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) {
      sums.card += r.card || 0; sums.cash += r.cash || 0; sums.vacation += r.vacation || 0; sums.debt += r.debt || 0;
      if (r.card > 0 || r.vacation > 0) kinds.add(r.kind);
      if (r.cash > 0) kinds.add('cash');
    }
    if (r.kind === 'vacation' && r.vacation > 0 && r.vacationDate) {
      const vd = parseLocalDate(r.vacationDate);
      if (vd && vd.getDate() === day && vd.getMonth() === calendarMonth && vd.getFullYear() === calendarYear) { sums.vacation += r.vacation; kinds.add('vacation'); }
    }
  });
  const labels = { main: 'Зарплата', advance: 'Аванс', vacation: 'Отпускные', debt: 'Долг' };
  kinds.forEach(k => {
    if (k === 'main' || k === 'advance') { lines.push(`${labels[k]} на карту: ${formatMoney(sums.card, currency)}`); has = true; }
    if (k === 'vacation') { lines.push(`Отпускные: ${formatMoney(sums.vacation, currency)}`); has = true; }
    if (k === 'debt') { lines.push(`Долг: ${formatMoney(sums.debt, currency)}`); has = true; }
  });
  if (sums.cash > 0) { lines.push(`В конверте: ${formatMoney(sums.cash, currency)}`); has = true; }

  // план
  const pd = getPaydaySettings();
  const plan = [];
  if (pd.main && getActualPayday(pd.main, calendarMonth, calendarYear) === day && !kinds.has('main')) plan.push('зарплата');
  if (pd.advance && getActualPayday(pd.advance, calendarMonth, calendarYear) === day && !kinds.has('advance')) plan.push('аванс');
  if (pd.cash && getActualPayday(pd.cash, calendarMonth, calendarYear) === day && !kinds.has('cash')) plan.push('конверт');
  if (plan.length) { lines.push(`План: ${plan.join(', ')}`); has = true; }

  if (!has) { tooltip.style.display = 'none'; return; }
  tooltip.innerHTML = lines.join('<br>');
  tooltip.style.display = 'block';
}
