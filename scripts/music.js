const Music = {
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    mode: 'repeat-one',
    audio: null,
    volume: 70,
    isModalOpen: false,

    init() {
        this.loadPlaylist();
        this.initAudio();
        this.bindEvents();
        this.renderPlaylist();
    },

    loadPlaylist() {
        this.playlist = [
            { name: 'So Far Away (Acoustic)', file: 'Adam Christopher - So Far Away (Acoustic).mp3' },
            { name: 'Insomnia (治愈版)', file: 'Alisa - Insomnia (治愈版).mp3' },
            { name: 'Delete', file: 'Even仇依文 - Delete.mp3' },
            { name: 'Somewhere', file: 'July - Somewhere.mp3' },
            { name: 'The Name of Life', file: 'Miyako Chaki - The Name of Life.mp3' },
            { name: 'Invisible Umbrella', file: 'MoreanP - Invisible Umbrella.mp3' },
            { name: 'Is It Just Me', file: 'Sasha Alex Sloan - Is It Just Me.mp3' },
            { name: 'Illusionary Daytime', file: 'Shirfine - Illusionary Daytime.mp3' },
            { name: 'The Waking of Insects', file: 'THT,VIIOX - The Waking of Insects（惊蛰）.mp3' },
            { name: '山涧月', file: '变奏的梦想 - 山涧月.mp3' },
            { name: 'Merry Christmas Mr. Lawrence', file: '坂本龍一 - Merry Christmas Mr. Lawrence.mp3' },
            { name: '诀别书', file: '邓垚 - 诀别书.mp3' }
        ];
    },

    initAudio() {
        this.audio = new Audio();
        this.audio.volume = this.volume / 100;
        this.audio.loop = false;

        this.audio.addEventListener('ended', () => {
            this.handleSongEnd();
        });

        this.audio.addEventListener('error', (e) => {
            console.warn('Audio error:', e);
            if (this.isPlaying) {
                this.handleSongEnd();
            }
        });
    },

    bindEvents() {
        const musicToggle = document.getElementById('musicToggle');
        const musicPlayerModal = document.getElementById('musicPlayerModal');
        const musicPlayerClose = document.getElementById('musicPlayerClose');
        const musicPlayPauseBtn = document.getElementById('musicPlayPauseBtn');
        const musicPrevBtn = document.getElementById('musicPrevBtn');
        const musicNextBtn = document.getElementById('musicNextBtn');
        const musicRepeatOneBtn = document.getElementById('musicRepeatOneBtn');
        const musicShuffleBtn = document.getElementById('musicShuffleBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const musicPlaylistToggle = document.getElementById('musicPlaylistToggle');
        const musicPlaylist = document.getElementById('musicPlaylist');

        musicToggle?.addEventListener('click', () => {
            if (!this.isPlaying) {
                this.playRandom();
            } else {
                this.openModal();
            }
        });

        musicPlayerClose?.addEventListener('click', () => {
            this.closeModal();
        });

        musicPlayerModal?.addEventListener('click', (e) => {
            if (e.target === musicPlayerModal) {
                this.closeModal();
            }
        });

        musicPlayPauseBtn?.addEventListener('click', () => {
            this.togglePlayPause();
        });

        musicPrevBtn?.addEventListener('click', () => {
            this.playPrevious();
        });

        musicNextBtn?.addEventListener('click', () => {
            this.playNext();
        });

        musicRepeatOneBtn?.addEventListener('click', () => {
            this.setMode('repeat-one');
        });

        musicShuffleBtn?.addEventListener('click', () => {
            this.setMode('shuffle');
        });

        volumeSlider?.addEventListener('input', (e) => {
            this.setVolume(parseInt(e.target.value));
        });

        musicPlaylistToggle?.addEventListener('click', () => {
            musicPlaylist?.classList.toggle('open');
            const chevron = document.getElementById('playlistChevron');
            if (chevron) {
                chevron.style.transform = musicPlaylist?.classList.contains('open')
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
    },

    playRandom() {
        if (this.playlist.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.playlist.length);
        this.playTrack(randomIndex);
    },

    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentIndex = index;
        const track = this.playlist[index];
        this.audio.src = `bgm/${track.file}`;
        this.audio.play().catch(e => {
            console.warn('Play error:', e);
        });
        this.isPlaying = true;
        this.updateUI();
    },

    togglePlayPause() {
        if (this.currentIndex === -1) {
            this.playRandom();
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        this.updateUI();
    },

    playNext() {
        if (this.mode === 'shuffle') {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } while (nextIndex === this.currentIndex && this.playlist.length > 1);
            this.playTrack(nextIndex);
        } else {
            const nextIndex = (this.currentIndex + 1) % this.playlist.length;
            this.playTrack(nextIndex);
        }
    },

    playPrevious() {
        const prevIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playTrack(prevIndex);
    },

    handleSongEnd() {
        if (this.mode === 'repeat-one') {
            this.playTrack(this.currentIndex);
        } else {
            this.playNext();
        }
    },

    setMode(mode) {
        this.mode = mode;
        const repeatOneBtn = document.getElementById('musicRepeatOneBtn');
        const shuffleBtn = document.getElementById('musicShuffleBtn');

        if (repeatOneBtn && shuffleBtn) {
            repeatOneBtn.classList.toggle('active', mode === 'repeat-one');
            shuffleBtn.classList.toggle('active', mode === 'shuffle');
        }
    },

    setVolume(value) {
        this.volume = value;
        this.audio.volume = value / 100;

        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = `${value}%`;
        }

        const volumeIcon = document.querySelector('.volume-icon');
        if (volumeIcon) {
            if (value === 0) {
                volumeIcon.setAttribute('data-lucide', 'volume-x');
            } else if (value < 50) {
                volumeIcon.setAttribute('data-lucide', 'volume');
            } else {
                volumeIcon.setAttribute('data-lucide', 'volume-2');
            }
            if (window.lucide) window.lucide.createIcons();
        }
    },

    openModal() {
        const modal = document.getElementById('musicPlayerModal');
        if (modal) {
            modal.classList.add('open');
            this.isModalOpen = true;
            this.updateCurrentTrackDisplay();
            this.renderPlaylist();
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    },

    closeModal() {
        const modal = document.getElementById('musicPlayerModal');
        if (modal) {
            modal.classList.remove('open');
            this.isModalOpen = false;
        }
    },

    updateUI() {
        const musicIconIdle = document.querySelector('.music-icon-idle');
        const musicIconPlaying = document.querySelector('.music-icon-playing');
        const musicPlayIcon = document.getElementById('musicPlayIcon');
        const musicPauseIcon = document.getElementById('musicPauseIcon');

        if (musicIconIdle && musicIconPlaying) {
            musicIconIdle.classList.toggle('hidden', this.isPlaying);
            musicIconPlaying.classList.toggle('hidden', !this.isPlaying);
        }

        if (musicPlayIcon && musicPauseIcon) {
            musicPlayIcon.classList.toggle('hidden', this.isPlaying);
            musicPauseIcon.classList.toggle('hidden', !this.isPlaying);
        }

        this.updateCurrentTrackDisplay();
    },

    updateCurrentTrackDisplay() {
        const trackNameEl = document.querySelector('.music-track-name');
        if (trackNameEl) {
            if (this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
                trackNameEl.textContent = this.playlist[this.currentIndex].name;
            } else {
                trackNameEl.textContent = '选择一首歌开始播放';
            }
        }
    },

    renderPlaylist() {
        const playlistEl = document.getElementById('musicPlaylist');
        if (!playlistEl) return;

        playlistEl.innerHTML = this.playlist.map((track, index) => `
            <div class="playlist-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <span class="playlist-item-name">${track.name}</span>
                ${index === this.currentIndex && this.isPlaying ? '<i data-lucide="volume-2" class="playlist-playing-icon"></i>' : ''}
            </div>
        `).join('');

        playlistEl.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.playTrack(index);
                this.renderPlaylist();
            });
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    stop() {
        this.audio.pause();
        this.isPlaying = false;
        this.currentIndex = -1;
        this.updateUI();
    }
};

window.Music = Music;