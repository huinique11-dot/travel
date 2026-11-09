import { useState } from 'react';
import { store, useTrips } from '../store/index.js';
import { rangeLabel, today } from '../lib/format.js';
import { go } from '../App.jsx';
import TripFormModal from './TripFormModal.jsx';
import { Avatar } from './Modal.jsx';

function status(t) {
  const d = today();
  if (!t.startDate) return { label: '날짜 미정', cls: '' };
  if (d < t.startDate) {
    const left = Math.ceil((new Date(t.startDate) - new Date(d)) / 86400000);
    return { label: `D-${left}`, cls: 'soon' };
  }
  if (d <= (t.endDate || t.startDate)) return { label: '여행 중', cls: 'now' };
  return { label: '다녀옴', cls: 'past' };
}

export default function TripList({ user }) {
  const { data: trips, error } = useTrips(user);
  const [adding, setAdding] = useState(false);

  const sorted = (trips || []).slice().sort((a, b) => {
    const pa = status(a).cls === 'past';
    const pb = status(b).cls === 'past';
    if (pa !== pb) return pa ? 1 : -1;
    return pa ? (b.startDate || '').localeCompare(a.startDate || '') : (a.startDate || '9').localeCompare(b.startDate || '9');
  });

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand"><img src="./icon.svg" alt="" width="28" height="28" /> 우리 가족 여행</h1>
        <div className="row gap">
          <Avatar member={user} size={30} />
          <button className="btn ghost small" onClick={() => store.signOut()}>로그아웃</button>
        </div>
      </header>

      {store.mode === 'local' && <div className="banner">체험 모드 · 이 기기에만 저장돼요. 가족과 공유하려면 Firebase를 연결하세요 (README 참고).</div>}

      <main className="content">
        {error && <p className="error">여행 목록을 불러오지 못했어요: {error.message}</p>}
        {trips === undefined && <div className="spinner" />}
        {trips && trips.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🧳</div>
            <p>아직 여행이 없어요.<br />아래 <b>+</b> 버튼을 눌러 첫 여행지를 추가해 보세요!</p>
          </div>
        )}
        <div className="trip-grid">
          {sorted.map((t) => {
            const s = status(t);
            return (
              <button key={t.id} className="trip-card" onClick={() => go(`/trip/${t.id}`)}>
                <div className="trip-cover" style={{ background: t.color || '#0f766e' }}>
                  <span className="trip-emoji">{t.emoji || '✈️'}</span>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                </div>
                <div className="trip-info">
                  <h3>{t.title}</h3>
                  {t.destination && <p className="muted small">📍 {t.destination}</p>}
                  <p className="muted small">{rangeLabel(t.startDate, t.endDate)}</p>
                  <div className="avatars">
                    {(t.members || []).slice(0, 6).map((m) => <Avatar key={m.email} member={m} size={24} />)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <button className="fab" onClick={() => setAdding(true)} aria-label="여행 추가">+</button>
      {adding && (
        <TripFormModal
          onClose={() => setAdding(false)}
          onSave={async (data) => {
            const id = await store.createTrip(user, data);
            setAdding(false);
            go(`/trip/${id}`);
          }}
        />
      )}
    </div>
  );
}
