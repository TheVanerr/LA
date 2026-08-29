(function () {
  const STORAGE_KEY = 'loveapp_session_id';
  let db = null;

  function getConfig() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || !cfg.projectId) return null;
    if (cfg.apiKey.includes('BURAYA') || cfg.projectId.includes('BURAYA')) return null;
    return cfg;
  }

  function getSessionId() {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  function getDb() {
    if (db) return db;
    const cfg = getConfig();
    if (!cfg || typeof firebase === 'undefined') return null;
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    db = firebase.firestore();
    return db;
  }

  async function track(fields) {
    const firestore = getDb();
    if (!firestore) return;

    const payload = {
      session_id: getSessionId(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      user_agent: navigator.userAgent,
      ...fields,
    };

    try {
      await firestore
        .collection('date_responses')
        .doc(getSessionId())
        .set(payload, { merge: true });
    } catch (err) {
      console.warn('[LoveTrack]', err);
    }
  }

  window.LoveTrack = {
    track,
    init() {
      track({ started_at: new Date().toISOString() });
    },
  };
})();
