// Инициализация приложения

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

function init() {
  chartTooltip = document.getElementById('chart-tooltip');

  // Скрытые инпуты, хранящие значения настроек
  const hiddenInputs = [
    { id: 'payday-advance', value: '25' },
    { id: 'payday-main', value: '10' },
    { id: 'payday-unofficial', value: '15' },
    { id: 'currency', value: '₽' },
    { id: 'reminder-days', value: '3' },
    { id: 'default-stats', value: '6' },
    { id: 'stats-period', value: '6' }
  ];
  hiddenInputs.forEach(h => {
    if (!document.getElementById(h.id)) {
      const inp = document.createElement('input');
      inp.type = 'hidden';
      inp.id = h.id;
      inp.value = h.value;
      document.body.appendChild(inp);
    }
  });

  initTriggers();
  initCalendar();
  loadSettings();
  initNewInputScreen();
  initEditModal();
  initQuickCustomSelects();

  updateCurrentMonthTotalVisual();
  renderCalendar();
  renderAnalytics();

  enableAutoCalc();

  checkPaydayReminders();
  setInterval(checkPaydayReminders, 3600000);

  initSwipeNavigation();

  requestAnimationFrame(() => moveNavIndicator(document.querySelector('.nav-item.active')));

  const goalAmount = document.getElementById('goal-amount');
  const goalMonth = document.getElementById('goal-month');
  if (goalAmount) goalAmount.addEventListener('input', () => { goalAmount.value = cleanNumberInput(goalAmount.value); saveSettings(); });
  if (goalMonth) goalMonth.addEventListener('change', saveSettings);
}

function initTriggers() {
  // Дни выплат
  const dayOpts = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} число` }));
  const paydayChange = () => { saveSettings(); renderCalendar(); updateCountdown(); };
  initDropdown(document.getElementById('payday-advance-trigger'), 'payday-advance', dayOpts, paydayChange);
  initDropdown(document.getElementById('payday-main-trigger'), 'payday-main', dayOpts, paydayChange);
  initDropdown(document.getElementById('payday-unofficial-trigger'), 'payday-unofficial', dayOpts, paydayChange);

  initDropdown(document.getElementById('currency-trigger'), 'currency', CURRENCIES, () => {
    saveSettings();
    updateCurrentMonthTotalVisual();
    renderAnalytics();
    renderTemplateChips();
    updateDebtBadge();
    updateCountdown();
  });

  const remOpts = REMINDER_OPTIONS.map(v => ({ value: v, label: (v === '0' ? '0 (только в день)' : v + ' ' + (v === '1' ? 'день' : (v >= '2' && v <= '4' ? 'дня' : 'дней'))) }));
  initDropdown(document.getElementById('reminder-trigger'), 'reminder-days', remOpts, saveSettings);

  const statOpts = STATS_PERIODS.map(p => ({ value: p.value, label: p.label }));
  initDropdown(document.getElementById('default-stats-trigger'), 'default-stats', statOpts, saveSettings);
  initDropdown(document.getElementById('stats-trigger'), 'stats-period', statOpts, (opt) => {
    const t = document.getElementById('stats-trigger');
    if (t) t.querySelector('span').textContent = opt.label;
    saveSettings();
    renderAnalytics();
  });

  // Дропдауны модалки редактирования
  initDropdown(document.getElementById('edit-trigger-type'), 'edit-type', KIND_OPTIONS, () => { setEditKindUI(); });
  initDropdown(document.getElementById('edit-trigger-category'), 'edit-category', CATEGORIES.map(c => ({ value: c, label: c })), () => {});
}

window.addEventListener('resize', () => {
  renderAnalytics();
  moveNavIndicator(document.querySelector('.nav-item.active'));
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Показ/скрытие нижней навигации при скролле
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav-wrapper');
  if (!nav) return;
  const st = window.scrollY || document.documentElement.scrollTop;
  if (st > lastScrollTop && st > 50) nav.classList.add('hidden');
  else nav.classList.remove('hidden');
  lastScrollTop = st;
}, { passive: true });

document.addEventListener('DOMContentLoaded', init);
