import { useState } from 'react';
import { store } from '../store/index.js';
import { Avatar } from './Modal.jsx';
import { go } from '../App.jsx';

export default function Members({ user, trip }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = trip.ownerEmail === user.email;
  const appUrl = window.location.href.split('#')[0];
  const tripUrl = `${appUrl}#/trip/${trip.id}`;

  const invite = async (e) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setMsg('이메일 주소를 확인해 주세요.'); return; }
    setBusy(true);
    try {
      await store.inviteMember(trip, v);
      setEmail('');
      setMsg(`${v} 님을 초대했어요. 아래 '초대 메시지 보내기'로 알려주세요!`);
    } catch (err) {
      setMsg(`초대에 실패했어요: ${err.message}`);
    } finally { setBusy(false); }
  };

  const remove = async (m) => {
    const self = m.email === user.email;
    if (!window.confirm(self ? '이 여행에서 나갈까요?' : `${m.name || m.email} 님을 이 여행에서 내보낼까요?`)) return;
    await store.removeMember(trip, m.email);
    if (self) go('/');
  };

  const shareText = `[우리 가족 여행] '${trip.title}' 여행에 초대했어요!\n아래 링크를 열고, 초대받은 Google 계정으로 로그인하면 함께 일정과 경비를 기록할 수 있어요.\n${tripUrl}`;
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: trip.title, text: shareText }); return; } catch { /* 취소 */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setMsg('초대 메시지를 복사했어요. 카카오톡 등에 붙여넣어 보내세요.');
    } catch {
      window.prompt('아래 메시지를 복사해서 보내세요', shareText);
    }
  };

  return (
    <div className="members">
      <section className="card">
        <h3>👨‍👩‍👧 함께하는 가족 ({(trip.members || []).length})</h3>
        <ul className="member-list">
          {(trip.members || []).map((m) => (
            <li key={m.email}>
              <Avatar member={m} size={40} />
              <div className="grow">
                <b>{m.name || '초대됨 (아직 로그인 전)'}</b>
                <small className="muted">{m.email}{m.email === trip.ownerEmail ? ' · 만든 사람' : ''}{m.email === user.email ? ' · 나' : ''}</small>
              </div>
              {m.email !== trip.ownerEmail && (isOwner || m.email === user.email) && (
                <button className="btn small ghost danger" onClick={() => remove(m)}>{m.email === user.email ? '나가기' : '내보내기'}</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>✉️ 가족 초대하기</h3>
        <p className="muted small">가족의 <b>Google 계정 이메일</b>을 추가하면, 그 계정으로 로그인했을 때 이 여행이 보이고 같이 수정할 수 있어요.</p>
        <form className="row gap" onSubmit={invite}>
          <input className="grow" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="family@gmail.com" />
          <button className="btn primary" disabled={busy || !email.trim()}>초대</button>
        </form>
        <button className="btn outline block" onClick={share}>💬 초대 메시지 보내기 (카카오톡·문자)</button>
        {msg && <p className="hint">{msg}</p>}
        {store.mode === 'local' && <p className="hint">체험 모드에서는 초대 목록만 저장되고 실제 공유는 되지 않아요. Firebase를 연결하면 실시간으로 함께 쓸 수 있어요.</p>}
      </section>
    </div>
  );
}
