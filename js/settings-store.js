'use strict';
// Настройки приложения: сохранение/загрузка из localStorage.

      function saveSettings() {
        const paymentsCount = document.getElementById('payments-count').value || '1';
        const category = document.getElementById('category-select-hidden').value || 'Основная';
        const customCategory = document.getElementById('custom-category') ? document.getElementById('custom-category').value : '';
        const reminderDays = document.getElementById('reminder-days-before').value || '3';
        const currency = document.getElementById('currency-select-hidden').value || '₽';
        const defaultStats = document.getElementById('default-stats-period').value || '6';
        const paydayAdvance = document.getElementById('payday-advance') ? document.getElementById('payday-advance').value : '';
        const paydayMain = document.getElementById('payday-main') ? document.getElementById('payday-main').value : '';
        const paydayUnofficial = document.getElementById('payday-unofficial') ? document.getElementById('payday-unofficial').value : '';
        const receivedDate = document.getElementById('received-date') ? document.getElementById('received-date').value : '';
        const vacationDate = document.getElementById('vacation-date') ? document.getElementById('vacation-date').value : todayLocalISO();

        const settings = {
          paymentsCount,
          hasVacation: vacationToggle ? vacationToggle.classList.contains('active') : false,
          hasSplit: splitToggle ? splitToggle.classList.contains('active') : false,
          category,
          customCategory,
          theme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
          notifications: document.getElementById('notifications-toggle') ? document.getElementById('notifications-toggle').classList.contains('active') : true,
          reminderDaysBefore: reminderDays,
          autoCalc: document.getElementById('auto-calc-toggle') ? document.getElementById('auto-calc-toggle').classList.contains('active') : false,
          hints: document.getElementById('hints-toggle') ? document.getElementById('hints-toggle').classList.contains('active') : true,
          currency,
          defaultStatsPeriod: defaultStats,
          paydayAdvance,
          paydayMain,
          paydayUnofficial,
          receivedDate,
          vacationDate,
          inputValues: {}
        };
        document.querySelectorAll('#tab-input input[type="text"]').forEach(inp => {
          settings.inputValues[inp.id] = inp.value;
        });
        localStorage.setItem('salary-settings', JSON.stringify(settings));
      }

      function loadSettings() {
        const saved = localStorage.getItem('salary-settings');
        if (saved) {
          try {
            const settings = JSON.parse(saved);
            const paymentsTrigger = document.querySelector('#payments-trigger span:first-child');
            if (paymentsTrigger) paymentsTrigger.textContent = settings.paymentsCount || '1';
            const paymentsInput = document.getElementById('payments-count');
            if (paymentsInput) paymentsInput.value = settings.paymentsCount || '1';

            if (vacationToggle) {
              if (settings.hasVacation) vacationToggle.classList.add('active');
              else vacationToggle.classList.remove('active');
            }
            if (splitToggle) {
              if (settings.hasSplit) splitToggle.classList.add('active');
              else splitToggle.classList.remove('active');
            }

            const categoryTrigger = document.querySelector('#category-trigger span:first-child');
            if (categoryTrigger) categoryTrigger.textContent = settings.category || 'Основная';
            const categoryHidden = document.getElementById('category-select-hidden');
            if (categoryHidden) categoryHidden.value = settings.category || 'Основная';
            const customCat = document.getElementById('custom-category');
            if (customCat) customCat.value = settings.customCategory || '';
            toggleCustomCategoryVisibility();

            if (settings.theme === 'light') {
              document.body.classList.add('light-theme');
              const themeToggle = document.getElementById('theme-toggle');
              if (themeToggle) themeToggle.classList.remove('active');
            } else {
              document.body.classList.remove('light-theme');
              const themeToggle = document.getElementById('theme-toggle');
              if (themeToggle) themeToggle.classList.add('active');
            }

            const notifToggle = document.getElementById('notifications-toggle');
            if (notifToggle) {
              if (settings.notifications !== undefined) {
                if (settings.notifications) notifToggle.classList.add('active');
                else notifToggle.classList.remove('active');
              } else {
                notifToggle.classList.add('active');
              }
            }

            const remDays = settings.reminderDaysBefore || '3';
            const remLabels = ['0 (только в день)','1 день','2 дня','3 дня','4 дня','5 дней','6 дней','7 дней'];
            const reminderTrigger = document.querySelector('#reminder-trigger span:first-child');
            if (reminderTrigger) reminderTrigger.textContent = remLabels[parseInt(remDays,10)] || '3 дня';
            const reminderDaysInput = document.getElementById('reminder-days-before');
            if (reminderDaysInput) reminderDaysInput.value = remDays;

            const autoToggle = document.getElementById('auto-calc-toggle');
            if (autoToggle) {
              if (settings.autoCalc !== undefined) {
                if (settings.autoCalc) autoToggle.classList.add('active');
                else autoToggle.classList.remove('active');
              } else {
                autoToggle.classList.remove('active');
              }
            }

            const hintsToggle = document.getElementById('hints-toggle');
            if (hintsToggle) {
              if (settings.hints !== undefined) {
                if (settings.hints) hintsToggle.classList.add('active');
                else hintsToggle.classList.remove('active');
              } else {
                hintsToggle.classList.add('active');
              }
            }

            const currencyLabels = {'₽':'₽ (Рубль)','$':'$ (Доллар)','€':'€ (Евро)'};
            const currencyTrigger = document.querySelector('#currency-trigger span:first-child');
            if (currencyTrigger) currencyTrigger.textContent = currencyLabels[settings.currency] || '₽ (Рубль)';
            const currencyHidden = document.getElementById('currency-select-hidden');
            if (currencyHidden) currencyHidden.value = settings.currency || '₽';

            const statsLabels = {'3':'За 3 месяца','6':'За 6 месяцев','12':'За 12 месяцев','all':'За всё время'};
            const defaultStatsTrigger = document.querySelector('#default-stats-trigger span:first-child');
            if (defaultStatsTrigger) defaultStatsTrigger.textContent = statsLabels[settings.defaultStatsPeriod] || 'За 6 месяцев';
            const defaultStatsInput = document.getElementById('default-stats-period');
            if (defaultStatsInput) defaultStatsInput.value = settings.defaultStatsPeriod || '6';

            if (settings.paydayAdvance !== undefined) {
              const val = settings.paydayAdvance || '';
              const trigger = document.querySelector('#payday-advance-trigger span:first-child');
              if (trigger) trigger.textContent = val || '—';
              const hidden = document.getElementById('payday-advance');
              if (hidden) hidden.value = val;
            }
            if (settings.paydayMain !== undefined) {
              const val = settings.paydayMain || '';
              const trigger = document.querySelector('#payday-main-trigger span:first-child');
              if (trigger) trigger.textContent = val || '—';
              const hidden = document.getElementById('payday-main');
              if (hidden) hidden.value = val;
            }
            if (settings.paydayUnofficial !== undefined) {
              const val = settings.paydayUnofficial || '';
              const trigger = document.querySelector('#payday-unofficial-trigger span:first-child');
              if (trigger) trigger.textContent = val || '—';
              const hidden = document.getElementById('payday-unofficial');
              if (hidden) hidden.value = val;
            }

            if (settings.receivedDate) {
              const received = document.getElementById('received-date');
              if (received) received.value = settings.receivedDate;
            } else {
              const today = todayLocalISO();
              const received = document.getElementById('received-date');
              if (received) received.value = today;
            }

            const vacDateInput = document.getElementById('vacation-date');
            if (vacDateInput) {
              vacDateInput.value = settings.vacationDate || todayLocalISO();
            }

            if (settings.inputValues) {
              Object.keys(settings.inputValues).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = settings.inputValues[id];
              });
            }

            updateFieldsVisibility();
            if (autoToggle && autoToggle.classList.contains('active')) {
              enableAutoCalc();
            } else {
              disableAutoCalc();
            }

            renderAnalytics();
            renderCalendar();

          } catch(e) {}
        } else {
          const today = todayLocalISO();
          const received = document.getElementById('received-date');
          if (received) received.value = today;
          const paymentsTrigger = document.querySelector('#payments-trigger span:first-child');
          if (paymentsTrigger) paymentsTrigger.textContent = '1';
          const paymentsInput = document.getElementById('payments-count');
          if (paymentsInput) paymentsInput.value = '1';
          if (vacationToggle) vacationToggle.classList.remove('active');
          if (splitToggle) splitToggle.classList.remove('active');
          const categoryTrigger = document.querySelector('#category-trigger span:first-child');
          if (categoryTrigger) categoryTrigger.textContent = 'Основная';
          const categoryHidden = document.getElementById('category-select-hidden');
          if (categoryHidden) categoryHidden.value = 'Основная';
          const customCat = document.getElementById('custom-category');
          if (customCat) customCat.value = '';
          const themeToggle = document.getElementById('theme-toggle');
          if (themeToggle) themeToggle.classList.add('active');
          const notifToggle = document.getElementById('notifications-toggle');
          if (notifToggle) notifToggle.classList.add('active');
          const hintsToggle = document.getElementById('hints-toggle');
          if (hintsToggle) hintsToggle.classList.add('active');
          const reminderTrigger = document.querySelector('#reminder-trigger span:first-child');
          if (reminderTrigger) reminderTrigger.textContent = '3 дня';
          const reminderDaysInput = document.getElementById('reminder-days-before');
          if (reminderDaysInput) reminderDaysInput.value = '3';
          const autoToggle = document.getElementById('auto-calc-toggle');
          if (autoToggle) autoToggle.classList.remove('active');
          const currencyTrigger = document.querySelector('#currency-trigger span:first-child');
          if (currencyTrigger) currencyTrigger.textContent = '₽ (Рубль)';
          const currencyHidden = document.getElementById('currency-select-hidden');
          if (currencyHidden) currencyHidden.value = '₽';
          const defaultStatsTrigger = document.querySelector('#default-stats-trigger span:first-child');
          if (defaultStatsTrigger) defaultStatsTrigger.textContent = 'За 6 месяцев';
          const defaultStatsInput = document.getElementById('default-stats-period');
          if (defaultStatsInput) defaultStatsInput.value = '6';
          const advanceTrigger = document.querySelector('#payday-advance-trigger span:first-child');
          if (advanceTrigger) advanceTrigger.textContent = '—';
          const advanceHidden = document.getElementById('payday-advance');
          if (advanceHidden) advanceHidden.value = '';
          const mainTrigger = document.querySelector('#payday-main-trigger span:first-child');
          if (mainTrigger) mainTrigger.textContent = '—';
          const mainHidden = document.getElementById('payday-main');
          if (mainHidden) mainHidden.value = '';
          const unofficTrigger = document.querySelector('#payday-unofficial-trigger span:first-child');
          if (unofficTrigger) unofficTrigger.textContent = '—';
          const unofficHidden = document.getElementById('payday-unofficial');
          if (unofficHidden) unofficHidden.value = '';
          const vacDateInput = document.getElementById('vacation-date');
          if (vacDateInput) vacDateInput.value = today;
          document.querySelectorAll('#tab-input input[type="text"]').forEach(inp => inp.value = '');
          updateFieldsVisibility();
          saveSettings();
          renderAnalytics();
          renderCalendar();
        }
      }

      function toggleCustomCategoryVisibility() {
        const category = document.getElementById('category-select-hidden');
        const wrapper = document.getElementById('custom-category-wrapper');
        const customInput = document.getElementById('custom-category');
        if (!category || !wrapper || !customInput) return;
        if (category.value === 'Другое' || customInput.value.trim() !== '') {
          wrapper.style.display = 'block';
          if (category.value === 'Другое') customInput.focus();
        } else {
          wrapper.style.display = 'none';
          customInput.value = '';
        }
      }
