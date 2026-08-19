'use strict';
// Общее состояние приложения, используется во всех модулях.

      const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
      let editingIndex = null;
      let activeTrigger = null;
      let deferredPrompt = null;
      let chartTooltip = null;
      let calendarYear = new Date().getFullYear();
      let calendarMonth = new Date().getMonth();
