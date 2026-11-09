import { useEffect, useMemo, useState } from 'react';
import { store } from '../store/index.js';
import { categoryOf, dayColor, dayLabel, displayName, money, today, tripDays } from '../lib/format.js';
import { placeUrl, routeUrl } from '../lib/maps.js';
import PlaceModal from './PlaceModal.jsx';
import ExpenseModal from './ExpenseModal.jsx';

export const WISH = 'wish'; // 날짜 미정 "가고 싶은 곳"

export function sortPlaces(list) {
  return list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.time || '').localeCompare(b.time || ''));
}

export default function Itinerary({ user, trip, places, expenses, notes, cur }) {
  const days = useMemo(() => tripDays(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const [day, setDay] = useState(() => (days.includes(today()) ? today() : days[0] || WISH));
  const [placeModal, setPlaceModal] = useState(null); // {place?} | null
  const [expenseModal, setExpenseModal] = useState(null);

  useEffect(() => { if (day !== WISH && !days.includes(day)) setDay(days[0] || WISH); }, [days, day]);

  const dayKey = (p) => (p.day && days.includes(p.day) ? p.day : WISH);
  const dayPlaces = sortPlaces(places.filter((p) => dayKey(p) === day));
  const dayExpenses = expenses.filter((e) => e.date === day);
  const placeIds = new Set(places.map((p) => p.id));
  const otherExpenses = dayExpenses.filter((e) => !e.placeId || !placeIds.has(e.placeId));
  const dayTotal = dayExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const dayIndex = days.indexOf(day);
  const route = routeUrl(dayPlaces);

  const move = async (idx, dir) => {
    const a = dayPlaces[idx];
    const b = dayPlaces[idx + dir];
    if (!a || !b) return;
    // order 값을 다시 매겨서 자리 바꾸기
    const reordered = dayPlaces.slice();
    reordered[idx] = b;
    reordered[idx + dir] = a;
    await Promise.all(reordered.map((p, i) => (p.order !== i ? store.updateItem(trip.id, 'places', p.id, { order: i }) : null)));
  };

  return (
    <div className="itinerary">
      <div className="day-chips" role="tablist">
        {days.map((d, i) => {
          const n = places.filter((p) => p.day === d).length;
          return (
            <button key={d} className={`day-chip ${day === d ? 'on' : ''} ${d === today() ? 'today' : ''}`} style={day === d ? { background: dayColor(i), borderColor: dayColor(i) } : null} onClick={() => setDay(d)}>
              <b>Day {i + 1}</b>
              <small>{dayLabel(d)}</small>
              {n > 0 && <i>{n}</i>}
            </button>
          );
        })}
        <button className={`day-chip ${day === WISH ? 'on wish' : ''}`} onClick={() => setDay(WISH)}>
          <b>⭐ 가고 싶은 곳</b>
          <small>날짜 미정</small>
          {places.filter((p) => dayKey(p) === WISH).length > 0 && <i>{places.filter((p) => dayKey(p) === WISH).length}</i>}
        </button>
      </div>

      <section className="day-head">
        <div>
          <h2>{day === WISH ? '가고 싶은 곳' : `Day ${dayIndex + 1} · ${dayLabel(day)}`}</h2>
          {day !== WISH && <p className="muted small">이 날 지출 <b>{money(dayTotal, cur)}</b> · 장소 {dayPlaces.length}곳</p>}
          {day === WISH && <p className="muted small">날짜를 정하기 전 후보 장소를 모아두세요.</p>}
        </div>
        {route && dayPlaces.length > 1 && day !== WISH && (
          <a className="btn small outline" href={route} target="_blank" rel="noreferrer">🧭 동선 길찾기</a>
        )}
      </section>

      <ol className="place-list">
        {dayPlaces.map((p, i) => {
          const linked = expenses.filter((e) => e.placeId === p.id);
          const spent = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          return (
            <li key={p.id} className="place-card">
              <div className="place-num" style={{ background: day === WISH ? '#f59e0b' : dayColor(dayIndex) }}>{day === WISH ? '★' : i + 1}</div>
              <div className="place-main">
                <div className="row between top">
                  <div>
                    {p.time && <span className="time">{p.time}</span>}
                    <h3>{p.name}</h3>
                    {p.address && <p className="muted small">{p.address}</p>}
                  </div>
                  {spent > 0 && <span className="amount">{money(spent, cur)}</span>}
                </div>
                {p.memo && <p className="memo">{p.memo}</p>}
                {linked.length > 0 && (
                  <ul className="mini-expenses">
                    {linked.map((e) => (
                      <li key={e.id}>
                        <button className="link" onClick={() => setExpenseModal({ expense: e })}>
                          {categoryOf(e.category).icon} {e.title || categoryOf(e.category).label}
                          <span className="muted"> · {displayName(trip, e.paidBy)}</span>
                        </button>
                        <span>{money(e.amount, cur)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="place-actions">
                  <a href={placeUrl(p)} target="_blank" rel="noreferrer">📍 구글 지도</a>
                  <button onClick={() => setExpenseModal({ defaults: { date: day === WISH ? (days[0] || today()) : day, placeId: p.id, title: p.name } })}>💰 지출 기록</button>
                  <button onClick={() => setPlaceModal({ place: p })}>✎ 수정</button>
                  <span className="spacer" />
                  <button aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                  <button aria-label="아래로" disabled={i === dayPlaces.length - 1} onClick={() => move(i, 1)}>▼</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {dayPlaces.length === 0 && <p className="empty small">아직 등록된 장소가 없어요.</p>}

      <button className="btn add-place" onClick={() => setPlaceModal({})}>＋ 장소 추가</button>

      {day !== WISH && (
        <>
          <section className="card">
            <div className="row between">
              <h3>기타 지출</h3>
              <button className="btn small outline" onClick={() => setExpenseModal({ defaults: { date: day } })}>＋ 지출 기록</button>
            </div>
            {otherExpenses.length === 0 && <p className="muted small">교통비, 간식처럼 장소와 상관없는 지출을 기록하세요.</p>}
            <ul className="mini-expenses">
              {otherExpenses.map((e) => (
                <li key={e.id}>
                  <button className="link" onClick={() => setExpenseModal({ expense: e })}>
                    {categoryOf(e.category).icon} {e.title || categoryOf(e.category).label}
                    <span className="muted"> · {displayName(trip, e.paidBy)}</span>
                  </button>
                  <span>{money(e.amount, cur)}</span>
                </li>
              ))}
            </ul>
          </section>
          <DayNote key={day} trip={trip} day={day} user={user} note={notes.find((n) => n.id === day)} />
        </>
      )}

      {placeModal && (
        <PlaceModal
          trip={trip}
          days={days}
          place={placeModal.place}
          defaultDay={day}
          nextOrder={(d) => Math.max(-1, ...places.filter((p) => dayKey(p) === (d || WISH)).map((p) => p.order ?? 0)) + 1}
          linkedCount={placeModal.place ? expenses.filter((e) => e.placeId === placeModal.place.id).length : 0}
          user={user}
          onClose={() => setPlaceModal(null)}
        />
      )}
      {expenseModal && (
        <ExpenseModal
          trip={trip}
          days={days}
          places={places}
          user={user}
          expense={expenseModal.expense}
          defaults={expenseModal.defaults}
          onClose={() => setExpenseModal(null)}
        />
      )}
    </div>
  );
}

function DayNote({ trip, day, user, note }) {
  const [text, setText] = useState(note?.text || '');
  const [focused, setFocused] = useState(false);
  const [saved, setSaved] = useState(true);

  // 다른 가족이 수정하면 (내가 쓰는 중이 아닐 때) 반영
  useEffect(() => { if (!focused) setText(note?.text || ''); }, [note?.text, focused]);

  const save = async () => {
    setFocused(false);
    if ((note?.text || '') === text) return;
    await store.setItem(trip.id, 'notes', day, { text }, user);
    setSaved(true);
  };

  return (
    <section className="card">
      <h3>📝 오늘의 기록</h3>
      <textarea
        rows={4}
        value={text}
        placeholder="오늘 있었던 일, 맛있었던 것, 기억하고 싶은 순간을 남겨보세요."
        onFocus={() => setFocused(true)}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        onBlur={save}
      />
      <p className="muted tiny">
        {!saved ? '입력을 마치면 자동 저장돼요' : note?.updatedBy ? `마지막 작성: ${displayName(trip, note.updatedBy)}` : ''}
      </p>
    </section>
  );
}
