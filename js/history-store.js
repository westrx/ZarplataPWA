// Хранилище истории. Модель записи v6:
// { id, created:'DD.MM.YYYY HH:mm', receivedDate:'YYYY-MM-DD', kind:'main|advance|vacation|debt',
//   card, cash, vacation, debt, total, category, note, vacationDate }
// Старые записи (mainPayment/advance/unofficial/hasAdvance...) нормализуются на лету — данные не теряются.
'use strict';

const HISTORY_KEY = 'salary-history-v5';
const KIND_LABELS = { main: 'Зарплата', advance: 'Аванс', vacation: 'Отпускные', debt: 'Долг' };

function normalizeRecord(item) {
  if (!item) return null;
  if (item.kind && item.card !== undefined) return item;
  const card = (item.mainPayment || 0) + (item.advance || 0);
  const cash = item.unofficial || 0;
  const vacation = item.vacation || 0;
  const debt = item.debt || 0;
  let kind = 'main';
  if (item.hasVacation) kind = 'vacation';
  else if (item.hasAdvance && !item.mainPayment && !item.hasUnofficial) kind = 'advance';
  const ru = parseRuDate(item.date);
  const receivedDate = item.receivedDate || (ru ? toISODate(ru) : '');
  const total = (item.total != null) ? item.total : (card + cash + vacation);
  return {
    id: item.id || genRecordId(),
    created: (item.date && item.time) ? `${item.date} ${item.time}` : (item.created || item.date || ''),
    receivedDate, kind, card, cash, vacation, debt, total,
    category: item.category || 'Основная',
    note: item.note || '',
    vacationDate: item.vacationDate || receivedDate
  };
}

function getHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    return raw.map(normalizeRecord).filter(Boolean);
  } catch (e) { return []; }
}

function setHistory(history) { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }

// Фактически получено (долг в доход НЕ входит)
function recordReceived(r) { return (r.card || 0) + (r.cash || 0) + (r.vacation || 0); }

function recordDate(r) { return parseLocalDate(r.receivedDate) || parseRuDate(r.created); }

function getFilteredHistory(months) {
  const history = getHistory();
  const now = new Date();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return history.filter(item => {
    const d = recordDate(item);
    return d && d >= cutoff && d <= now;
  });
}

function groupDataForChart(records, currency) {
  const grouped = {};
  records.forEach(rec => {
    const total = recordReceived(rec);
    if (total > 0) {
      const d = (rec.kind === 'vacation')
        ? (parseLocalDate(rec.vacationDate) || parseLocalDate(rec.receivedDate))
        : parseLocalDate(rec.receivedDate);
      if (!d) return;
      const key = monthKeyOf(d);
      if (!grouped[key]) grouped[key] = { label: monthLabelRu(d), total: 0, card: 0, cash: 0, paymentsList: [] };
      grouped[key].total += total;
      grouped[key].card += (rec.card || 0);
      grouped[key].cash += (rec.cash || 0);
      grouped[key].paymentsList.push(`${d.getDate()} числа: ${formatMoney(total, currency)}`);
    }
    if ((rec.debt || 0) > 0) {
      const dd = parseLocalDate(rec.receivedDate);
      if (dd) {
        const key = monthKeyOf(dd);
        if (!grouped[key]) grouped[key] = { label: monthLabelRu(dd), total: 0, card: 0, cash: 0, paymentsList: [] };
        grouped[key].paymentsList.push(`Долг: ${formatMoney(rec.debt, currency)}`);
      }
    }
  });
  return grouped;
}

function getCategoryBreakdown(records) {
  const out = {};
  records.forEach(r => {
    const t = recordReceived(r);
    if (t > 0) { const c = r.category || 'Основная'; out[c] = (out[c] || 0) + t; }
  });
  return out;
}

function getOpenDebt(records) { return records.reduce((s, r) => s + (r.debt || 0), 0); }

function getYearCumulative(year) {
  const months = [];
  let acc = 0;
  const h = getHistory();
  const now = new Date();
  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    let sum = 0;
    h.forEach(r => {
      const d = (r.kind === 'vacation') ? (parseLocalDate(r.vacationDate) || parseLocalDate(r.receivedDate)) : parseLocalDate(r.receivedDate);
      if (d && monthKeyOf(d) === key) sum += recordReceived(r);
    });
    acc += sum;
    months.push({ month: m, sum, acc, future: (year === now.getFullYear() && m > now.getMonth()) });
  }
  return months;
}

function getYearOverYear(records) {
  const months = {};
  records.forEach(r => {
    const d = recordDate(r);
    if (!d) return;
    const key = monthKeyOf(d);
    months[key] = (months[key] || 0) + recordReceived(r);
  });
  const full = getHistory();
  const out = [];
  Object.keys(months).sort().forEach(key => {
    const [y, m] = key.split('-').map(Number);
    const prevKey = `${y - 1}-${String(m).padStart(2, '0')}`;
    let prev = 0;
    full.forEach(r => {
      const d = recordDate(r);
      if (d && monthKeyOf(d) === prevKey) prev += recordReceived(r);
    });
    if (prev > 0) out.push({ key, cur: months[key], prev, diffPct: Math.round(((months[key] - prev) / prev) * 100) });
  });
  return out;
}

function getRecordsInfo() {
  const months = {};
  getHistory().forEach(r => {
    const d = recordDate(r);
    if (!d) return;
    const key = monthKeyOf(d);
    months[key] = (months[key] || 0) + recordReceived(r);
  });
  const keys = Object.keys(months).sort();
  let bestKey = null;
  keys.forEach(k => { if (!bestKey || months[k] > months[bestKey]) bestKey = k; });
  let streak = 0;
  for (let i = keys.length - 1; i > 0; i--) {
    if (months[keys[i]] > months[keys[i - 1]]) streak++;
    else break;
  }
  return { bestKey, bestAmount: bestKey ? months[bestKey] : 0, streak };
}

function getMonthTotal(year, monthIdx) {
  let s = 0;
  getHistory().forEach(r => {
    const d = parseLocalDate(r.receivedDate);
    if (d && d.getFullYear() === year && d.getMonth() === monthIdx) s += recordReceived(r);
  });
  return s;
}

function getBestMonthTotal(excludeYear, excludeMonth) {
  const months = {};
  getHistory().forEach(r => {
    const d = parseLocalDate(r.receivedDate);
    if (!d) return;
    const key = monthKeyOf(d);
    months[key] = (months[key] || 0) + recordReceived(r);
  });
  let best = 0;
  Object.keys(months).forEach(k => {
    const [y, m] = k.split('-').map(Number);
    if (y === excludeYear && (m - 1) === excludeMonth) return;
    if (months[k] > best) best = months[k];
  });
  return best;
}

function buildRecord(card, cash, kind, dateISO, category, note) {
  const now = new Date();
  const rec = {
    id: genRecordId(),
    created: now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    receivedDate: dateISO,
    kind,
    card: card || 0,
    cash: (kind === 'main' || kind === 'advance') ? (cash || 0) : 0,
    vacation: kind === 'vacation' ? (card || 0) : 0,
    debt: kind === 'debt' ? (card || 0) : 0,
    total: 0,
    category: category || 'Основная',
    note: note || '',
    vacationDate: kind === 'vacation' ? dateISO : ''
  };
  rec.total = recordReceived(rec);
  return rec;
}

function saveQuickPaymentToHistory(card, cash, kind, dateISO, category, note) {
  const record = buildRecord(card, cash, kind, dateISO, category, note);
  const history = getHistory();
  history.unshift(record);
  setHistory(history);
  return record;
}

function updateHistoryRecord(index, card, cash, kind, dateISO, category) {
  const history = getHistory();
  if (index < 0 || index >= history.length) return;
  const old = history[index];
  const rec = buildRecord(card, cash, kind, dateISO, category, old.note || '');
  rec.id = old.id;
  rec.created = old.created;
  history[index] = rec;
  setHistory(history);
}

function exportCSV() {
  const header = ['Дата', 'Тип', 'На карту', 'Конверт', 'Отпускные', 'Долг', 'Итого получено', 'Категория', 'Заметка'];
  const rows = getHistory()
    .slice()
    .sort((a, b) => String(a.receivedDate).localeCompare(String(b.receivedDate)))
    .map(r => [r.receivedDate, KIND_LABELS[r.kind] || r.kind, r.card || 0, r.cash || 0, r.vacation || 0, r.debt || 0, recordReceived(r), r.category || '', r.note || '']
      .map(csvEscape).join(';'));
  downloadFile('salary-history.csv', '﻿' + header.join(';') + '\n' + rows.join('\n'), 'text/csv;charset=utf-8');
}
