import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut as fbSignOut,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig } from '../lib/config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// 오프라인 캐시: 해외에서 데이터가 끊겨도 기록하고, 연결되면 자동 동기화
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const SUBS = ['places', 'expenses', 'notes'];
const toUser = (u) => u && {
  uid: u.uid,
  email: (u.email || '').toLowerCase(),
  name: u.displayName || (u.email || '').split('@')[0],
  photo: u.photoURL || '',
};
const withId = (d) => ({ id: d.id, ...d.data() });

export const firebaseStore = {
  mode: 'firebase',

  onAuth(cb) {
    return onAuthStateChanged(auth, (u) => cb(toUser(u)));
  },
  async signIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) {
        await signInWithRedirect(auth, provider);
      } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        throw e;
      }
    }
  },
  signOut() {
    return fbSignOut(auth);
  },

  subscribeTrips(user, cb, onError) {
    const q = query(collection(db, 'trips'), where('memberEmails', 'array-contains', user.email));
    return onSnapshot(q, (snap) => {
      const trips = snap.docs.map(withId);
      // 초대받은 사람이 처음 로그인하면 이름/사진을 멤버 목록에 채워 넣음
      trips.forEach((t) => {
        const me = (t.members || []).find((m) => m.email === user.email);
        if (!me || (!me.name && user.name)) {
          const members = (t.members || []).filter((m) => m.email !== user.email);
          members.push({ email: user.email, name: user.name, photo: user.photo });
          updateDoc(doc(db, 'trips', t.id), { members }).catch(() => {});
        }
      });
      cb(trips);
    }, onError);
  },

  subscribeTrip(tripId, cb, onError) {
    return onSnapshot(doc(db, 'trips', tripId), (d) => cb(d.exists() ? withId(d) : null), onError);
  },

  async createTrip(user, data) {
    const ref = await addDoc(collection(db, 'trips'), {
      ...data,
      ownerUid: user.uid,
      ownerEmail: user.email,
      memberEmails: [user.email],
      members: [{ email: user.email, name: user.name, photo: user.photo }],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },
  updateTrip(tripId, patch) {
    return updateDoc(doc(db, 'trips', tripId), patch);
  },
  async deleteTrip(tripId) {
    for (const sub of SUBS) {
      const snap = await getDocs(collection(db, 'trips', tripId, sub));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'trips', tripId));
  },

  inviteMember(trip, email) {
    email = email.trim().toLowerCase();
    if ((trip.memberEmails || []).includes(email)) return Promise.resolve();
    return updateDoc(doc(db, 'trips', trip.id), {
      memberEmails: [...(trip.memberEmails || []), email],
      members: [...(trip.members || []), { email, name: '', photo: '' }],
    });
  },
  removeMember(trip, email) {
    return updateDoc(doc(db, 'trips', trip.id), {
      memberEmails: (trip.memberEmails || []).filter((e) => e !== email),
      members: (trip.members || []).filter((m) => m.email !== email),
    });
  },

  subscribeItems(tripId, sub, cb, onError) {
    return onSnapshot(collection(db, 'trips', tripId, sub), (snap) => cb(snap.docs.map(withId)), onError);
  },
  async addItem(tripId, sub, data, user) {
    const ref = await addDoc(collection(db, 'trips', tripId, sub), {
      ...data, createdBy: user?.email || '', createdAt: serverTimestamp(),
    });
    return ref.id;
  },
  setItem(tripId, sub, id, data, user) {
    return setDoc(doc(db, 'trips', tripId, sub, id), { ...data, updatedBy: user?.email || '', updatedAt: serverTimestamp() }, { merge: true });
  },
  updateItem(tripId, sub, id, patch) {
    return updateDoc(doc(db, 'trips', tripId, sub, id), patch);
  },
  deleteItem(tripId, sub, id) {
    return deleteDoc(doc(db, 'trips', tripId, sub, id));
  },
};
