const FirebaseAuth = {
    currentUser: null,
    initialized: false,
    listeners: [],

    init() {
        return new Promise((resolve) => {
            if (typeof window.Firebase === 'undefined') {
                window.addEventListener('firebaseReady', () => {
                    this.setupAuthListener();
                    resolve();
                }, { once: true });
            } else {
                this.setupAuthListener();
                resolve();
            }
        });
    },

    setupAuthListener() {
        const { onAuthStateChanged, auth } = window.Firebase;
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.notifyListeners();
        });
        this.initialized = true;
    },

    onAuthChange(callback) {
        this.listeners.push(callback);
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    },

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.currentUser));
    },

    async signIn(email, password) {
        const { signInWithEmailAndPassword, auth } = window.Firebase;
        const result = await signInWithEmailAndPassword(auth, email, password);
        this.currentUser = result.user;
        return result.user;
    },

    async signUp(email, password) {
        const { createUserWithEmailAndPassword, auth } = window.Firebase;
        const result = await createUserWithEmailAndPassword(auth, email, password);
        this.currentUser = result.user;
        return result.user;
    },

    async signOut() {
        const { signOut, auth } = window.Firebase;
        await signOut(auth);
        this.currentUser = null;
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }
};

window.FirebaseAuth = FirebaseAuth;