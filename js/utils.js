'use strict';
// Вспомогательные функции: форматирование, числа, дата, тосты, вибрация.

      function cleanNumberInput(value) { return value.replace(/[^0-9.,]/g, ''); }
      // Возвращает сегодняшнюю дату в формате YYYY-MM-DD по МЕСТНОМУ времени.
      // В отличие от new Date().toISOString().split('T')[0] (который берёт дату
      // по UTC), не «съезжает» на вчера в первые часы после полуночи
      // для часовых поясов восточнее UTC (Москва, Вена и т.д.).
      function genRecordId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      }

      function todayLocalISO() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      function parseNumberFromInput(value) {
        if (!value) return 0;
        const cleaned = value.replace(/\s/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        if (isNaN(num) || num < 0) return 0;
        return num;
      }
      function formatMoney(amount, currency = '₽') {
        if (typeof amount !== 'number' || isNaN(amount)) amount = 0;
        const fixed = amount.toFixed(2);
        const parts = fixed.split('.');
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return intPart + '.' + parts[1] + ' ' + currency;
      }

      function showToast(message, duration = 2500) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._hideTimeout);
        toast._hideTimeout = setTimeout(() => {
          toast.classList.remove('show');
        }, duration);
      }

      function animateNumber(element, targetValue, currency, duration = 1200) {
        if (!element) return;
        const chars = '0123456789.,- ';
        const targetStr = targetValue.toFixed(2);
        const targetParts = targetStr.split('.');
        const intPart = targetParts[0];
        const decPart = targetParts[1] || '00';
        const fullTarget = intPart + '.' + decPart;
        const length = fullTarget.length;
        let currentText = '';
        for (let i = 0; i < length; i++) {
          currentText += chars[Math.floor(Math.random() * chars.length)];
        }
        element.textContent = currentText + ' ' + currency;
        const startTime = performance.now();
        function update() {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const revealCount = Math.floor(progress * length);
          let newText = '';
          for (let i = 0; i < length; i++) {
            if (i < revealCount) {
              newText += fullTarget[i];
            } else {
              newText += chars[Math.floor(Math.random() * chars.length)];
            }
          }
          element.textContent = newText + ' ' + currency;
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            element.textContent = formatMoney(targetValue, currency);
          }
        }
        requestAnimationFrame(update);
      }

      function vibrateIfSafe() {
        try { if (navigator.vibrate) navigator.vibrate(10); } catch(e) {}
      }

      function getActualPayday(targetDay, month = new Date().getMonth(), year = new Date().getFullYear()) {
        if (!targetDay) return null;
        const paydayDate = new Date(year, month, targetDay);
        const dayOfWeek = paydayDate.getDay();
        if (dayOfWeek === 0) return targetDay - 2;
        if (dayOfWeek === 6) return targetDay - 1;
        return targetDay;
      }

