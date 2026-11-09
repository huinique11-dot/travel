import { useState } from 'react';
import Modal from './Modal.jsx';
import PlaceSearch from './PlaceSearch.jsx';
import { store } from '../store/index.js';
import { dayLabel } from '../lib/format.js';
import { placeUrl, searchUrl } from '../lib/maps.js';
import { WISH } from './Itinerary.jsx';

export default function PlaceModal({ trip, days, place, defaultDay, nextOrder, linkedCount, user, onClose }) {
  const [f, setF] = useState(() => ({
    name: place?.name || '',
    address: place?.address || '',
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    googlePlaceId: place?.googlePlaceId || '',
    googleMapsUri: place?.googleMapsUri || '',
    day: place ? (days.includes(place.day) ? place.day : WISH) : defaultDay,
    time: place?.time || '',
    memo: place?.memo || '',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    setBusy(true);
    const data = { ...f, name: f.name.trim(), address: f.address.trim(), memo: f.memo.trim(), day: f.day === WISH ? '' : f.day };
    try {
      if (place) {
        const patch = { ...data };
        if ((place.day || WISH) !== (data.day || WISH)) patch.order = nextOrder(data.day);
        await store.updateItem(trip.id, 'places', place.id, patch);
      } else {
        await store.addItem(trip.id, 'places', { ...data, order: nextOrder(data.day) }, user);
      }
      onClose();
    } finally { setBusy(false); }
  };

  const remove = async () => {
    const msg = linkedCount > 0 ? `'${place.name}'을(를) 삭제할까요? 연결된 지출 ${linkedCount}건은 '기타 지출'로 남아요.` : `'${place.name}'을(를) 삭제할까요?`;
    if (!window.confirm(msg)) return;
    await store.deleteItem(trip.id, 'places', place.id);
    onClose();
  };

  return (
    <Modal
      title={place ? '장소 수정' : '장소 추가'}
      onClose={onClose}
      footer={(
        <>
          {place && <button type="button" className="btn danger ghost" onClick={remove}>삭제</button>}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>취소</button>
          <button type="submit" form="place-form" className="btn primary" disabled={busy || !f.name.trim()}>{place ? '저장' : '추가'}</button>
        </>
      )}
    >
      <form id="place-form" className="form" onSubmit={save}>
        <PlaceSearch onPick={(p) => setF((prev) => ({ ...prev, ...p }))} />
        {f.googlePlaceId && (
          <div className="picked">
            <span>✅ 구글 지도 장소가 연결됐어요</span>
            <a href={placeUrl(f)} target="_blank" rel="noreferrer">지도에서 보기</a>
          </div>
        )}
        <label>장소 이름 *
          <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} placeholder="예) 이치란 라멘 도톤보리점" required />
        </label>
        <label>주소
          <input value={f.address} onChange={set('address')} placeholder="선택" />
        </label>
        {!f.googlePlaceId && f.name.trim() && (
          <a className="small" href={searchUrl(`${f.name} ${f.address}`)} target="_blank" rel="noreferrer">구글 지도에서 '{f.name}' 확인하기 ↗</a>
        )}
        <div className="grid2">
          <label>날짜
            <select value={f.day} onChange={set('day')}>
              {days.map((d, i) => <option key={d} value={d}>Day {i + 1} · {dayLabel(d)}</option>)}
              <option value={WISH}>⭐ 가고 싶은 곳 (날짜 미정)</option>
            </select>
          </label>
          <label>시간
            <input type="time" value={f.time} onChange={set('time')} />
          </label>
        </div>
        <label>메모
          <textarea rows={3} value={f.memo} onChange={set('memo')} placeholder="예약 번호, 추천 메뉴, 영업시간, 주의할 점 등" />
        </label>
      </form>
    </Modal>
  );
}
