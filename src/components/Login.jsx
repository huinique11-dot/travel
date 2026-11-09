import { useState } from 'react';
import { store } from '../store/index.js';

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const local = store.mode === 'local';

  const signIn = async () => {
    setBusy(true);
    setError('');
    try { await store.signIn(); } catch (e) { setError(e.message || '로그인에 실패했어요.'); } finally { setBusy(false); }
  };

  return (
    <div className="login">
      <div className="login-card">
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1>우리 가족 여행</h1>
        <p className="muted">여행 일정, 가볼 곳, 쓴 돈, 그날의 기록까지<br />가족과 함께 실시간으로 작성해요.</p>
        <ul className="features">
          <li>📍 구글 지도로 장소 검색 · 동선 보기</li>
          <li>🗓️ 날짜별 일정과 메모</li>
          <li>💰 날짜·장소별 지출 기록과 정산</li>
          <li>👨‍👩‍👧 가족 초대해서 같이 쓰기</li>
        </ul>
        <button className="btn primary big" onClick={signIn} disabled={busy}>
          {local ? '체험 모드로 시작하기' : (<><GoogleIcon /> Google 계정으로 시작하기</>)}
        </button>
        {local && <p className="hint">Firebase 설정 전이라 이 기기에만 저장되는 체험 모드예요. 가족 공유는 README의 설정을 마치면 켜져요.</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
