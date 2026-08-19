'use strict';
// Вкладка «Аналитика»: график, статистика, тренды, прогноз, список записей.

      function renderAnalytics() {
        const period = document.getElementById('stats-period')?.value || '6';
        const rawData = getFilteredHistory(period);
        const currency = document.getElementById('currency-select-hidden')?.value || '₽';

        const skeleton = document.getElementById('chart-skeleton');
        const chartContainer = document.getElementById('chart-container');

        if (rawData.length === 0) {
          if (skeleton) skeleton.style.display = 'block';
          if (chartContainer) chartContainer.style.display = 'none';
          document.getElementById('stat-avg').textContent = '-';
          document.getElementById('stat-median').textContent = '-';
          document.getElementById('stat-min').textContent = '-';
          document.getElementById('stat-max').textContent = '-';
          document.getElementById('trend-container').innerHTML = '';
          document.getElementById('forecast-container').innerHTML = '';
          renderHistoryList(rawData, currency);
          return;
        } else {
          if (skeleton) skeleton.style.display = 'none';
          if (chartContainer) chartContainer.style.display = 'block';
        }

        const groupedData = groupDataForChart(rawData, currency);
        const totals = groupedData.map(item => item.total);
        const sorted = [...totals].sort((a,b) => a - b);
        const sum = totals.reduce((a,b) => a + b, 0);
        const avg = sum / totals.length;
        const median = sorted.length % 2 === 0 ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2 : sorted[Math.floor(sorted.length/2)];
        const min = sorted[0];
        const max = sorted[sorted.length-1];

        const isActive = document.getElementById('tab-analytics')?.classList.contains('active') || false;
        if (isActive) {
          animateNumber(document.getElementById('stat-avg'), avg, currency);
          animateNumber(document.getElementById('stat-median'), median, currency);
          animateNumber(document.getElementById('stat-min'), min, currency);
          animateNumber(document.getElementById('stat-max'), max, currency);
        } else {
          document.getElementById('stat-avg').textContent = formatMoney(avg, currency);
          document.getElementById('stat-median').textContent = formatMoney(median, currency);
          document.getElementById('stat-min').textContent = formatMoney(min, currency);
          document.getElementById('stat-max').textContent = formatMoney(max, currency);
        }

        drawChart(groupedData, currency);
        updateTrendsAndForecast(rawData);
        renderHistoryList(rawData, currency);
      }

      function drawChart(groupedData, currency) {
        const canvas = document.getElementById('salaryChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: 300 };
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.max(300, rect.width - 12);
        const displayHeight = Math.max(200, displayWidth * 0.6);
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        ctx.scale(dpr, dpr);

        const width = displayWidth;
        const height = displayHeight;
        ctx.clearRect(0, 0, width, height);

        if (groupedData.length === 0) {
          ctx.fillStyle = '#a0a5b0';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Нет данных', width/2, height/2);
          return;
        }

        const values = groupedData.map(item => item.total);
        const maxVal = Math.max(...values, 1);
        const padding = 28;
        const chartWidth = width - 2*padding;
        const chartHeight = height - 2*padding;
        const barWidth = Math.min(chartWidth / values.length * 0.5, 60);
        const gap = (chartWidth - barWidth * values.length) / (values.length + 1);
        const isLight = document.body.classList.contains('light-theme');
        const textColor = isLight ? '#1a1b20' : '#ffffff';

        ctx.fillStyle = textColor;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';

        const chartRects = [];

        groupedData.forEach((item, i) => {
          const val = item.total;
          const x = padding + gap + i * (barWidth + gap);
          const barHeight = (val / maxVal) * chartHeight;
          const y = height - padding - barHeight;

          ctx.fillStyle = '#9d4edd';
          ctx.fillRect(x, y, barWidth, barHeight);

          chartRects.push({ x, y, width: barWidth, height: barHeight, data: item });

          ctx.fillStyle = textColor;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.label, x + barWidth/2, height - padding + 18);
          ctx.fillText(formatMoney(val, currency), x + barWidth/2, y - 8);
        });

        if (canvas._clickHandler) {
          canvas.removeEventListener('click', canvas._clickHandler);
        }
        canvas._clickHandler = function(e) {
          const rectCanvas = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rectCanvas.width;
          const scaleY = canvas.height / rectCanvas.height;
          const mouseX = (e.clientX - rectCanvas.left) * scaleX;
          const mouseY = (e.clientY - rectCanvas.top) * scaleY;

          let found = false;
          for (let i = 0; i < chartRects.length; i++) {
            const r = chartRects[i];
            if (mouseX >= r.x && mouseX <= r.x + r.width &&
                mouseY >= r.y && mouseY <= r.y + r.height) {
              showChartTooltip(e.clientX, e.clientY, r.data, currency);
              found = true;
              break;
            }
          }
          if (!found) hideChartTooltip();
        };
        canvas.addEventListener('click', canvas._clickHandler);
      }

      function showChartTooltip(x, y, groupData, currency) {
        if (!chartTooltip) return;
        let html = `<div class="tooltip-title">${groupData.label}</div>`;
        const official = groupData.official || 0;
        const unofficial = groupData.unofficial || 0;
        const total = groupData.total || 0;

        if (official > 0 || unofficial > 0) {
          if (official > 0) html += `<div class="tooltip-row"><span class="label">💳 На карту</span><span class="value">${formatMoney(official, currency)}</span></div>`;
          if (unofficial > 0) html += `<div class="tooltip-row"><span class="label">✉️ В конверте</span><span class="value">${formatMoney(unofficial, currency)}</span></div>`;
          html += `<div class="tooltip-row" style="border-top:1px solid var(--glass-border); padding-top:4px; margin-top:4px;"><span class="label">💰 Итого</span><span class="value">${formatMoney(total, currency)}</span></div>`;
        } else {
          html += `<div class="tooltip-row"><span class="label">💰 Итого</span><span class="value">${formatMoney(total, currency)}</span></div>`;
        }

        if (groupData.paymentsList && groupData.paymentsList.length > 0) {
          html += `<div class="tooltip-payments">`;
          groupData.paymentsList.forEach(p => {
            html += `<div class="payment-item"><span>📅</span><span>${p}</span></div>`;
          });
          html += `</div>`;
        }

        chartTooltip.innerHTML = html;
        const tooltipWidth = Math.min(280, window.innerWidth - 32);
        chartTooltip.style.width = tooltipWidth + 'px';
        let left = x - tooltipWidth / 2;
        let top = y - 20;
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
        if (top < 10) top = 10;
        if (top + chartTooltip.offsetHeight > window.innerHeight - 20) {
          top = y - chartTooltip.offsetHeight - 10;
          if (top < 10) top = 10;
        }
        chartTooltip.style.left = left + 'px';
        chartTooltip.style.top = top + 'px';
        chartTooltip.classList.add('visible');
      }

      function hideChartTooltip() { if (chartTooltip) chartTooltip.classList.remove('visible'); }

      function updateTrendsAndForecast(data) {
        const container = document.getElementById('trend-container');
        const forecastContainer = document.getElementById('forecast-container');
        if (!container || !forecastContainer) return;
        if (data.length < 2) {
          container.innerHTML = '';
          forecastContainer.innerHTML = '';
          return;
        }
        // history/data хранится в порядке "новые записи первыми" (unshift),
        // поэтому текущая запись — это data[0], а не последний элемент массива.
        const current = data[0]?.total || 0;
        const previous = data[1]?.total || 0;
        const diff = current - previous;
        const diffPercent = previous ? (diff / previous * 100) : 0;
        const trendIcon = diff > 0 ? '▲' : (diff < 0 ? '▼' : '•');
        container.innerHTML = `<div class="card" style="padding:10px; text-align:center; margin-bottom:8px;"><span style="font-size:clamp(16px,2vw,24px);">${trendIcon} ${diff > 0 ? 'Рост' : (diff < 0 ? 'Падение' : 'Стабильность')}</span><span style="font-size:clamp(14px,1.6vw,20px); margin-left:8px; color:var(--text-secondary);">${diff > 0 ? '+' : ''}${formatMoney(diff)} (${diffPercent.toFixed(1)}%)</span></div>`;
        if (data.length >= 3) {
          const monthlyAvg = data.slice(0, 6).reduce((s, item) => s + item.total, 0) / Math.min(data.length, 6);
          const monthsLeft = 12 - new Date().getMonth() - 1;
          if (monthsLeft > 0) {
            const forecast = monthlyAvg * monthsLeft;
            forecastContainer.innerHTML = `<div class="card" style="padding:10px; text-align:center; border:1px solid var(--accent-purple);"><span style="font-size:clamp(14px,1.6vw,20px);">Прогноз до конца года</span><span style="font-size:clamp(20px,2.8vw,32px); font-weight:700; display:block; margin-top:4px;">${formatMoney(forecast)}</span><span style="font-size:clamp(12px,1.4vw,18px); color:var(--text-secondary);">при сохранении текущего темпа</span></div>`;
          } else forecastContainer.innerHTML = '';
        } else forecastContainer.innerHTML = '';
      }

      function renderHistoryList(data, currency) {
        const list = document.getElementById('history-list');
        if (!list) return;
        if (data.length === 0) {
          list.innerHTML = '<div class="empty">Нет записей для выбранного периода.</div>';
          return;
        }
        const sorted = [...data].sort((a,b) => new Date(b.receivedDate || b.date) - new Date(a.receivedDate || a.date));
        const fullHistory = getHistory();
        let html = '';
        sorted.forEach((item) => {
          const index = item.id
            ? fullHistory.findIndex(h => h.id === item.id)
            : fullHistory.findIndex(h => h.date === item.date && h.time === item.time && h.total === item.total);
          const mainDateObj = new Date(item.receivedDate || item.date);
          const monthName = MONTHS_RU[mainDateObj.getMonth()] || '?';
          const year = mainDateObj.getFullYear();
          const displayDate = `${String(mainDateObj.getDate()).padStart(2,'0')}.${String(mainDateObj.getMonth()+1).padStart(2,'0')}.${year}`;

          html += `<div class="card history-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid var(--glass-border);">
              <span style="font-size: 16px; font-weight: 700;">${monthName} ${year}</span>
              <span style="font-size: 16px; font-weight: 700; color: var(--accent-purple);">${formatMoney(item.total, currency)}</span>
            </div>
            <div class="history-payments-vertical-list">`;

          if (item.advance && item.advance > 0) {
            html += `<div class="history-payment-row t-advance">
              <div class="history-payment-label">Аванс</div>
              <div class="history-payment-value">${formatMoney(item.advance, currency)}</div>
            </div>`;
          }
          if (item.mainPayment && item.mainPayment > 0) {
            html += `<div class="history-payment-row t-main">
              <div class="history-payment-label">Первая выплата</div>
              <div class="history-payment-value">${formatMoney(item.mainPayment, currency)}</div>
            </div>`;
          }
          if (item.vacation && item.vacation > 0) {
            html += `<div class="history-payment-row t-vacation">
              <div class="history-payment-label">Отпускные</div>
              <div class="history-payment-value">${formatMoney(item.vacation, currency)}</div>
            </div>`;
          }
          if (item.unofficial && item.unofficial > 0) {
            html += `<div class="history-payment-row t-unofficial">
              <div class="history-payment-label">Дополнительно (конверт)</div>
              <div class="history-payment-value">${formatMoney(item.unofficial, currency)}</div>
            </div>`;
          }

          html += `</div>
            <div class="history-card-footer">
              ${item.category ? `<span>${item.category}</span> • ` : ''}
              <span>${displayDate}</span>
              <button class="action-btn edit-btn" onclick="editHistoryItem(${index})" style="position:static; margin-left: auto;">✏️</button>
              <button class="action-btn delete-btn" onclick="deleteHistoryItem(${index})" style="position:static;">×</button>
            </div>
          </div>`;
        });
        list.innerHTML = html;
      }

