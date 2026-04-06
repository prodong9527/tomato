const CloudStore = {
    initialized: false,
    userId: null,

    async init() {
        await FirebaseAuth.init();
        FirebaseAuth.onAuthChange(async (user) => {
            this.userId = user ? user.uid : null;
            if (user) {
                await this.loadAllData();
            }
        });
        this.initialized = true;
    },

    getUserDocPath(collection, docId = 'data') {
        if (!this.userId) return null;
        return `users/${this.userId}/${collection}/${docId}`;
    },

    async save(collection, data, docId = 'data') {
        if (!this.userId) {
            console.warn('User not authenticated, cannot save to cloud');
            return false;
        }
        try {
            const { doc, setDoc, db } = window.Firebase;
            const docRef = doc(db, this.getUserDocPath(collection, docId));
            const dataToSave = Array.isArray(data) ? { items: data } : data;
            await setDoc(docRef, dataToSave);
            return true;
        } catch (e) {
            console.error(`Error saving ${collection}:`, e);
            return false;
        }
    },

    async load(collection, docId = 'data') {
        if (!this.userId) return null;
        try {
            const { doc, getDoc, db } = window.Firebase;
            const docRef = doc(db, this.getUserDocPath(collection, docId));
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            const data = snap.data();
            return data.items !== undefined ? data.items : data;
        } catch (e) {
            console.error(`Error loading ${collection}:`, e);
            return null;
        }
    },

    async update(collection, data, docId = 'data') {
        if (!this.userId) return false;
        try {
            const { doc, updateDoc, db } = window.Firebase;
            const docRef = doc(db, this.getUserDocPath(collection, docId));
            await updateDoc(docRef, data);
            return true;
        } catch (e) {
            console.error(`Error updating ${collection}:`, e);
            return false;
        }
    },

    async loadAllData() {
        const [settings, todos, stats, garden, achievements, sessions] = await Promise.all([
            this.load('settings'),
            this.load('todos'),
            this.load('stats'),
            this.load('garden'),
            this.load('achievements'),
            this.load('sessions')
        ]);

        if (settings) Storage.overwriteSettings(settings);
        if (todos) Storage.overwriteTodos(todos);
        if (stats) Storage.overwriteStats(stats);
        if (garden) Storage.overwriteGarden(garden);
        if (achievements) Storage.overwriteAchievements(achievements);
        if (sessions) Storage.overwriteSessions(sessions);
    }
};

window.CloudStore = CloudStore;