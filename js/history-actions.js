// Тосты, экспорт/импорт JSON, CSV-кнопка, очистка, удаление записи,
// виджет "уже учтено в этом месяце"

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function updateCurrentMonthTotalVisual() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const currency = getCurrency();
  let total = 0;
  getHistory().forEach(item => {
    const d = recordDate(item);
    if (d && !isNaN(d) && d.getMonth() === month && d.getFullYear() === year) total += recordReceived(item);
  });
  document.getElementById('current-month-total').textContent = formatMoney(total, currency);
}

function exportHistory() {
  const data = getHistory();
  const dataStr = JSON.stringify(data, null, 2);
  downloadFile(`salary-history-${new Date().toISOString().split('T')[0]}.json`, dataStr, 'application/json');
  showToast('История экспортирована', 2000);
}

function refreshAllAfterDataChange() {
  updateCurrentMonthTotalVisual();
  renderAnalytics();
  renderCalendar();
  updateDebtBadge();
  updateCountdown();
}

function importHistory(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) { showToast('Неверный формат файла', 3000); return; }
      setHistory(data.map(normalizeRecord).filter(Boolean));
      refreshAllAfterDataChange();
      showToast(`Импортировано записей: ${data.length}`, 2000);
    } catch (err) {
      showToast('Ошибка чтения файла', 3000);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

function clearHistory() {
  if (confirm('Очистить всю историю? Это действие нельзя отменить.')) {
    setHistory([]);
    refreshAllAfterDataChange();
    showToast('История очищена', 2000);
  }
}

function deleteHistoryItem(index) {
  const history = getHistory();
  if (index < 0 || index >= history.length) return;
  history.splice(index, 1);
  setHistory(history);
  refreshAllAfterDataChange();
  showToast('Запись удалена', 2000);
}
