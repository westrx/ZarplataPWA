// Утилиты форматирования, дат, id

function formatMoney(amount, currency = '₽') {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' ' + currency;
}

function cleanNumberInput(value) {
  let cleaned = value.replace(/[^0-9.,]/g, '');
  if (cleaned.includes(',')) { cleaned = cleaned.replace('.', '').replace(',', '.'); }
  if ((cleaned.match(/\./g) || []).length > 1) {
    const parts = cleaned.split('.');
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

function parseNumberFromInput(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const cleaned = cleanNumberInput(el.value || '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function genRecordId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// 'YYYY-MM-DD' -> локальная дата БЕЗ сдвига часовых поясов
function parseLocalDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// 'DD.MM.YYYY' -> локальная дата
function parseRuDate(s) {
  const m = String(s || '').match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKeyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelRu(d) {
  return d.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
}

// Если день выплаты попал на субботу/воскресенье — переносим на пятницу (макс. на 2 дня назад)
function getActualPayday(targetDay, month, year) {
  let actualDay = targetDay;
  for (let i = 0; i <= 2; i++) {
    const d = new Date(year, month, targetDay - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { actualDay = targetDay - i; break; }
    if (i === 2) actualDay = targetDay - i;
  }
  return actualDay;
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function todayLocalISO() {
  const n = new Date();
  return toISODate(n);
}
