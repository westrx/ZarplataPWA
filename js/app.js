'use strict';
// Точка входа: инициализация всего приложения при загрузке DOM,
// регистрация Service Worker, обработка событий online/offline.

      function init() {
        chartTooltip = document.getElementById('chart-tooltip');

        const hiddenInputs = `
          <input type="hidden" id="stats-period" value="6">
          <input type="hidden" id="reminder-days-before" value="3">
          <input type="hidden" id="currency-select-hidden" value="₽">
          <input type="hidden" id="default-stats-period" value="6">
          <input type="hidden" id="payday-advance" value="">
          <input type="hidden" id="payday-main" value="">
          <input type="hidden" id="payday-unofficial" value="">
        `;
        document.body.insertAdjacentHTML('beforeend', hiddenInputs);

        loadSettings();
        initTriggers();
        initNewInputScreen();
        initQuickCustomSelects();
        initEditModal();

        document.getElementById('quick-salary-amount').addEventListener('input', function() {
          this.value = cleanNumberInput(this.value);
        });
        document.getElementById('quick-salary-amount').addEventListener('keydown', function(e) {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          document.getElementById('btn-submit-stream').click();
        });

        const defaultStats = document.getElementById('default-stats-period')?.value || '6';
        const statsPeriod = document.getElementById('stats-period');
        if (statsPeriod) statsPeriod.value = defaultStats;
        const statsLabels = {'3':'За 3 месяца','6':'За 6 месяцев','12':'За 12 месяцев','all':'За всё время'};
        const statsTrigger = document.querySelector('#stats-trigger span:first-child');
        if (statsTrigger) statsTrigger.textContent = statsLabels[defaultStats] || 'За 6 месяцев';
        renderAnalytics();
        checkPaydayReminders();
        setInterval(checkPaydayReminders, 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkPaydayReminders();
        });
        calendarYear = new Date().getFullYear();
        calendarMonth = new Date().getMonth();
        renderCalendar();

        if (document.getElementById('auto-calc-toggle')?.classList.contains('active')) {
          enableAutoCalc();
        }

        window.addEventListener('resize', function() {
          if (document.getElementById('tab-analytics')?.classList.contains('active')) {
            renderAnalytics();
          }
        });

        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          deferredPrompt = e;
          const installBtn = document.getElementById('install-btn');
          if (installBtn) installBtn.style.display = 'block';
        });

        let lastScrollTop = 0;
        const navWrapper = document.getElementById('nav-wrapper');
        document.querySelectorAll('section').forEach(section => {
          section.addEventListener('scroll', function() {
            const scrollTop = this.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 50) {
              if (navWrapper) navWrapper.classList.add('hidden');
            } else {
              if (navWrapper) navWrapper.classList.remove('hidden');
            }
            lastScrollTop = scrollTop;
          });
        });

        initSwipeNavigation();
      }

      window.addEventListener('online', () => showToast('✅ Интернет восстановлен', 2000));
      window.addEventListener('offline', () => showToast('⚠️ Нет интернета, но вы можете считать локально', 3000));

      document.addEventListener('DOMContentLoaded', init);

      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('Не удалось зарегистрировать service worker:', err);
          });
        });
      }
