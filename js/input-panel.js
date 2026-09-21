// Экран быстрого ввода: шаблоны, сплит карта/конверт, типы (ЗП/аванс/отпуск/долг),
// счётчик до следующей выплаты, бейдж долга, конфетти за рекордный месяц

function applyKindUI() {
  const kind = document.getElementById('quick-salary-type').value;
  const labelCard = document.getElementById('label-card-amount');
  const rowCash = document.getElementById('row-cash-amount');
  if (kind === 'vacation') { labelCard.textContent = 'Сумма отпускных'; rowCash.classList.add('hidden-field'); }
  else if (kind === 'debt') { labelCard.textContent = 'Сумма долга'; rowCash.classList.add('hidden-field'); }
  else { labelCard.textContent = 'Сумма на карту'; rowCash.classList.remove('hidden-field'); }
}

function initQuickCustomSelects() {
  initDropdown(
    document.getElementById('trigger-type'),
    'quick-salary-type',
    KIND_OPTIONS,
    () => { applyKindUI(); if (navigator.vibrate) navigator.vibrate(10); }
  );
  initDropdown(
    document.getElementById('trigger-category'),
    'quick-salary-cat',
    CATEGORIES.map(c => ({ value: c, label: c })),
    () => { if (navigator.vibrate) navigator.vibrate(10); }
  );
}

function initNewInputScreen() {
  const dateInput = document.getElementById('quick-salary-date');
  dateInput.valueAsDate = new Date();

  document.getElementById('quick-card-amount').addEventListener('input', (e) => { e.target.value = cleanNumberInput(e.target.value); });
  document.getElementById('quick-cash-amount').addEventListener('input', (e) => { e.target.value = cleanNumberInput(e.target.value); });

  document.getElementById('btn-submit-stream').addEventListener('click', () => {
    const kind = document.getElementById('quick-salary-type').value;
    const card = parseNumberFromInput('quick-card-amount');
    const cash = (kind === 'main' || kind === 'advance') ? parseNumberFromInput('quick-cash-amount') : 0;
    const dateEl = document.getElementById('quick-salary-date');
    if (!dateEl.value) { showToast('Укажите дату', 2000); return; }
    if (kind === 'debt') { if (card <= 0) { showToast('Введите сумму долга', 2000); return; } }
    else if (card + cash <= 0) { showToast('Введите сумму', 2000); return; }

    const category = document.getElementById('quick-salary-cat').value;
    const d = parseLocalDate(dateEl.value) || new Date();
    const wasBest = getBestMonthTotal(d.getFullYear(), d.getMonth());

    saveQuickPaymentToHistory(card, cash, kind, dateEl.value, category, '');

    document.getElementById('quick-card-amount').value = '';
    document.getElementById('quick-cash-amount').value = '';
    updateCurrentMonthTotalVisual();
    renderAnalytics();
    renderCalendar();
    updateDebtBadge();
    updateCountdown();

    if (kind !== 'debt') {
      const mt = getMonthTotal(d.getFullYear(), d.getMonth());
      if (wasBest > 0 && mt > wasBest) launchConfetti();
    }
    if (navigator.vibrate) navigator.vibrate(30);
    showToast(kind === 'debt' ? 'Долг записан' : 'Выплата добавлена', 2000);
  });

  applyKindUI();
  renderTemplateChips();
  updateDebtBadge();
  updateCountdown();
}

// Шаблоны: быстрые чипы над формой ввода
function renderTemplateChips() {
  const c = document.getElementById('template-chips');
  if (!c) return;
  const tpls = getTemplates().filter(t => t.name && parseFloat(t.amount) > 0);
  c.innerHTML = '';
  tpls.forEach(t => {
    const b = document.createElement('button');
    b.className = 'template-chip';
    b.textContent = `${t.name} · ${formatMoney(parseFloat(t.amount), getCurrency())}`;
    b.onclick = () => {
      document.getElementById('quick-card-amount').value = t.amount;
      const cat = t.category || 'Основная';
      document.getElementById('quick-salary-cat').value = cat;
      const trg = document.getElementById('trigger-category');
      if (trg) trg.querySelector('.selected-value').textContent = cat;
      if (navigator.vibrate) navigator.vibrate(10);
    };
    c.appendChild(b);
  });
}

function updateDebtBadge() {
  const el = document.getElementById('debt-badge');
  if (!el) return;
  const debt = getOpenDebt(getHistory());
  if (debt > 0) {
    el.textContent = 'Долг работодателя: ' + formatMoney(debt, getCurrency());
    el.classList.remove('hidden-field');
  } else {
    el.classList.add('hidden-field');
  }
}

function updateCountdown() {
  const el = document.getElementById('payday-countdown');
  if (!el) return;
  const pd = getPaydaySettings();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidates = [];
  const addCand = (day, label) => {
    if (!day) return;
    let m = now.getMonth(), y = now.getFullYear();
    let actual = getActualPayday(day, m, y);
    let d = new Date(y, m, actual);
    if (d < today) { m++; if (m > 11) { m = 0; y++; } actual = getActualPayday(day, m, y); d = new Date(y, m, actual); }
    candidates.push({ d, label });
  };
  addCand(pd.main, 'ЗП');
  addCand(pd.advance, 'аванс');
  addCand(pd.cash, 'конверт');
  if (!candidates.length) { el.textContent = ''; return; }
  candidates.sort((a, b) => a.d - b.d);
  const days = Math.round((candidates[0].d - today) / 86400000);
  el.textContent = days === 0 ? `Сегодня: ${candidates[0].label}` : `До выплаты (${candidates[0].label}): ${days} дн`;
}

// Модалка редактирования записи
function setEditKindUI() {
  const kind = document.getElementById('edit-type').value;
  const label = document.getElementById('label-edit-amount');
  const rowCash = document.getElementById('row-edit-cash');
  if (kind === 'vacation') { label.textContent = 'Сумма отпускных'; rowCash.classList.add('hidden-field'); }
  else if (kind === 'debt') { label.textContent = 'Сумма долга'; rowCash.classList.add('hidden-field'); }
  else { label.textContent = 'На карту'; rowCash.classList.remove('hidden-field'); }
}

function openEditModal(index) {
  const history = getHistory();
  const item = history[index];
  if (!item) return;
  editingIndex = index;
  const isCashKind = (item.kind === 'main' || item.kind === 'advance');
  document.getElementById('edit-amount').value = isCashKind ? String(item.card || 0) : String((item.vacation || 0) + (item.debt || 0) + (item.card || 0));
  document.getElementById('edit-cash').value = String(item.cash || 0);
  document.getElementById('edit-type').value = item.kind || 'main';
  document.getElementById('edit-category').value = item.category || 'Основная';
  document.getElementById('edit-date').value = item.receivedDate || '';
  const tt = document.getElementById('edit-trigger-type');
  const tk = KIND_OPTIONS.find(k => k.value === (item.kind || 'main'));
  if (tt && tk) tt.querySelector('.selected-value').textContent = tk.label;
  const tc = document.getElementById('edit-trigger-category');
  if (tc) tc.querySelector('.selected-value').textContent = item.category || 'Основная';
  setEditKindUI();
  const modal = document.getElementById('edit-modal');
  modal.classList.remove('hidden-field');
  modal.classList.add('modal-overlay');
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  modal.classList.add('hidden-field');
  modal.classList.remove('modal-overlay');
  editingIndex = null;
}

function initEditModal() {
  document.getElementById('btn-close-edit').addEventListener('click', closeEditModal);
  document.getElementById('edit-amount').addEventListener('input', (e) => { e.target.value = cleanNumberInput(e.target.value); });
  document.getElementById('edit-cash').addEventListener('input', (e) => { e.target.value = cleanNumberInput(e.target.value); });

  document.getElementById('btn-save-edit').addEventListener('click', () => {
    if (editingIndex === null) return;
    const kind = document.getElementById('edit-type').value;
    const card = parseNumberFromInput('edit-amount');
    const cash = (kind === 'main' || kind === 'advance') ? parseNumberFromInput('edit-cash') : 0;
    const dateEl = document.getElementById('edit-date');
    if (!dateEl.value) { showToast('Укажите дату', 2000); return; }
    if (kind === 'debt') { if (card <= 0) { showToast('Введите сумму долга', 2000); return; } }
    else if (card + cash <= 0) { showToast('Введите сумму', 2000); return; }
    updateHistoryRecord(editingIndex, card, cash, kind, dateEl.value, document.getElementById('edit-category').value);
    closeEditModal();
    updateCurrentMonthTotalVisual();
    renderAnalytics();
    renderCalendar();
    updateDebtBadge();
    updateCountdown();
    showToast('Запись обновлена', 2000);
  });

  document.getElementById('btn-delete-edit').addEventListener('click', () => {
    if (editingIndex === null) return;
    const idx = editingIndex;
    closeEditModal();
    deleteHistoryItem(idx);
  });
}

function enableAutoCalc() {}
function disableAutoCalc() {}
