const Garden = {
    garden: null,
    achievements: null,
    lastUnlockedId: null,

    TREE_THRESHOLDS: [
        { count: 1, stage: 'seed', name: '种子' },
        { count: 5, stage: 'sprout', name: '幼苗' },
        { count: 25, stage: 'small', name: '小树' },
        { count: 100, stage: 'mature', name: '成树' },
        { count: 365, stage: 'full', name: '茂盛树' }
    ],

    SPECIAL_TREES: [
        { id: 'cherry', name: '樱花树', requirement: 'streak_30', icon: 'flower' },
        { id: 'autumn', name: '枫树', requirement: 'streak_100', icon: 'flag' },
        { id: 'ancient', name: '千年古橡', requirement: 'tomatoes_1000', icon: 'crown' },
        { id: 'moon', name: '月树', requirement: 'hidden', icon: 'moon' }
    ],

    init() {
        this.garden = Storage.getGarden();
        this.achievements = Storage.getAchievements();
        Achievements.init();
    },

    checkTreeUnlocks() {
        const totalTomatoes = this.garden.totalTomatoes;
        let newTreeUnlocked = false;

        this.TREE_THRESHOLDS.forEach(threshold => {
            const existingTree = this.garden.unlockedTrees.find(t => t.type === threshold.stage);

            if (totalTomatoes >= threshold.count && !existingTree) {
                this.garden.unlockedTrees.push({
                    id: Date.now().toString() + '_' + threshold.stage,
                    type: threshold.stage,
                    name: threshold.name,
                    unlockedAt: Date.now(),
                    tomatoesAtUnlock: totalTomatoes
                });
                newTreeUnlocked = true;
            }
        });

        if (newTreeUnlocked) {
            Storage.saveGarden(this.garden);
            this.render();
            App.updateMiniGarden();
        }
    },

    checkStreakAchievements() {
        const streak = this.garden.currentStreak;

        if (streak >= 7) {
            this.unlockAchievement('week_warrior');
        }
        if (streak >= 30) {
            this.unlockAchievement('month_master');
            this.unlockSpecialTree('cherry');
        }
        if (streak >= 100) {
            this.unlockAchievement('autumn_maple');
            this.unlockSpecialTree('autumn');
        }
        if (streak >= 365) {
            this.unlockAchievement('year_champion');
        }

        this.checkTreeAchievements();
    },

    checkTreeAchievements() {
        const treeCount = this.garden.unlockedTrees.length;

        if (treeCount >= 1) this.unlockAchievement('first_tree');
        if (treeCount >= 5) this.unlockAchievement('sapling');
        if (treeCount >= 10) this.unlockAchievement('small_tree');
        if (treeCount >= 25) this.unlockAchievement('mature_tree');
        if (treeCount >= 50) this.unlockAchievement('ancient_oak');
        if (treeCount >= 5) this.unlockAchievement('tree_planter');
        if (treeCount >= 25) this.unlockAchievement('forest_keeper');
    },

    checkTimeBasedAchievements() {
        const hour = new Date().getHours();

        if (hour < 6) {
            this.unlockAchievement('early_bird');
        }
        if (hour >= 23) {
            this.unlockAchievement('night_owl');
        }
    },

    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = Date.now();
            this.lastUnlockedId = id;
            Storage.saveAchievements(this.achievements);
            this.renderAchievements();

            // 显示右上角成就解锁弹窗
            Achievements.showAchievementNotification(achievement);
            Achievements.playUnlockSound();
            App.renderSidebarAchievements(id);

            // 3秒后清除lastUnlockedId
            setTimeout(() => {
                this.lastUnlockedId = null;
            }, 3000);
        }
    },

    unlockSpecialTree(id) {
        const specialTree = this.SPECIAL_TREES.find(t => t.id === id);
        const existingTree = this.garden.unlockedTrees.find(t => t.type === id);

        if (specialTree && !existingTree) {
            this.garden.unlockedTrees.push({
                id: Date.now().toString() + '_' + id,
                type: id,
                name: specialTree.name,
                unlockedAt: Date.now(),
                special: true
            });
            Storage.saveGarden(this.garden);
            this.render();
            App.showCelebration(`新树种解锁: ${specialTree.name}`);
        }
    },

    render() {
        this.renderTrees();
        this.renderStats();
        this.renderAchievements();
    },

    renderTrees() {
        const container = document.getElementById('treesGrid');
        if (!container) return;

        if (this.garden.unlockedTrees.length === 0) {
            container.innerHTML = `
                <div class="empty-garden">
                    <p>开始专注，播下你的第一颗种子</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.garden.unlockedTrees.map(tree => `
            <div class="tree-item" data-tree-id="${tree.id}">
                <div class="tree-visual">
                    ${this.getTreeSvg(tree)}
                </div>
                <div class="tree-info">
                    <span class="tree-info-name">${tree.name}</span>
                    <span class="tree-info-date">${new Date(tree.unlockedAt).toLocaleDateString('zh-CN')}</span>
                </div>
            </div>
        `).join('');
    },

    getTreeSvg(tree) {
        if (tree.special) {
            if (tree.type === 'cherry') {
                return `<div class="tree-cherry"></div>`;
            }
            if (tree.type === 'autumn') {
                return `<div class="tree-mature" style="--tree-color: #E6A66A;"></div>`;
            }
            if (tree.type === 'ancient') {
                return `<div class="tree-full" style="--tree-color: #4A7C59;"></div>`;
            }
            if (tree.type === 'moon') {
                return `<div class="tree-mature" style="--tree-color: #9B8ACB;"></div>`;
            }
        }

        const stages = {
            seed: 'tree-seed',
            sprout: 'tree-sprout',
            small: 'tree-small',
            mature: 'tree-mature',
            full: 'tree-full'
        };

        return `<div class="${stages[tree.type] || 'tree-seed'}"></div>`;
    },

    renderStats() {
        const totalTreesEl = document.getElementById('totalTrees');
        const totalTomatoesEl = document.getElementById('totalTomatoes');
        const longestStreakEl = document.getElementById('longestStreak');

        if (totalTreesEl) totalTreesEl.textContent = this.garden.unlockedTrees.length;
        if (totalTomatoesEl) totalTomatoesEl.textContent = this.garden.totalTomatoes;
        if (longestStreakEl) longestStreakEl.textContent = this.garden.longestStreak;
    },

    renderAchievements() {
        const container = document.getElementById('achievementsGrid');
        if (!container) return;

        container.innerHTML = this.achievements.map(achievement => {
            const unlocked = !!achievement.unlockedAt;
            const justUnlocked = this.lastUnlockedId === achievement.id;
            return `
                <div class="achievement-item ${unlocked ? '' : 'locked'} ${justUnlocked ? 'just-unlocked' : ''}" title="${achievement.description}">
                    <div class="achievement-icon ${unlocked ? 'unlocked' : 'locked'}">
                        <i data-lucide="${achievement.icon}"></i>
                    </div>
                    <span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-desc">${achievement.description}</span>
                </div>
            `;
        }).join('');

        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    getNextTreeInfo() {
        const totalTomatoes = this.garden.totalTomatoes;

        for (let i = this.TREE_THRESHOLDS.length - 1; i >= 0; i--) {
            if (totalTomatoes >= this.TREE_THRESHOLDS[i].count) {
                if (i < this.TREE_THRESHOLDS.length - 1) {
                    const next = this.TREE_THRESHOLDS[i + 1];
                    return {
                        name: next.name,
                        needed: next.count - totalTomatoes,
                        stage: next.stage
                    };
                }
                return null;
            }
        }

        const first = this.TREE_THRESHOLDS[0];
        return {
            name: first.name,
            needed: first.count - totalTomatoes,
            stage: first.stage
        };
    }
};

const Achievements = {
    audioContext: null,

    // 直接使用 Garden.achievements
    get achievements() {
        return Garden.achievements;
    },

    checkAchievements() {
        const garden = Storage.getGarden();

        if (garden.totalTomatoes >= 1) {
            this.unlock('first_focus');
        }

        const hour = new Date().getHours();
        if (hour < 6) {
            this.unlock('early_bird');
        }
        if (hour >= 23) {
            this.unlock('night_owl');
        }

        Garden.checkTreeAchievements();
    },

    unlock(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = Date.now();
            Storage.saveAchievements(this.achievements);

            // 显示右上角成就解锁弹窗
            this.showAchievementNotification(achievement);
            // 播放解锁音效
            this.playUnlockSound();
            // 更新侧边栏成就显示
            App.renderSidebarAchievements(id);
        }
    },

    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        const nameEl = document.getElementById('achievementNotifName');

        if (!notification || !nameEl) return;

        nameEl.textContent = achievement.name;

        // 显示通知
        notification.classList.remove('hide');
        notification.classList.add('show');

        // 创建粒子效果
        this.createAchievementParticles(notification);

        // 3秒后隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');

            setTimeout(() => {
                notification.classList.remove('hide');
            }, 500);
        }, 3000);
    },

    createAchievementParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'];

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${centerX}px;
                top: ${centerY}px;
                pointer-events: none;
                z-index: 3001;
            `;

            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / 12;
            const distance = 60 + Math.random() * 40;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;

            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0)`, opacity: 0 }
            ], {
                duration: 800 + Math.random() * 400,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }).onfinish = () => particle.remove();
        }
    },

    playUnlockSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // 和 Gallery.playUnlockSound 类似的音效，但稍有不同
            const notes = [523.25, 659.25, 783.99, 1046.50];

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.1);

                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.6);
            });

            // 添加一个高音装饰音
            const shimmer = ctx.createOscillator();
            const shimmerGain = ctx.createGain();
            shimmer.type = 'triangle';
            shimmer.frequency.setValueAtTime(2093, now + 0.35);
            shimmerGain.gain.setValueAtTime(0, now + 0.35);
            shimmerGain.gain.linearRampToValueAtTime(0.1, now + 0.45);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            shimmer.connect(shimmerGain);
            shimmerGain.connect(ctx.destination);
            shimmer.start(now + 0.35);
            shimmer.stop(now + 0.9);

        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }
};
