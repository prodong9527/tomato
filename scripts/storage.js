const Storage = {
    KEYS: {
        SETTINGS: 'focusgrove_settings',
        TODOS: 'focusgrove_todos',
        STATS: 'focusgrove_stats',
        GARDEN: 'focusgrove_garden',
        ACHIEVEMENTS: 'focusgrove_achievements',
        SESSIONS: 'focusgrove_sessions',
        GALLERY: 'focusgrove_gallery'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn(`Error reading ${key} from storage:`, e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`Error writing ${key} to storage:`, e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },

    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            return false;
        }
    },

    getSettings() {
        const defaults = {
            focusDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            longBreakInterval: 4,
            soundEnabled: true,
            notificationsEnabled: true
        };
        const stored = this.get(this.KEYS.SETTINGS);
        return { ...defaults, ...stored };
    },

    saveSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    getTodos() {
        return this.get(this.KEYS.TODOS) || [];
    },

    saveTodos(todos) {
        return this.set(this.KEYS.TODOS, todos);
    },

    getStats() {
        return this.get(this.KEYS.STATS) || { dailyStats: {} };
    },

    saveStats(stats) {
        return this.set(this.KEYS.STATS, stats);
    },

    getGarden() {
        const defaults = {
            unlockedTrees: [],
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            totalTomatoes: 0
        };
        const stored = this.get(this.KEYS.GARDEN);
        return { ...defaults, ...stored };
    },

    saveGarden(garden) {
        return this.set(this.KEYS.GARDEN, garden);
    },

    getAchievements() {
        const defaults = [
            { id: 'first_focus', name: '初次专注', description: '完成第一个番茄', icon: 'play', unlockedAt: null },
            { id: 'early_bird', name: '早起鸟', description: '早上6点前开始专注', icon: 'sunrise', unlockedAt: null },
            { id: 'night_owl', name: '夜猫子', description: '晚上11点后完成专注', icon: 'moon', unlockedAt: null },
            { id: 'week_warrior', name: '周战士', description: '连续7天打卡', icon: 'calendar', unlockedAt: null },
            { id: 'month_master', name: '月度大师', description: '连续30天打卡', icon: 'award', unlockedAt: null },
            { id: 'year_champion', name: '年度冠军', description: '连续365天打卡', icon: 'trophy', unlockedAt: null },
            { id: 'tree_planter', name: '植树人', description: '种植5棵树', icon: 'tree-deciduous', unlockedAt: null },
            { id: 'forest_keeper', name: '森林守护者', description: '拥有完整森林', icon: 'shield', unlockedAt: null },
            { id: 'first_tree', name: '第一棵树', description: '累计完成1个番茄', icon: 'sprout', unlockedAt: null },
            { id: 'sapling', name: '幼苗', description: '累计完成5个番茄', icon: 'leaf', unlockedAt: null },
            { id: 'small_tree', name: '小树', description: '累计完成25个番茄', icon: 'tree-pine', unlockedAt: null },
            { id: 'mature_tree', name: '成树', description: '累计完成100个番茄', icon: 'tree-deciduous', unlockedAt: null },
            { id: 'ancient_oak', name: '千年古橡', description: '累计完成365个番茄', icon: 'crown', unlockedAt: null },
            { id: 'cherry_blossom', name: '樱花树', description: '连续30天解锁特殊树种', icon: 'flower', unlockedAt: null },
            { id: 'autumn_maple', name: '枫树', description: '连续100天解锁特殊树种', icon: 'flag', unlockedAt: null }
        ];
        const stored = this.get(this.KEYS.ACHIEVEMENTS);
        if (!stored) return defaults;

        const storedIds = stored.map(a => a.id);
        defaults.forEach(def => {
            if (!storedIds.includes(def.id)) {
                stored.push(def);
            }
        });
        return stored;
    },

    saveAchievements(achievements) {
        return this.set(this.KEYS.ACHIEVEMENTS, achievements);
    },

    getSessions() {
        return this.get(this.KEYS.SESSIONS) || [];
    },

    saveSessions(sessions) {
        return this.set(this.KEYS.SESSIONS, sessions);
    },

    exportData() {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            settings: this.getSettings(),
            todos: this.getTodos(),
            stats: this.getStats(),
            garden: this.getGarden(),
            achievements: this.getAchievements(),
            sessions: this.getSessions()
        };
    },

    importData(data) {
        try {
            if (data.settings) this.saveSettings(data.settings);
            if (data.todos) this.saveTodos(data.todos);
            if (data.stats) this.saveStats(data.stats);
            if (data.garden) this.saveGarden(data.garden);
            if (data.achievements) this.saveAchievements(data.achievements);
            if (data.sessions) this.saveSessions(data.sessions);
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    overwriteSettings(settings) {
        this.set(this.KEYS.SETTINGS, settings);
    },

    overwriteTodos(todos) {
        this.set(this.KEYS.TODOS, todos);
    },

    overwriteStats(stats) {
        this.set(this.KEYS.STATS, stats);
    },

    overwriteGarden(garden) {
        this.set(this.KEYS.GARDEN, garden);
    },

    overwriteAchievements(achievements) {
        this.set(this.KEYS.ACHIEVEMENTS, achievements);
    },

    overwriteSessions(sessions) {
        this.set(this.KEYS.SESSIONS, sessions);
    },

    async saveToCloud(collection) {
        if (typeof CloudStore === 'undefined') return false;
        let data;
        switch (collection) {
            case 'settings': data = this.getSettings(); break;
            case 'todos': data = this.getTodos(); break;
            case 'stats': data = this.getStats(); break;
            case 'garden': data = this.getGarden(); break;
            case 'achievements': data = this.getAchievements(); break;
            case 'sessions': data = this.getSessions(); break;
            default: return false;
        }
        return await CloudStore.save(collection, data);
    },

    async loadFromCloud(collection) {
        if (typeof CloudStore === 'undefined') return null;
        return await CloudStore.load(collection);
    }
};
