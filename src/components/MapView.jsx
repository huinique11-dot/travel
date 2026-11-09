import { useEffect, useMemo, useState } from 'react';
import { AdvancedMarker, InfoWindow, Map, useMap } from '@vis.gl/react-google-maps';
import { hasMaps, MAP_ID } from '../lib/config.js';
import { dayColor, dayLabel, tripDays } from '../lib/format.js';
import { placeUrl, routeUrl } from '../lib/maps.js';
import { sortPlaces, WISH } from './Itinerary.jsx';

export default function MapView({ trip, places }) {
  const days = useMemo(() => tripDays(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // 각 장소에 Day 번호/색/순번 붙이기
  const decorated = useMemo(() => {
    const out = [];
    [...days, WISH].forEach((d, di) => {
      const list = sortPlaces(places.filter((p) => (d === WISH ? !days.includes(p.day) : p.day === d)));
      list.forEach((p, i) => out.push({ ...p, dayKey: d, color: d === WISH ? '#f59e0b' : dayColor(di), label: d === WISH ? '★' : String(i + 1) }));
    });
    return out;
  }, [places, days]);

  const shown = decorated.filter((p) => filter === 'all' || p.dayKey === filter);
  const withCoords = shown.filter((p) => p.lat != null && p.lng != null);
  const route = filter !== 'all' && filter !== WISH ? routeUrl(shown) : null;

  return (
    <div className="map-view">
      <div className="day-chips compact">
        <button className={`day-chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}><b>전체</b></button>
        {days.map((d, i) => (
          <button key={d} className={`day-chip ${filter === d ? 'on' : ''}`} style={filter === d ? { background: dayColor(i), borderColor: dayColor(i) } : { borderColor: dayColor(i) }} onClick={() => setFilter(d)}>
            <b>Day {i + 1}</b><small>{dayLabel(d)}</small>
          </button>
        ))}
        <button className={`day-chip ${filter === WISH ? 'on wish' : ''}`} onClick={() => setFilter(WISH)}><b>⭐ 후보</b></button>
      </div>

      {hasMaps ? (
        <div className="map-box">
          <Map
            mapId={MAP_ID}
            defaultCenter={{ lat: 37.5665, lng: 126.978 }}
            defaultZoom={11}
            gestureHandling="greedy"
            clickableIcons={false}
            mapTypeControl={false}
            streetViewControl={false}
            onClick={() => setSelected(null)}
          >
            {withCoords.map((p) => (
              <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} onClick={() => setSelected(p)} title={p.name}>
                <div className="marker" style={{ background: p.color }}>{p.label}</div>
              </AdvancedMarker>
            ))}
            {selected && selected.lat != null && (
              <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} pixelOffset={[0, -34]} onCloseClick={() => setSelected(null)}>
                <div className="info">
                  <b>{selected.name}</b>
                  {selected.time && <div>{selected.time}</div>}
                  {selected.memo && <div className="muted">{selected.memo}</div>}
                  <a href={placeUrl(selected)} target="_blank" rel="noreferrer">구글 지도에서 열기 ↗</a>
                </div>
              </InfoWindow>
            )}
            <FitBounds points={withCoords} />
          </Map>
        </div>
      ) : (
        <div className="card notice">
          <b>🗺️ 지도를 보려면 Google Maps API 키가 필요해요.</b>
          <p className="muted small">README의 설정 방법을 따라 키를 넣으면 이 자리에 일정별 색깔 핀이 표시돼요. 지금은 아래 링크로 구글 지도를 열 수 있어요.</p>
        </div>
      )}

      {route && <a className="btn outline block" href={route} target="_blank" rel="noreferrer">🧭 이 날 동선을 구글 지도 길찾기로 열기</a>}

      <ul className="map-list">
        {shown.map((p) => (
          <li key={p.id} className={selected?.id === p.id ? 'on' : ''}>
            <span className="marker small" style={{ background: p.color }}>{p.label}</span>
            <button className="link grow" onClick={() => setSelected(p)}>
              <b>{p.name}</b>
              <small className="muted">{p.dayKey === WISH ? '날짜 미정' : dayLabel(p.dayKey)}{p.time ? ` · ${p.time}` : ''}{p.lat == null ? ' · 좌표 없음' : ''}</small>
            </button>
            <a href={placeUrl(p)} target="_blank" rel="noreferrer" className="small">열기 ↗</a>
          </li>
        ))}
        {shown.length === 0 && <li className="muted small">표시할 장소가 없어요. 일정 탭에서 장소를 추가해 보세요.</li>}
      </ul>
    </div>
  );
}

function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (!map || points.length === 0 || !window.google?.maps) return;
    if (points.length === 1) {
      map.setCenter({ lat: points[0].lat, lng: points[0].lng });
      map.setZoom(15);
      return;
    }
    const b = new window.google.maps.LatLngBounds();
    points.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(b, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}
