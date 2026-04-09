const App = {
    currentView: 'timer',
    currentTab: 'todo',
    lastUnlockedSidebarId: null,

    init() {
        this.initFirebase();
    },

    async initFirebase() {
        await CloudStore.init();
        this.initAuthEvents();
        this.updateAuthUI();

        FirebaseAuth.onAuthChange((user) => {
            this.updateAuthUI();
            if (user) {
                this.showToast('已连接云端');
            }
        });

        Timer.init();
        Todos.init();
        Stats.init();
        Gallery.init();
        Music.init();

        this.bindEvents();
        this.initEditTaskModal();
        this.initCalendarModal();
        this.loadInitialData();
        this.updateDurationControlVisibility();
        this.checkNotificationsPermission();

        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 100);
    },

    updateAuthUI() {
        const user = FirebaseAuth.currentUser;
        const loginSection = document.getElementById('loginSection');
        const userInfoSection = document.getElementById('userInfoSection');
        const syncStatus = document.getElementById('syncStatus');

        if (user) {
            loginSection.style.display = 'none';
            userInfoSection.style.display = 'block';
            if (syncStatus) syncStatus.textContent = '已连接';
        } else {
            loginSection.style.display = 'block';
            userInfoSection.style.display = 'none';
            if (syncStatus) syncStatus.textContent = '未连接';
        }
    },

    initAuthEvents() {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.handleRegister());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

        document.getElementById('loginEmail')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('loginPassword')?.focus();
        });
        document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    },

    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        const errorEl = document.getElementById('loginError');

        if (!email || !password) {
            errorEl.textContent = '请输入邮箱和密码';
            errorEl.style.display = 'block';
            return;
        }

        errorEl.style.display = 'none';
        try {
            await FirebaseAuth.signIn(email, password);
            errorEl.style.display = 'none';
            this.showToast('登录成功');
        } catch (e) {
            errorEl.textContent = this.getAuthErrorMessage(e.code);
            errorEl.style.display = 'block';
        }
    },

    async handleRegister() {
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        const errorEl = document.getElementById('loginError');

        if (!email || !password) {
            errorEl.textContent = '请输入邮箱和密码';
            errorEl.style.display = 'block';
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = '密码至少需要6个字符';
            errorEl.style.display = 'block';
            return;
        }

        errorEl.style.display = 'none';
        try {
            await FirebaseAuth.signUp(email, password);
            errorEl.style.display = 'none';
            this.showToast('注册成功');
        } catch (e) {
            errorEl.textContent = this.getAuthErrorMessage(e.code);
            errorEl.style.display = 'block';
        }
    },

    async handleLogout() {
        await FirebaseAuth.signOut();
        this.showToast('已退出登录');
    },

    getAuthErrorMessage(code) {
        const messages = {
            'auth/invalid-email': '邮箱格式不正确',
            'auth/user-disabled': '该账号已被禁用',
            'auth/user-not-found': '账号不存在',
            'auth/wrong-password': '密码错误',
            'auth/email-already-in-use': '该邮箱已被注册',
            'auth/weak-password': '密码强度太弱',
            'auth/network-request-failed': '网络连接失败，请检查网络'
        };
        return messages[code] || '操作失败，请重试';
    },

    loadInitialData() {
        this.updateStreakDisplay();
        this.updateTodayTomatoes();
        this.updateTaskLinkSelect();
        this.renderSidebarAchievements();
        this.renderSessionList();

        const settings = Storage.getSettings();
        const focusInput = document.getElementById('focusDurationInput');
        const breakInput = document.getElementById('breakDurationInput');

        if (focusInput) focusInput.value = settings.focusDuration;
        if (breakInput) breakInput.value = settings.shortBreakDuration;

        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) soundToggle.classList.toggle('active', settings.soundEnabled);

        const notifToggle = document.getElementById('notificationToggle');
        if (notifToggle) notifToggle.classList.toggle('active', settings.notificationsEnabled);
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
            });
        });

        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                Timer.setMode(tab.dataset.mode);
                this.updateDurationControlVisibility();
            });
        });

        document.getElementById('startPauseBtn')?.addEventListener('click', () => {
            Timer.toggle();
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            Timer.reset();
        });

        document.getElementById('skipBtn')?.addEventListener('click', () => {
            Timer.skip();
        });

        document.getElementById('endEarlyBtn')?.addEventListener('click', () => {
            Timer.endEarly();
        });

        this.initCustomSelects();

        document.getElementById('customTaskInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                Timer.setCustomTask(e.target.value.trim());
            }
        });

        document.querySelectorAll('.task-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTaskTab(tab.dataset.tab);
            });
        });

        document.getElementById('taskInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        document.querySelectorAll('.stat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchStatsPeriod(tab.dataset.period);
            });
        });

        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const target = btn.dataset.target;
                const input = document.getElementById(target === 'focusDuration' ? 'focusDurationInput' : 'breakDurationInput');
                if (!input) return;

                let value = parseInt(input.value) || (target === 'focusDuration' ? 25 : 5);
                const min = parseInt(input.min);
                const max = parseInt(input.max);

                if (action === 'increase' && value < max) {
                    value += 1;
                } else if (action === 'decrease' && value > min) {
                    value -= 1;
                }

                input.value = value;

                if (target === 'focusDuration') {
                    this.updateSettings('focusDuration', value);
                } else {
                    this.updateSettings('shortBreakDuration', value);
                }

                Timer.setSettings(Storage.getSettings());
                Timer.updateDisplay();
            });
        });

        document.querySelectorAll('.duration-input').forEach(input => {
            input.addEventListener('change', () => {
                const id = input.id;
                let value = parseInt(input.value) || (id === 'focusDurationInput' ? 25 : 5);
                const min = parseInt(input.min);
                const max = parseInt(input.max);
                value = Math.max(min, Math.min(max, value));
                input.value = value;

                if (id === 'focusDurationInput') {
                    this.updateSettings('focusDuration', value);
                    Timer.setSettings(Storage.getSettings());
                    Timer.updateDisplay();
                } else {
                    this.updateSettings('shortBreakDuration', value);
                }
            });
        });

        document.getElementById('soundToggle')?.addEventListener('click', () => {
            const btn = document.getElementById('soundToggle');
            const isActive = btn.classList.toggle('active');
            this.updateSettings('soundEnabled', isActive);
        });

        document.getElementById('notificationToggle')?.addEventListener('click', () => {
            const btn = document.getElementById('notificationToggle');
            const isActive = btn.classList.toggle('active');
            this.updateSettings('notificationsEnabled', isActive);
            if (isActive) {
                this.requestNotificationPermission();
            }
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });

        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
                this.clearAllData();
            }
        });

        document.getElementById('syncToCloudBtn')?.addEventListener('click', async () => {
            await this.syncToCloud();
        });
    },

    async syncToCloud() {
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) syncStatus.textContent = '同步中...';

        try {
            await Storage.saveToCloud('settings');
            await Storage.saveToCloud('todos');
            await Storage.saveToCloud('stats');
            await Storage.saveToCloud('garden');
            await Storage.saveToCloud('achievements');
            await Storage.saveToCloud('sessions');

            if (syncStatus) syncStatus.textContent = '已同步';
            this.showToast('同步成功');
        } catch (e) {
            if (syncStatus) syncStatus.textContent = '同步失败';
            this.showToast('同步失败');
            console.error('Sync error:', e);
        }
    },

    initCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(selectWrapper => {
            const trigger = selectWrapper.querySelector('.custom-select-trigger');
            const dropdown = selectWrapper.querySelector('.custom-select-dropdown');
            const valueEl = trigger.querySelector('.custom-select-value');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = selectWrapper.classList.contains('open');
                document.querySelectorAll('.custom-select.open').forEach(s => {
                    if (s !== selectWrapper) s.classList.remove('open');
                });
                selectWrapper.classList.toggle('open', !isOpen);
            });

            dropdown.querySelectorAll('.custom-select-option').forEach(option => {
                option.addEventListener('click', () => {
                    const value = option.dataset.value;
                    const text = option.textContent;
                    const color = option.dataset.color;

                    dropdown.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');

                    valueEl.textContent = text;
                    if (color) {
                        valueEl.style.color = color;
                    } else {
                        valueEl.style.color = '';
                    }

                    selectWrapper.classList.remove('open');
                    this.handleCustomSelectChange(selectWrapper.id, value);
                });
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
        });
    },

    handleCustomSelectChange(selectId, value) {
        if (selectId === 'taskLinkSelectWrapper') {
            if (value === 'custom') {
                const customInput = document.getElementById('customTaskInput');
                if (customInput) customInput.style.display = 'flex';
            } else {
                const customInput = document.getElementById('customTaskInput');
                if (customInput) customInput.style.display = 'none';
                Timer.linkTask(value);
            }
        } else if (selectId === 'taskDateSelectWrapper') {
            Todos.currentDateFilter = value;
            Todos.renderTodoList();
        } else if (selectId === 'categoryFilterWrapper') {
            Todos.render('all', value);
        }
    },

    switchView(viewName) {
        this.currentView = viewName;

        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(`${viewName}View`)?.classList.remove('hidden');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        if (viewName === 'stats') {
            Stats.render('day');
        } else if (viewName === 'garden') {
            Garden.render();
        }

        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 50);
    },

    switchTaskTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.task-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        document.getElementById('todoList')?.classList.toggle('hidden', tab !== 'todo');
        document.getElementById('doneList')?.classList.toggle('hidden', tab !== 'done');
        document.getElementById('monthlyList')?.classList.toggle('hidden', tab !== 'monthly');

        if (tab === 'todo') {
            Todos.renderTodoList();
        } else if (tab === 'done') {
            Todos.renderDoneList();
        } else if (tab === 'monthly') {
            Todos.renderMonthlyList();
        }
    },

    switchStatsPeriod(period) {
        document.querySelectorAll('.stat-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.period === period);
        });

        Stats.render(period);
    },

    updateDurationControlVisibility() {
        const focusControl = document.getElementById('focusDurationControl');
        const breakControl = document.getElementById('breakDurationControl');

        if (focusControl && breakControl) {
            const isFocus = Timer.mode === 'focus';
            focusControl.classList.toggle('hidden', !isFocus);
            breakControl.classList.toggle('hidden', isFocus);
        }
    },

    initCalendarModal() {
        document.getElementById('calendarPrev')?.addEventListener('click', () => {
            Stats.changeCalendarMonth(1);
        });

        document.getElementById('calendarNext')?.addEventListener('click', () => {
            Stats.changeCalendarMonth(-1);
        });

        document.querySelectorAll('.calendar-view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.calendar-view-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                Stats.setCalendarViewMode(tab.dataset.view);
            });
        });

        const modal = document.getElementById('calendarModal');
        document.getElementById('calendarModalClose')?.addEventListener('click', () => {
            modal?.classList.remove('show');
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    },

    initEditTaskModal() {
        const modal = document.getElementById('editTaskModal');

        document.getElementById('editTaskModalClose')?.addEventListener('click', () => {
            Todos.hideEditModal();
        });

        document.getElementById('editTaskCancelBtn')?.addEventListener('click', () => {
            Todos.hideEditModal();
        });

        document.getElementById('editTaskSaveBtn')?.addEventListener('click', () => {
            Todos.saveEdit();
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                Todos.hideEditModal();
            }
        });

        document.getElementById('editTaskInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                Todos.saveEdit();
            }
        });
    },

    addTask() {
        const input = document.getElementById('taskInput');
        const dateWrapper = document.getElementById('taskDateSelectWrapper');
        const categoryWrapper = document.getElementById('taskCategorySelectWrapper');
        const priorityWrapper = document.getElementById('taskPrioritySelectWrapper');

        const content = input.value.trim();
        if (!content) return;

        const dateValueEl = dateWrapper.querySelector('.custom-select-value');
        const categoryValueEl = categoryWrapper.querySelector('.custom-select-value');
        const priorityValueEl = priorityWrapper.querySelector('.custom-select-value');

        const dateOptions = {
            '今天': 'today', '明天': 'tomorrow', '本周': 'week', '所有': 'all', '每月目标': 'monthly'
        };
        const categoryOptions = {
            '工作': 'work', '学习': 'study', '健康': 'health', '运动': 'sports',
            '生活': 'life', '写作': 'writing', '未来': 'future', '休息': 'rest'
        };
        const priorityOptions = { '高': 'p1', '中': 'p2', '低': 'p3' };

        const dateType = dateOptions[dateValueEl.textContent] || 'today';
        const category = categoryOptions[categoryValueEl.textContent] || 'work';
        const priority = priorityOptions[priorityValueEl.textContent] || 'p2';

        Todos.add(content, category, priority, dateType);
        input.value = '';
    },

    updateSettings(key, value) {
        const settings = Storage.getSettings();
        settings[key] = value;
        Storage.saveSettings(settings);

        if (['focusDuration', 'shortBreakDuration', 'longBreakDuration'].includes(key)) {
            Timer.setSettings(settings);
        }
    },

    updateStreakDisplay() {
        const garden = Storage.getGarden();
        const streakEl = document.getElementById('streakCount');
        if (streakEl) {
            streakEl.textContent = garden.currentStreak;
        }
    },

    updateTodayTomatoes() {
        const stats = Stats.getToday();
        const el = document.getElementById('todayTomatoes');
        if (el) {
            el.textContent = stats.tomatoes;
        }
    },

    updateTaskLinkSelect() {
        const optionsList = document.getElementById('taskLinkOptions');
        if (!optionsList) return;

        const pendingTodos = Todos.getPending();

        if (pendingTodos.length === 0) {
            optionsList.innerHTML = '<div class="custom-select-empty">暂无待办任务</div>';
            return;
        }

        optionsList.innerHTML = pendingTodos.map(todo => {
            const category = Todos.getCategoryInfo(todo.category);
            return `<div class="custom-select-option" data-value="${todo.id}">
                <span class="category-dot" style="background: ${category.color}"></span>
                ${todo.content.substring(0, 25)}${todo.content.length > 25 ? '...' : ''}
            </div>`;
        }).join('');

        optionsList.querySelectorAll('.custom-select-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                const text = option.textContent;
                const wrapper = document.getElementById('taskLinkSelectWrapper');
                const valueEl = wrapper.querySelector('.custom-select-value');

                optionsList.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                valueEl.textContent = text;

                wrapper.classList.remove('open');
                this.handleCustomSelectChange('taskLinkSelectWrapper', value);
            });
        });
    },

    renderSidebarAchievements(justUnlockedId = null) {
        const container = document.getElementById('achievementsList');
        if (!container) return;

        // Define achievements based on focus hours
        const totalHours = Gallery.totalFocusHours;
        const achievementsData = Storage.getAchievements();
        const unlockedIds = achievementsData.filter(a => a.unlockedAt).map(a => a.id);

        const achievements = [
            { id: 'first_focus', name: '首次专注', icon: 'star', unlocked: unlockedIds.includes('first_focus') },
            { id: 'hour5', name: '5小时', icon: 'clock', unlocked: totalHours >= 5 },
            { id: 'hour15', name: '15小时', icon: 'zap', unlocked: totalHours >= 15 },
            { id: 'hour30', name: '30小时', icon: 'award', unlocked: totalHours >= 30 },
            { id: 'hour50', name: '50小时', icon: 'trophy', unlocked: totalHours >= 50 },
            { id: 'hour100', name: '100小时', icon: 'crown', unlocked: totalHours >= 100 },
        ];

        const iconSvgs = {
            star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
            trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
            crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>'
        };

        container.innerHTML = achievements.map(ach => `
            <div class="achievement-badge ${ach.unlocked ? '' : 'locked'} ${justUnlockedId === ach.id ? 'just-unlocked' : ''}" title="${ach.name}">
                <div class="achievement-badge-icon">
                    ${iconSvgs[ach.icon]}
                </div>
                <span class="achievement-badge-name">${ach.name}</span>
            </div>
        `).join('');
    },

    renderSessionList() {
        const container = document.getElementById('sessionList');
        if (!container) return;

        const sessions = Storage.getSessions();
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = sessions.filter(s => {
            const date = new Date(s.completedAt).toISOString().split('T')[0];
            return date === today;
        }).slice(0, 10);

        if (todaySessions.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">暂无记录</p>';
            return;
        }

        container.innerHTML = todaySessions.map(session => {
            const time = new Date(session.completedAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            let taskName = '无关联任务';
            if (session.taskId) {
                const task = Todos.getById(session.taskId);
                if (task) taskName = task.content.substring(0, 20);
            } else if (session.customTask) {
                taskName = session.customTask.substring(0, 20);
            }

            return `
                <div class="session-item">
                    <span class="session-item-time">${time}</span>
                    <span class="session-item-task">${taskName}</span>
                </div>
            `;
        }).join('');
    },

    showToast(message) {
        const toast = document.getElementById('notificationToast');
        const toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    },

    showCelebration(message) {
        const overlay = document.getElementById('celebrationOverlay');
        const text = document.getElementById('celebrationText');

        if (overlay && text) {
            text.textContent = message;
            overlay.classList.add('show');

            setTimeout(() => {
                overlay.classList.remove('show');
            }, 3000);
        }
    },

    async checkNotificationsPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await this.requestNotificationPermission();
        }
    },

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }
    },

    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `focusgrove-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('数据导出成功');
    },

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Storage.importData(data)) {
                    location.reload();
                } else {
                    alert('导入失败：数据格式错误');
                }
            } catch (err) {
                alert('导入失败：' + err.message);
            }
        };
        reader.readAsText(file);
    },

    clearAllData() {
        Storage.clear();
        FirebaseAuth.signOut();
        location.reload();
    },

    async logout() {
        await FirebaseAuth.signOut();
        this.showToast('已退出登录');
    },
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}
