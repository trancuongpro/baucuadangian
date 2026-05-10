document.addEventListener('DOMContentLoaded', () => {
    const btnAction = document.getElementById('btnAction');
    const diceWrapper = document.getElementById('diceWrapper');
    const statusMessage = document.getElementById('statusMessage');
    const totalChipDisplay = document.getElementById('totalChip');
    const effectLayer = document.getElementById('effect-layer');
    const gameOverModal = document.getElementById('gameOverModal');
    const btnReset = document.getElementById('btnReset');
    
    // Khai báo âm thanh
    const bgMusic = document.getElementById('bgMusic');
    const toggleMusic = document.getElementById('toggleMusic');
    const musicIcon = document.getElementById('musicIcon');
    let isMuted = false;

    // Thiết lập âm lượng mặc định 30%
    bgMusic.volume = 0.3;

    // Hàm để phát nhạc (vượt qua rào cản autoplay của trình duyệt)
    function startMusic() {
        if (!isMuted) {
            bgMusic.play().catch(() => {
                // Trình duyệt chặn autoplay, chờ tương tác đầu tiên
                console.log("Chờ tương tác để phát nhạc...");
            });
        }
    }

    // Phát nhạc ngay khi có tương tác đầu tiên vào web
    document.body.addEventListener('click', startMusic, { once: true });

    // Xử lý bật/tắt nhạc khi nhấn vào loa
    toggleMusic.addEventListener('click', () => {
        if (isMuted) {
            bgMusic.play();
            musicIcon.innerText = "🔊";
            isMuted = false;
        } else {
            bgMusic.pause();
            musicIcon.innerText = "🔇";
            isMuted = true;
        }
    });

    const items = ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'];
    let userBalance = parseInt(localStorage.getItem('bauCuaBalance')) || 100;
    let currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
    let isGamePlaying = false; 
    
    let gameStartTime = Date.now();
    const TARGET_LOSE_TIME = 30 * 60 * 1000; 

    updateBalanceDisplay();

    // Logic đặt cược
    document.querySelectorAll('.bet-slot').forEach(slot => {
        const name = slot.getAttribute('data-name');
        const icon = slot.querySelector('.bet-icon');
        const btnMinus = slot.querySelector('.btn-minus');

        icon.addEventListener('click', () => {
            if (isGamePlaying || userBalance <= 0) return;
            if (currentBets[name] >= 10) return;
            playFlyEffect(icon);
            userBalance--;
            currentBets[name]++;
            updateSlotUI(name);
            updateBalanceDisplay();
            statusMessage.innerText = "Mời Bạn Đặt Cược";
        });

        btnMinus.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isGamePlaying || currentBets[name] <= 0) return;
            userBalance++;
            currentBets[name]--;
            updateSlotUI(name);
            updateBalanceDisplay();
        });
    });

    btnAction.addEventListener('click', () => {
        if (!isGamePlaying) {
            const totalBet = Object.values(currentBets).reduce((a, b) => a + b, 0);
            if (totalBet === 0) {
                statusMessage.innerText = "Chưa cược sao khui được bạn ơi!";
                return;
            }
            performRoll();
        } else {
            resetNewGame();
        }
    });

    function performRoll() {
        diceWrapper.innerHTML = '';
        let results = [];
        let currentTime = Date.now();
        let timePlayed = currentTime - gameStartTime;
        let difficulty = Math.min(timePlayed / TARGET_LOSE_TIME, 0.95); 
        let nonBetItems = items.filter(item => currentBets[item] === 0);

        let randType = Math.random() * 100;
        let isTriple = randType < 1; 
        let isDouble = randType >= 1 && randType < 6; 

        let shouldForceLose = Math.random() < difficulty;

        for (let i = 0; i < 3; i++) {
            if (shouldForceLose && nonBetItems.length > 0) {
                results.push(nonBetItems[Math.floor(Math.random() * nonBetItems.length)]);
            } else {
                results.push(items[Math.floor(Math.random() * items.length)]);
            }
        }

        if (isTriple) results = [results[0], results[0], results[0]];
        if (isDouble) results = [results[0], results[0], results[1]];

        results.forEach(res => {
            const img = document.createElement('img');
            img.src = `${res}.png`;
            img.className = 'dice-result';
            diceWrapper.appendChild(img);
        });

        checkWinLoss(results);
        btnAction.innerText = "Ván Mới";
        isGamePlaying = true;
        localStorage.setItem('bauCuaBalance', userBalance);
    }

    function checkWinLoss(results) {
        let totalReceived = 0;
        items.forEach(item => {
            const countInDice = results.filter(r => r === item).length;
            if (countInDice > 0 && currentBets[item] > 0) {
                totalReceived += currentBets[item] + (currentBets[item] * countInDice);
                document.querySelector(`[data-name="${item}"]`).classList.add('win-effect');
            }
        });
        userBalance += totalReceived;
        updateBalanceDisplay();
        if (totalReceived > 0) {
            statusMessage.innerText = `Thắng rồi! Nhận ${totalReceived} Chip.`;
        } else {
            statusMessage.innerText = "Không trúng rồi, chia buồn nhé!";
            setTimeout(() => {
                if (userBalance === 0) gameOverModal.style.display = 'flex';
            }, 1200);
        }
    }

    btnReset.addEventListener('click', () => {
        userBalance = 100;
        gameStartTime = Date.now(); 
        localStorage.setItem('bauCuaBalance', 100);
        updateBalanceDisplay();
        gameOverModal.style.display = 'none';
        resetNewGame();
    });

    function resetNewGame() {
        isGamePlaying = false;
        currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
        document.querySelectorAll('.bet-slot').forEach(slot => {
            slot.classList.remove('win-effect');
            updateSlotUI(slot.getAttribute('data-name'));
        });
        diceWrapper.innerHTML = ''; 
        btnAction.innerText = "Mở Khui";
        statusMessage.innerText = "Mời Bạn Đặt Cược Vào Trò Chơi";
    }

    function updateSlotUI(name) {
        const slot = document.querySelector(`[data-name="${name}"]`);
        const container = slot.querySelector('.chip-container');
        slot.querySelector('.bet-count').innerText = currentBets[name];
        slot.querySelector('.btn-minus').style.display = (currentBets[name] > 0 && !isGamePlaying) ? 'block' : 'none';
        container.innerHTML = '';
        for (let i = 0; i < currentBets[name]; i++) {
            const c = document.createElement('img');
            c.src = 'chip.png';
            c.className = 'chip-in-slot';
            c.style.left = (Math.random() * 50 + 5) + '%';
            c.style.top = (Math.random() * 50 + 5) + '%';
            c.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(c);
        }
    }

    function updateBalanceDisplay() {
        totalChipDisplay.innerText = userBalance;
    }

    function playFlyEffect(targetEl) {
        const chip = document.createElement('img');
        chip.src = 'chip.png';
        chip.className = 'flying-chip';
        const startRect = totalChipDisplay.getBoundingClientRect();
        const endRect = targetEl.getBoundingClientRect();
        chip.style.left = startRect.left + 'px';
        chip.style.top = startRect.top + 'px';
        effectLayer.appendChild(chip);
        setTimeout(() => {
            chip.style.left = (endRect.left + endRect.width/2 - 20) + 'px';
            chip.style.top = (endRect.top + endRect.height/2 - 20) + 'px';
            chip.style.opacity = '0';
        }, 50);
        setTimeout(() => chip.remove(), 600);
    }
});