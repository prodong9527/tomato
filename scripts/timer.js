const Timer = {
    settings: null,
    mode: 'focus',
    timeRemaining: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    pomodorosCompleted: 0,
    currentTaskId: null,
    currentCustomTask: null,
    intervalId: null,
    sessionStartTime: null,
    isEditing: false,

    init() {
        this.settings = Storage.getSettings();
        this.reset();
        this.updateDisplay();
        this.initDigitPickers();
        this.initEditOverlay();
    },

    initEditOverlay() {
        const display = document.getElementById('timerDisplay');
        const overlay = document.getElementById('timerEditOverlay');
        const input = document.getElementById('timerEditInput');

        if (!display || !overlay || !input) return;

        display.addEventListener('click', (e) => {
            if (this.isRunning) return;
            if (e.target.closest('.timer-digit')) return;
            if (e.target.closest('.timer-edit-overlay')) return;

            overlay.classList.add('active');
            input.value = '';
            input.focus();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                input.focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.applyEditedTime(input.value);
                overlay.classList.remove('active');
            } else if (e.key === 'Escape') {
                overlay.classList.remove('active');
                input.blur();
            }
        });

        input.addEventListener('blur', () => {
            if (input.value) {
                this.applyEditedTime(input.value);
            }
            overlay.classList.remove('active');
        });

        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;
        });
    },

    applyEditedTime(value) {
        const digits = value.replace(/\D/g, '');
        if (!digits || digits.length === 0) return;

        let totalSeconds;
        if (digits.length === 1) {
            totalSeconds = parseInt(digits[0], 10);
        } else if (digits.length === 2) {
            const secs = parseInt(digits, 10);
            totalSeconds = secs;
        } else if (digits.length === 3) {
            const secs = parseInt(digits.slice(1), 10);
            const mins = parseInt(digits[0], 10);
            totalSeconds = mins * 60 + secs;
        } else {
            const secs = parseInt(digits.slice(-2), 10);
            const mins = parseInt(digits.slice(0, -2), 10);
            totalSeconds = mins * 60 + secs;
        }

        totalSeconds = Math.max(1, Math.min(7200, totalSeconds));
        this.totalTime = totalSeconds;
        this.timeRemaining = totalSeconds;

        if (this.mode === 'focus') {
            this.settings.focusDuration = Math.ceil(totalSeconds / 60);
        } else {
            this.settings.shortBreakDuration = Math.ceil(totalSeconds / 60);
        }
        Storage.saveSettings(this.settings);

        this.updateDisplay();
    },

    initDigitPickers() {
        document.querySelectorAll('.timer-digit').forEach(digit => {
            const roller = digit.querySelector('.digit-roller');
            if (!roller) return;

            let startY = 0;
            let startIndex = 0;
            let isDragging = false;

            const unit = digit.dataset.unit;
            const min = parseInt(digit.dataset.min) || 0;
            const max = parseInt(digit.dataset.max) || 9;
            const range = max - min + 1;
            const itemHeight = 72;
            const baseIndex = range;
            const totalItems = range * 2;

            const getValue = (index) => {
                const rawIndex = index - baseIndex;
                return min + (((rawIndex % range) + range) % range);
            };

            const getIndexInSecondCycle = (value) => {
                const normalized = value - min;
                const rawIndex = (normalized - range + range * 2) % range;
                return baseIndex + rawIndex;
            };

            const getCurrentIndex = () => {
                const transform = roller.style.transform;
                const match = transform.match(/translateY\(-(\d+)px\)/);
                if (match) {
                    return Math.round(parseInt(match[1]) / itemHeight);
                }
                return baseIndex;
            };

            digit.addEventListener('mousedown', (e) => {
                if (this.isRunning) return;
                isDragging = true;
                startY = e.clientY;
                startIndex = getCurrentIndex();
                digit.classList.add('highlight');
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const delta = startY - e.clientY;
                const indexOffset = Math.round(delta / itemHeight);
                let newIndex = startIndex + indexOffset;

                const rawIndex = newIndex - baseIndex;
                const wrappedOffset = (((rawIndex % range) + range) % range);
                newIndex = baseIndex + wrappedOffset;

                roller.style.transform = `translateY(-${newIndex * itemHeight}px)`;
            });

            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                digit.classList.remove('highlight');

                const currentIndex = getCurrentIndex();
                const value = getValue(currentIndex);
                this.setTimeFromDigits(value, unit);
            });

            digit.addEventListener('touchstart', (e) => {
                if (this.isRunning) return;
                isDragging = true;
                startY = e.touches[0].clientY;
                startIndex = getCurrentIndex();
                digit.classList.add('highlight');
                e.preventDefault();
            }, { passive: false });

            document.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const delta = startY - e.touches[0].clientY;
                const indexOffset = Math.round(delta / itemHeight);
                let newIndex = startIndex + indexOffset;

                const rawIndex = newIndex - baseIndex;
                const wrappedOffset = (((rawIndex % range) + range) % range);
                newIndex = baseIndex + wrappedOffset;

                roller.style.transform = `translateY(-${newIndex * itemHeight}px)`;
            }, { passive: false });

            document.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                digit.classList.remove('highlight');

                const currentIndex = getCurrentIndex();
                const value = getValue(currentIndex);
                this.setTimeFromDigits(value, unit);
            });
        });
    },

    setTimeFromDigits(value, unit) {
        const minutes = this.getMinutes();
        const seconds = this.getSeconds();

        if (unit === 'minutes-tens') {
            this.totalTime = (value * 600 + seconds * 10) > 0 ? (value * 600 + seconds * 10) : 1;
        } else if (unit === 'minutes-ones') {
            this.totalTime = (minutes - (minutes % 10) + value) * 60 + seconds;
            if (this.totalTime < 60) this.totalTime = (value < 10 ? value * 60 : 60) + seconds;
        } else if (unit === 'seconds-tens') {
            this.totalTime = minutes * 60 + value * 10 + (seconds % 10);
        } else if (unit === 'seconds-ones') {
            this.totalTime = minutes * 60 + (seconds - (seconds % 10)) + value;
        }

        this.totalTime = Math.max(1, Math.min(7200, this.totalTime));
        this.timeRemaining = this.totalTime;

        if (this.mode === 'focus') {
            this.settings.focusDuration = Math.ceil(this.totalTime / 60);
        } else {
            this.settings.shortBreakDuration = Math.ceil(this.totalTime / 60);
        }
        Storage.saveSettings(this.settings);

        this.updateDisplay();
    },

    getMinutes() {
        return Math.floor(this.totalTime / 60);
    },

    getSeconds() {
        return this.totalTime % 60;
    },

    setSettings(settings) {
        this.settings = settings;
        if (!this.isRunning) {
            this.reset();
            this.updateDisplay();
        }
    },

    setMode(mode) {
        this.mode = mode;
        this.reset();
        this.updateDisplay();
        this.updateModeTabs();
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.sessionStartTime = Date.now();

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);

        this.updateDisplay();
        this.updateControls();
    },

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.updateDisplay();
        this.updateControls();
    },

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    },

    reset() {
        this.pause();

        const duration = this.mode === 'focus'
            ? this.settings.focusDuration * 60
            : this.settings.shortBreakDuration * 60;

        this.totalTime = duration;
        this.timeRemaining = duration;
        this.currentTaskId = null;
        this.currentCustomTask = null;
        this.sessionStartTime = null;

        this.updateDisplay();
        this.updateControls();
    },

    skip() {
        this.pause();
        this.completeSession(true);
    },

    endEarly() {
        this.pause();
        this.completeSession(false);
    },

    tick() {
        this.timeRemaining--;

        if (this.timeRemaining <= 0) {
            this.completeSession(false);
        }

        this.updateDisplay();
        this.updateProgress();
    },

    completeSession(skipped = false) {
        this.pause();

        if (!skipped && this.mode === 'focus') {
            this.pomodorosCompleted++;
            this.onPomodoroComplete();
        }

        if (this.mode === 'focus') {
            this.goToBreak();
        } else {
            this.goToFocus();
        }
    },

    goToBreak() {
        this.mode = 'break';
        this.totalTime = this.settings.shortBreakDuration * 60;
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
        this.updateModeTabs();
    },

    goToFocus() {
        this.mode = 'focus';
        this.totalTime = this.settings.focusDuration * 60;
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
        this.updateModeTabs();
    },

    onPomodoroComplete() {
        const today = new Date().toISOString().split('T')[0];
        const stats = Storage.getStats();

        if (!stats.dailyStats[today]) {
            stats.dailyStats[today] = {
                tomatoes: 0,
                totalFocusTime: 0,
                tasksCompleted: 0
            };
        }

        stats.dailyStats[today].tomatoes++;
        const actualSeconds = this.totalTime - this.timeRemaining;
        const actualMinutes = Math.round(actualSeconds / 60);
        if (actualMinutes > 0) {
            stats.dailyStats[today].totalFocusTime += actualMinutes;
        }
        Storage.saveStats(stats);

        if (this.currentTaskId) {
            this.currentTaskId = null;
        } else if (this.currentCustomTask) {
            Todos.add(this.currentCustomTask, 'custom', 'p2');
            this.currentCustomTask = null;
        }

        const garden = Storage.getGarden();
        garden.totalTomatoes++;

        if (garden.streakCountedDate !== today) {
            if (this.shouldIncreaseStreak(garden.lastActiveDate)) {
                garden.currentStreak++;
                if (garden.currentStreak > garden.longestStreak) {
                    garden.longestStreak = garden.currentStreak;
                }
            }
            garden.streakCountedDate = today;
        }
        garden.lastActiveDate = today;

        Storage.saveGarden(garden);

        const session = {
            id: Date.now().toString(),
            taskId: this.currentTaskId,
            customTask: this.currentCustomTask,
            duration: this.settings.focusDuration,
            completedAt: Date.now()
        };
        const sessions = Storage.getSessions();
        sessions.unshift(session);
        if (sessions.length > 100) sessions.pop();
        Storage.saveSessions(sessions);

        Garden.checkTreeUnlocks();
        Garden.checkStreakAchievements();
        Achievements.checkAchievements();

        if (this.settings.soundEnabled) {
            this.playSound();
        }

        if (this.settings.notificationsEnabled) {
            this.showNotification('番茄完成！', '太棒了，休息一下吧');
        }

        App.updateStreakDisplay();
        App.updateTodayTomatoes();

        // Refresh stats immediately
        Stats.refresh();
        if (App.currentView === 'stats') {
            Stats.render('day');
        }
    },

    shouldIncreaseStreak(lastDate) {
        if (!lastDate) return true;

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        return lastDate === yesterdayStr || lastDate === todayStr;
    },

    playSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Could not play sound:', e);
        }
    },

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        } else {
            App.showToast(title + ': ' + body);
        }
    },

    linkTask(taskId) {
        this.currentTaskId = taskId;
        this.currentCustomTask = null;
    },

    setCustomTask(taskName) {
        this.currentCustomTask = taskName;
        this.currentTaskId = null;
    },

    getLinkedTask() {
        if (!this.currentTaskId) return null;
        return Todos.getById(this.currentTaskId);
    },

    updateDisplay() {
        const displayMinutes = Math.floor(this.timeRemaining / 60);
        const displaySeconds = this.timeRemaining % 60;

        const minutesTens = Math.floor(displayMinutes / 10) % 10;
        const minutesOnes = displayMinutes % 10;
        const secondsTens = Math.floor(displaySeconds / 10);
        const secondsOnes = displaySeconds % 10;

        this.setDigit('minutes-tens', minutesTens);
        this.setDigit('minutes-ones', minutesOnes);
        this.setDigit('seconds-tens', secondsTens);
        this.setDigit('seconds-ones', secondsOnes);

        const labelEl = document.getElementById('timerModeLabel');
        if (labelEl) {
            labelEl.textContent = this.mode === 'focus' ? '专注中' : '休息中';
        }

        this.updateProgress();
    },

    setDigit(unit, value) {
        const digit = document.querySelector(`.timer-digit[data-unit="${unit}"]`);
        if (!digit) return;

        const roller = digit.querySelector('.digit-roller');
        if (!roller) return;

        const min = parseInt(digit.dataset.min) || 0;
        const max = parseInt(digit.dataset.max) || 9;
        const range = max - min + 1;
        const itemHeight = 72;
        const baseIndex = range;
        const normalizedValue = (((value - min) % range) + range) % range;
        const index = baseIndex + normalizedValue;
        roller.style.transform = `translateY(-${index * itemHeight}px)`;
    },

    updateProgress() {
        const progress = this.totalTime > 0 ? (this.totalTime - this.timeRemaining) / this.totalTime : 0;
        const circumference = 2 * Math.PI * 130;
        const offset = circumference * (1 - progress);

        const ring = document.getElementById('timerProgress');
        if (ring) {
            ring.style.strokeDashoffset = offset;
            ring.classList.toggle('break', this.mode !== 'focus');
        }
    },

    updateControls() {
        const startPauseBtn = document.getElementById('startPauseBtn');
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        const startPauseText = document.getElementById('startPauseText');

        if (startPauseBtn) {
            if (this.isRunning) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                startPauseText.textContent = '暂停';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                startPauseText.textContent = '开始';
            }
        }
    },

    updateModeTabs() {
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === this.mode);
        });
    }
};
