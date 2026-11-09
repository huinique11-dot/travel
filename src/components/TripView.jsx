import { useMemo, useState } from 'react';
import { store, useItems, useTrip } from '../store/index.js';
import { money, rangeLabel } from '../lib/format.js';
import { go } from '../App.jsx';
import { Avatar } from './Modal.jsx';
import TripFormModal from './TripFormModal.jsx';
import Itinerary from './Itinerary.jsx';
import MapView from './MapView.jsx';
import Expenses from './Expenses.jsx';
import Members from './Members.jsx';

const TABS = [
  { id: 'plan', label: '일정', icon: '🗓️' },
  { id: 'map', label: '지도', icon: '🗺️' },
  { id: 'money', label: '경비', icon: '💰' },
  { id: 'members', label: '가족', icon: '👨‍👩‍👧' },
];

export default function TripView({ user, tripId, tab }) {
  const { data: trip, error } = useTrip(tripId);
  const { data: places } = useItems(tripId, 'places');
  const { data: expenses } = useItems(tripId, 'expenses');
  const { data: notes } = useItems(tripId, 'notes');
  const [editing, setEditing] = useState(false);

  const total = useMemo(() => (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);

  if (error || trip === null) {
    return (
      <div className="center-screen column">
        <p>여행을 찾을 수 없거나 접근 권한이 없어요.</p>
        <p className="muted small">초대받은 이메일 계정으로 로그인했는지 확인해 주세요.</p>
        <button className="btn primary" onClick={() => go('/')}>목록으로</button>
      </div>
    );
  }
  if (!trip) return <div className="center-screen"><div className="spinner" /></div>;

  const ctx = { user, trip, places: places || [], expenses: expenses || [], notes: notes || [], cur: trip.currency || 'KRW' };
  const isOwner = trip.ownerEmail === user.email;

  return (
    <div className="page trip-page">
      <header className="trip-head" style={{ background: trip.color || '#0f766e' }}>
        <div className="row between">
          <button className="icon-btn light" onClick={() => go('/')} aria-label="뒤로">←</button>
          <button className="icon-btn light" onClick={() => setEditing(true)} aria-label="여행 정보 수정">✎</button>
        </div>
        <div className="trip-title">
          <span className="trip-emoji big">{trip.emoji || '✈️'}</span>
          <div>
            <h1>{trip.title}</h1>
            <p>{trip.destination && `📍 ${trip.destination} · `}{rangeLabel(trip.startDate, trip.endDate)}</p>
          </div>
        </div>
        <div className="row between">
          <button className="avatars light" onClick={() => go(`/trip/${tripId}/members`)} aria-label="가족 멤버">
            {(trip.members || []).slice(0, 6).map((m) => <Avatar key={m.email} member={m} size={26} />)}
            <span className="add-member">+ 초대</span>
          </button>
          <div className="total">
            <small>총 지출</small>
            <b>{money(total, ctx.cur)}</b>
            {trip.budget > 0 && <small className="budget">예산 {money(trip.budget, ctx.cur)}</small>}
          </div>
        </div>
        {trip.budget > 0 && (
          <div className="budget-bar"><span style={{ width: `${Math.min(100, (total / trip.budget) * 100)}%` }} className={total > trip.budget ? 'over' : ''} /></div>
        )}
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(`/trip/${tripId}/${t.id}`)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      <main className={`content ${tab === 'map' ? 'content-map' : ''}`}>
        {tab === 'plan' && <Itinerary {...ctx} />}
        {tab === 'map' && <MapView {...ctx} />}
        {tab === 'money' && <Expenses {...ctx} />}
        {tab === 'members' && <Members {...ctx} />}
      </main>

      {editing && (
        <TripFormModal
          trip={trip}
          onClose={() => setEditing(false)}
          onSave={async (data) => { await store.updateTrip(tripId, data); setEditing(false); }}
          onDelete={isOwner ? async () => {
            if (!window.confirm(`'${trip.title}' 여행과 모든 일정·지출 기록을 삭제할까요? 되돌릴 수 없어요.`)) return;
            await store.deleteTrip(tripId);
            go('/');
          } : null}
        />
      )}
    </div>
  );
}
