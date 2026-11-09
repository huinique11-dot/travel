import { useEffect, useState } from 'react';
import { hasFirebase } from '../lib/config.js';
import { localStore } from './localStore.js';

// Firebase 설정이 있으면 Firebase(가족 공유), 없으면 체험 모드(이 기기에만 저장)
export const store = hasFirebase ? (await import('./firebaseStore.js')).firebaseStore : localStore;

function useSubscription(subscribe, deps) {
  const [state, setState] = useState({ data: undefined, error: null });
  useEffect(() => {
    setState({ data: undefined, error: null });
    const unsub = subscribe(
      (data) => setState({ data, error: null }),
      (error) => setState({ data: null, error }),
    );
    return unsub || undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useAuth() {
  const [user, setUser] = useState(undefined);
  useEffect(() => store.onAuth(setUser), []);
  return user;
}
export const useTrips = (user) => useSubscription((ok, err) => store.subscribeTrips(user, ok, err), [user.email]);
export const useTrip = (tripId) => useSubscription((ok, err) => store.subscribeTrip(tripId, ok, err), [tripId]);
export const useItems = (tripId, sub) => useSubscription((ok, err) => store.subscribeItems(tripId, sub, ok, err), [tripId, sub]);
