'use strict';
// Действия над историей: очистка формы, удаление/редактирование записи,
// экспорт/импорт/очистка истории.

      function updateCurrentMonthTotalVisual() {
        const now = new Date();
        const month = now.getMonth(), year = now.getFullYear();
        const history = getHistory();
        let total = 0;
        history.forEach(item => {
          const d = new Date(item.receivedDate);
          if (d.getMonth() === month && d.getFullYear() === year) total += item.total || 0;
        });
        document.getElementById('current-month-total').textContent = formatMoney(total, document.getElementById('currency-select-hidden')?.value || '₽');
      }


      window.deleteHistoryItem = function(index) {
        const history = getHistory();
        if (index >= 0 && index < history.length) {
          history.splice(index, 1);
          setHistory(history);
          renderAnalytics();
        }
      };


      window.editHistoryItem = function(index) {
        const history = getHistory();
        if (index < 0 || index >= history.length) return;
        openEditModal(index, history[index]);
      };


      window.exportHistory = function() {
        const history = getHistory();
        if (history.length === 0) { showToast('История пуста', 2000); return; }
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salary_history_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };


      window.importHistory = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
              setHistory(data);
              renderAnalytics();
              showToast('История импортирована', 2000);
            } else { showToast('Неверный формат файла', 2500); }
          } catch { showToast('Ошибка при чтении файла', 2500); }
        };
        reader.readAsText(file);
        event.target.value = '';
      };


      window.clearHistory = function() {
        if (confirm('Вы точно хотите очистить всю историю?')) {
          setHistory([]);
          renderAnalytics();
          updateCurrentMonthTotalVisual();
          renderCalendar();
          showToast('История очищена', 2000);
          editingIndex = null;
        }
      };

