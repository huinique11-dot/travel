export const CURRENCIES = [
  { code: 'KRW', label: '원 (KRW)' },
  { code: 'JPY', label: '엔 (JPY)' },
  { code: 'USD', label: '달러 (USD)' },
  { code: 'EUR', label: '유로 (EUR)' },
  { code: 'CNY', label: '위안 (CNY)' },
  { code: 'TWD', label: '대만달러 (TWD)' },
  { code: 'THB', label: '바트 (THB)' },
  { code: 'VND', label: '동 (VND)' },
  { code: 'PHP', label: '페소 (PHP)' },
  { code: 'GBP', label: '파운드 (GBP)' },
];

export const CATEGORIES = [
  { id: 'food', label: '식비', icon: '🍜' },
  { id: 'transport', label: '교통', icon: '🚕' },
  { id: 'lodging', label: '숙박', icon: '🏨' },
  { id: 'ticket', label: '관광·입장', icon: '🎟️' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' },
  { id: 'etc', label: '기타', icon: '💡' },
];
export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export function money(amount, currency = 'KRW') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: ['KRW', 'JPY', 'VND', 'TWD'].includes(currency) ? 0 : 2 }).format(n);
  } catch {
    return `${n.toLocaleString('ko-KR')} ${currency}`;
  }
}

// 'YYYY-MM-DD' 문자열을 로컬 날짜로 다룸 (시간대 문제 방지)
export function parseDay(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function toDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function today() {
  return toDay(new Date());
}

export function tripDays(start, end) {
  if (!start) return [];
  const days = [];
  const s = parseDay(start);
  const e = parseDay(end && end >= start ? end : start);
  for (let d = new Date(s); d <= e && days.length < 60; d.setDate(d.getDate() + 1)) days.push(toDay(d));
  return days;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export function dayLabel(s) {
  const d = parseDay(s);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEK[d.getDay()]})`;
}
export function rangeLabel(start, end) {
  if (!start) return '날짜 미정';
  const s = parseDay(start);
  const e = parseDay(end || start);
  const nights = Math.round((e - s) / 86400000);
  const sl = `${s.getFullYear()}.${s.getMonth() + 1}.${s.getDate()}`;
  const el = s.getFullYear() === e.getFullYear() ? `${e.getMonth() + 1}.${e.getDate()}` : `${e.getFullYear()}.${e.getMonth() + 1}.${e.getDate()}`;
  return nights > 0 ? `${sl} – ${el} · ${nights}박 ${nights + 1}일` : `${sl} · 당일`;
}

export function displayName(trip, email) {
  const m = (trip?.members || []).find((x) => x.email === email);
  return (m && m.name) || (email ? email.split('@')[0] : '알 수 없음');
}

export const DAY_COLORS = ['#0f766e', '#e11d48', '#2563eb', '#d97706', '#7c3aed', '#059669', '#db2777', '#0891b2', '#65a30d', '#9333ea'];
export const dayColor = (i) => DAY_COLORS[i % DAY_COLORS.length];
