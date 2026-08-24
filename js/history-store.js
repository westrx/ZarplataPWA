'use strict';
// Слой данных: чтение/запись истории выплат в localStorage,
// сбор данных из формы, сохранение записей.

      function getHistory() {
        try { return JSON.parse(localStorage.getItem('salary-history-v5')) || []; }
        catch { return []; }
      }
      function setHistory(history) { localStorage.setItem('salary-history-v5', JSON.stringify(history)); }

      function getFilteredHistory(months) {
        const history = getHistory();
        if (history.length === 0) return [];
        if (months === 'all') return history;
        const limit = parseInt(months, 10);
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - limit);
        return history.filter(item => {
          const d = new Date(item.receivedDate || item.date);
          return d >= cutoff;
        });
      }


      function groupDataForChart(records, currency) {
        const grouped = {};
        records.forEach(rec => {
          const mainDate = rec.receivedDate || rec.date;
          if (!mainDate) return;
          const mainObj = new Date(mainDate);
          if (isNaN(mainObj)) return;

          const mainMonthKey = `${mainObj.getFullYear()}-${String(mainObj.getMonth()+1).padStart(2,'0')}`;
          const mainMonthName = mainObj.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
          if (!grouped[mainMonthKey]) {
            grouped[mainMonthKey] = { label: mainMonthName, total: 0, official: 0, unofficial: 0, paymentsList: [] };
          }
          // БАГ (исправлено): раньше аванс искусственно "переносился" в
          // следующий месяц относительно receivedDate, из-за чего аванс,
          // введённый в конкретную дату, засчитывался в аналитике не туда,
          // куда его поместил бы Календарь. Теперь аванс, как и зарплата,
          // и конверт, учитывается в месяц СВОЕЙ реальной даты (той, что
          // выбрана при вводе) — это совпадает с тем, что показывает Календарь.
          const officialForMain = (rec.advance || 0) + (rec.mainPayment || 0) + (rec.unofficial || 0);
          grouped[mainMonthKey].total += officialForMain;
          grouped[mainMonthKey].official += officialForMain;
          grouped[mainMonthKey].unofficial += (rec.unofficial || 0);
          grouped[mainMonthKey].paymentsList.push(`${mainObj.getDate()} числа: ${formatMoney(officialForMain, currency)}`);

          const vacDateStr = rec.vacationDate || mainDate;
          if (rec.vacation && rec.vacation > 0 && vacDateStr) {
            const vacObj = new Date(vacDateStr);
            if (!isNaN(vacObj)) {
              const vacKey = `${vacObj.getFullYear()}-${String(vacObj.getMonth()+1).padStart(2,'0')}`;
              const vacMonthName = vacObj.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
              if (!grouped[vacKey]) {
                grouped[vacKey] = { label: vacMonthName, total: 0, official: 0, unofficial: 0, paymentsList: [] };
              }
              grouped[vacKey].total += rec.vacation;
              grouped[vacKey].official += rec.vacation;
              grouped[vacKey].paymentsList.push(`Отпускные: ${formatMoney(rec.vacation, currency)}`);
            }
          }
        });
        return Object.keys(grouped).sort().map(key => grouped[key]);
      }


      function saveQuickPaymentToHistory(amount, type, date, category) {
        const history = getHistory();
        const now = new Date();
        const record = {
          id: genRecordId(),
          date: now.toLocaleDateString('ru-RU'),
          time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          receivedDate: date,
          advance: 0, mainPayment: 0, vacation: 0, unofficial: 0, total: amount,
          category, note: '', hasAdvance: false, hasVacation: false, hasUnofficial: false,
          paymentsCount: 1, vacationDate: date
        };
        switch(type) {
          case 'advance': record.advance = amount; record.hasAdvance = true; break;
          case 'main': record.mainPayment = amount; break;
          case 'vacation': record.vacation = amount; record.hasVacation = true; record.vacationDate = date; break;
          case 'unofficial': record.unofficial = amount; record.hasUnofficial = true; break;
        }
        history.unshift(record);
        setHistory(history);
      }


      // Редактирование записи из модалки «Редактировать запись».
      // Сохраняет ту же модель, что и быстрый ввод: одна запись = одна
      // выплата одного типа с одной датой. id записи не меняется.
      function updateHistoryRecord(index, amount, type, date, category) {
        const history = getHistory();
        if (index < 0 || index >= history.length) return;
        const existing = history[index];
        const record = {
          id: existing.id,
          date: existing.date,
          time: existing.time,
          receivedDate: date,
          advance: 0, mainPayment: 0, vacation: 0, unofficial: 0, total: amount,
          category, note: existing.note || '', hasAdvance: false, hasVacation: false, hasUnofficial: false,
          paymentsCount: 1, vacationDate: date
        };
        switch (type) {
          case 'advance': record.advance = amount; record.hasAdvance = true; break;
          case 'main': record.mainPayment = amount; break;
          case 'vacation': record.vacation = amount; record.hasVacation = true; record.vacationDate = date; break;
          case 'unofficial': record.unofficial = amount; record.hasUnofficial = true; break;
        }
        history[index] = record;
        setHistory(history);
        renderAnalytics();
      }
