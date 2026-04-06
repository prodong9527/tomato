const Todos = {
    todos: [],

    CATEGORIES: [
        { id: 'work', name: '工作', color: '#C45A4A' },
        { id: 'study', name: '学习', color: '#4A8A4D' },
        { id: 'health', name: '健康', color: '#B08A4A' },
        { id: 'sports', name: '运动', color: '#3D7A4D' },
        { id: 'life', name: '生活', color: '#5A8A5A' },
        { id: 'writing', name: '写作', color: '#7A68AB' },
        { id: 'future', name: '未来', color: '#4A8A8A' },
        { id: 'rest', name: '休息', color: '#6A9A6A' }
    ],

    currentDateFilter: 'today',
    currentTab: 'todo',

    init() {
        this.todos = Storage.getTodos();
        this.render();
    },

    add(content, category = 'work', priority = 'p2', dateType = 'today', isMonthly = false) {
        const now = new Date();
        let targetDate = null;

        if (dateType === 'today') {
            targetDate = this.getDateString(now);
        } else if (dateType === 'tomorrow') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = this.getDateString(tomorrow);
        } else if (dateType === 'week') {
            targetDate = 'week';
        } else if (dateType === 'monthly') {
            isMonthly = true;
            targetDate = null;
        }

        const todo = {
            id: Date.now().toString(),
            content,
            category,
            priority,
            createdAt: Date.now(),
            targetDate,
            isMonthly,
            completedAt: null,
            focusDuration: null
        };

        this.todos.unshift(todo);
        Storage.saveTodos(this.todos);
        this.render();
        App.updateTaskLinkSelect();
        return todo;
    },

    getDateString(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },

    complete(id, focusDuration = null) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completedAt = Date.now();
            todo.focusDuration = focusDuration;
            Storage.saveTodos(this.todos);

            const stats = Storage.getStats();
            const today = this.getDateString(new Date());
            if (!stats.dailyStats[today]) {
                stats.dailyStats[today] = { tomatoes: 0, totalFocusTime: 0, tasksCompleted: 0 };
            }
            stats.dailyStats[today].tasksCompleted++;
            Storage.saveStats(stats);

            this.render();
            App.updateTaskLinkSelect();
        }
    },

    uncomplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completedAt = null;
            todo.focusDuration = null;
            Storage.saveTodos(this.todos);
            this.render();
            App.updateTaskLinkSelect();
        }
    },

    update(id, updates) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            Object.assign(todo, updates);
            Storage.saveTodos(this.todos);
            this.render();
            App.updateTaskLinkSelect();
        }
    },

    remove(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        Storage.saveTodos(this.todos);
        this.render();
        App.updateTaskLinkSelect();
    },

    getById(id) {
        return this.todos.find(t => t.id === id);
    },

    getPending() {
        const now = new Date();
        const today = this.getDateString(now);
        const tomorrow = this.getDateString(new Date(now.getTime() + 86400000));
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return this.todos.filter(t => {
            if (t.completedAt) return false;

            if (this.currentDateFilter === 'today') {
                return t.targetDate === today || (!t.targetDate && !t.isMonthly);
            } else if (this.currentDateFilter === 'tomorrow') {
                return t.targetDate === tomorrow;
            } else if (this.currentDateFilter === 'week') {
                if (t.targetDate === 'week') return true;
                if (!t.targetDate && !t.isMonthly) {
                    const todoDate = new Date(t.targetDate);
                    return todoDate >= weekStart && todoDate <= weekEnd;
                }
                return false;
            } else if (this.currentDateFilter === 'monthly') {
                return t.isMonthly;
            } else if (this.currentDateFilter === 'all') {
                return !t.completedAt;
            }
            return true;
        }).sort((a, b) => {
            const priorityOrder = { p1: 0, p2: 1, p3: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    },

    getCompleted() {
        return this.todos.filter(t => t.completedAt).sort((a, b) => b.completedAt - a.completedAt);
    },

    getMonthly() {
        return this.todos.filter(t => t.isMonthly && !t.completedAt);
    },

    getByCategory(category) {
        return this.todos.filter(t => t.category === category);
    },

    getCategoryInfo(categoryId) {
        return this.CATEGORIES.find(c => c.id === categoryId) || this.CATEGORIES[0];
    },

    getStats() {
        const stats = { work: 0, study: 0, health: 0, sports: 0, life: 0, writing: 0, future: 0, rest: 0 };
        this.todos.filter(t => t.completedAt).forEach(t => {
            if (stats[t.category] !== undefined) {
                stats[t.category]++;
            } else {
                stats.work++;
            }
        });
        return stats;
    },

    getTasksForDate(dateStr) {
        return this.todos.filter(t => {
            if (!t.completedAt) return false;
            const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
            return completedDate === dateStr;
        });
    },

    render() {
        this.renderTodoList();
        this.renderDoneList();
        this.renderMonthlyList();
    },

    renderTodoList() {
        const container = document.getElementById('todoList');
        if (!container) return;

        const todos = this.getPending();

        if (todos.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>暂无待办任务</p></div>';
            return;
        }

        container.innerHTML = todos.map(todo => this.renderTodoItem(todo)).join('');

        if (window.lucide) {
            window.lucide.createIcons();
        }

        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => this.complete(checkbox.dataset.id));
        });

        container.querySelectorAll('.task-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.remove(btn.dataset.id);
            });
        });

        container.querySelectorAll('.task-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(btn.dataset.id);
            });
        });
    },

    renderDoneList() {
        const container = document.getElementById('doneList');
        if (!container) return;

        const todos = this.getCompleted().slice(0, 50);

        if (todos.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>暂无已完成任务</p></div>';
            return;
        }

        container.innerHTML = todos.map(todo => this.renderDoneItem(todo)).join('');

        if (window.lucide) {
            window.lucide.createIcons();
        }

        container.querySelectorAll('.task-action-btn.restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.uncomplete(btn.dataset.id);
            });
        });

        container.querySelectorAll('.task-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.remove(btn.dataset.id);
            });
        });
    },

    renderMonthlyList() {
        const container = document.getElementById('monthlyList');
        if (!container) return;

        const todos = this.getMonthly();

        if (todos.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>暂无每月目标<br><small>添加任务时选择"每月目标"即可添加</small></p></div>';
            return;
        }

        container.innerHTML = todos.map(todo => this.renderTodoItem(todo, true)).join('');

        if (window.lucide) {
            window.lucide.createIcons();
        }

        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => this.complete(checkbox.dataset.id));
        });

        container.querySelectorAll('.task-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.remove(btn.dataset.id);
            });
        });

        container.querySelectorAll('.task-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(btn.dataset.id);
            });
        });
    },

    showEditModal(id) {
        const todo = this.getById(id);
        if (!todo) return;

        const modal = document.getElementById('editTaskModal');
        if (!modal) return;

        document.getElementById('editTaskInput').value = todo.content;
        document.getElementById('editTaskId').value = todo.id;

        const categoryWrapper = document.getElementById('editTaskCategoryWrapper');
        const categoryValueEl = categoryWrapper.querySelector('.custom-select-value');
        categoryValueEl.textContent = this.getCategoryInfo(todo.category).name;
        categoryValueEl.style.color = this.getCategoryInfo(todo.category).color;

        const priorityWrapper = document.getElementById('editTaskPriorityWrapper');
        const priorityValueEl = priorityWrapper.querySelector('.custom-select-value');
        const priorityLabels = { p1: '高', p2: '中', p3: '低' };
        const priorityColors = { p1: '#C45A4A', p2: '#B08A4A', p3: '#4A8A4D' };
        priorityValueEl.textContent = priorityLabels[todo.priority];
        priorityValueEl.style.color = priorityColors[todo.priority];

        modal.classList.add('show');
    },

    hideEditModal() {
        const modal = document.getElementById('editTaskModal');
        if (modal) modal.classList.remove('show');
    },

    saveEdit() {
        const id = document.getElementById('editTaskId').value;
        const content = document.getElementById('editTaskInput').value.trim();
        if (!content || !id) return;

        const categoryWrapper = document.getElementById('editTaskCategoryWrapper');
        const priorityWrapper = document.getElementById('editTaskPriorityWrapper');

        const categoryOptions = {
            '工作': 'work', '学习': 'study', '健康': 'health', '运动': 'sports',
            '生活': 'life', '写作': 'writing', '未来': 'future', '休息': 'rest'
        };
        const priorityOptions = { '高': 'p1', '中': 'p2', '低': 'p3' };

        const category = categoryOptions[categoryWrapper.querySelector('.custom-select-value').textContent] || 'work';
        const priority = priorityOptions[priorityWrapper.querySelector('.custom-select-value').textContent] || 'p2';

        this.update(id, { content, category, priority });
        this.hideEditModal();
    },

    renderTodoItem(todo, showMonthly = false) {
        const category = this.getCategoryInfo(todo.category);
        const date = new Date(todo.createdAt).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="task-item ${todo.isMonthly ? 'monthly-item' : ''}" data-id="${todo.id}">
                <div class="task-checkbox" data-id="${todo.id}">
                    <i data-lucide="check"></i>
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(todo.content)}</div>
                    <div class="task-meta">
                        ${todo.isMonthly ? `<span class="task-badge monthly-badge"><span class="badge-star">&#9733;</span>每月目标</span>` : `<span class="task-category" style="background: ${category.color}15; color: ${category.color};">${category.name}</span>`}
                        ${todo.isMonthly ? '' : `<span class="task-priority ${todo.priority}">${todo.priority === 'p1' ? '高' : todo.priority === 'p2' ? '中' : '低'}</span>`}
                        <span>${date}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" data-id="${todo.id}" title="编辑">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="task-action-btn delete" data-id="${todo.id}" title="删除">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    renderDoneItem(todo) {
        const category = this.getCategoryInfo(todo.category);
        const date = new Date(todo.completedAt).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="task-item completed ${todo.isMonthly ? 'monthly-completed' : ''}" data-id="${todo.id}">
                <div class="task-checkbox checked" data-id="${todo.id}">
                    <i data-lucide="check"></i>
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(todo.content)}</div>
                    <div class="task-meta">
                        ${todo.isMonthly ? '<span class="task-badge monthly-badge"><span class="badge-star">&#9733;</span>每月目标</span>' : `<span class="task-category" style="background: ${category.color}15; color: ${category.color};">${category.name}</span>`}
                        ${todo.focusDuration ? `<span>专注 ${todo.focusDuration} 分钟</span>` : ''}
                        <span>完成于 ${date}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn restore" data-id="${todo.id}" title="恢复">
                        <i data-lucide="rotate-ccw"></i>
                    </button>
                    <button class="task-action-btn delete" data-id="${todo.id}" title="删除">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
