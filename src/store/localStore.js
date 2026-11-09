// 체험 모드: Firebase 설정이 없을 때 브라우저(localStorage)에만 저장
const KEY = 'family-trip-demo-v1';
const USER_KEY = 'family-trip-demo-user';
const listeners = new Set();
const authListeners = new Set();

const DEMO_USER = { uid: 'demo', email: 'me@family.local', name: '나', photo: '' };

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { trips: {}, sub: {} };
  } catch {
    return { trips: {}, sub: {} };
  }
}
let data = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 저장 공간 부족 등 */ }
  listeners.forEach((fn) => fn());
}
window.addEventListener('storage', (e) => {
  if (e.key === KEY) { data = load(); listeners.forEach((fn) => fn()); }
});

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => Date.now();
function watch(fn) {
  listeners.add(fn);
  fn();
  return () => listeners.delete(fn);
}
const subOf = (tripId, sub) => {
  data.sub[tripId] ??= {};
  data.sub[tripId][sub] ??= {};
  return data.sub[tripId][sub];
};
const currentUser = () => {
  try { return localStorage.getItem(USER_KEY) ? DEMO_USER : null; } catch { return DEMO_USER; }
};

export const localStore = {
  mode: 'local',

  onAuth(cb) {
    const fn = () => cb(currentUser());
    authListeners.add(fn);
    fn();
    return () => authListeners.delete(fn);
  },
  async signIn() {
    try { localStorage.setItem(USER_KEY, '1'); } catch { /* ignore */ }
    authListeners.forEach((fn) => fn());
  },
  async signOut() {
    try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
    authListeners.forEach((fn) => fn());
  },

  subscribeTrips(user, cb) {
    return watch(() => cb(Object.values(data.trips).filter((t) => t.memberEmails.includes(user.email)).map((t) => ({ ...t }))));
  },
  subscribeTrip(tripId, cb) {
    return watch(() => cb(data.trips[tripId] ? { ...data.trips[tripId] } : null));
  },
  async createTrip(user, d) {
    const id = uid();
    data.trips[id] = {
      ...d, id, ownerUid: user.uid, ownerEmail: user.email,
      memberEmails: [user.email], members: [{ email: user.email, name: user.name, photo: '' }], createdAt: now(),
    };
    save();
    return id;
  },
  async updateTrip(tripId, patch) {
    Object.assign(data.trips[tripId], patch);
    save();
  },
  async deleteTrip(tripId) {
    delete data.trips[tripId];
    delete data.sub[tripId];
    save();
  },
  async inviteMember(trip, email) {
    email = email.trim().toLowerCase();
    const t = data.trips[trip.id];
    if (t.memberEmails.includes(email)) return;
    t.memberEmails = [...t.memberEmails, email];
    t.members = [...t.members, { email, name: '', photo: '' }];
    save();
  },
  async removeMember(trip, email) {
    const t = data.trips[trip.id];
    t.memberEmails = t.memberEmails.filter((e) => e !== email);
    t.members = t.members.filter((m) => m.email !== email);
    save();
  },

  subscribeItems(tripId, sub, cb) {
    return watch(() => cb(Object.values(data.sub[tripId]?.[sub] || {}).map((x) => ({ ...x }))));
  },
  async addItem(tripId, sub, d, user) {
    const id = uid();
    subOf(tripId, sub)[id] = { ...d, id, createdBy: user?.email || '', createdAt: now() };
    save();
    return id;
  },
  async setItem(tripId, sub, id, d, user) {
    const s = subOf(tripId, sub);
    s[id] = { ...(s[id] || {}), ...d, id, updatedBy: user?.email || '', updatedAt: now() };
    save();
  },
  async updateItem(tripId, sub, id, patch) {
    Object.assign(subOf(tripId, sub)[id], patch);
    save();
  },
  async deleteItem(tripId, sub, id) {
    delete subOf(tripId, sub)[id];
    save();
  },
};
