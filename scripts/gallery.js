const Gallery = {
    illustrations: [
        {
            id: 'forest_1',
            name: '森林秘境',
            file: '05dcbbba63502a21821a53fdfe6bd1d.jpg',
            requiredHours: 0,
            isFree: true,
            colors: {
                primary: '#5A3D2D',
                primaryLight: '#6A4D3D',
                secondary: '#C4A08A',
                accent: '#E8C87C',
                background: '#FAF7F3',
                surface: '#FFFFFF',
                textPrimary: '#3E2D1D',
                textSecondary: '#8A7A6A',
                success: '#8AAF75',
                warning: '#D4A636',
                tomato: '#C47B5C',
                shadowColor: 'rgba(90, 61, 45, 0.15)',
                ringColor: '#5A3D2D'
            }
        },
        {
            id: 'forest_2',
            name: '晨曦林间',
            file: '47de63eee6df76b3db441fbd2ebeec6.jpg',
            requiredHours: 5,
            isFree: false,
            colors: {
                primary: '#2E4A6A',
                primaryLight: '#3E5A7A',
                secondary: '#7AAFC4',
                accent: '#F0B87C',
                background: '#F3F7FA',
                surface: '#FFFFFF',
                textPrimary: '#2C3E4A',
                textSecondary: '#6A7A8A',
                success: '#5A9F75',
                warning: '#D4A656',
                tomato: '#D07B6C',
                shadowColor: 'rgba(46, 74, 106, 0.15)',
                ringColor: '#2E4A6A'
            }
        },
        {
            id: 'forest_3',
            name: '迷雾森林',
            file: '83f0fdc9b75bae26319b3024b14066a.jpg',
            requiredHours: 15,
            isFree: false,
            colors: {
                primary: '#4A3D6A',
                primaryLight: '#5A4D7A',
                secondary: '#A08FC8',
                accent: '#C89BE8',
                background: '#F7F5FA',
                surface: '#FFFFFF',
                textPrimary: '#3C2E4A',
                textSecondary: '#7A6A8A',
                success: '#8A7FC5',
                warning: '#C4A656',
                tomato: '#B07BCA',
                shadowColor: 'rgba(74, 61, 106, 0.15)',
                ringColor: '#4A3D6A'
            }
        },
        {
            id: 'forest_4',
            name: '幽深林径',
            file: 'c5475f10af034eefc9b006c6a1dd94a.jpg',
            requiredHours: 30,
            isFree: false,
            colors: {
                primary: '#3D4A5A',
                primaryLight: '#4D5A6A',
                secondary: '#8A9FB8',
                accent: '#F0C8A0',
                background: '#F5F7FA',
                surface: '#FFFFFF',
                textPrimary: '#2C3A4A',
                textSecondary: '#6A7A8A',
                success: '#6A9F85',
                warning: '#D4A656',
                tomato: '#C87B6C',
                shadowColor: 'rgba(61, 74, 90, 0.15)',
                ringColor: '#3D4A5A'
            }
        },
        {
            id: 'forest_5',
            name: '秘林深处',
            file: 'e7e1e0a6bc4e4e9e30ce6d6c1398bad.jpg',
            requiredHours: 50,
            isFree: false,
            colors: {
                primary: '#1D4A3D',
                primaryLight: '#2D5A4D',
                secondary: '#5A9A7A',
                accent: '#B8E8A8',
                background: '#F4FAF5',
                surface: '#FFFFFF',
                textPrimary: '#2C3E2D',
                textSecondary: '#6A8A7A',
                success: '#4A9F65',
                warning: '#C4A636',
                tomato: '#A07B5C',
                shadowColor: 'rgba(29, 74, 61, 0.15)',
                ringColor: '#1D4A3D'
            }
        }
    ],

    unlocked: [],
    currentSkin: null,
    totalFocusHours: 0,
    currentAnimationType: 0, // 0: flip, 1: energy, 2: particle

    init() {
        this.loadData();
        this.unlocked = [];
        this.applyCurrentSkin();
        this.render();
        this.renderStats();
        this.initDetailModal();
    },

    loadData() {
        const saved = Storage.get(Storage.KEYS.GALLERY);
        if (saved) {
            this.currentSkin = saved.currentSkin || null;
        } else {
            this.currentSkin = null;
        }
        this.totalFocusHours = this.calculateTotalFocusHours();
    },

    calculateTotalFocusHours() {
        const sessions = Storage.getSessions();
        let totalMinutes = 0;
        sessions.forEach(session => {
            if (session.type === 'focus' && session.completed) {
                totalMinutes += session.duration || 25;
            }
        });
        const todos = Storage.getTodos();
        todos.forEach(todo => {
            if (todo.completed && todo.focusTime) {
                totalMinutes += todo.focusTime;
            }
        });
        return Math.floor(totalMinutes / 60);
    },

    saveData() {
        Storage.set(Storage.KEYS.GALLERY, {
            unlocked: this.unlocked,
            currentSkin: this.currentSkin
        });
    },

    checkUnlocks() {
    },

    isUnlocked(id) {
        return this.unlocked.includes(id);
    },

    isAvailable(id) {
        const illustration = this.illustrations.find(i => i.id === id);
        if (!illustration) return false;
        if (illustration.isFree) return true;
        return this.totalFocusHours >= illustration.requiredHours;
    },

    getUnlockedCount() {
        return this.unlocked.length;
    },

    getTotalCount() {
        return this.illustrations.length;
    },

    render() {
        const container = document.getElementById('galleryGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="gallery-bg-decor">
                <div class="decor-line decor-line-1"></div>
                <div class="decor-line decor-line-2"></div>
                <div class="decor-diamond decor-diamond-1"></div>
                <div class="decor-diamond decor-diamond-2"></div>
            </div>
        ` + this.illustrations.map(illustration => {
            const unlocked = this.isUnlocked(illustration.id);
            const available = this.isAvailable(illustration.id);
            const isActive = this.currentSkin === illustration.id;
            const progress = this.getUnlockProgress(illustration.id);

            return `
                <div class="gallery-card ${unlocked ? 'unlocked' : ''} ${available && !unlocked ? 'available' : ''} ${isActive ? 'active' : ''}" data-id="${illustration.id}">
                    <div class="card-frame">
                        <div class="frame-corner frame-tl"></div>
                        <div class="frame-corner frame-tr"></div>
                        <div class="frame-corner frame-bl"></div>
                        <div class="frame-corner frame-br"></div>
                        <div class="frame-border"></div>
                    </div>
                    <div class="card-inner">
                        ${unlocked ? `
                            <div class="card-image-container">
                                <img src="插画/${illustration.file}" alt="${illustration.name}" class="card-image">
                                <div class="card-shine"></div>
                            </div>
                            <div class="card-overlay">
                                <div class="card-name-plate">
                                    <span class="card-name">${illustration.name}</span>
                                </div>
                                ${isActive ? `
                                    <div class="card-status-badge active">
                                        <span>使用中</span>
                                    </div>
                                ` : `
                                    <div class="card-action-hint">点击装备</div>
                                `}
                            </div>
                            ${isActive ? `
                                <div class="card-active-glow"></div>
                                <div class="card-active-indicator">
                                    <div class="indicator-corner tl"></div>
                                    <div class="indicator-corner tr"></div>
                                    <div class="indicator-corner bl"></div>
                                    <div class="indicator-corner br"></div>
                                </div>
                            ` : ''}
                        ` : available ? `
                            <div class="card-image-container locked">
                                <img src="插画/${illustration.file}" alt="${illustration.name}" class="card-image grayscale">
                                <div class="card-lock-overlay">
                                    <div class="lock-icon-container">
                                        <svg class="lock-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L9 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H15L12 2Z" stroke="currentColor" stroke-width="1.5"/>
                                            <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div class="card-available-badge">
                                <span class="badge-text">可解锁</span>
                            </div>
                            <div class="card-unlock-btn" data-unlock-type="${this.currentAnimationType}">
                                <span class="btn-text">解锁</span>
                                <span class="btn-glow"></span>
                            </div>
                            <div class="card-progress-container">
                                <div class="progress-label">
                                    <span class="progress-current">${progress.current}</span>
                                    <span class="progress-sep">/</span>
                                    <span class="progress-required">${progress.required}h</span>
                                </div>
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar-track">
                                        <div class="progress-bar-fill" style="width: ${progress.percent}%"></div>
                                        <div class="progress-bar-shine"></div>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="card-image-container locked deep-locked">
                                <img src="插画/${illustration.file}" alt="${illustration.name}" class="card-image grayscale">
                                <div class="card-lock-overlay">
                                    <div class="lock-icon-container">
                                        <svg class="lock-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L9 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H15L12 2Z" stroke="currentColor" stroke-width="1.5"/>
                                            <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div class="card-progress-container locked-progress">
                                <div class="progress-label">
                                    <span class="progress-current">${progress.current}</span>
                                    <span class="progress-sep">/</span>
                                    <span class="progress-required">${progress.required}h</span>
                                </div>
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar-track">
                                        <div class="progress-bar-fill" style="width: ${progress.percent}%"></div>
                                    </div>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.gallery-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleItemClick(card.dataset.id);
            });
        });

        this.renderShowcase();
    },

    renderShowcase() {
        const showcase = document.getElementById('galleryShowcase');
        if (!showcase) return;

        if (!this.currentSkin) {
            showcase.innerHTML = '';
            showcase.classList.remove('show');
            return;
        }

        const illustration = this.illustrations.find(i => i.id === this.currentSkin);
        if (!illustration) return;

        showcase.classList.add('show');
        showcase.innerHTML = `
            <div class="showcase-inner">
                <div class="showcase-image-wrapper">
                    <img src="插画/${illustration.file}" alt="${illustration.name}" class="showcase-image">
                    <div class="showcase-shine"></div>
                    <div class="showcase-frame">
                        <div class="frame-corner frame-tl"></div>
                        <div class="frame-corner frame-tr"></div>
                        <div class="frame-corner frame-bl"></div>
                        <div class="frame-corner frame-br"></div>
                    </div>
                </div>
                <div class="showcase-info">
                    <div class="showcase-label">当前使用中</div>
                    <div class="showcase-name">${illustration.name}</div>
                    <button class="showcase-btn" onclick="Gallery.removeSkin()">
                        <span>卸下皮肤</span>
                    </button>
                </div>
            </div>
        `;
    },

    handleItemClick(id) {
        if (this.isUnlocked(id)) {
            this.applySkin(id);
        } else if (this.isAvailable(id)) {
            this.unlockWithAnimation(id);
        }
    },

    // 三种解锁动画
    unlockWithAnimation(id) {
        const type = this.currentAnimationType;
        switch(type) {
            case 0:
                this.playFlipAnimation(id);
                break;
            case 1:
                this.playEnergyAnimation(id);
                break;
            case 2:
                this.playParticleAnimation(id);
                break;
        }
        // 切换到下一个动画类型
        this.currentAnimationType = (this.currentAnimationType + 1) % 3;
        // 更新所有卡片的动画类型显示
        this.updateUnlockButtons();
    },

    updateUnlockButtons() {
        document.querySelectorAll('.card-unlock-btn').forEach(btn => {
            const type = this.currentAnimationType;
            const labels = ['翻转', '能量', '粒子'];
            btn.querySelector('.btn-text').textContent = '解锁 ' + labels[type];
            btn.dataset.unlockType = type;
        });
    },

    // 动画1: 卡片翻转揭幕
    playFlipAnimation(id, _callback) {
        const illustration = this.illustrations.find(i => i.id === id);
        if (!illustration || this.isUnlocked(id)) return;

        const card = document.querySelector(`.gallery-card[data-id="${id}"]`);
        if (!card) return;

        this.playUnlockSound();

        // 创建揭幕动画元素
        const revealer = document.createElement('div');
        revealer.className = 'card-revealer';
        card.querySelector('.card-inner').appendChild(revealer);

        // 粒子效果
        const rect = card.getBoundingClientRect();
        this.createFloatingParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'flip');

        // 翻转动画
        card.classList.add('flipping');
        card.querySelector('.card-image').classList.remove('grayscale');

        setTimeout(() => {
            this.unlocked.push(id);
            this.saveData();
            this.render();
            this.renderStats();
        }, 800);
    },

    // 动画2: 能量注入
    playEnergyAnimation(id, _callback) {
        const illustration = this.illustrations.find(i => i.id === id);
        if (!illustration || this.isUnlocked(id)) return;

        const card = document.querySelector(`.gallery-card[data-id="${id}"]`);
        if (!card) return;

        this.playUnlockSound();

        const inner = card.querySelector('.card-inner');
        const energyBar = document.createElement('div');
        energyBar.className = 'energy-inject-bar';
        inner.appendChild(energyBar);

        const rect = card.getBoundingClientRect();
        this.createFloatingParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'energy');

        setTimeout(() => {
            energyBar.classList.add('filling');
        }, 50);

        setTimeout(() => {
            this.unlocked.push(id);
            this.saveData();
            this.render();
            this.renderStats();
        }, 1200);
    },

    // 动画3: 粒子重组
    playParticleAnimation(id, _callback) {
        const illustration = this.illustrations.find(i => i.id === id);
        if (!illustration || this.isUnlocked(id)) return;

        const card = document.querySelector(`.gallery-card[data-id="${id}"]`);
        if (!card) return;

        const img = card.querySelector('.card-image');
        img.classList.remove('grayscale');

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.playUnlockSound();
        this.createParticleReveal(centerX, centerY, img);

        setTimeout(() => {
            this.unlocked.push(id);
            this.saveData();
            this.render();
            this.renderStats();
            if (_callback) _callback();
        }, 1500);
    },

    createFloatingParticles(x, y, type) {
        const colors = type === 'flip'
            ? ['#4A7C59', '#7BC47F', '#A8D5A2', '#E8A87C']
            : type === 'energy'
            ? ['#2D5A4A', '#6AAF75', '#8FB89A', '#E8A87C']
            : ['#4A7C59', '#FFD700', '#FF6B6B', '#A8D5A2'];

        const count = 30;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'float-particle';

            const size = 3 + Math.random() * 6;
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const distance = 60 + Math.random() * 100;
            const duration = 600 + Math.random() * 400;

            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                box-shadow: 0 0 ${size * 2}px ${color};
            `;

            document.body.appendChild(particle);

            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance - 30;

            if (type === 'flip') {
                particle.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0)`, opacity: 0 }
                ], {
                    duration: duration,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                }).onfinish = () => particle.remove();
            } else if (type === 'energy') {
                particle.animate([
                    { transform: 'translate(-50%, -50%) scale(0)', opacity: 1, y: 50 },
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, y: 0 },
                    { transform: `translate(-50%, -50%) scale(0.5)`, opacity: 0, y: -50 }
                ], {
                    duration: duration,
                    easing: 'ease-out'
                }).onfinish = () => particle.remove();
            } else {
                particle.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0)`, opacity: 0 }
                ], {
                    duration: duration,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }).onfinish = () => particle.remove();
            }
        }
    },

    createParticleReveal(_x, _y, imgElement) {
        const colors = ['#4A7C59', '#7BC47F', '#A8D5A2', '#FFD700', '#E8A87C'];
        const imgRect = imgElement.getBoundingClientRect();
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'reveal-particle';

            const size = 2 + Math.random() * 4;
            const startX = imgRect.left + Math.random() * imgRect.width;
            const startY = imgRect.top + Math.random() * imgRect.height;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                left: ${startX}px;
                top: ${startY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                box-shadow: 0 0 ${size}px ${color};
            `;

            document.body.appendChild(particle);

            const duration = 800 + Math.random() * 600;

            particle.animate([
                {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(-50%, -50%) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                delay: Math.random() * 300,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }).onfinish = () => particle.remove();
        }
    },

    createParticles(_x, _y, _callback) {
    },

    applySkin(id) {
        if (this.currentSkin === id) {
            this.removeSkin();
            return;
        }

        const illustration = this.illustrations.find(i => i.id === id);
        if (!illustration || !this.isUnlocked(id)) return;

        this.currentSkin = id;
        this.saveData();
        this.applyCurrentSkin();
        this.render();
        this.showToast(`已应用皮肤: ${illustration.name}`);
    },

    applyCurrentSkin() {
        const root = document.documentElement;

        if (this.currentSkin) {
            const illustration = this.illustrations.find(i => i.id === this.currentSkin);
            if (illustration && illustration.colors) {
                const c = illustration.colors;
                root.style.setProperty('--skin-image', `url('插画/${illustration.file}')`);
                root.style.setProperty('--skin-primary', c.primary);
                root.style.setProperty('--skin-primary-light', c.primaryLight);
                root.style.setProperty('--skin-secondary', c.secondary);
                root.style.setProperty('--skin-accent', c.accent);
                root.style.setProperty('--skin-background', c.background);
                root.style.setProperty('--skin-surface', c.surface);
                root.style.setProperty('--skin-text-primary', c.textPrimary);
                root.style.setProperty('--skin-text-secondary', c.textSecondary);
                root.style.setProperty('--skin-success', c.success);
                root.style.setProperty('--skin-warning', c.warning);
                root.style.setProperty('--skin-tomato', c.tomato);
                root.style.setProperty('--skin-shadow-color', c.shadowColor);
                root.style.setProperty('--skin-ring-color', c.ringColor);
                root.classList.add('skin-active');
            }
        } else {
            root.style.removeProperty('--skin-image');
            root.style.removeProperty('--skin-primary');
            root.style.removeProperty('--skin-primary-light');
            root.style.removeProperty('--skin-secondary');
            root.style.removeProperty('--skin-accent');
            root.style.removeProperty('--skin-background');
            root.style.removeProperty('--skin-surface');
            root.style.removeProperty('--skin-text-primary');
            root.style.removeProperty('--skin-text-secondary');
            root.style.removeProperty('--skin-success');
            root.style.removeProperty('--skin-warning');
            root.style.removeProperty('--skin-tomato');
            root.style.removeProperty('--skin-shadow-color');
            root.style.removeProperty('--skin-ring-color');
            root.classList.remove('skin-active');
        }
    },

    removeSkin() {
        this.currentSkin = null;
        this.saveData();
        this.applyCurrentSkin();
        this.render();
        this.showToast('已卸下皮肤');
    },

    getUnlockProgress(id) {
        const illustration = this.illustrations.find(i => i.id === id);
        if (!illustration) return { current: 0, required: 0, percent: 0 };

        const current = Math.min(this.totalFocusHours, illustration.requiredHours);
        const percent = illustration.requiredHours > 0
            ? Math.round((current / illustration.requiredHours) * 100)
            : 100;

        return {
            current,
            required: illustration.requiredHours,
            percent
        };
    },

    renderStats() {
        const container = document.getElementById('galleryStats');
        if (!container) return;

        container.innerHTML = `
            <div class="stat-panel">
                <div class="stat-panel-inner">
                    <div class="stat-value">${this.getUnlockedCount()}/${this.getTotalCount()}</div>
                    <div class="stat-label">已解锁</div>
                </div>
                <div class="stat-panel-decor"></div>
            </div>
            <div class="stat-panel">
                <div class="stat-panel-inner">
                    <div class="stat-value">${this.totalFocusHours}</div>
                    <div class="stat-label">累计小时</div>
                </div>
                <div class="stat-panel-decor"></div>
            </div>
        `;
    },

    initDetailModal() {
    },

    showToast(message) {
        const existing = document.querySelector('.gallery-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'gallery-toast';
        toast.innerHTML = `
            <span class="toast-icon"></span>
            <span class="toast-text">${message}</span>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    audioContext: null,

    playUnlockSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = this.audioContext;
            const now = ctx.currentTime;

            const notes = [523.25, 659.25, 783.99, 1046.50];

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.12);

                gain.gain.setValueAtTime(0, now + i * 0.12);
                gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + i * 0.12);
                osc.stop(now + i * 0.12 + 0.5);
            });

            const shimmer = ctx.createOscillator();
            const shimmerGain = ctx.createGain();
            shimmer.type = 'triangle';
            shimmer.frequency.setValueAtTime(2093, now + 0.4);
            shimmerGain.gain.setValueAtTime(0, now + 0.4);
            shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
            shimmer.connect(shimmerGain);
            shimmerGain.connect(ctx.destination);
            shimmer.start(now + 0.4);
            shimmer.stop(now + 1.0);

        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    },

    updateFocusHours() {
        const prevUnlocked = [...this.unlocked];
        this.totalFocusHours = this.calculateTotalFocusHours();
        this.checkUnlocks();

        const newlyUnlocked = this.unlocked.filter(id => !prevUnlocked.includes(id));

        this.render();
        this.renderStats();

        return newlyUnlocked;
    }
};

window.Gallery = Gallery;