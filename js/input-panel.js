'use strict';
// Вкладка «Ввод»: быстрый ввод, шторка «Полный расчёт месяца», авторасчёт.

      const advanceBlock = document.getElementById('advance-block');
      const vacationToggle = document.getElementById('vacation-toggle');
      const vacationBlock = document.getElementById('vacation-block');
      const splitToggle = document.getElementById('split-toggle');
      const unofficialBlock = document.getElementById('unofficial-block');

      function updateFieldsVisibility() {
        const count = parseInt(document.getElementById('payments-count').value || '1', 10);
        if (advanceBlock) {
          if (count === 2) advanceBlock.classList.remove('hidden-field');
          else advanceBlock.classList.add('hidden-field');
        }
        if (vacationBlock) {
          if (vacationToggle && vacationToggle.classList.contains('active')) vacationBlock.classList.remove('hidden-field');
          else vacationBlock.classList.add('hidden-field');
        }
        if (unofficialBlock) {
          if (splitToggle && splitToggle.classList.contains('active')) unofficialBlock.classList.remove('hidden-field');
          else unofficialBlock.classList.add('hidden-field');
        }
      }

      window.toggleVacation = function() {
        if (vacationToggle) {
          vacationToggle.classList.toggle('active');
          updateFieldsVisibility();
          saveSettings();
        }
      };

      window.toggleSplit = function() {
        if (splitToggle) {
          splitToggle.classList.toggle('active');
          updateFieldsVisibility();
          saveSettings();
        }
      };


      function initTriggers() {
        const triggers = document.querySelectorAll('.custom-select-trigger');
        if (!triggers.length) return;
        triggers.forEach(trigger => {
          trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.id;
            let options = [];
            let onSelect = null;

            if (id === 'payments-trigger') {
              const count = [1,2];
              options = count.map(c => ({
                value: String(c),
                label: String(c),
                selected: document.querySelector('#payments-trigger span:first-child').textContent === String(c)
              }));
              onSelect = (val) => {
                document.querySelector('#payments-trigger span:first-child').textContent = val;
                document.getElementById('payments-count').value = val;
                updateFieldsVisibility();
                saveSettings();
              };
            } else if (id === 'category-trigger') {
              const cats = ['Основная','Подработка','Премия','Другое'];
              options = cats.map(c => ({
                value: c,
                label: c,
                selected: document.querySelector('#category-trigger span:first-child').textContent === c
              }));
              onSelect = (val) => {
                document.querySelector('#category-trigger span:first-child').textContent = val;
                document.getElementById('category-select-hidden').value = val;
                toggleCustomCategoryVisibility();
                saveSettings();
              };
            } else if (id === 'stats-trigger') {
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


      function initAdvancedPanel() {
        const panel = document.getElementById('advanced-salary-fields');
        const btnSubmitStream = document.getElementById('btn-submit-stream');

        document.getElementById('btn-toggle-advanced').addEventListener('click', (e) => {
          e.preventDefault();
          const now = new Date();
          document.getElementById('calc-month-value').innerText = MONTHS_RU[now.getMonth()];
          document.getElementById('calc-year-value').innerText = now.getFullYear();
          panel.classList.remove('hidden-field');
          if (btnSubmitStream) btnSubmitStream.style.display = 'none';
        });

        document.getElementById('btn-close-advanced').addEventListener('click', (e) => {
          e.preventDefault();
          panel.classList.add('hidden-field');
          if (btnSubmitStream) btnSubmitStream.style.display = '';
          editingIndex = null;
          const submitBtn = document.getElementById('btn-submit-advanced');
          if (submitBtn) submitBtn.textContent = 'Сохранить сводку за месяц';
        });

        document.getElementById('btn-submit-advanced').addEventListener('click', (e) => {
          e.preventDefault();
          const monthText = document.getElementById('calc-month-value').innerText;
          const year = parseInt(document.getElementById('calc-year-value').innerText) || new Date().getFullYear();
          const monthIdx = MONTHS_RU.indexOf(monthText);
          if (monthIdx === -1) return showToast('Выберите месяц', 1500);
          const wasEditing = editingIndex !== null;
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
          saveAdvancedMonthlyReport(dateStr);
          panel.classList.add('hidden-field');
          if (btnSubmitStream) btnSubmitStream.style.display = '';
          e.currentTarget.textContent = 'Сохранить сводку за месяц';
          showToast(wasEditing ? 'Запись обновлена' : 'Сводка сохранена', 2000);
        });

        const triggerMonth = document.getElementById('trigger-calc-month');
        if (triggerMonth) {
          const monthOpts = MONTHS_RU.map((m, i) => ({ value: i.toString(), label: m }));
          triggerMonth.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentText = document.getElementById('calc-month-value').innerText;
            const opts = monthOpts.map(opt => ({ ...opt, selected: opt.label === currentText }));
            openDropdown(this, opts, (val, label) => {
              document.getElementById('calc-month-value').innerText = label;
            });
          });
        }

        const triggerYear = document.getElementById('trigger-calc-year');
        if (triggerYear) {
          const currentYear = new Date().getFullYear();
          const years = [];
          for (let y = currentYear - 5; y <= currentYear + 5; y++) {
            years.push({ value: y.toString(), label: y.toString() });
          }
          triggerYear.addEventListener('click', function(e) {
            e.stopPropagation();
            const currentText = document.getElementById('calc-year-value').innerText;
            const opts = years.map(opt => ({ ...opt, selected: opt.label === currentText }));
            openDropdown(this, opts, (val, label) => {
              document.getElementById('calc-year-value').innerText = label;
            });
          });
        }
      }

