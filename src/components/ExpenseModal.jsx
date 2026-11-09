import { useState } from 'react';
import Modal from './Modal.jsx';
import { store } from '../store/index.js';
import { CATEGORIES, dayLabel, today } from '../lib/format.js';
import { sortPlaces } from './Itinerary.jsx';

export default function ExpenseModal({ trip, days, places, user, expense, defaults = {}, onClose }) {
  const members = trip.members || [];
  const [f, setF] = useState(() => ({
    title: expense?.title ?? defaults.title ?? '',
    amount: expense?.amount ?? '',
    category: expense?.category || defaults.category || 'food',
    date: expense?.date || defaults.date || (days.includes(today()) ? today() : days[0] || today()),
    placeId: expense?.placeId ?? defaults.placeId ?? '',
    paidBy: expense?.paidBy || user.email,
    memo: expense?.memo || '',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const cur = trip.currency || 'KRW';

  const dayPlaces = sortPlaces(places.filter((p) => p.day === f.date || p.id === f.placeId));

  const save = async (e) => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount < 0) return;
    setBusy(true);
    const data = { ...f, amount, title: f.title.trim(), memo: f.memo.trim() };
    try {
      if (expense) await store.updateItem(trip.id, 'expenses', expense.id, data);
      else await store.addItem(trip.id, 'expenses', data, user);
      onClose();
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm('이 지출 기록을 삭제할까요?')) return;
    await store.deleteItem(trip.id, 'expenses', expense.id);
    onClose();
  };

  return (
    <Modal
      title={expense ? '지출 수정' : '지출 기록'}
      onClose={onClose}
      footer={(
        <>
          {expense && <button type="button" className="btn danger ghost" onClick={remove}>삭제</button>}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>취소</button>
          <button type="submit" form="expense-form" className="btn primary" disabled={busy || !Number(f.amount)}>{expense ? '저장' : '기록'}</button>
        </>
      )}
    >
      <form id="expense-form" className="form" onSubmit={save}>
        <label>금액 ({cur}) *
          <input className="amount-input" type="number" inputMode="decimal" min="0" step="any" autoFocus value={f.amount} onChange={set('amount')} placeholder="0" required />
        </label>
        <div className="field">
          <span>분류</span>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} className={`chip ${f.category === c.id ? 'on' : ''}`} onClick={() => setF((p) => ({ ...p, category: c.id }))}>{c.icon} {c.label}</button>
            ))}
          </div>
        </div>
        <label>내용
          <input value={f.title} onChange={set('title')} placeholder="예) 점심 라멘 4인분" />
        </label>
        <div className="grid2">
          <label>날짜
            <select value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value, placeId: '' }))}>
              {days.map((d, i) => <option key={d} value={d}>Day {i + 1} · {dayLabel(d)}</option>)}
              {!days.includes(f.date) && <option value={f.date}>{f.date}</option>}
            </select>
          </label>
          <label>낸 사람
            <select value={f.paidBy} onChange={set('paidBy')}>
              {members.map((m) => <option key={m.email} value={m.email}>{m.name || m.email}</option>)}
              {!members.some((m) => m.email === f.paidBy) && <option value={f.paidBy}>{f.paidBy}</option>}
            </select>
          </label>
        </div>
        <label>장소
          <select value={f.placeId} onChange={set('placeId')}>
            <option value="">(장소 없음 · 기타 지출)</option>
            {dayPlaces.map((p) => <option key={p.id} value={p.id}>{p.time ? `${p.time} ` : ''}{p.name}</option>)}
          </select>
        </label>
        <label>메모
          <textarea rows={2} value={f.memo} onChange={set('memo')} placeholder="선택" />
        </label>
      </form>
    </Modal>
  );
}
