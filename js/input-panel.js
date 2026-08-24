'use strict';
// Вкладка «Ввод»: быстрый ввод, шторка «Полный расчёт месяца», авторасчёт.

      function initTriggers() {
        const triggers = document.querySelectorAll('.custom-select-trigger');
        if (!triggers.length) return;
        triggers.forEach(trigger => {
          trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.id;
            let options = [];
            let onSelect = null;

            if (id === 'stats-trigger') {
              const periods = [
                {value:'3', label:'За 3 месяца'},
                {value:'6', label:'За 6 месяцев'},
                {value:'12', label:'За 12 месяцев'},
                {value:'all', label:'За всё время'}
              ];
              options = periods.map(p => ({
                value: p.value,
                label: p.label,
                selected: document.querySelector('#stats-trigger span:first-child').textContent === p.label
              }));
              onSelect = (val, label) => {
                document.querySelector('#stats-trigger span:first-child').textContent = label;
                document.getElementById('stats-period').value = val;
                renderAnalytics();
                saveSettings();
              };
            } else if (id === 'reminder-trigger') {
              const days = [0,1,2,3,4,5,6,7];
              const labels = ['0 (только в день)','1 день','2 дня','3 дня','4 дня','5 дней','6 дней','7 дней'];
              options = days.map((d, i) => ({
                value: String(d),
                label: labels[i],
                selected: document.querySelector('#reminder-trigger span:first-child').textContent === labels[i]
              }));
              onSelect = (val, label) => {
                document.querySelector('#reminder-trigger span:first-child').textContent = label;
                document.getElementById('reminder-days-before').value = val;
                saveSettings();
              };
            } else if (id === 'currency-trigger') {
              const currencies = [
                {value:'₽', label:'₽ (Рубль)'},
                {value:'$', label:'$ (Доллар)'},
                {value:'€', label:'€ (Евро)'}
              ];
              options = currencies.map(c => ({
                value: c.value,
                label: c.label,
                selected: document.querySelector('#currency-trigger span:first-child').textContent === c.label
              }));
              onSelect = (val, label) => {
                document.querySelector('#currency-trigger span:first-child').textContent = label;
                document.getElementById('currency-select-hidden').value = val;
                saveSettings();
                renderAnalytics();
              };
            } else if (id === 'default-stats-trigger') {
              const periods = [
                {value:'3', label:'За 3 месяца'},
                {value:'6', label:'За 6 месяцев'},
                {value:'12', label:'За 12 месяцев'},
                {value:'all', label:'За всё время'}
              ];
              options = periods.map(p => ({
                value: p.value,
                label: p.label,
                selected: document.querySelector('#default-stats-trigger span:first-child').textContent === p.label
              }));
              onSelect = (val, label) => {
                document.querySelector('#default-stats-trigger span:first-child').textContent = label;
                document.getElementById('default-stats-period').value = val;
                saveSettings();
              };
            } else if (id === 'payday-advance-trigger') {
              const days = ['—',1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
              options = days.map(d => ({
                value: d === '—' ? '' : String(d),
                label: String(d),
                selected: document.querySelector('#payday-advance-trigger span:first-child').textContent === String(d)
              }));
              onSelect = (val, label) => {
                document.querySelector('#payday-advance-trigger span:first-child').textContent = label;
                document.getElementById('payday-advance').value = val;
                saveSettings();
                renderCalendar();
              };
            } else if (id === 'payday-main-trigger') {
              const days = ['—',1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
              options = days.map(d => ({
                value: d === '—' ? '' : String(d),
                label: String(d),
                selected: document.querySelector('#payday-main-trigger span:first-child').textContent === String(d)
              }));
              onSelect = (val, label) => {
                document.querySelector('#payday-main-trigger span:first-child').textContent = label;
                document.getElementById('payday-main').value = val;
                saveSettings();
                renderCalendar();
              };
            } else if (id === 'payday-unofficial-trigger') {
              const days = ['—',1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
              options = days.map(d => ({
                value: d === '—' ? '' : String(d),
                label: String(d),
                selected: document.querySelector('#payday-unofficial-trigger span:first-child').textContent === String(d)
              }));
              onSelect = (val, label) => {
                document.querySelector('#payday-unofficial-trigger span:first-child').textContent = label;
                document.getElementById('payday-unofficial').value = val;
                saveSettings();
                renderCalendar();
              };
            }

            if (options.length && onSelect) {
              openDropdown(this, options, onSelect);
            }
          });
        });
      }


      function enableAutoCalc() {
        const inputs = document.querySelectorAll('#tab-input input[type="text"]');
        inputs.forEach(input => {
          input.addEventListener('input', autoCalcHandler);
        });
      }
      function disableAutoCalc() {
        const inputs = document.querySelectorAll('#tab-input input[type="text"]');
        inputs.forEach(input => {
          input.removeEventListener('input', autoCalcHandler);
        });
      }
      function autoCalcHandler() {
        // Живой предпросмотр расчёта убрали вместе со старым интерфейсом.
        // Сохранение теперь всегда идёт через явные кнопки
        // «Добавить выплату» / «Сохранить сводку за месяц».
      }

      function initNewInputScreen() {
        const dateInput = document.getElementById('quick-salary-date');
        if (dateInput) dateInput.valueAsDate = new Date();

        document.getElementById('btn-submit-stream').addEventListener('click', () => {
          const amount = parseFloat(document.getElementById('quick-salary-amount').value.replace(',', '.')) || 0;
          if (amount <= 0) return showToast('Введите сумму', 1500);
          saveQuickPaymentToHistory(amount, document.getElementById('quick-salary-type').value, document.getElementById('quick-salary-date').value, document.getElementById('quick-salary-cat').value);
          document.getElementById('quick-salary-amount').value = '';
          updateCurrentMonthTotalVisual();
          renderAnalytics();
          showToast('Выплата добавлена', 2000);
        });

        updateCurrentMonthTotalVisual();
      }


      function initQuickCustomSelects() {
        const triggerType = document.getElementById('trigger-type');
        if (triggerType) {
          const typeOptions = [
            { value: 'main', label: 'Выплата (ЗП)' },
            { value: 'advance', label: 'Аванс' },
            { value: 'vacation', label: 'Отпускные' },
            { value: 'unofficial', label: 'В конверте' }
          ];
          triggerType.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentVal = document.getElementById('quick-salary-type').value;
            const opts = typeOptions.map(opt => ({ ...opt, selected: opt.value === currentVal }));
            openDropdown(this, opts, (val, label) => {
              this.querySelector('.selected-value').textContent = label;
              document.getElementById('quick-salary-type').value = val;
              saveSettings();
            });
          });
        }

        const triggerCat = document.getElementById('trigger-category');
        if (triggerCat) {
          const catOptions = [
            { value: 'Основная', label: 'Основная' },
            { value: 'Подработка', label: 'Подработка' },
            { value: 'Премия', label: 'Премия' },
            { value: 'Другое', label: 'Другое' }
          ];
          triggerCat.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentVal = document.getElementById('quick-salary-cat').value;
            const opts = catOptions.map(opt => ({ ...opt, selected: opt.value === currentVal }));
            openDropdown(this, opts, (val, label) => {
              this.querySelector('.selected-value').textContent = label;
              document.getElementById('quick-salary-cat').value = val;
              saveSettings();
            });
          });
        }
      }


      const EDIT_TYPE_OPTIONS = [
        { value: 'main', label: 'Выплата (ЗП)' },
        { value: 'advance', label: 'Аванс' },
        { value: 'vacation', label: 'Отпускные' },
        { value: 'unofficial', label: 'В конверте' }
      ];
      const EDIT_CATEGORY_OPTIONS = [
        { value: 'Основная', label: 'Основная' },
        { value: 'Подработка', label: 'Подработка' },
        { value: 'Премия', label: 'Премия' },
        { value: 'Другое', label: 'Другое' }
      ];

      function closeEditModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) modal.classList.add('hidden-field');
        editingIndex = null;
      }

      // Открывает модалку редактирования, предзаполняя поля данными записи.
      function openEditModal(index, item) {
        editingIndex = index;
        document.getElementById('edit-amount').value = item.total || '';
        document.getElementById('edit-date').value = item.receivedDate || todayLocalISO();

        let type = 'main';
        if (item.hasAdvance) type = 'advance';
        else if (item.hasVacation) type = 'vacation';
        else if (item.hasUnofficial) type = 'unofficial';
        const typeLabel = (EDIT_TYPE_OPTIONS.find(o => o.value === type) || EDIT_TYPE_OPTIONS[0]).label;
        document.getElementById('edit-type').value = type;
        document.querySelector('#edit-trigger-type .selected-value').textContent = typeLabel;

        const category = item.category || 'Основная';
        document.getElementById('edit-category').value = category;
        document.querySelector('#edit-trigger-category .selected-value').textContent = category;

        document.getElementById('edit-modal').classList.remove('hidden-field');
      }

      function initEditModal() {
        const triggerType = document.getElementById('edit-trigger-type');
        if (triggerType) {
          triggerType.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentVal = document.getElementById('edit-type').value;
            const opts = EDIT_TYPE_OPTIONS.map(opt => ({ ...opt, selected: opt.value === currentVal }));
            openDropdown(this, opts, (val, label) => {
              this.querySelector('.selected-value').textContent = label;
              document.getElementById('edit-type').value = val;
            });
          });
        }

        const triggerCat = document.getElementById('edit-trigger-category');
        if (triggerCat) {
          triggerCat.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentVal = document.getElementById('edit-category').value;
            const opts = EDIT_CATEGORY_OPTIONS.map(opt => ({ ...opt, selected: opt.value === currentVal }));
            openDropdown(this, opts, (val, label) => {
              this.querySelector('.selected-value').textContent = label;
              document.getElementById('edit-category').value = val;
            });
          });
        }

        document.getElementById('btn-close-edit').addEventListener('click', (e) => {
          e.preventDefault();
          closeEditModal();
        });

        document.getElementById('btn-save-edit').addEventListener('click', (e) => {
          e.preventDefault();
          const amount = parseNumberFromInput(document.getElementById('edit-amount').value);
          if (amount <= 0) return showToast('Введите сумму', 1500);
          const date = document.getElementById('edit-date').value || todayLocalISO();
          const type = document.getElementById('edit-type').value;
          const category = document.getElementById('edit-category').value;
          updateHistoryRecord(editingIndex, amount, type, date, category);
          closeEditModal();
          updateCurrentMonthTotalVisual();
          renderAnalytics();
          renderCalendar();
          showToast('Запись обновлена', 2000);
        });

        document.getElementById('btn-delete-edit').addEventListener('click', (e) => {
          e.preventDefault();
          const index = editingIndex;
          closeEditModal();
          deleteHistoryItem(index);
          updateCurrentMonthTotalVisual();
          renderCalendar();
          showToast('Запись удалена', 2000);
        });
      }

