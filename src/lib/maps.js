// API 키 없이도 동작하는 구글 지도 링크들
export function placeUrl(p) {
  if (p.googleMapsUri) return p.googleMapsUri;
  const q = encodeURIComponent([p.name, p.address].filter(Boolean).join(' '));
  const base = `https://www.google.com/maps/search/?api=1&query=${q || `${p.lat},${p.lng}`}`;
  return p.googlePlaceId ? `${base}&query_place_id=${p.googlePlaceId}` : base;
}

function point(p) {
  if (p.lat != null && p.lng != null) return `${p.lat},${p.lng}`;
  return [p.name, p.address].filter(Boolean).join(' ');
}

// 하루 동선 길찾기 (출발 → 경유지 → 도착)
export function routeUrl(places) {
  const pts = places.filter((p) => p.name || p.lat != null);
  if (pts.length === 0) return null;
  if (pts.length === 1) return placeUrl(pts[0]);
  const enc = encodeURIComponent;
  const origin = pts[0];
  const dest = pts[pts.length - 1];
  const mids = pts.slice(1, -1).slice(0, 9);
  let url = `https://www.google.com/maps/dir/?api=1&origin=${enc(point(origin))}&destination=${enc(point(dest))}`;
  if (origin.googlePlaceId) url += `&origin_place_id=${origin.googlePlaceId}`;
  if (dest.googlePlaceId) url += `&destination_place_id=${dest.googlePlaceId}`;
  if (mids.length) url += `&waypoints=${enc(mids.map(point).join('|'))}`;
  return url;
}

export const searchUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
