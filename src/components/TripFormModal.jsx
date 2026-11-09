import { useState } from 'react';
import Modal from './Modal.jsx';
import { CURRENCIES, today } from '../lib/format.js';

const EMOJIS = ['✈️', '🏝️', '🏔️', '🗼', '🏯', '🌸', '🍜', '🚗', '⛺', '🎢', '🌊', '🎄'];
const COLORS = ['#0f766e', '#2563eb', '#e11d48', '#d97706', '#7c3aed', '#0891b2', '#65a30d', '#475569'];

export default function TripFormModal({ trip, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => ({
    title: trip?.title || '',
    destination: trip?.destination || '',
    startDate: trip?.startDate || today(),
    endDate: trip?.endDate || today(),
    currency: trip?.currency || 'KRW',
    budget: trip?.budget || '',
    emoji: trip?.emoji || '✈️',
    color: trip?.color || '#0f766e',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    setBusy(true);
    try {
      await onSave({
        ...f,
        title: f.title.trim(),
        destination: f.destination.trim(),
        endDate: f.endDate < f.startDate ? f.startDate : f.endDate,
        budget: Number(f.budget) || 0,
      });
    } finally { setBusy(false); }
  };

  return (
    <Modal
      title={trip ? '여행 정보 수정' : '새 여행 추가'}
      onClose={onClose}
      footer={(
        <>
          {onDelete && <button type="button" className="btn danger ghost" onClick={onDelete}>여행 삭제</button>}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>취소</button>
          <button type="submit" form="trip-form" className="btn primary" disabled={busy || !f.title.trim()}>{trip ? '저장' : '추가'}</button>
        </>
      )}
    >
      <form id="trip-form" onSubmit={submit} className="form">
        <label>여행 이름 *
          <input autoFocus value={f.title} onChange={set('title')} placeholder="예) 2026 겨울 오사카 가족여행" required />
        </label>
        <label>여행지
          <input value={f.destination} onChange={set('destination')} placeholder="예) 일본 오사카" />
        </label>
        <div className="grid2">
          <label>출발일<input type="date" value={f.startDate} onChange={set('startDate')} required /></label>
          <label>도착일<input type="date" value={f.endDate} min={f.startDate} onChange={set('endDate')} required /></label>
        </div>
        <div className="grid2">
          <label>통화
            <select value={f.currency} onChange={set('currency')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </label>
          <label>예산 (선택)<input type="number" inputMode="decimal" min="0" value={f.budget} onChange={set('budget')} placeholder="0" /></label>
        </div>
        <div className="field">
          <span>아이콘</span>
          <div className="chips">
            {EMOJIS.map((em) => (
              <button type="button" key={em} className={`chip emoji ${f.emoji === em ? 'on' : ''}`} onClick={() => setF((p) => ({ ...p, emoji: em }))}>{em}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>색상</span>
          <div className="chips">
            {COLORS.map((c) => (
              <button type="button" key={c} aria-label={c} className={`swatch ${f.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setF((p) => ({ ...p, color: c }))} />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
