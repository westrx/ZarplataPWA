'use strict';
// Вкладка «Календарь»: дни выплат, точки-индикаторы, тултип.

      window.showPrevMonth = function() {
        if (calendarMonth === 0) { calendarMonth = 11; calendarYear--; }
        else { calendarMonth--; }
        renderCalendar();
      };
      window.showNextMonth = function() {
        if (calendarMonth === 11) { calendarMonth = 0; calendarYear++; }
        else { calendarMonth++; }
        renderCalendar();
      };

      // Быстрый ввод создаёт отдельную запись на каждую выплату, поэтому
      // за один месяц в истории может быть несколько записей.
      // Суммируем их все, а не берём случайно первую попавшуюся.
      function getMonthAggregate(history, month, year) {
        const agg = { advance: 0, mainPayment: 0, vacation: 0, unofficial: 0, vacationDate: null };
        history.forEach(item => {
          const itemDate = new Date(item.receivedDate || item.date);
          if (isNaN(itemDate) || itemDate.getMonth() !== month || itemDate.getFullYear() !== year) return;
          agg.advance += item.advance || 0;
          agg.mainPayment += item.mainPayment || 0;
          agg.unofficial += item.unofficial || 0;
          if (item.vacation > 0) {
            agg.vacation += item.vacation;
            if (!agg.vacationDate) agg.vacationDate = item.vacationDate || item.receivedDate;
          }
        });
        return agg;
      }

      window.renderCalendar = function() {
        const container = document.getElementById('calendar-container');
        if (!container) return;
        const year = calendarYear;
        const month = calendarMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const paydayAdvance = parseInt(document.getElementById('payday-advance')?.value) || null;
        const paydayMain = parseInt(document.getElementById('payday-main')?.value) || null;
        const paydayUnofficial = parseInt(document.getElementById('payday-unofficial')?.value) || null;
        const actualAdvance = getActualPayday(paydayAdvance, month, year);
        const actualMain = getActualPayday(paydayMain, month, year);
        const actualUnofficial = getActualPayday(paydayUnofficial, month, year);

        const history = getHistory();
        const thisMonthData = getMonthAggregate(history, month, year);
        let vacationDay = null;
        if (thisMonthData.vacation > 0 && thisMonthData.vacationDate) {
          const vacDate = new Date(thisMonthData.vacationDate);
          if (!isNaN(vacDate) && vacDate.getMonth() === month && vacDate.getFullYear() === year) vacationDay = vacDate.getDate();
        }

        let html = `<div class="calendar-header"><button class="cal-nav-btn" onclick="showPrevMonth()">◀</button><span>${MONTHS_RU[month]} ${year}</span><button class="cal-nav-btn" onclick="showNextMonth()">▶</button></div>`;
        html += `<div class="calendar-grid" id="calendar-grid">`;
        ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => html += `<div style="text-align:center;color:var(--text-secondary);">${d}</div>`);
        let startOffset = (firstDay === 0) ? 6 : firstDay - 1;
        for (let i = 0; i < startOffset; i++) html += `<div class="calendar-day"></div>`;
        for (let d = 1; d <= daysInMonth; d++) {
          let classes = 'calendar-day';
          const dow = new Date(year, month, d).getDay();
          if (dow === 0 || dow === 6) classes += ' weekend';
          let dotHtml = '';
          if (actualAdvance === d) dotHtml += `<div class="dot advance"></div>`;
          if (actualMain === d) dotHtml += `<div class="dot main"></div>`;
          if (actualUnofficial === d) dotHtml += `<div class="dot unofficial"></div>`;
          if (vacationDay === d) dotHtml += `<div class="dot vacation"></div>`;
          html += `<div class="${classes}" data-day="${d}" data-type="${actualAdvance===d?'advance':actualMain===d?'main':actualUnofficial===d?'unofficial':vacationDay===d?'vacation':''}" onclick="onCalendarDayClick(this)">${d}${dotHtml}</div>`;
        }
        html += `</div>`;
        html += `<div style="display:flex; gap:12px; justify-content:center; margin-top:8px; flex-wrap:wrap;">
                  <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#00b4d8;border-radius:50%;box-shadow:0 0 6px #00b4d8;"></span> Аванс</span>
                  <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#06d6a0;border-radius:50%;box-shadow:0 0 6px #06d6a0;"></span> Первая</span>
                  <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#ffd166;border-radius:50%;box-shadow:0 0 6px #ffd166;"></span> Отпускные</span>
                  <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#ef476f;border-radius:50%;box-shadow:0 0 6px #ef476f;"></span> Конверт</span>
                </div>`;
        container.innerHTML = html;
        document.getElementById('calendar-tooltip').style.display = 'none';

        const grid = document.getElementById('calendar-grid');
        if (grid) {
          let touchStartX = 0;
          grid.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; e.stopPropagation(); }, { passive: true });
          grid.addEventListener('touchend', (e) => {
            const dist = e.changedTouches[0].screenX - touchStartX;
            if (dist < -60) showNextMonth();
            else if (dist > 60) showPrevMonth();
            e.stopPropagation();
          }, { passive: true });
        }
      };

      window.onCalendarDayClick = function(el) {
        const type = el.dataset.type;
        if (!type) return;
        const history = getHistory();
        const thisMonthData = getMonthAggregate(history, calendarMonth, calendarYear);
        let amount = 0, name = '';
        if (type === 'advance') { name = 'Аванс'; amount = thisMonthData.advance; }
        else if (type === 'main') { name = 'Первая выплата'; amount = thisMonthData.mainPayment; }
        else if (type === 'vacation') { name = 'Отпускные'; amount = thisMonthData.vacation; }
        else if (type === 'unofficial') { name = 'Конверт'; amount = thisMonthData.unofficial; }
        const currency = document.getElementById('currency-select-hidden')?.value || '₽';
        const tooltip = document.getElementById('calendar-tooltip');
        tooltip.innerHTML = `<strong>${name}</strong> — ${formatMoney(amount, currency)}`;
        tooltip.style.display = 'block';
      };

