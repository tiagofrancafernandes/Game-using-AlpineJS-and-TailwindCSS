// import Alpine from 'alpinejs'

// window.Alpine = Alpine;

window.NumberHelpers = {
    toInt(value, positiveOnly = false) {
        value = parseInt(value);
        value = !isNaN(value) ? value : parseInt(0);

        if (positiveOnly) {
            return value >= 0 ? value : 0;
        }

        return value;
    },
    toFloat(value, positiveOnly = false) {
        value = parseFloat(value);
        value = !isNaN(value) ? value : parseFloat(0.00);

        if (positiveOnly) {
            return value >= 0 ? value : 0.00;
        }

        return value;
    },
    formatTimer: (totalSeg) => {
        totalSeg = parseInt(totalSeg);
        totalSeg = !isNaN(totalSeg) && totalSeg > 0 ? totalSeg : 0;

        let min = parseInt(totalSeg / 60);
        let seg = totalSeg % 60;
        let formated = [min, seg].map(item => item.toString().padStart(2, 0)).join(':');

        return {
            min,
            seg,
            totalSeg,
            totalLeft: totalSeg,
            formated,
        };
    },
};

window.themeManager = {
    get isDarkMode() {
        return localStorage.getItem('theme') === 'dark' || (
            !localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches
        );
    },
    get isLightMode() {
        return !this.isDarkMode;
    },
    setMode(value = null) {
        let darkMode = null;
        let lightAuto = false;
        let valueAuto = value === 'auto';

        if (['dark', 'light'].includes(value)) {
            darkMode = (value === 'dark');
        }

        if (valueAuto) {
            darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document?.documentElement?.classList?.remove('light');
            document?.documentElement?.classList?.remove('dark');
        }

        darkMode = darkMode !== null ? darkMode : localStorage.getItem('theme') === 'dark' || (
            !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches
        );

        localStorage.setItem('theme', darkMode ? 'dark' : 'light');

        if (!darkMode && valueAuto) {
            localStorage.removeItem('theme');
        }

        if (darkMode) {
            document?.documentElement?.classList?.remove('light');
            document?.documentElement?.classList?.add('dark');

            return;
        }

        document?.documentElement?.classList?.remove('dark');

        if (!lightAuto) {
            document?.documentElement?.classList?.add('light');
        }
    },
    toggleColorMode() {
        this.setMode(this.isLightMode ? 'dark' : 'light');
    },
}

window.tryJsonDecode = (content, defaultValue = null) => {
    try {
      if (!content || typeof content !== 'string') {
            return defaultValue;
      }

      return JSON.parse(content);
    } catch(error) {
        return defaultValue;
    }
}

document.addEventListener('alpine:init', () => {
    Alpine.data('gameData', () => ({
        playerName: null,
        editPlayerName: false,
        score: 0,
        giftOn: 0,
        position: 0,
        timerConfig: {
            minutes: 1,
            seconds: 0,
        },
        currentTimeLeft: {
            formatTimer: null,
            intervalID: null,
        },
        modalMessage: {
            showModal: false,
            showNewGameButton: true,
            showContinueGameButton: true,
            line1: '',
            line2: '',
            line3: '',
        },
        latestScores: [],
        showResetScoreConfirmModal: false,
        showControls: false,
        showHelp: false,
        darkMode: null,
        init() {
            this.darkMode = window?.themeManager?.isDarkMode;
            this.loadLatestScores();
            this.showModal('Square Game');
            // this.startNewGame();
            this.playerName = localStorage.getItem('playerName') || 'Player';

            let showControls = window?.tryJsonDecode(localStorage.getItem('showControls'), false) || false;
            this.showControls = showControls;
        },

        get isDarkMode() {
            return this.darkMode ? true : false;
        },

        get width() {
            return 8;
        },

        get height() {
            return 8;
        },

        get fieldSize() {
            return (this.width * this.height);
        },

        get giftContent() {
            return `🎁`;
        },

        get timeLeft() {
            if (!this.currentTimeLeft || !this.currentTimeLeft?.formatTimer) {
                return '';
            }

            return this.currentTimeLeft?.formatTimer?.formated || '::'
        },

        get canPlay() {
            if (!this.currentTimeLeft || !this.currentTimeLeft?.formatTimer) {
                return false;
            }

            let totalLeft = this.currentTimeLeft?.formatTimer?.totalSeg ||
                this.currentTimeLeft?.formatTimer?.totalLeft;

            totalLeft = parseInt(totalLeft);

            return !isNaN(totalLeft) && totalLeft > 0 ? true : false;
        },

        get highScoreObject() {
            return this.getHighScoreObject() || {};
        },

        get appInfo() {
            let year = (new Date()).getFullYear();
            let url = [location.origin, location.pathname].join('');
            let logoPath = 'img/mini-game-logo-color.svg'
            let logoSrc = [url, logoPath].join('/');

            return {
                url,
                repoUrl: 'https://github.com/tiagofrancafernandes/Game-using-AlpineJS-and-TailwindCSS',
                name: 'Mini Game',
                title: 'AlpineJS + TailwindCSS Game',
                year,
                logoSrc,
                logoPath,
            };
        },

        get helpContent() {
            const easyCreateElement = (elementName, content = '', attributes = {}) => {
                let element = document.createElement(elementName);
                element.innerHTML = content || '';

                attributes = attributes && typeof attributes === 'object' && !Array.isArray(attributes)
                    ? attributes : {};

                for (let item of Object.entries(attributes)) {
                    let [attribute, value] = item;

                    element.setAttribute(attribute, value || '');
                }

                return element;
            }

            let paragraph = (content) => {
                return easyCreateElement('p', content, {
                    class: 'mb-2 text-gray-500 dark:text-gray-400'
                });
            }

            let elements = [
                paragraph('Controls:'),
            ];

            let keys = [
                ['N', 'Start a new game'],
                ['P', 'Play/Pause'],
                ['R', 'Restart the game'],
                ['S', 'Abrupt stop in current game'],

                // L
            ];

            let createKeyComponent = (content) => {
                component = document.createElement('span');
                component.innerHTML = content;
                component.classList.add(
                    'inline',
                    'text-center',
                    'w-4',
                    'h-4',
                    'px-1',
                    'justify-center',
                    'text-xs',
                    'font-medium',
                    'text-gray-700',
                    'bg-white',
                    'border',
                    'border-gray-200',
                    'rounded-md',
                    'hover:bg-gray-100',
                    'hover:text-blue-700',
                    'focus:z-10',
                    'focus:ring-0',
                    'focus:ring-gray-300',
                    'dark:focus:ring-gray-500',
                    'dark:bg-gray-800',
                    'focus:outline-none',
                    'dark:text-gray-400',
                    'dark:border-gray-600',
                    'dark:hover:text-white',
                    'dark:hover:bg-gray-700',
                );

              return component
            }

            let keysContents = document.createElement('ul');
            keysContents.classList.add('ps-5','text-gray-500','list-disc','dark:text-gray-400');

            for (let item of keys) {
                let [key, text] = item;
                let keysContent = document.createElement('li');
                let keyEl = createKeyComponent(key);
                keysContent.innerHTML = `${keyEl.outerHTML} ${text}`;
                keysContents.appendChild(keysContent);
            }

            elements.push(keysContents);

            return elements;
        },

        get gameIsPaused() {
            if (!this.currentTimeLeft) {
                return false;
            }

            if (this.currentTimeLeft?.formatTimer?.totalSeg && this.currentTimeLeft?.intervalID) {
                return false;
            }

            if (this.currentTimeLeft?.formatTimer?.totalSeg && this.currentTimeLeft?.intervalID === null) {
                return true;
            }

            return false;
        },

        get gameIsPlaying() {
            if (!this.currentTimeLeft) {
                return false;
            }

            if (
                this.currentTimeLeft?.formatTimer
                && this.currentTimeLeft?.formatTimer?.totalSeg > 1
                && this.currentTimeLeft?.intervalID > 1
            ) {
                return true;
            }

            return false;
        },

        toggleColorMode() {
            if (!window?.themeManager) {
                return;
            }

            window?.themeManager?.toggleColorMode();
            this.darkMode = window?.themeManager?.isDarkMode;
        },

        openResetScoreConfirm() {
            this.showResetScoreConfirmModal = true;
        },

        toggleShowControls() {
            this.showControls = !this.showControls;
            localStorage.setItem('showControls', this.showControls);

            this.focusOnGameControl();
        },

        closeResetScoreConfirm() {
            this.showResetScoreConfirmModal = false;
        },

        __ConfirmTheResetScore() {
            if (!this.showResetScoreConfirmModal) {
                return;
            }

            this.latestScores = [];
            localStorage.setItem('latestScores', JSON.stringify(this.latestScores));
            this.closeResetScoreConfirm();
        },

        scrollToGameArea() {
            // const gameAreaElement = document.querySelector('[data-id="before-game"]');
            const gameAreaElement = document.querySelector('[x-data="gameData"]');

            if (!gameAreaElement) {
                return;
            }

	        gameAreaElement.scrollIntoView({ behavior: "smooth", block: "start" });
        },

        confirmEditName() {
            let newPlayerName = this.$refs?.playerNameInput?.value || 'Player';
            newPlayerName = (`${newPlayerName}`).trim();
            this.playerName = newPlayerName;

            localStorage.setItem('playerName', newPlayerName);
            this.editPlayerName = false;
        },

        showModal(
            line1 = '',
            line2 = '',
            line3 = '',
            showNewGameButton = true,
            showContinueGameButton = false,
        ) {
            this.modalMessage['showModal'] = true;
            this.modalMessage['showNewGameButton'] = showNewGameButton;
            this.modalMessage['showContinueGameButton'] = showContinueGameButton;
            this.modalMessage['line1'] = line1;
            this.modalMessage['line2'] = line2;
            this.modalMessage['line3'] = line3;
        },

        hidenModal() {
            this.modalMessage['showModal'] = false;
            this.modalMessage['line1'] = '';
            this.modalMessage['line2'] = '';
            this.modalMessage['line3'] = '';
        },

        countdownTimer(minutes = 0, seconds = 0, whenFinish = null) {
            whenFinish = typeof whenFinish === 'function' ? whenFinish : (fmt) => {
                console.log('Finished!', fmt);
            };

            minutes = parseInt(minutes);
            minutes = !isNaN(minutes) && minutes > 0 ? minutes : 0;

            seconds = parseInt(seconds);
            seconds = !isNaN(seconds) && seconds > 0 ? seconds : 0;

            let totalSeg = (minutes * 60) + seconds;
            let value = totalSeg;

            if (this.currentTimeLeft.intervalID && !isNaN(parseInt(this.currentTimeLeft.intervalID))) {
                clearInterval(this.currentTimeLeft.intervalID);
            }

            this.currentTimeLeft.intervalID = setInterval(() => {
                let formatedValue = globalThis?.NumberHelpers?.formatTimer(value);
                this.currentTimeLeft.formatTimer = formatedValue;

                if (--value < 0) {
                    clearInterval(this.currentTimeLeft.intervalID);
                    whenFinish(formatedValue);
                }
            }, 1000);
        },

        generateCurrentScore() {
            let {
                minutes,
                seconds,
            } = this.timerConfig;

            minutes = globalThis?.NumberHelpers?.toInt(minutes, true);
            seconds = globalThis?.NumberHelpers?.toInt(seconds, true);

            let timeLimit = globalThis?.NumberHelpers?.formatTimer(minutes * 60 + seconds)?.formated || '00:00';

            let scoreData = {
                name: this.playerName,
                grid: [this.width, this.height].join('x'),
                timeLimit: timeLimit,
                score: this.score,
                date: (new Date()).toISOString(),
            };

            console.log('scoreData', scoreData);

            return scoreData;
        },

        restartTimer(
            minutes = null,
            seconds = null,
        ) {
            let hasValue = (minutes || seconds);
            minutes = hasValue ? minutes : (this.timerConfig['minutes'] ?? null);
            seconds = hasValue ? seconds : (this.timerConfig['seconds'] ?? null);

            minutes = globalThis?.NumberHelpers?.toInt(minutes, true);
            seconds = globalThis?.NumberHelpers?.toInt(seconds, true);

            this.countdownTimer(minutes, seconds, (fmt) => {
                let message = 'End of time!';

                let currentScore = this.generateCurrentScore();

                let toCompareScore = [
                    globalThis?.NumberHelpers?.toInt(currentScore?.score, true),
                    globalThis?.NumberHelpers?.toInt(this.getHighScoreObject()?.score, true),
                ];

                let isHighScore = (toCompareScore[0] > toCompareScore[1]);

                let highScoreText = document.createElement('span');
                highScoreText.classList.add(
                    'text-orange-600/100',
                    'dark:text-orange-400/100',
                    'animate-bounce',
                    'text-sm',
                );
                highScoreText.innerHTML = 'NEW HIGH SCORE!';

                this.showModal(
                    message,
                    `Score: ${this.score}`,
                    isHighScore ? `
                    <div class="relative rounded-xl overflow-auto px-2 pt-1">
                        <div class="flex justify-center">
                            <div class="animate-bounce text-slate-800 dark:text-slate-800 p-2 ring-0 flex items-center justify-center">
                                ${highScoreText.outerHTML}
                            </div>
                        </div>
                    </div>
                    ` : '',
                );

                this.pushScore(currentScore);
            });
        },

        loadLatestScores() {
            let latestScores = localStorage.getItem('latestScores');
            latestScores = latestScores || '[]';
            latestScores = JSON.parse(latestScores);
            this.latestScores = Array.isArray(latestScores) ? latestScores : [];

            localStorage.setItem('latestScores', JSON.stringify(this.latestScores));
        },

        pushScore(scoreData = null) {
            if (!Array.isArray(this.latestScores)) {
                this.latestScores = [];
            }

            if (!scoreData || typeof scoreData !== 'object' || Array.isArray(scoreData) || !scoreData?.score) {
                return;
            }

            this.latestScores.unshift(scoreData);

            localStorage.setItem('latestScores', JSON.stringify(this.latestScores));
        },

        _old_getHighScoreObject() {
            if (!Array.isArray(this.latestScores)) {
                this.latestScores = [];
            }

            if (!this.latestScores.length) {
                return null;
            }

            let highScore = -Infinity;
            let highScoreObject = null;

            this.latestScores?.forEach(objeto => {
                if (objeto.score > highScore) {
                    highScore = objeto.score;
                    highScoreObject = objeto;
                    return;
                }

                highScoreObject = objeto;
            });

            return highScoreObject;
        },

        getLatestScores() {
            if (!Array.isArray(this.latestScores)) {
                this.latestScores = [];
            }

            if (!this.latestScores.length) {
                return null;
            }

            let getSecs = (time) => {
                time = time || 0;
                time = (`${time}`).trim().split(':');
                let min = parseInt(time[0] || 0);
                return parseInt(time[1] || 0) + (min * 60);
            }

            let items = this.latestScores || [];

            items.sort((a, b) => {
                if (a.score === b.score) {
                    return getSecs(a.time) - getSecs(b.time); // menor tempo
                }

                return b.score - a.score; // maior score
            });

            items = items.slice(0, 30);

            this.latestScores = items;

            return this.latestScores || [];
        },

        getHighScoreObject() {
            return (this.getLatestScores() || [])[0] || null;
        },

        pauseGame() {
            if (this.currentTimeLeft?.intervalID && !isNaN(this.currentTimeLeft?.intervalID)) {
                clearInterval(this.currentTimeLeft?.intervalID);

                this.currentTimeLeft.intervalID = null;
            }

            this.showModal(
                'Paused!',
                '',
                '',
                true,
                true,
            );
        },

        continueGame() {
            if (!this.currentTimeLeft?.formatTimer || !this.gameIsPaused) {
                return;
            }

            this.hidenModal();

            this.restartTimer(
                null,
                this.currentTimeLeft?.formatTimer?.totalSeg,
            );

            this.closeResetScoreConfirm();
            this.focusOnGameControl();
            this.scrollToGameArea();
        },

        stopGame() {
            if (!this.gameIsPlaying) {
                return;
            }

            if (this.currentTimeLeft?.intervalID && !isNaN(this.currentTimeLeft?.intervalID)) {
                clearInterval(this.currentTimeLeft?.intervalID);
            }

            this.score = 0;
            this.currentTimeLeft = {
                formatTimer: null,
                intervalID: null,
            };

            this.showModal(
                'Abrupt stop!',
                '',
                '',
                true,
                false,
            );
        },

        startNewGame() {
            this.score = 0;

            this.showModal(
                'Starting new game',
                '',
                '',
                false,
                false,
            );

            setTimeout(() => {
                this.hidenModal();
                this.closeResetScoreConfirm();
                this.newRandomPosition();
                this.newGiftPosition();
                this.focusOnGameControl();
                this.restartTimer();
                this.scrollToGameArea();
            }, 600);
        },

        giftContentFor(value) {
            return value === this.giftOn ? this.giftContent : '';
        },

        focusOnGameControl() {
            if (!this.$refs?.gameControl) {
                return;
            }

            this.$refs?.gameControl?.focus();
        },

        whenClickOnGameFild(event) {
            if (!this.gameIsPlaying) {
                return;
            }

            this.focusOnGameControl();
            this.scrollToGameArea();
        },

        setPosition(newPosition) {
            if (this.gameIsPaused) {
                return;
            }

            this.focusOnGameControl();
            newPosition = parseInt(newPosition);

            if (isNaN(newPosition)) {
                return;
            }

            if (newPosition > this.fieldSize) {
                return;
            }

            if (newPosition < 1) {
                return;
            }

            if (this.position === newPosition) {
                return;
            }

            this.position = newPosition;

            if (newPosition === this.giftOn) {
                this.catchGift();
            }
        },

        catchGift() {
            this.incrementScore();
            this.newGiftPosition();
        },

        randomNumber(min = 1, max = 1000, except = [], maxRetry = 300) {
            const generateValue = () => Math.floor(Math.random() * (max - min)) + 1;

            let newValue = generateValue();

            if (!except.includes(newValue)) {
                return newValue;
            }

            for (let i = 0; i <= maxRetry; i++) {
                newValue = generateValue();

                if (!except.includes(newValue)) {
                    return newValue;
                }
            }

            return null;
        },

        randomPosition(except = []) {
            return this.randomNumber(1, this.fieldSize, except);
        },

        newGiftPosition() {
            let newGiftPosition = this.randomPosition([
                this.giftOn,
                this.position,
            ]);

            this.giftOn = newGiftPosition;
        },

        newRandomPosition() {
            let newGiftPosition = this.randomPosition([
                this.giftOn,
                this.position,
            ]);

            this.position = newGiftPosition;

            console.log('getHighScoreObject', this.getHighScoreObject());
        },

        incrementScore() {
            this.score = this.score + 1;
        },

        incrementPosition() {
            this.setPosition(this.position + 1);
        },

        decrementPosition() {
            this.setPosition(this.position - 1);
        },

        onArrowUp() {
            this.setPosition(this.position - this.width);
        },

        onArrowRight() {
            if (this.position % this.width === 0) {
                return;
            }

            this.incrementPosition();
        },

        onArrowLeft() {
            if ((this.position - 1) % this.width === 0) {
                return;
            }

            this.decrementPosition();
        },

        onArrowDown() {
            this.setPosition(this.position + this.width);
        },

        gameControlKeyUpAction(event) {
            // console.log('gameControlKeyUpAction', event);
        },

        gameControlKeyDownAction(event) {
            let { key, code, keyCode, ctrlKey, shiftKey } = event;

            if (event?.target) {
                event.target.value = '';
            }

            let lKey = [code, key].includes('KeyL') || [code, key].includes('L') || keyCode === 76;

            if (lKey && ctrlKey && shiftKey) {
                console.clear();
                return;
            }

            if ([code, key].includes('KeyR') && !ctrlKey && !shiftKey) {
                this.startNewGame();
                return;
            }

            if ([code, key].includes('KeyN') && !ctrlKey && !shiftKey) {
                this.startNewGame();
                return;
            }

            if ([code, key].includes('KeyS') && !ctrlKey && !shiftKey) {
                this.stopGame();
                return;
            }

            if ([code, key].includes('KeyP') && !ctrlKey && !shiftKey) {
                if (!this.currentTimeLeft?.formatTimer) {
                    return;
                }

                if (this.gameIsPlaying && !this.gameIsPaused) {
                    this.pauseGame();
                    return;
                }

                if (this.currentTimeLeft?.formatTimer && this.gameIsPaused) {
                    this.continueGame();
                    return;
                }

                return;
            }

            if (!this.canPlay) {
                console.log('this.canPlay', this.canPlay);
                return;
            }

            if (keyCode === 38 || [code, key].includes('ArrowUp')) {
                this.onArrowUp();
                return;
            }

            if (keyCode === 39 || [code, key].includes('ArrowRight')) {
                this.onArrowRight();
                return;
            }

            if (keyCode === 37 || [code, key].includes('ArrowLeft')) {
                this.onArrowLeft();
                return;
            }

            if (keyCode === 40 || [code, key].includes('ArrowDown')) {
                this.onArrowDown();
                return;
            }

            console.log('gameControlKeyDownAction', event);
        },
    }))
});

// Alpine.start();

window.themeManager.setMode(window.themeManager.isDarkMode ? 'dark' : 'light');

document.addEventListener('DOMContentLoaded', () => {
    if (!window.themeManager) {
        return;
    }

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', event => {
        window.themeManager.setMode(event.matches ? 'dark' : 'auto');
    });
});
