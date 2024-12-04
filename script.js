// Game configuration
const GRID_SIZE = 15;
const WORDS = [
    'BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'CRYPTO', 'MINING',
    'WALLET', 'TOKEN', 'DEFI', 'NFT', 'ALTCOIN',
    'EXCHANGE', 'HODL', 'STAKING', 'DAPP', 'HASH',
    'LEDGER', 'PROTOCOL', 'SMART', 'CONTRACT', 'GAS',
    'FORK', 'NODE', 'SEED', 'CHAIN', 'BLOCK',
    'AVALANCHE', 'BULLISH', 'BEARISH'
];
const HIDDEN_WORDS = ['LEE', 'SCOTT', 'KEITH', 'PACA'];
const COOLDOWN_HOURS = 24;
const HIDDEN_WORD_BONUS = 500;

// Game state
let gameBoard = [];
let selectedCells = [];
let foundWords = new Set();
let foundHiddenWords = new Set();
let score = 0;
let startTime;
let timerInterval;
let username = '';

// DOM Elements
const gameBoardElement = document.getElementById('gameBoard');
const wordListElement = document.getElementById('wordList');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const signInOverlay = document.getElementById('signInOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const endGameBtn = document.getElementById('endGameBtn');
const tgUsernameInput = document.getElementById('tgUsername');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeGame);
startGameBtn.addEventListener('click', handleStartGame);
endGameBtn.addEventListener('click', handleEndGame);

// Game Initialization
function initializeGame() {
    checkCooldown();
    displayWordList();
}

function checkCooldown() {
    try {
        const lastGameTime = localStorage.getItem('lastGameTime');
        if (lastGameTime) {
            const timeSinceLastGame = Date.now() - parseInt(lastGameTime);
            const cooldownTime = COOLDOWN_HOURS * 60 * 60 * 1000;
            
            if (timeSinceLastGame < cooldownTime) {
                createCooldownOverlay(cooldownTime - timeSinceLastGame);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.warn('Storage access not available:', error);
        return true; // Allow game to proceed without cooldown if storage is not available
    }
}

function createCooldownOverlay(remainingTime) {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    
    const content = document.createElement('div');
    content.className = 'game-summary';
    
    const title = document.createElement('h2');
    title.textContent = 'Game Cooldown';
    
    const message = document.createElement('div');
    message.className = 'summary-content';
    message.innerHTML = '<p>You need to wait before starting a new game.</p>';
    
    const countdown = document.createElement('div');
    countdown.className = 'countdown';
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(countdown);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    updateCooldownTimer(countdown, remainingTime);
}

function updateCooldownTimer(element, remainingTime) {
    const updateTimer = () => {
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
        
        element.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        remainingTime -= 1000;
        if (remainingTime <= 0) {
            location.reload();
        }
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

function handleStartGame() {
    if (!checkCooldown()) return;
    
    username = tgUsernameInput.value.trim();
    if (!username) {
        alert('Please enter your Telegram username');
        return;
    }
    
    signInOverlay.style.display = 'none';
    startGame();
}

function startGame() {
    resetGame();
    generateBoard();
    startTimer();
    setupGameEvents();
}

function resetGame() {
    gameBoard = [];
    selectedCells = [];
    foundWords = new Set();
    foundHiddenWords = new Set();
    score = 0;
    updateScore();
}

// Board Generation
function generateBoard() {
    const allWords = [...HIDDEN_WORDS, ...WORDS];
    const tempBoard = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
    const placedWords = [];
    
    // Try to place all words
    for (const word of allWords) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!placed && attempts < maxAttempts) {
            const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            
            if (canPlaceWord(tempBoard, word, row, col, direction)) {
                placeWord(tempBoard, word, row, col, direction);
                placedWords.push(word);
                placed = true;
            }
            attempts++;
        }
    }
    
    // Fill empty cells with random letters
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (!tempBoard[i][j]) {
                tempBoard[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }
    
    gameBoard = tempBoard;
    renderBoard();
}

function canPlaceWord(board, word, row, col, direction) {
    if (direction === 'horizontal') {
        if (col + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
            if (board[row][col + i] && board[row][col + i] !== word[i]) return false;
        }
    } else {
        if (row + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
            if (board[row + i][col] && board[row + i][col] !== word[i]) return false;
        }
    }
    return true;
}

function placeWord(board, word, row, col, direction) {
    if (direction === 'horizontal') {
        for (let i = 0; i < word.length; i++) {
            board[row][col + i] = word[i];
        }
    } else {
        for (let i = 0; i < word.length; i++) {
            board[row + i][col] = word[i];
        }
    }
}

function renderBoard() {
    gameBoardElement.innerHTML = '';
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = gameBoard[i][j];
            gameBoardElement.appendChild(cell);
        }
    }
}

// Word List Display
function displayWordList() {
    wordListElement.innerHTML = '';
    [...WORDS].sort().forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.dataset.word = word;
        wordListElement.appendChild(li);
    });
}

// Game Events
function setupGameEvents() {
    let isSelecting = false;
    
    gameBoardElement.addEventListener('mousedown', startSelection);
    gameBoardElement.addEventListener('mouseover', updateSelection);
    document.addEventListener('mouseup', endSelection);
    
    // Touch events
    gameBoardElement.addEventListener('touchstart', handleTouchStart);
    gameBoardElement.addEventListener('touchmove', handleTouchMove);
    gameBoardElement.addEventListener('touchend', handleTouchEnd);
    
    function startSelection(e) {
        if (e.target.classList.contains('grid-cell')) {
            isSelecting = true;
            selectedCells = [e.target];
            updateCellStyles();
        }
    }
    
    function updateSelection(e) {
        if (isSelecting && e.target.classList.contains('grid-cell')) {
            const lastCell = selectedCells[selectedCells.length - 1];
            if (e.target !== lastCell) {
                selectedCells.push(e.target);
                updateCellStyles();
            }
        }
    }
    
    function endSelection() {
        if (isSelecting) {
            isSelecting = false;
            checkWord();
            selectedCells = [];
            updateCellStyles();
        }
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);
        if (cell && cell.classList.contains('grid-cell')) {
            isSelecting = true;
            selectedCells = [cell];
            updateCellStyles();
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (isSelecting) {
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('grid-cell')) {
                const lastCell = selectedCells[selectedCells.length - 1];
                if (cell !== lastCell) {
                    selectedCells.push(cell);
                    updateCellStyles();
                }
            }
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        endSelection();
    }
}

function updateCellStyles() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => cell.classList.remove('selected'));
    selectedCells.forEach(cell => cell.classList.add('selected'));
}

// Word Checking
function checkWord() {
    const selectedWord = getSelectedWord();
    if (WORDS.includes(selectedWord) && !foundWords.has(selectedWord)) {
        foundWords.add(selectedWord);
        updateWordList(selectedWord);
        updateScore(100);
        markFoundWord(selectedWord);
    } else if (HIDDEN_WORDS.includes(selectedWord) && !foundHiddenWords.has(selectedWord)) {
        foundHiddenWords.add(selectedWord);
        updateScore(HIDDEN_WORD_BONUS);
        markFoundHiddenWord(selectedWord);
        celebrateHiddenWord();
    }
    
    if (isGameComplete()) {
        handleEndGame();
    }
}

function getSelectedWord() {
    return selectedCells.map(cell => cell.textContent).join('');
}

function updateWordList(word) {
    const wordElement = document.querySelector(`[data-word="${word}"]`);
    if (wordElement) {
        wordElement.classList.add('found');
    }
}

function markFoundWord(word) {
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
        cell.classList.add('found');
    });
}

function markFoundHiddenWord(word) {
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
        cell.classList.add('found-hidden');
    });
}

function celebrateHiddenWord() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: #00ff88;
        padding: 20px;
        border-radius: 10px;
        font-size: 24px;
        animation: fadeInOut 2s forwards;
        z-index: 1000;
    `;
    overlay.textContent = 'Hidden Word Found! +500 Points!';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 2000);
}

// Score and Timer
function updateScore(points = 0) {
    score += points;
    scoreElement.textContent = score;
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Game Completion
function isGameComplete() {
    return foundWords.size === WORDS.length;
}

function handleEndGame() {
    clearInterval(timerInterval);
    localStorage.setItem('lastGameTime', Date.now().toString());
    showGameSummary();
}

function showGameSummary() {
    const timeTaken = timerElement.textContent;
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    
    const summary = document.createElement('div');
    summary.className = 'game-summary';
    
    summary.innerHTML = `
        <h2>Game Summary</h2>
        <div class="summary-content">
            <p><strong>Player:</strong> ${username}</p>
            <p><strong>Final Score:</strong> ${score}</p>
            <p><strong>Time Taken:</strong> ${timeTaken}</p>
            <p><strong>Words Found:</strong> ${foundWords.size}/${WORDS.length}</p>
            <p><strong>Hidden Words Found:</strong> ${foundHiddenWords.size}/${HIDDEN_WORDS.length}</p>
        </div>
        <div class="next-game">
            <p>Next game available in:</p>
            <div class="countdown"></div>
        </div>
        <button id="closeGameSummary">Close Summary</button>
    `;
    
    overlay.appendChild(summary);
    document.body.appendChild(overlay);
    
    const countdown = summary.querySelector('.countdown');
    updateCooldownTimer(countdown, COOLDOWN_HOURS * 60 * 60 * 1000);
    
    document.getElementById('closeGameSummary').addEventListener('click', () => {
        document.body.removeChild(overlay);
        location.reload();
    });
}
