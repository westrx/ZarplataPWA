'use strict';
// Настройки приложения: сохранение/загрузка из localStorage.

      function saveSettings() {
        const reminderDays = document.getElementById('reminder-days-before').value || '3';
        const currency = document.getElementById('currency-select-hidden').value || '₽';
        const defaultStats = document.getElementById('default-stats-period').value || '6';
        const paydayAdvance = document.getElementById('payday-advance') ? document.getElementById('payday-advance').value : '';
        const paydayMain = document.getElementById('payday-main') ? document.getElementById('payday-main').value : '';
        const paydayUnofficial = document.getElementById('payday-unofficial') ? document.getElementById('payday-unofficial').value : '';
        // Тип и категория, выбранные в «Быстром вводе» — раньше не сохранялись,
        // хотя saveSettings() и вызывался при их выборе (сохранялись только
        // поля старой шторки). Теперь запоминаем реально используемые поля.
        const quickType = document.getElementById('quick-salary-type') ? document.getElementById('quick-salary-type').value : 'main';
        const quickCategory = document.getElementById('quick-salary-cat') ? document.getElementById('quick-salary-cat').value : 'Основная';

        const settings = {
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
          quickType,
          quickCategory
        };
        localStorage.setItem('salary-settings', JSON.stringify(settings));
      }

      function loadSettings() {
        const saved = localStorage.getItem('salary-settings');
        if (saved) {
          try {
            const settings = JSON.parse(saved);

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

            const quickTypeOptions = { main: 'Выплата (ЗП)', advance: 'Аванс', vacation: 'Отпускные', unofficial: 'В конверте' };
            const quickType = settings.quickType || 'main';
            const triggerType = document.getElementById('trigger-type');
            if (triggerType) {
              triggerType.querySelector('.selected-value').textContent = quickTypeOptions[quickType] || quickTypeOptions.main;
              document.getElementById('quick-salary-type').value = quickType;
            }
            const quickCategory = settings.quickCategory || 'Основная';
            const triggerCat = document.getElementById('trigger-category');
            if (triggerCat) {
              triggerCat.querySelector('.selected-value').textContent = quickCategory;
              document.getElementById('quick-salary-cat').value = quickCategory;
            }

            if (autoToggle && autoToggle.classList.contains('active')) {
              enableAutoCalc();
            } else {
              disableAutoCalc();
            }

            renderAnalytics();
            renderCalendar();

          } catch(e) {}
        } else {
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
          const mainTrigger = document.querySelector('#payday-main-trigger span:first-child');
          if (mainTrigger) mainTrigger.textContent = '—';
          const unofficTrigger = document.querySelector('#payday-unofficial-trigger span:first-child');
          if (unofficTrigger) unofficTrigger.textContent = '—';
          saveSettings();
          renderAnalytics();
          renderCalendar();
        }
      }
