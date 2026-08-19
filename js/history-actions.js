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


      window.clearAll = function() {
        document.querySelectorAll('#tab-input input[type="text"]').forEach(el => el.value = '');
        const vacationDateInput = document.getElementById('vacation-date');
        if (vacationDateInput) vacationDateInput.value = todayLocalISO();
        editingIndex = null;
        const submitBtn = document.getElementById('btn-submit-advanced');
        if (submitBtn) submitBtn.textContent = 'Сохранить сводку за месяц';
        const today = todayLocalISO();
        document.getElementById('quick-salary-amount').value = '';
        document.getElementById('quick-salary-date').valueAsDate = new Date();
        const triggerType = document.getElementById('trigger-type');
        if (triggerType) {
          triggerType.querySelector('.selected-value').textContent = 'Выплата (ЗП)';
          document.getElementById('quick-salary-type').value = 'main';
        }
        const triggerCat = document.getElementById('trigger-category');
        if (triggerCat) {
          triggerCat.querySelector('.selected-value').textContent = 'Основная';
          document.getElementById('quick-salary-cat').value = 'Основная';
        }
        updateCurrentMonthTotalVisual();
        saveSettings();
      };


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
        const item = history[index];

        // Открываем шторку и ждём отрисовки
        const panel = document.getElementById('advanced-salary-fields');
        panel.classList.remove('hidden-field');
        const btnStream = document.getElementById('btn-submit-stream');
        if (btnStream) btnStream.style.display = 'none';

        requestAnimationFrame(() => {
          const paymentsTrigger = document.querySelector('#payments-trigger span:first-child');
          if (paymentsTrigger) paymentsTrigger.textContent = String(item.paymentsCount || 1);
          const paymentsInput = document.getElementById('payments-count');
          if (paymentsInput) paymentsInput.value = String(item.paymentsCount || 1);
          if (vacationToggle) {
            if (item.hasVacation) vacationToggle.classList.add('active');
            else vacationToggle.classList.remove('active');
          }
          if (splitToggle) {
            if (item.hasUnofficial) splitToggle.classList.add('active');
            else splitToggle.classList.remove('active');
          }
          updateFieldsVisibility();

          const advanceInput = document.getElementById('input-advance');
          if (advanceInput) advanceInput.value = item.advance || '';
          const mainInput = document.getElementById('input-main');
          if (mainInput) mainInput.value = item.mainPayment || '';
          const vacationInput = document.getElementById('input-vacation');
          if (vacationInput) vacationInput.value = item.vacation || '';
          const unofficialInput = document.getElementById('input-unofficial');
          if (unofficialInput) unofficialInput.value = item.unofficial || '';
          const receivedInput = document.getElementById('received-date');
          if (receivedInput) receivedInput.value = item.receivedDate || '';
          const vacationDateInput = document.getElementById('vacation-date');
          if (vacationDateInput) vacationDateInput.value = item.vacationDate || item.receivedDate || todayLocalISO();

          const itemDate = new Date(item.receivedDate || item.date || Date.now());
          if (!isNaN(itemDate)) {
            document.getElementById('calc-month-value').innerText = MONTHS_RU[itemDate.getMonth()];
            document.getElementById('calc-year-value').innerText = itemDate.getFullYear();
          }

          editingIndex = index;
          const submitBtn = document.getElementById('btn-submit-advanced');
          if (submitBtn) submitBtn.textContent = 'Обновить запись';
          switchTab('tab-input', document.getElementById('nav-input'));
        });
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
          clearAll();
          showToast('История очищена', 2000);
          editingIndex = null;
        }
      };

