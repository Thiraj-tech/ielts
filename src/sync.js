// Firestore sync: one document per user (users/{uid}) holding the whole planner state.
// The newest copy (by updatedAt) wins; localStorage stays as an offline cache.
import { firebaseConfig } from './firebase-config.js';
import { normalize, onSave } from './store.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

export const syncEnabled = Boolean(firebaseConfig.apiKey);

let status = { state: syncEnabled ? 'loading' : 'disabled', user: null, error: '' };
let fb = null; // { A, F, auth, ref }
let pushTimer = null;

export const syncStatus = () => status;

export async function initSync({ getState, applyRemote, onChange }) {
  if (!syncEnabled) return;
  const setStatus = (patch) => { status = { ...status, ...patch }; onChange(); };

  try {
    const [{ initializeApp }, A, F] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = A.getAuth(app);
    const db = F.getFirestore(app);
    fb = { A, F, auth, ref: null };
    let unsubscribe = null;

    A.onAuthStateChanged(auth, (user) => {
      unsubscribe?.();
      unsubscribe = null;
      fb.ref = user ? F.doc(db, 'users', user.uid) : null;
      if (!user) return setStatus({ state: 'signed-out', user: null, error: '' });

      setStatus({ state: 'syncing', user: { name: user.displayName, email: user.email }, error: '' });
      unsubscribe = F.onSnapshot(fb.ref, (snap) => {
        const local = getState();
        const remoteAt = snap.exists() ? snap.data().updatedAt || 0 : 0;
        if (remoteAt > local.updatedAt) {
          try {
            applyRemote(normalize(JSON.parse(snap.data().data)));
          } catch (err) {
            return setStatus({ state: 'error', error: `Cloud copy unreadable: ${err.message}` });
          }
        } else if (remoteAt < local.updatedAt || !snap.exists()) {
          push(local, 0);
        }
        if (!snap.metadata.hasPendingWrites) setStatus({ state: 'synced', error: '' });
      }, (err) => setStatus({ state: 'error', error: err.message }));
    });

    onSave((s) => push(s));

    function push(s, delay = 800) {
      const ref = fb.ref;
      if (!ref) return;
      clearTimeout(pushTimer);
      setStatus({ state: 'syncing' });
      pushTimer = setTimeout(() => {
        F.setDoc(ref, { data: JSON.stringify(s), updatedAt: s.updatedAt })
          .catch((err) => setStatus({ state: 'error', error: err.message }));
      }, delay);
    }
  } catch (err) {
    setStatus({ state: 'error', error: `Could not load Firebase: ${err.message}` });
  }
}

export async function signIn() {
  if (!fb) return;
  try {
    await fb.A.signInWithPopup(fb.auth, new fb.A.GoogleAuthProvider());
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      status = { ...status, state: 'error', error: err.message };
      throw err;
    }
  }
}

export function signOut() {
  return fb?.A.signOut(fb.auth);
}
