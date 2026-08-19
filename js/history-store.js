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
          const officialForMain = (rec.mainPayment || 0) + (rec.unofficial || 0);
          grouped[mainMonthKey].total += officialForMain;
          grouped[mainMonthKey].official += officialForMain;
          grouped[mainMonthKey].unofficial += (rec.unofficial || 0);
          grouped[mainMonthKey].paymentsList.push(`${mainObj.getDate()} числа: ${formatMoney(officialForMain, currency)}`);

          if (rec.advance && rec.advance > 0) {
            const advFinancialDate = new Date(mainObj);
            advFinancialDate.setMonth(advFinancialDate.getMonth() + 1);
            const advKey = `${advFinancialDate.getFullYear()}-${String(advFinancialDate.getMonth()+1).padStart(2,'0')}`;
            const advMonthName = advFinancialDate.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
            if (!grouped[advKey]) {
              grouped[advKey] = { label: advMonthName, total: 0, official: 0, unofficial: 0, paymentsList: [] };
            }
            grouped[advKey].total += rec.advance;
            grouped[advKey].official += rec.advance;
            grouped[advKey].paymentsList.push(`Аванс (учтён в этом месяце): ${formatMoney(rec.advance, currency)}`);
          }

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


      function gatherInputs() {
        const advance = parseNumberFromInput(document.getElementById('input-advance')?.value || '');
        const mainPayment = parseNumberFromInput(document.getElementById('input-main')?.value || '');
        const vacation = parseNumberFromInput(document.getElementById('input-vacation')?.value || '');
        const unofficial = parseNumberFromInput(document.getElementById('input-unofficial')?.value || '');
        const vacationDate = document.getElementById('vacation-date')?.value || todayLocalISO();
        let category = document.getElementById('category-select-hidden')?.value || 'Основная';
        const custom = document.getElementById('custom-category')?.value?.trim() || '';
        if (custom) category = custom;
        const total = advance + mainPayment + vacation + unofficial;
        const hasAdvance = advanceBlock ? !advanceBlock.classList.contains('hidden-field') : false;
        const hasVacation = vacationBlock ? !vacationBlock.classList.contains('hidden-field') : false;
        const hasUnofficial = unofficialBlock ? !unofficialBlock.classList.contains('hidden-field') : false;
        return { advance: hasAdvance ? advance : 0, mainPayment, vacation: hasVacation ? vacation : 0, unofficial: hasUnofficial ? unofficial : 0, total, category, note: '', hasAdvance, hasVacation, hasUnofficial, paymentsCount: parseInt(document.getElementById('payments-count')?.value || '1', 10), vacationDate };
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


      function saveAdvancedMonthlyReport(dateStr) {
        const data = gatherInputs();
        data.receivedDate = dateStr;
        const history = getHistory();
        const now = new Date();
        const preservedId = (editingIndex !== null && history[editingIndex]) ? history[editingIndex].id : null;
        const record = {
          id: preservedId || genRecordId(),
          date: now.toLocaleDateString('ru-RU'),
          time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          receivedDate: dateStr,
          advance: data.advance,
          mainPayment: data.mainPayment,
          vacation: data.vacation,
          unofficial: data.unofficial,
          total: data.total,
          category: data.category,
          note: data.note,
          hasAdvance: data.hasAdvance,
          hasVacation: data.hasVacation,
          hasUnofficial: data.hasUnofficial,
          paymentsCount: data.paymentsCount,
          vacationDate: data.vacationDate
        };
        if (editingIndex !== null && editingIndex >= 0 && editingIndex < history.length) {
          history[editingIndex] = record;
          editingIndex = null;
        } else {
          history.unshift(record);
        }
        setHistory(history);
        renderAnalytics();
      }
