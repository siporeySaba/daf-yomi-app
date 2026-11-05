// -------------------------------
// 💾 PROGRESS STORE
// Firestore format (לא לשנות – משתמשים קיימים):
// users/{uid}/progress/{masechet}_{daf}  →  { masechet, daf, status, timestamp, note?, noteUpdated? }
// status יכול להיות חסר אם יש רק הערה.
// -------------------------------
import {
  collection, getDocs, doc, setDoc, deleteDoc, writeBatch, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebase.js";

const key = (masechet, daf) => `${masechet}_${daf}`;

export function createStore(uid, { demo = false } = {}) {
  // key → { masechet, daf, status?, timestamp?, note?, noteUpdated? }
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

  // מחזיר את הרשומה החדשה בזיכרון + הפעולה לביצוע ב-Firestore
  function applyStatus(masechet, daf, status, timestamp) {
    const k = key(masechet, daf);
    const prev = cache.get(k);
    if (status) {
      cache.set(k, { ...prev, masechet, daf, status, timestamp });
      return { op: "merge", data: { masechet, daf, status, timestamp } };
    }
    if (prev?.note) {
      // יש הערה – מוחקים רק את הסטטוס ומשאירים את ההערה
      const { status: _s, timestamp: _t, ...rest } = prev;
      cache.set(k, rest);
      return { op: "merge", data: { status: deleteField(), timestamp: deleteField() } };
    }
    cache.delete(k);
    return { op: "delete" };
  }

  function rollback(entries) {
    for (const [k, p] of entries) p ? cache.set(k, p) : cache.delete(k);
  }

  return {
    ready() {
      if (!loaded) loaded = load().catch(err => { loaded = null; throw err; });
      return loaded;
    },

    status(masechet, daf) {
      return cache.get(key(masechet, daf))?.status || null;
    },

    note(masechet, daf) {
      return cache.get(key(masechet, daf))?.note || "";
    },

    all() {
      return [...cache.values()];
    },

    // status = "learned" | "skipped" | null (null = ביטול סימון)
    async setStatus(masechet, daf, status) {
      const k = key(masechet, daf);
      const prev = cache.get(k);
      const action = applyStatus(masechet, daf, status, new Date().toISOString());
      try {
        if (demo) return;
        if (action.op === "delete") await deleteDoc(ref(masechet, daf));
        else await setDoc(ref(masechet, daf), action.data, { merge: true });
      } catch (err) {
        rollback([[k, prev]]);
        throw err;
      }
    },

    async setNote(masechet, daf, text) {
      const k = key(masechet, daf);
      const prev = cache.get(k);
      const note = (text || "").trim().slice(0, 500);
      let action;
      if (note) {
        const noteUpdated = new Date().toISOString();
        cache.set(k, { ...prev, masechet, daf, note, noteUpdated });
        action = { op: "merge", data: { masechet, daf, note, noteUpdated } };
      } else if (prev?.status) {
        const { note: _n, noteUpdated: _u, ...rest } = prev;
        cache.set(k, rest);
        action = { op: "merge", data: { note: deleteField(), noteUpdated: deleteField() } };
      } else {
        cache.delete(k);
        action = { op: "delete" };
      }
      try {
        if (demo) return;
        if (action.op === "delete") await deleteDoc(ref(masechet, daf));
        else await setDoc(ref(masechet, daf), action.data, { merge: true });
      } catch (err) {
        rollback([[k, prev]]);
        throw err;
      }
    },

    async setMany(masechet, dafs, status) {
      const prev = dafs.map(d => [key(masechet, d), cache.get(key(masechet, d))]);
      const timestamp = new Date().toISOString();
      const actions = dafs.map(d => [d, applyStatus(masechet, d, status, timestamp)]);
      try {
        if (demo) return;
        const batch = writeBatch(db);
        for (const [d, a] of actions) {
          if (a.op === "delete") batch.delete(ref(masechet, d));
          else batch.set(ref(masechet, d), a.data, { merge: true });
        }
        await batch.commit();
      } catch (err) {
        rollback(prev);
        throw err;
      }
    },
  };
}
