import { useMemo, useState } from 'react';
import { CATEGORIES, categoryOf, dayLabel, displayName, money, tripDays } from '../lib/format.js';
import ExpenseModal from './ExpenseModal.jsx';

// 균등 분할 정산: 누가 누구에게 얼마를 보내면 되는지
function settle(balances) {
  const debtors = balances.filter((b) => b.diff < -0.5).map((b) => ({ ...b, left: -b.diff })).sort((a, b) => b.left - a.left);
  const creditors = balances.filter((b) => b.diff > 0.5).map((b) => ({ ...b, left: b.diff })).sort((a, b) => b.left - a.left);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const x = Math.min(debtors[i].left, creditors[j].left);
    out.push({ from: debtors[i].email, to: creditors[j].email, amount: x });
    debtors[i].left -= x;
    creditors[j].left -= x;
    if (debtors[i].left < 0.5) i++;
    if (creditors[j].left < 0.5) j++;
  }
  return out;
}

export default function Expenses({ user, trip, places, expenses, cur }) {
  const days = useMemo(() => tripDays(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const [modal, setModal] = useState(null);
  const [excluded, setExcluded] = useState([]);
  const members = trip.members || [];

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byCat = CATEGORIES.map((c) => ({ ...c, sum: expenses.filter((e) => categoryOf(e.category).id === c.id).reduce((s, e) => s + Number(e.amount || 0), 0) }))
    .filter((c) => c.sum > 0).sort((a, b) => b.sum - a.sum);

  const dates = [...new Set([...days, ...expenses.map((e) => e.date)])].filter((d) => expenses.some((e) => e.date === d)).sort();
  const placeName = (id) => places.find((p) => p.id === id)?.name;

  const participants = members.filter((m) => !excluded.includes(m.email));
  const payers = [...new Set([...participants.map((m) => m.email), ...expenses.map((e) => e.paidBy)])];
  const share = participants.length ? total / participants.length : 0;
  const balances = payers.map((email) => {
    const paid = expenses.filter((e) => e.paidBy === email).reduce((s, e) => s + Number(e.amount || 0), 0);
    const owes = participants.some((m) => m.email === email) ? share : 0;
    return { email, paid, diff: paid - owes };
  });
  const transfers = settle(balances);

  return (
    <div className="expenses">
      <section className="card summary">
        <div className="row between">
          <div>
            <small className="muted">총 지출</small>
            <div className="big-num">{money(total, cur)}</div>
          </div>
          {trip.budget > 0 && (
            <div className="right">
              <small className="muted">예산 대비</small>
              <div className={total > trip.budget ? 'over-text' : ''}>
                {total > trip.budget ? `${money(total - trip.budget, cur)} 초과` : `${money(trip.budget - total, cur)} 남음`}
              </div>
            </div>
          )}
        </div>
        {byCat.length > 0 && (
          <>
            <div className="stack-bar">
              {byCat.map((c, i) => <span key={c.id} title={c.label} style={{ width: `${(c.sum / total) * 100}%`, background: `var(--cat-${i})` }} />)}
            </div>
            <ul className="legend">
              {byCat.map((c, i) => (
                <li key={c.id}><i style={{ background: `var(--cat-${i})` }} />{c.icon} {c.label} <b>{money(c.sum, cur)}</b> <span className="muted">{Math.round((c.sum / total) * 100)}%</span></li>
              ))}
            </ul>
          </>
        )}
      </section>

      {expenses.length > 0 && members.length > 1 && (
        <section className="card">
          <h3>🤝 정산 (1/N)</h3>
          <div className="chips">
            {members.map((m) => (
              <button key={m.email} type="button" className={`chip ${excluded.includes(m.email) ? '' : 'on'}`}
                onClick={() => setExcluded((x) => (x.includes(m.email) ? x.filter((e) => e !== m.email) : [...x, m.email]))}>
                {m.name || m.email.split('@')[0]}
              </button>
            ))}
          </div>
          <p className="muted small">{participants.length}명 기준 1인당 <b>{money(share, cur)}</b></p>
          <table className="table">
            <thead><tr><th>이름</th><th>낸 돈</th><th>차액</th></tr></thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.email}>
                  <td>{displayName(trip, b.email)}</td>
                  <td>{money(b.paid, cur)}</td>
                  <td className={b.diff >= 0 ? 'plus' : 'minus'}>{b.diff >= 0 ? '+' : ''}{money(b.diff, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length > 0 ? (
            <ul className="transfers">
              {transfers.map((t) => (
                <li key={`${t.from}-${t.to}`}>{displayName(trip, t.from)} → {displayName(trip, t.to)} <b>{money(t.amount, cur)}</b></li>
              ))}
            </ul>
          ) : <p className="muted small">정산할 금액이 없어요 👍</p>}
        </section>
      )}

      {dates.length === 0 && <div className="empty"><div className="empty-icon">💰</div><p>아직 지출 기록이 없어요.<br /><b>+</b> 버튼으로 첫 지출을 기록해 보세요.</p></div>}

      {dates.map((d) => {
        const list = expenses.filter((e) => e.date === d).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        const sum = list.reduce((s, e) => s + Number(e.amount || 0), 0);
        const idx = days.indexOf(d);
        return (
          <section key={d} className="card">
            <div className="row between">
              <h3>{idx >= 0 ? `Day ${idx + 1} · ` : ''}{dayLabel(d)}</h3>
              <b>{money(sum, cur)}</b>
            </div>
            <ul className="expense-list">
              {list.map((e) => {
                const c = categoryOf(e.category);
                return (
                  <li key={e.id}>
                    <button className="expense-row" onClick={() => setModal({ expense: e })}>
                      <span className="cat-icon">{c.icon}</span>
                      <span className="grow">
                        <b>{e.title || c.label}</b>
                        <small className="muted">
                          {placeName(e.placeId) ? `📍 ${placeName(e.placeId)} · ` : ''}{displayName(trip, e.paidBy)} 결제{e.memo ? ` · ${e.memo}` : ''}
                        </small>
                      </span>
                      <span className="amount">{money(e.amount, cur)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <button className="fab" onClick={() => setModal({})} aria-label="지출 기록">+</button>
      {modal && (
        <ExpenseModal trip={trip} days={days} places={places} user={user} expense={modal.expense} defaults={modal.defaults} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
