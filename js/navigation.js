// Навигация между вкладками (с индикатором-подложкой), свайпы,
// переключатели темы/подсказок/уведомлений, напоминания о выплатах

function switchTab(tabId, navButton, userAction) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(tabId);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navButton) navButton.classList.add('active');
  moveNavIndicator(navButton || document.querySelector('.nav-item.active'));
  if (tabId === 'tab-analytics') renderAnalytics();
  if (tabId === 'tab-input') { updateCurrentMonthTotalVisual(); updateDebtBadge(); updateCountdown(); }
  if (tabId !== 'tab-input') {
    const m = document.getElementById('edit-modal');
    if (m && !m.classList.contains('hidden-field')) closeEditModal();
  }
  if (window.innerWidth <= 768) window.scrollTo(0, 0);
}

function moveNavIndicator(btn) {
  const ind = document.getElementById('nav-indicator');
  if (!ind || !btn) return;
  const nav = btn.parentElement;
  const navRect = nav.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  ind.style.width = r.width + 'px';
  ind.style.transform = `translateX(${r.left - navRect.left}px)`;
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  saveSettings();
  renderAnalytics();
  renderCalendar();
}

function toggleHints() {
  const t = document.getElementById('hints-toggle');
  if (t) t.classList.toggle('active');
  saveSettings();
}

function toggleNotifications() {
  const t = document.getElementById('notifications-toggle');
  if (!t) return;
  t.classList.toggle('active');
  if (t.classList.contains('active')) enableNotifications(); else disableNotifications();
  saveSettings();
}

function enableNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') showToast('Уведомления включены', 2000);
    });
  }
}

function disableNotifications() { showToast('Уведомления выключены', 2000); }

function checkPaydayReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('salary-settings')) || {}; } catch (e) { return; }
  if (!settings.notificationsEnabled) return;
  const today = new Date();
  const todayStr = toISODate(today);
  if (localStorage.getItem('last-reminder') === todayStr) return;
  const daysBefore = parseInt(settings.reminderDays != null ? settings.reminderDays : '3', 10);
  const map = {};
  if (settings.paydayMain) map[settings.paydayMain] = 'основная выплата';
  if (settings.paydayAdvance) map[settings.paydayAdvance] = 'аванс';
  if (settings.paydayUnofficial) map[settings.paydayUnofficial] = 'конверт';
  const paydays = Object.keys(map).map(Number);
  if (!paydays.length) return;
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let fired = false;
  for (const target of paydays) {
    for (let shift = 0; shift <= 1; shift++) {
      let m = today.getMonth() + shift, y = today.getFullYear();
      if (m > 11) { m = 0; y++; }
      const actual = getActualPayday(target, m, y);
      const payDate = new Date(y, m, actual);
      const diffDays = Math.round((payDate - today0) / 86400000);
      if (diffDays >= 0 && diffDays <= daysBefore) {
        const body = diffDays === 0 ? 'Сегодня день выплаты!' : `Через ${diffDays} дн. (${payDate.toLocaleDateString('ru-RU')})`;
        try { new Notification('Зарплата: напоминание', { body: `${map[target]}: ${body}` }); } catch (e) {}
        fired = true;
        break;
      }
    }
  }
  if (fired) localStorage.setItem('last-reminder', todayStr);
}

// Свайпы между вкладками
function initSwipeNavigation() {
  const wrapper = document.querySelector('.sections-wrapper');
  if (!wrapper) return;
  const tabs = ['tab-input', 'tab-analytics', 'tab-calendar', 'tab-settings'];
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });
  wrapper.addEventListener('touchend', (e) => {
    if (!touchStartTime) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;
    touchStartTime = 0;
    if (elapsed > 800) return;
    if (Math.abs(diffX) < 60 || Math.abs(diffX) < Math.abs(diffY) * 2) return;
    const active = document.querySelector('section.active');
    if (!active) return;
    const idx = tabs.indexOf(active.id);
    if (idx === -1) return;
    const nextIdx = diffX > 0 ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= tabs.length) return;
    const nextNav = document.getElementById('nav-' + tabs[nextIdx].split('-')[1]);
    if (nextNav) switchTab(tabs[nextIdx], nextNav, true);
  }, { passive: true });
}
