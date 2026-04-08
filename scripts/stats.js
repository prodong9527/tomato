const Stats = {
    stats: null,
    calendarMonthOffset: 0,
    calendarViewMode: 'time',

    init() {
        this.stats = Storage.getStats();
    },

    refresh() {
        this.stats = Storage.getStats();
    },

    getToday() {
        const today = new Date().toISOString().split('T')[0];
        return this.stats.dailyStats[today] || { tomatoes: 0, totalFocusTime: 0, tasksCompleted: 0 };
    },

    getWeek() {
        const result = { tomatoes: 0, totalFocusTime: 0, tasksCompleted: 0 };
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = this.stats.dailyStats[dateStr];
            if (dayData) {
                result.tomatoes += dayData.tomatoes;
                result.totalFocusTime += dayData.totalFocusTime;
                result.tasksCompleted += dayData.tasksCompleted;
            }
        }

        return result;
    },

    getMonth() {
        const result = { tomatoes: 0, totalFocusTime: 0, tasksCompleted: 0 };
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = this.stats.dailyStats[dateStr];
            if (dayData) {
                result.tomatoes += dayData.tomatoes;
                result.totalFocusTime += dayData.totalFocusTime;
                result.tasksCompleted += dayData.tasksCompleted;
            }
        }

        return result;
    },

    getYear() {
        const result = { tomatoes: 0, totalFocusTime: 0, tasksCompleted: 0 };

        Object.values(this.stats.dailyStats).forEach(dayData => {
            result.tomatoes += dayData.tomatoes;
            result.totalFocusTime += dayData.totalFocusTime;
            result.tasksCompleted += dayData.tasksCompleted;
        });

        return result;
    },

    getHeatLevel(tomatoes) {
        if (tomatoes === 0) return 0;
        if (tomatoes <= 2) return 1;
        if (tomatoes <= 5) return 2;
        if (tomatoes <= 8) return 3;
        return 4;
    },

    getComparison(period) {
        let current, previous;

        if (period === 'week') {
            current = this.getWeek();
            previous = this.getWeek(true);
        } else if (period === 'month') {
            current = this.getMonth();
            previous = this.getMonth(true);
        } else {
            return null;
        }

        if (previous.tomatoes === 0) {
            return current.tomatoes > 0 ? { direction: 'up', percent: 100 } : null;
        }

        const change = ((current.tomatoes - previous.tomatoes) / previous.tomatoes) * 100;

        return {
            direction: change >= 0 ? 'up' : 'down',
            percent: Math.abs(Math.round(change))
        };
    },

    getWeek(skipCurrent = false) {
        const result = { tomatoes: 0, totalFocusTime: 0 };
        const today = new Date();
        const startOffset = skipCurrent ? 14 : 7;

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i + startOffset));
            const dateStr = date.toISOString().split('T')[0];
            const dayData = this.stats.dailyStats[dateStr];
            if (dayData) {
                result.tomatoes += dayData.tomatoes;
                result.totalFocusTime += dayData.totalFocusTime;
            }
        }

        return result;
    },

    getMonth(skipCurrent = false) {
        const result = { tomatoes: 0, totalFocusTime: 0 };
        const today = new Date();
        const startOffset = skipCurrent ? 60 : 30;

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i + startOffset));
            const dateStr = date.toISOString().split('T')[0];
            const dayData = this.stats.dailyStats[dateStr];
            if (dayData) {
                result.tomatoes += dayData.tomatoes;
                result.totalFocusTime += dayData.totalFocusTime;
            }
        }

        return result;
    },

    formatTime(minutes) {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    },

    getOverdueCountForPeriod(period) {
        const today = new Date();
        const todayStr = this.getDateString(today);

        // 获取该周期内的时间范围
        let startDate, endDate;
        if (period === 'day') {
            startDate = todayStr;
            endDate = todayStr;
        } else if (period === 'week') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            startDate = this.getDateString(startDate);
            endDate = new Date(today);
            endDate.setDate(today.getDate() + (6 - today.getDay()));
            endDate = this.getDateString(endDate);
        } else if (period === 'month') {
            startDate = this.getDateString(new Date(today.getFullYear(), today.getMonth(), 1));
            endDate = this.getDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        } else if (period === 'year') {
            startDate = `${today.getFullYear()}-01-01`;
            endDate = `${today.getFullYear()}-12-31`;
        } else {
            startDate = todayStr;
            endDate = todayStr;
        }

        // 统计在该周期内已逾期但未完成的任务
        return Todos.todos.filter(t => {
            if (t.completedAt) return false;
            if (t.isMonthly) return false;
            if (!t.targetDate || t.targetDate === 'week') return false;
            // 任务的目标日期在该周期内且已逾期
            return t.targetDate >= startDate && t.targetDate <= endDate && t.targetDate < todayStr;
        }).length;
    },

    getDateString(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },

    getCategoryStatsForPeriod(period) {
        const stats = { work: 0, study: 0, health: 0, sports: 0, life: 0, writing: 0, future: 0, rest: 0 };

        const today = new Date();
        const todayStr = this.getDateString(today);

        // 获取该周期内的时间范围
        let startDate, endDate;
        if (period === 'day') {
            startDate = todayStr;
            endDate = todayStr;
        } else if (period === 'week') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            startDate = this.getDateString(startDate);
            endDate = new Date(today);
            endDate.setDate(today.getDate() + (6 - today.getDay()));
            endDate = this.getDateString(endDate);
        } else if (period === 'month') {
            startDate = this.getDateString(new Date(today.getFullYear(), today.getMonth(), 1));
            endDate = this.getDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        } else if (period === 'year') {
            startDate = `${today.getFullYear()}-01-01`;
            endDate = `${today.getFullYear()}-12-31`;
        } else {
            startDate = todayStr;
            endDate = todayStr;
        }

        // 过滤在该周期内完成的任务
        Todos.todos.filter(t => {
            if (!t.completedAt) return false;
            const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
            return completedDate >= startDate && completedDate <= endDate;
        }).forEach(t => {
            if (stats[t.category] !== undefined) {
                stats[t.category]++;
            } else {
                stats.work++;
            }
        });

        return stats;
    },

    changeCalendarMonth(delta) {
        this.calendarMonthOffset += delta;
        this.renderCalendar();
    },

    setCalendarViewMode(mode) {
        this.calendarViewMode = mode;
        this.renderCalendar();
    },

    render(period = 'day') {
        let data;

        switch (period) {
            case 'day':
                data = this.getToday();
                break;
            case 'week':
                data = this.getWeek();
                break;
            case 'month':
                data = this.getMonth();
                break;
            case 'year':
                data = this.getYear();
                break;
            default:
                data = this.getToday();
        }

        const tomatoesEl = document.getElementById('statTomatoes');
        const focusTimeEl = document.getElementById('statFocusTime');
        const tasksEl = document.getElementById('statTasks');
        const avgEl = document.getElementById('statAvg');
        const trendEl = document.getElementById('statTomatoesTrend');

        if (tomatoesEl) tomatoesEl.textContent = data.tomatoes;
        if (focusTimeEl) focusTimeEl.textContent = this.formatTime(data.totalFocusTime);
        if (tasksEl) tasksEl.textContent = data.tasksCompleted;

        const overdueCount = this.getOverdueCountForPeriod(period);
        if (avgEl) avgEl.textContent = overdueCount;

        const comparison = this.getComparison(period);
        if (trendEl && comparison) {
            trendEl.textContent = `${comparison.direction === 'up' ? '+' : '-'}${comparison.percent}%`;
            trendEl.className = `stat-trend ${comparison.direction}`;
        } else if (trendEl) {
            trendEl.textContent = '';
            trendEl.className = 'stat-trend';
        }

        this.renderBarChart(period);
        this.renderPieChart(period);
        this.renderCalendar();
    },

    renderBarChart(period) {
        const container = document.getElementById('barChart');
        if (!container) return;

        let labels = [];
        let values = [];

        if (period === 'day') {
            const sessions = Storage.getSessions();
            const today = new Date().toISOString().split('T')[0];
            const todaySessions = sessions.filter(s => {
                const date = new Date(s.completedAt).toISOString().split('T')[0];
                return date === today;
            });

            const hourly = Array(24).fill(0);
            todaySessions.forEach(s => {
                const hour = new Date(s.completedAt).getHours();
                hourly[hour]++;
            });

            for (let i = 0; i < 24; i++) {
                if (i % 3 === 0) {
                    labels.push(`${i.toString().padStart(2, '0')}:00`);
                    values.push(hourly[i]);
                }
            }
        } else if (period === 'week') {
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayData = this.stats.dailyStats[dateStr];
                labels.push(date.toLocaleDateString('zh-CN', { weekday: 'short' }));
                values.push(dayData ? dayData.tomatoes : 0);
            }
        } else if (period === 'month') {
            const today = new Date();
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayData = this.stats.dailyStats[dateStr];
                labels.push(date.getDate().toString());
                values.push(dayData ? dayData.tomatoes : 0);
            }
        } else {
            const today = new Date();
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toLocaleDateString('zh-CN', { month: 'short' });
                labels.push(monthStr.replace('月', ''));

                let monthTomatoes = 0;
                const year = date.getFullYear();
                const month = date.getMonth();

                Object.entries(this.stats.dailyStats).forEach(([dateStr, dayData]) => {
                    const d = new Date(dateStr);
                    if (d.getFullYear() === year && d.getMonth() === month) {
                        monthTomatoes += dayData.tomatoes;
                    }
                });

                values.push(monthTomatoes);
            }
        }

        const maxValue = Math.max(...values, 1);

        container.innerHTML = values.map((v, i) => `
            <div class="bar-item">
                <div class="bar" style="height: ${(v / maxValue) * 120}px"></div>
                <span class="bar-label">${labels[i]}</span>
            </div>
        `).join('');
    },

    renderPieChart(period) {
        const container = document.getElementById('pieChart');
        if (!container) return;

        const categoryStats = this.getCategoryStatsForPeriod(period);
        const categories = Todos.CATEGORIES;

        const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);

        if (total === 0) {
            container.innerHTML = '<div class="pie-empty"><p>暂无分类数据</p></div>';
            return;
        }

        let currentAngle = 0;
        const segments = [];

        categories.forEach(cat => {
            const count = categoryStats[cat.id] || 0;
            if (count > 0) {
                const percentage = count / total;
                const angle = percentage * 360;
                segments.push({
                    ...cat,
                    count,
                    percentage,
                    angle,
                    startAngle: currentAngle,
                    endAngle: currentAngle + angle
                });
                currentAngle += angle;
            }
        });

        const radius = 80;
        const cx = 100;
        const cy = 100;

        let svgContent = `<svg viewBox="0 0 200 200" class="pie-svg">`;

        segments.forEach((seg, index) => {
            const startRad = (seg.startAngle - 90) * Math.PI / 180;
            const endRad = (seg.endAngle - 90) * Math.PI / 180;

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArc = seg.angle > 180 ? 1 : 0;

            if (seg.angle >= 360) {
                svgContent += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${seg.color}" class="pie-segment" data-category="${seg.id}"/>`;
            } else {
                svgContent += `<path d="M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z" fill="${seg.color}" class="pie-segment" data-category="${seg.id}"/>`;
            }
        });

        svgContent += `<circle cx="${cx}" cy="${cy}" r="50" fill="var(--surface)"/>`;
        svgContent += `</svg>`;

        let legendHtml = '<div class="pie-legend">';
        segments.forEach(seg => {
            legendHtml += `
                <div class="pie-legend-item" data-category="${seg.id}">
                    <span class="pie-legend-color" style="background: ${seg.color}"></span>
                    <span class="pie-legend-name">${seg.name}</span>
                    <span class="pie-legend-value">${seg.count}</span>
                </div>
            `;
        });
        legendHtml += '</div>';

        container.innerHTML = `<div class="pie-container">${svgContent}</div>${legendHtml}`;
    },

    renderCalendar() {
        const container = document.getElementById('calendarGrid');
        const monthLabel = document.getElementById('calendarMonth');
        if (!container) return;

        const today = new Date();
        const targetDate = new Date(today.getFullYear(), today.getMonth() - this.calendarMonthOffset, 1);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthName = targetDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

        if (monthLabel) monthLabel.textContent = monthName;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        let html = '<div class="calendar-weekdays">';
        ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
            html += `<span>${day}</span>`;
        });
        html += '</div>';
        html += '<div class="calendar-days">';

        let dayCounter = 1;
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const cellIndex = week * 7 + day;
                if (cellIndex < startDayOfWeek || dayCounter > daysInMonth) {
                    html += '<div class="calendar-cell empty"></div>';
                } else {
                    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayCounter.toString().padStart(2, '0')}`;
                    const dayData = this.stats.dailyStats[dateStr];
                    const isToday = dayCounter === today.getDate() && this.calendarMonthOffset === 0;
                    const tasks = Todos.getTasksForDate(dateStr);

                    let cellContent = '';
                    let cellStyle = '';
                    let cellClass = 'calendar-cell';

                    if (this.calendarViewMode === 'time') {
                        const percentage = dayData ? Math.min((dayData.totalFocusTime / (24 * 60)) * 100, 100) : 0;
                        const level = this.getHeatLevel(dayData ? dayData.tomatoes : 0);
                        cellClass += ` level-${level}`;
                        cellContent = `<span class="cell-day">${dayCounter}</span>`;
                        if (dayData && dayData.totalFocusTime > 0) {
                            cellContent += `<span class="cell-time">${this.formatTime(dayData.totalFocusTime)}</span>`;
                        }
                        cellStyle = `background: linear-gradient(to top, var(--success) ${percentage}%, rgba(45, 90, 74, 0.05) ${percentage}%);`;
                    } else if (this.calendarViewMode === 'tasks') {
                        const level = this.getHeatLevel(dayData ? dayData.tasksCompleted : 0);
                        cellClass += ` level-${level}`;
                        cellContent = `<span class="cell-day">${dayCounter}</span>`;
                        if (tasks.length > 0) {
                            const categoryCounts = {};
                            tasks.forEach(t => {
                                categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
                            });
                            const totalCount = tasks.length;
                            const bars = Object.entries(categoryCounts).map(([cat, count]) => {
                                const catInfo = Todos.getCategoryInfo(cat);
                                return {
                                    color: catInfo.color,
                                    height: (count / totalCount) * 100
                                };
                            });
                            const totalHeight = bars.reduce((sum, b) => sum + b.height, 0);
                            // Base opacity for all bars, plus layer reduction if > 100%
                            const baseOpacity = 0.5;
                            const layerOpacity = totalHeight > 100 ? 100 / totalHeight : 1;
                            let colorHtml = '';
                            let offset = 0;
                            bars.forEach(b => {
                                const h = Math.min(b.height, 100 - offset);
                                // First layer uses base opacity, overlaid layers multiply with layerOpacity
                                const barOpacity = offset === 0 ? baseOpacity : baseOpacity * layerOpacity;
                                colorHtml += `<div class="task-bar" style="height:${h}%;background:${b.color};bottom:${offset}%;opacity:${barOpacity};"></div>`;
                                offset += h;
                            });
                            cellContent += `<div class="task-bars">${colorHtml}</div>`;
                        }
                    } else if (this.calendarViewMode === 'names') {
                        cellClass += ' names-mode';
                        cellContent = `<span class="cell-day">${dayCounter}</span>`;
                        if (tasks.length > 0) {
                            let tasksHtml = '';
                            tasks.forEach(t => {
                                const catInfo = Todos.getCategoryInfo(t.category);
                                tasksHtml += `<div class="task-name-item" title="${this.escapeHtml(t.content)}">
                                    <span class="task-name-dot" style="background:${catInfo.color}"></span>
                                    <span class="task-name-text">${this.escapeHtml(t.content)}</span>
                                </div>`;
                            });
                            cellContent += `<div class="task-names" data-total="${tasks.length}">${tasksHtml}</div>`;
                        }
                    }

                    html += `<div class="${cellClass}" data-date="${dateStr}" style="${cellStyle}" ${isToday ? 'data-today="true"' : ''}>
                        ${cellContent}
                    </div>`;
                    dayCounter++;
                }
            }
        }

        html += '</div>';
        container.innerHTML = html;

        // Detect overflow in names-mode cells
        if (this.calendarViewMode === 'names') {
            container.querySelectorAll('.calendar-cell.names-mode .task-names').forEach(wrapper => {
                const total = parseInt(wrapper.dataset.total) || 0;
                // Remove any existing "+N more" before recalculating
                const existingMore = wrapper.querySelector('.task-name-more');
                if (existingMore) existingMore.remove();

                // Keep removing last item until it fits (or only 1 left)
                while (wrapper.querySelectorAll('.task-name-item').length > 1 &&
                       wrapper.scrollHeight > wrapper.clientHeight) {
                    const lastItem = wrapper.querySelector('.task-name-item:last-child');
                    if (lastItem) lastItem.remove();
                }

                const remaining = wrapper.querySelectorAll('.task-name-item').length;
                const hiddenCount = total - remaining;
                if (hiddenCount > 0) {
                    const moreDiv = document.createElement('div');
                    moreDiv.className = 'task-name-item task-name-more';
                    moreDiv.textContent = `+${hiddenCount} 更多`;
                    wrapper.appendChild(moreDiv);
                }
            });
        }

        container.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
            cell.addEventListener('click', () => {
                this.showCalendarCellModal(cell.dataset.date);
            });
        });
    },

    showCalendarCellModal(dateStr) {
        const modal = document.getElementById('calendarModal');
        const modalTitle = document.getElementById('calendarModalTitle');
        const modalBody = document.getElementById('calendarModalBody');

        if (!modal) return;

        const date = new Date(dateStr);
        const dateFormatted = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        const dayData = this.stats.dailyStats[dateStr] || { tomatoes: 0, totalFocusTime: 0, tasksCompleted: 0 };
        const tasks = Todos.getTasksForDate(dateStr);

        modalTitle.textContent = dateFormatted;

        let html = `
            <div class="cell-detail-stats">
                <div class="cell-detail-stat">
                    <span class="stat-value">${dayData.tomatoes}</span>
                    <span class="stat-label">番茄数</span>
                </div>
                <div class="cell-detail-stat">
                    <span class="stat-value">${this.formatTime(dayData.totalFocusTime)}</span>
                    <span class="stat-label">专注时长</span>
                </div>
                <div class="cell-detail-stat">
                    <span class="stat-value">${dayData.tasksCompleted}</span>
                    <span class="stat-label">完成任务</span>
                </div>
            </div>
        `;

        if (tasks.length > 0) {
            html += '<div class="cell-detail-tasks"><h4>完成任务</h4>';
            tasks.forEach(t => {
                const catInfo = Todos.getCategoryInfo(t.category);
                html += `
                    <div class="cell-task-item">
                        <span class="task-category-dot" style="background:${catInfo.color}"></span>
                        <span class="task-name">${this.escapeHtml(t.content)}</span>
                        <span class="task-time">${t.focusDuration ? this.formatTime(t.focusDuration) : ''}</span>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<div class="cell-detail-empty"><p>当日无完成记录</p></div>';
        }

        modalBody.innerHTML = html;
        modal.classList.add('show');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
