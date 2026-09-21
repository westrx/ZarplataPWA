// Настройки: тема, выплаты, валюта, шаблоны, цель
'use strict';

const SETTINGS_KEY = 'salary-settings';
const CATEGORIES = ['Основная', 'Подработка', 'Премия', 'Другое'];
const KIND_OPTIONS = [
  { value: 'main', label: 'Выплата (ЗП)' },
  { value: 'advance', label: 'Аванс' },
  { value: 'vacation', label: 'Отпускные' },
  { value: 'debt', label: 'Долг (недоплата)' }
];
const REMINDER_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7'];
const STATS_PERIODS = [
  { label: 'За 3 месяца', value: '3' },
  { label: 'За 6 месяцев', value: '6' },
  { label: 'За год', value: '12' },
  { label: 'Всё время', value: 'all' }
];
const CURRENCIES = [
  { label: '₽ (Рубль)', value: '₽' },
  { label: '$ (Доллар)', value: '$' },
  { label: '€ (Евро)', value: '€' }
];
const DEFAULT_TEMPLATES = [
  { name: '', amount: '', category: 'Основная' },
  { name: '', amount: '', category: 'Основная' },
  { name: '', amount: '', category: 'Основная' }
];

function saveSettings() {
  const settings = {
    theme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
    hintsEnabled: document.getElementById('hints-toggle')?.classList.contains('active') ?? true,
    notificationsEnabled: document.getElementById('notifications-toggle')?.classList.contains('active') ?? true,
    paydayAdvance: document.getElementById('payday-advance')?.value || '',
    paydayMain: document.getElementById('payday-main')?.value || '',
    paydayUnofficial: document.getElementById('payday-unofficial')?.value || '',
    currency: document.getElementById('currency')?.value || '₽',
    reminderDays: document.getElementById('reminder-days')?.value ?? '3',
    defaultStatsPeriod: document.getElementById('default-stats')?.value || '6',
    templates: readTemplatesFromEditor(),
    goal: readGoalFromInputs()
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function readTemplatesFromEditor() {
  const rows = document.querySelectorAll('#template-editor .template-row');
  const arr = [];
  rows.forEach(row => {
    arr.push({
      name: row.querySelector('[data-field="name"]').value.trim(),
      amount: cleanNumberInput(row.querySelector('[data-field="amount"]').value || ''),
      category: row.querySelector('[data-field="category"]').value.trim() || 'Основная'
    });
  });
  return arr.length ? arr : DEFAULT_TEMPLATES;
}

function readGoalFromInputs() {
  const amount = parseNumberFromInput('goal-amount');
  const month = document.getElementById('goal-month')?.value || '';
  if (amount > 0 && month) return { amount, month };
  return null;
}

function loadSettings() {
  const defaults = {
    theme: 'dark', hintsEnabled: true, notificationsEnabled: true,
    paydayAdvance: '25', paydayMain: '10', paydayUnofficial: '15',
    currency: '₽', reminderDays: '3', defaultStatsPeriod: '6',
    templates: DEFAULT_TEMPLATES, goal: null
  };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { saved = {}; }
  const settings = Object.assign({}, defaults, saved);
  if (!Array.isArray(settings.templates) || settings.templates.length !== 3) settings.templates = DEFAULT_TEMPLATES;

  // Применяем к UI
  document.body.classList.toggle('light-theme', settings.theme === 'light');
  const hintsEl = document.getElementById('hints-toggle');
  if (hintsEl) hintsEl.classList.toggle('active', !!settings.hintsEnabled);
  const notifEl = document.getElementById('notifications-toggle');
  if (notifEl) notifEl.classList.toggle('active', !!settings.notificationsEnabled);

  const setHidden = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setHidden('payday-advance', settings.paydayAdvance);
  setHidden('payday-main', settings.paydayMain);
  setHidden('payday-unofficial', settings.paydayUnofficial);
  setHidden('currency', settings.currency);
  setHidden('reminder-days', settings.reminderDays);
  setHidden('default-stats', settings.defaultStatsPeriod);

  // Тексты триггеров
  const setTrigger = (triggerId, text) => { const t = document.getElementById(triggerId); if (t) t.querySelector('span').textContent = text; };
  setTrigger('payday-advance-trigger', settings.paydayAdvance ? settings.paydayAdvance + ' число' : '—');
  setTrigger('payday-main-trigger', settings.paydayMain ? settings.paydayMain + ' число' : '—');
  setTrigger('payday-unofficial-trigger', settings.paydayUnofficial ? settings.paydayUnofficial + ' число' : '—');
  const cur = CURRENCIES.find(c => c.value === settings.currency);
  setTrigger('currency-trigger', cur ? cur.label : '₽ (Рубль)');
  const remLabels = { '0': '0 (только в день)', '1': '1 день', '2': '2 дня', '3': '3 дня', '4': '4 дня', '5': '5 дней', '6': '6 дней', '7': '7 дней' };
  setTrigger('reminder-trigger', remLabels[parseInt(settings.reminderDays, 10)] || '3 дня');
  const st = STATS_PERIODS.find(p => p.value === String(settings.defaultStatsPeriod)) || STATS_PERIODS[1];
  setTrigger('default-stats-trigger', st.label);
  setTrigger('stats-trigger', st.label);
  const statsHidden = document.getElementById('stats-period');
  if (statsHidden) statsHidden.value = String(settings.defaultStatsPeriod);

  renderTemplateEditor(settings.templates);
  applyGoalToInputs(settings.goal);
  renderAnalytics();
  renderCalendar();
  renderTemplateChips();
  updateDebtBadge();
  updateCountdown();

  if (settings.notificationsEnabled) enableNotifications(); else disableNotifications();
}

function renderTemplateEditor(templates) {
  const container = document.getElementById('template-editor');
  if (!container) return;
  container.innerHTML = '';
  templates.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'template-row';
    row.innerHTML = `
      <input type="text" data-field="name" placeholder="Название ${i + 1}" value="${(t.name || '').replace(/"/g, '&quot;')}" style="flex:2;">
      <input type="text" data-field="amount" inputmode="decimal" placeholder="Сумма" value="${t.amount || ''}" style="flex:1.2;">
      <input type="text" data-field="category" placeholder="Категория" value="${(t.category || 'Основная').replace(/"/g, '&quot;')}" style="flex:1.2;">`;
    container.appendChild(row);
  });
  container.querySelectorAll('input').forEach(inp => inp.addEventListener('input', saveSettings));
}

function applyGoalToInputs(goal) {
  const a = document.getElementById('goal-amount');
  const m = document.getElementById('goal-month');
  if (a) a.value = goal && goal.amount ? String(goal.amount) : '';
  if (m) m.value = goal && goal.month ? goal.month : '';
}

function getTemplates() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return (Array.isArray(s.templates) && s.templates.length === 3) ? s.templates : DEFAULT_TEMPLATES;
  } catch (e) { return DEFAULT_TEMPLATES; }
}

function getGoal() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return s.goal || null;
  } catch (e) { return null; }
}

function getCurrency() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return s.currency || '₽';
  } catch (e) { return '₽'; }
}

// Плановые даты выплат из настроек (для календаря-плана и счётчика)
function getPaydaySettings() {
  const ga = (id) => { const el = document.getElementById(id); return el && el.value ? parseInt(el.value, 10) : null; };
  return {
    advance: ga('payday-advance'),
    main: ga('payday-main'),
    cash: ga('payday-unofficial')
  };
}
