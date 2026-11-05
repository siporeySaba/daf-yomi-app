// -------------------------------
// 💾 PROGRESS STORE
// Firestore format (לא לשנות – משתמשים קיימים):
// users/{uid}/progress/{masechet}_{daf}  →  { masechet, daf, status, timestamp }
// -------------------------------
import {
  collection, getDocs, doc, setDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebase.js";

const key = (masechet, daf) => `${masechet}_${daf}`;

export function createStore(uid, { demo = false } = {}) {
  // key → { masechet, daf, status, timestamp }
  const cache = new Map();
  let loaded = null;

  const ref = (masechet, daf) => doc(db, "users", uid, "progress", key(masechet, daf));

  async function load() {
    if (demo) return;
    const snap = await getDocs(collection(db, "users", uid, "progress"));
    snap.forEach(d => {
      const data = d.data();
      if (data && data.masechet && data.daf) cache.set(key(data.masechet, data.daf), data);
    });
  }

  return {
    ready() {
      if (!loaded) loaded = load().catch(err => { loaded = null; throw err; });
      return loaded;
    },

    status(masechet, daf) {
      return cache.get(key(masechet, daf))?.status || null;
    },

    all() {
      return [...cache.values()];
    },

    async set(masechet, daf, status) {
      const k = key(masechet, daf);
      const prev = cache.get(k);
      const data = { masechet, daf, status, timestamp: new Date().toISOString() };
      cache.set(k, data);
      try {
        if (!demo) await setDoc(ref(masechet, daf), data);
      } catch (err) {
        prev ? cache.set(k, prev) : cache.delete(k);
        throw err;
      }
    },

    async clear(masechet, daf) {
      const k = key(masechet, daf);
      const prev = cache.get(k);
      cache.delete(k);
      try {
        if (!demo) await deleteDoc(ref(masechet, daf));
      } catch (err) {
        if (prev) cache.set(k, prev);
        throw err;
      }
    },

    // status = "learned" | "skipped" | null (null = ביטול סימון)
    async setMany(masechet, dafs, status) {
      const prev = new Map(dafs.map(d => [d, cache.get(key(masechet, d))]));
      const timestamp = new Date().toISOString();
      for (const d of dafs) {
        if (status) cache.set(key(masechet, d), { masechet, daf: d, status, timestamp });
        else cache.delete(key(masechet, d));
      }
      try {
        if (!demo) {
          const batch = writeBatch(db);
          for (const d of dafs) {
            if (status) batch.set(ref(masechet, d), { masechet, daf: d, status, timestamp });
            else batch.delete(ref(masechet, d));
          }
          await batch.commit();
        }
      } catch (err) {
        for (const [d, p] of prev) p ? cache.set(key(masechet, d), p) : cache.delete(key(masechet, d));
        throw err;
      }
    },
  };
}
