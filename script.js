document.addEventListener('DOMContentLoaded', () => {
    const btnAction = document.getElementById('btnAction');
    const diceWrapper = document.getElementById('diceWrapper');
    const statusMessage = document.getElementById('statusMessage');
    const totalChipDisplay = document.getElementById('totalChip');
    const effectLayer = document.getElementById('effect-layer');
    const gameOverModal = document.getElementById('gameOverModal');
    const btnReset = document.getElementById('btnReset');
    
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); }, false);

    const bgMusic = document.getElementById('bgMusic');
    const toggleMusic = document.getElementById('toggleMusic');
    const musicIcon = document.getElementById('musicIcon');
    let isMuted = false;

    bgMusic.volume = 0.3;

    function startMusic() { if (!isMuted) { bgMusic.play().catch(() => {}); } }
    document.body.addEventListener('click', startMusic, { once: true });

    toggleMusic.addEventListener('click', () => {
        if (isMuted) { bgMusic.play(); musicIcon.innerText = "🔊"; isMuted = false; }
        else { bgMusic.pause(); musicIcon.innerText = "🔇"; isMuted = true; }
    });

    const items = ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'];
    let userBalance = parseInt(localStorage.getItem('bauCuaBalance')) || 100;
    let currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
    let isGamePlaying = false;
    let isRolling = false; 

    updateBalanceDisplay();

    document.querySelectorAll('.bet-slot').forEach(slot => {
        const name = slot.getAttribute('data-name');
        const icon = slot.querySelector('.bet-icon');
        const btnMinus = slot.querySelector('.btn-minus');

        icon.addEventListener('click', () => {
            if (isGamePlaying || isRolling || userBalance <= 0 || currentBets[name] >= 10) return;
            playFlyEffect(icon);
            userBalance--;
            currentBets[name]++;
            updateSlotUI(name);
            updateBalanceDisplay();
        });

        btnMinus.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isGamePlaying || isRolling || currentBets[name] <= 0) return;
            userBalance++;
            currentBets[name]--;
            updateSlotUI(name);
            updateBalanceDisplay();
        });
    });

    btnAction.addEventListener('click', () => {
        if (isRolling) return; 

        if (!isGamePlaying) {
            const totalBet = Object.values(currentBets).reduce((a, b) => a + b, 0);
            if (totalBet === 0) { statusMessage.innerText = "Đặt cược đã bạn ơi!"; return; }
            performRoll();
        } else {
            resetNewGame();
        }
    });

    function performRoll() {
        isRolling = true; 
        diceWrapper.innerHTML = '';
        statusMessage.innerText = "Đang lắc xí ngầu... chờ tí nhé!";
        btnAction.innerText = "Đang lắc...";
        btnAction.style.opacity = '0.5';

        let diceElements = [];
        for (let i = 0; i < 3; i++) {
            const img = document.createElement('img');
            img.src = 'chip.png'; 
            img.className = 'dice-result spinning';
            diceWrapper.appendChild(img);
            diceElements.push(img);
        }

        setTimeout(() => {
            let results = [];
            for (let i = 0; i < 3; i++) {
                results.push(items[Math.floor(Math.random() * items.length)]);
            }

            results.forEach((res, index) => {
                diceElements[index].src = `${res}.png`;
                diceElements[index].classList.remove('spinning');
            });

            checkWinLoss(results);
            
            btnAction.innerText = "Ván Mới";
            btnAction.style.opacity = '1';
            isGamePlaying = true;
            isRolling = false;
            localStorage.setItem('bauCuaBalance', userBalance);

        }, 1500); 
    }

    function checkWinLoss(results) {
        let totalReceived = 0;
        items.forEach(item => {
            const countInDice = results.filter(r => r === item).length;
            if (countInDice > 0 && currentBets[item] > 0) {
                totalReceived += currentBets[item] + (currentBets[item] * countInDice);
                // Ô này sẽ chớp vô tận nhờ CSS đã sửa
                document.querySelector(`[data-name="${item}"]`).classList.add('win-effect');
            }
        });
        userBalance += totalReceived;
        updateBalanceDisplay();
        statusMessage.innerText = totalReceived > 0 ? `Thắng! Nhận ${totalReceived} Chip.` : "Tiếc quá, thua rồi chơi ván mới nè!";
        if (userBalance === 0) setTimeout(() => gameOverModal.style.display = 'flex', 1000);
    }

    btnReset.addEventListener('click', () => {
        userBalance = 100;
        localStorage.setItem('bauCuaBalance', 100);
        updateBalanceDisplay();
        gameOverModal.style.display = 'none';
        resetNewGame();
    });

    function resetNewGame() {
        isGamePlaying = false;
        isRolling = false;
        currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
        
        // Dọn dẹp hiệu ứng chớp vàng và reset giao diện đặt cược
        document.querySelectorAll('.bet-slot').forEach(slot => {
            slot.classList.remove('win-effect'); // NGƯNG CHỚP TẠI ĐÂY
            updateSlotUI(slot.getAttribute('data-name'));
        });
        
        diceWrapper.innerHTML = '';
        btnAction.innerText = "Mở Khui";
        statusMessage.innerText = "Mời Bạn Đặt Cược Vào Ô Dưới Nhé";
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

    function updateBalanceDisplay() { totalChipDisplay.innerText = userBalance; }

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
        }, 10);
        setTimeout(() => { if (chip.parentNode) chip.remove(); }, 600);
    }
});