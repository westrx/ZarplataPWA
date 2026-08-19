'use strict';
// Переключение вкладок, свайп-навигация, переключатели темы/уведомлений,
// напоминания о днях выплат.

      window.switchTab = function(tabId, el, shouldVibrate = false) {
        document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
        if (el) { el.classList.add('active'); el.setAttribute('aria-selected', 'true'); }
        if (tabId === 'tab-analytics') renderAnalytics();
        if (tabId === 'tab-calendar') renderCalendar();
        if (tabId === 'tab-input') {
          const nw = document.getElementById('nav-wrapper');
          if (nw) nw.classList.remove('hidden');
        } else {
          const panel = document.getElementById('advanced-salary-fields');
          if (panel && !panel.classList.contains('hidden-field')) {
            panel.classList.add('hidden-field');
            const btn = document.getElementById('btn-submit-stream'); if (btn) btn.style.display = '';
          }
        }
        if (shouldVibrate) vibrateIfSafe();
      };

      function initSwipeNavigation() {
        const wrapper = document.querySelector('.sections-wrapper');
        if (!wrapper) return;

        let touchStartX = 0;
        let touchStartY = 0;

        wrapper.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        wrapper.addEventListener('touchend', (e) => {
          const touchEndX = e.changedTouches[0].screenX;
          const touchEndY = e.changedTouches[0].screenY;
          const diffX = touchEndX - touchStartX;
          const diffY = touchEndY - touchStartY;

          if (Math.abs(diffX) > Math.abs(diffY) * 2 && Math.abs(diffX) > 50) {
            const tabs = ['tab-input', 'tab-analytics', 'tab-calendar', 'tab-settings'];
            const currentTab = document.querySelector('section.active')?.id;
            let currentIndex = tabs.indexOf(currentTab);
            if (currentIndex === -1) return;

            if (diffX < -50) {
              currentIndex = Math.min(currentIndex + 1, tabs.length - 1);
            } else if (diffX > 50) {
              currentIndex = Math.max(currentIndex - 1, 0);
            }
            const targetTab = document.getElementById(tabs[currentIndex]);
            // БАГ (исправлено): раньше искали кнопку навигации через
            // [aria-controls="..."], но такого атрибута нет в разметке —
            // targetNav всегда был null, и свайп не переключал вкладку.
            const targetNav = document.getElementById('nav-' + tabs[currentIndex].replace('tab-', ''));
            if (targetTab && targetNav) {
              switchTab(tabs[currentIndex], targetNav, true);
            }
          }
        }, { passive: true });
      }

      window.toggleTheme = function() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        const isDark = toggle.classList.contains('active');
        if (isDark) { document.body.classList.add('light-theme'); toggle.classList.remove('active'); }
        else { document.body.classList.remove('light-theme'); toggle.classList.add('active'); }
        saveSettings();
      };

      window.toggleNotifications = function() {
        const toggle = document.getElementById('notifications-toggle');
        if (!toggle) return;
        toggle.classList.toggle('active');
        if (toggle.classList.contains('active')) {
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(perm => {
              if (perm !== 'granted') { toggle.classList.remove('active'); showToast('Разрешите уведомления в браузере', 3000); }
            });
          } else if ('Notification' in window && Notification.permission === 'denied') { toggle.classList.remove('active'); showToast('Уведомления запрещены', 3000); }
        }
        saveSettings();
      };

      window.toggleHints = function() { const t = document.getElementById('hints-toggle'); if (t) { t.classList.toggle('active'); saveSettings(); } };
      window.toggleAutoCalc = function() { const t = document.getElementById('auto-calc-toggle'); if (t) { t.classList.toggle('active'); saveSettings(); if (t.classList.contains('active')) enableAutoCalc(); else disableAutoCalc(); } };

      function checkPaydayReminders() {
        const settings = JSON.parse(localStorage.getItem('salary-settings') || '{}');
        if (settings.notifications === false) return;

        const daysBefore = parseInt(settings.reminderDaysBefore, 10) || 0;
        const advanceDay = parseInt(settings.paydayAdvance) || null;
        const mainDay = parseInt(settings.paydayMain) || null;
        const unofficialDay = parseInt(settings.paydayUnofficial) || null;

        const today = new Date();
        const currentDay = today.getDate();
        const todayStr = today.toDateString();

        const checkDay = (targetDay, label) => {
          if (!targetDay) return false;
          const startDay = Math.max(1, targetDay - daysBefore);
          if (currentDay >= startDay && currentDay <= targetDay) {
            const lastKey = `last-reminder-${label}`;
            const last = localStorage.getItem(lastKey);
            if (last !== todayStr) {
              localStorage.setItem(lastKey, todayStr);
              return true;
            }
          }
          return false;
        };

        const reminders = [];
        if (checkDay(advanceDay, 'advance')) reminders.push('Аванс');
        if (checkDay(mainDay, 'main')) reminders.push('Первая выплата');
        if (checkDay(unofficialDay, 'unofficial')) reminders.push('Конверт');

        if (reminders.length > 0) {
          const body = `Сегодня день выплаты: ${reminders.join(', ')}.\nНе забудьте рассчитать зарплату!`;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📅 Напоминание о выплате', { body, icon: '/icons/icon-192.png' });
          } else {
            showToast(`📅 ${body}`, 3000);
          }
        }
      }
