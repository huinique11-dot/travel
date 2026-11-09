import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { hasMaps } from '../lib/config.js';
import { searchUrl } from '../lib/maps.js';

// 구글 Places API (New) 자동완성. 선택하면 onPick({name, address, lat, lng, googlePlaceId, googleMapsUri})
export default function PlaceSearch({ onPick, bias }) {
  if (!hasMaps) return <ManualHint />;
  return <GooglePlaceSearch onPick={onPick} bias={bias} />;
}

function ManualHint() {
  return (
    <p className="hint">
      구글 지도 API 키를 설정하면 장소 이름으로 검색해서 바로 추가할 수 있어요. 지금은 아래에 직접 입력해 주세요.
    </p>
  );
}

function GooglePlaceSearch({ onPick, bias }) {
  const places = useMapsLibrary('places');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const token = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!places || q.trim().length < 2) { setItems([]); return undefined; }
    const my = ++seq.current;
    const t = setTimeout(async () => {
      token.current ??= new places.AutocompleteSessionToken();
      setLoading(true);
      try {
        const req = { input: q, sessionToken: token.current, language: 'ko' };
        if (bias) req.locationBias = bias;
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        if (my === seq.current) { setItems(suggestions.filter((s) => s.placePrediction)); setErr(''); }
      } catch (e) {
        if (my === seq.current) { setItems([]); setErr('장소 검색에 실패했어요. API 키 설정(Places API New)을 확인해 주세요.'); console.error(e); }
      } finally {
        if (my === seq.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, places, bias]);

  const pick = async (s) => {
    const pred = s.placePrediction;
    setItems([]);
    setQ('');
    try {
      const place = pred.toPlace();
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'googleMapsURI'] });
      token.current = null; // 세션 종료
      onPick({
        name: place.displayName || pred.mainText?.text || pred.text.text,
        address: place.formattedAddress || pred.secondaryText?.text || '',
        lat: place.location?.lat() ?? null,
        lng: place.location?.lng() ?? null,
        googlePlaceId: place.id || pred.placeId,
        googleMapsUri: place.googleMapsURI || '',
      });
    } catch (e) {
      console.error(e);
      onPick({ name: pred.mainText?.text || pred.text.text, address: pred.secondaryText?.text || '', googlePlaceId: pred.placeId });
    }
  };

  return (
    <div className="place-search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 구글 지도에서 장소 검색 (예: 도톤보리, 오사카성)"
        autoFocus
      />
      {loading && <span className="search-loading">검색 중…</span>}
      {items.length > 0 && (
        <ul className="suggestions">
          {items.map((s) => (
            <li key={s.placePrediction.placeId}>
              <button type="button" onClick={() => pick(s)}>
                <b>{s.placePrediction.mainText?.text || s.placePrediction.text.text}</b>
                <small>{s.placePrediction.secondaryText?.text}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="error small">{err} <a href={searchUrl(q)} target="_blank" rel="noreferrer">구글 지도에서 찾기</a></p>}
    </div>
  );
}
