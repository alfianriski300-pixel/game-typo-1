// ==========================================
// 1. DATABASE KATA & GENERATOR ACAK
// ==========================================
const WORD_BANK = {
    easy: {
        makanan: ["sate", "bakso", "soto", "rendang", "tempe", "tahu", "seblak", "pempek", "gudeg", "rawon", "lontong", "ketoprak", "martabak", "siomay"],
        minuman: ["kopi", "teh", "susu", "sirup", "cendol", "dawet", "bajigur", "bandrek", "jus", "air", "soda", "matcha", "latte", "boba"],
        wilayah: ["jakarta", "bandung", "medan", "riau", "bali", "papua", "aceh", "solo", "bogor", "depok", "malang", "padang", "batam", "jambi"],
        nama: ["budi", "siti", "andi", "rizki", "putri", "dewi", "agus", "fajar", "nina", "dimas", "tari", "eka", "indah", "alfian"]
    },
    medium: {
        makanan: ["nasi goreng", "ayam geprek", "mie ayam bakso", "sate padang", "ikan bakar", "bubur ayam", "kerak telor", "opor ayam", "pecel lele"],
        minuman: ["es teh manis", "kopi susu gula", "es kelapa muda", "jus alpukat", "es campur buah", "wedang jahe", "es cendol dawet", "cokelat panas"],
        wilayah: ["pekanbaru riau", "yogyakarta", "kalimantan", "sulawesi utara", "sumatera barat", "jawa tengah", "lombok timur", "raja ampat"],
        nama: ["muhammad rizki", "putri ayu sari", "ahmad fauzan", "siti nurhaliza", "budi santoso", "dimas anggara", "citra kirana", "alfian riski"]
    },
    hard: {
        makanan: ["nasi goreng spesial pedas", "rendang daging sapi padang", "martabak manis keju coklat", "sate kambing bumbu kecap", "pempek kapal selam palembang"],
        minuman: ["es kopi susu gula aren dingin", "jus mangga harum manis segar", "es teler durian alpukat kelapa", "wedang ronde jahe hangat malam"],
        wilayah: ["daerah istimewa yogyakarta", "kepulauan bangka belitung", "provinsi kalimantan timur", "kota pekanbaru provinsi riau", "nusa tenggara timur indonesia"],
        nama: ["muhammad alfian riski pratama", "putri cahaya purnama sari", "alexander graham bell junior", "raden ajeng kartini jepara"]
    }
};

const RANDOM_ITEMS = ["apel", "jeruk", "mangga", "kucing", "harimau", "elang", "hiu", "panda", "naga", "pisang", "singa", "serigala"];
const RANDOM_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?";

function generateRandomMixedWord(difficulty) {
    let targetLen = difficulty === "easy" ? randInt(4, 10) : difficulty === "medium" ? randInt(10, 15) : randInt(16, 22);
    let result = "";

    while (result.length < targetLen) {
        const mode = Math.random();
        if (mode < 0.45) {
            // Ambil nama buah/hewan acak
            const word = RANDOM_ITEMS[Math.floor(Math.random() * RANDOM_ITEMS.length)];
            result += (result.length > 0 && difficulty === "hard" ? " " : "") + word;
        } else {
            // Tambah kombinasi huruf/angka/karakter acak
            const chunkLen = randInt(2, 5);
            for (let i = 0; i < chunkLen; i++) {
                result += RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
            }
        }
    }
    return result.slice(0, targetLen).trim();
}

function getWord(difficulty, category) {
    if (category === "acak") {
        return generateRandomMixedWord(difficulty);
    }
    const list = WORD_BANK[difficulty][category];
    return list[Math.floor(Math.random() * list.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==========================================
// 2. STATE PERMAINAN & ELEMEN DOM
// ==========================================
const pages = {
    home: document.getElementById("page-home"),
    difficulty: document.getElementById("page-difficulty"),
    category: document.getElementById("page-category"),
    game: document.getElementById("page-game")
};

const arena = document.getElementById("game-arena");
const typingInput = document.getElementById("typing-input");
const dangerLine = document.getElementById("danger-line");
const livesDisplay = document.getElementById("lives-display");
const scoreDisplay = document.getElementById("score-display");
const comboDisplay = document.getElementById("combo-display");
const comboPopup = document.getElementById("combo-popup");
const bonusBanner = document.getElementById("bonus-banner");
const gameoverModal = document.getElementById("gameover-modal");

let gameState = {
    difficulty: "easy",
    category: "makanan",
    lives: 3,
    score: 0,
    combo: 0,
    maxCombo: 0,
    nextBonusThreshold: 100,
    nextComboThresholdIncrease: 150,
    activeWords: [], // { id, text, typedIndex, x, y, speed, el, spawnTime, hadTypo }
    isRunning: false,
    waveCount: 0,
    lastFrameTime: 0,
    spawnTimers: []
};

// ==========================================
// 3. NAVIGASI HALAMAN
// ==========================================
function switchPage(pageName) {
    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[pageName].classList.add("active");
}

document.getElementById("btn-play").addEventListener("click", () => switchPage("difficulty"));
document.getElementById("btn-back-home").addEventListener("click", () => switchPage("home"));
document.getElementById("btn-back-diff").addEventListener("click", () => switchPage("difficulty"));

document.querySelectorAll(".diff-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        gameState.difficulty = btn.dataset.diff;
        document.getElementById("selected-diff-label").textContent = gameState.difficulty.toUpperCase();
        switchPage("category");
    });
});

document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        gameState.category = btn.dataset.cat;
        startGame();
    });
});

document.getElementById("btn-restart-home").addEventListener("click", () => {
    gameoverModal.classList.add("hidden");
    switchPage("home");
});

// ==========================================
// 4. LOGIKA UTAMA PERMAINAN
// ==========================================
function startGame() {
    // Reset state
    clearAllTimers();
    document.querySelectorAll(".falling-word").forEach(el => el.remove());

    gameState.lives = 3;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.nextBonusThreshold = 100;
    gameState.nextComboThresholdIncrease = 150;
    gameState.activeWords = [];
    gameState.waveCount = 0;
    gameState.isRunning = true;

    updateHUD();
    switchPage("game");
    typingInput.value = "";
    typingInput.focus();

    // Mulai gelombang pertama (1 kata dulu)
    scheduleNextWave(true);

    gameState.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function clearAllTimers() {
    gameState.spawnTimers.forEach(t => clearTimeout(t));
    gameState.spawnTimers = [];
}

// Sistem Gelombang (Wave) Berurutan dengan Jeda
function scheduleNextWave(isFirstWave = false) {
    if (!gameState.isRunning) return;

    gameState.waveCount++;
    let count = 1;

    if (!isFirstWave) {
        if (gameState.difficulty === "easy") {
            // Awal 1, selanjutnya bisa 3 sampai 5 berurutan
            count = gameState.waveCount === 2 ? 3 : randInt(3, 5);
        } else {
            // Medium & Hard bisa 5 sampai 7 berurutan
            count = gameState.waveCount === 2 ? 4 : randInt(5, 7);
        }
    }

    // Jeda antar kata dalam satu gelombang agar tidak turun barengan
    const staggerDelay = gameState.difficulty === "easy" ? 1300 : gameState.difficulty === "medium" ? 1500 : 2100;

    for (let i = 0; i < count; i++) {
        const timer = setTimeout(() => {
            if (gameState.isRunning) spawnWord();
        }, i * staggerDelay);
        gameState.spawnTimers.push(timer);
    }

    // Jadwalkan gelombang berikutnya setelah gelombang ini selesai muncul
    const nextWaveDelay = count * staggerDelay + 1800;
    const waveTimer = setTimeout(() => {
        if (gameState.isRunning) scheduleNextWave(false);
    }, nextWaveDelay);
    gameState.spawnTimers.push(waveTimer);
}


function spawnWord() {
    const text = getWord(gameState.difficulty, gameState.category);
    const el = document.createElement("div");
    el.className = "falling-word";
    el.innerHTML = `<span class="typed"></span><span class="untyped">${escapeHTML(text)}</span>`;
    arena.appendChild(el);

    const arenaWidth = arena.clientWidth;
    const arenaHeight = arena.clientHeight;
    const wordWidth = el.offsetWidth || 120;
    const maxX = Math.max(20, arenaWidth - wordWidth - 30);
    const randomX = randInt(20, maxX);

    el.style.left = `${randomX}px`;

    // Durasi jatuh berdasarkan perangkat dan kesulitan
    const isMobile = window.matchMedia("(max-width: 600px)").matches;

    let fallDurationSec;

    if (gameState.difficulty === "easy") {
        fallDurationSec = isMobile ? randInt(10, 12) : randInt(8, 12);
    } else if (gameState.difficulty === "medium") {
        fallDurationSec = isMobile ? randInt(8, 10) : randInt(7, 8);
    } else {
        fallDurationSec = isMobile ? randInt(8, 10) : randInt(7, 8);
    }

    // Hitung jarak dari posisi awal sampai garis merah
    const dangerY = dangerLine.offsetTop;
    const jarakJatuh = dangerY + 35 - el.offsetHeight;

    const speedPxPerSec = jarakJatuh / fallDurationSec;

    gameState.activeWords.push({
        id: Date.now() + Math.random(),
        text,
        typedIndex: 0,
        x: randomX,
        y: -35,
        speed: speedPxPerSec,
        el,
        spawnTime: performance.now(),
        hadTypo: false
    });
}


// Loop Animasi Turun

function gameLoop(now) {
    if (!gameState.isRunning) return;

    const dt = (now - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = now;

    const dangerY = dangerLine.offsetTop;

    for (let i = gameState.activeWords.length - 1; i >= 0; i--) {
        const wordObj = gameState.activeWords[i];
        wordObj.y += wordObj.speed * dt;
        wordObj.el.style.top = `${wordObj.y}px`;

        // Cek apakah menyentuh garis batas
        if (wordObj.y + wordObj.el.offsetHeight >= dangerY) {
            handleWordMissed(i);
        }
    }

    requestAnimationFrame(gameLoop);
}

function handleWordMissed(index) {
    const wordObj = gameState.activeWords[index];
    createExplosion(wordObj.x + wordObj.el.offsetWidth / 2, wordObj.y, "#ef4444");
    wordObj.el.remove();
    gameState.activeWords.splice(index, 1);

    // Reset combo & kurangi 1 nyawa
    gameState.combo = 0;
    gameState.lives--;
    typingInput.value = "";
    updateHUD();

    if (gameState.lives <= 0) {
        triggerGameOver();
    }
}

// ==========================================
// 5. DETEKSI KETIKAN, TYPO, COMBO & BONUS 100
// ==========================================
typingInput.addEventListener("input", () => {
    if (!gameState.isRunning) return;

    const currentVal = typingInput.value;
    if (currentVal.length === 0) {
        resetWordProgress();
        return;
    }

    // Cari kata aktif yang cocok dengan awal ketikan (prioritaskan yang paling bawah)
    const sortedWords = [...gameState.activeWords].sort((a, b) => b.y - a.y);
    let matchedWord = sortedWords.find(w => w.text.startsWith(currentVal));

    if (matchedWord) {
        typingInput.classList.remove("input-error");

        // Update highlight huruf yang sudah diketik pada kata yang cocok
        gameState.activeWords.forEach(w => {
            if (w.id === matchedWord.id) {
                w.typedIndex = currentVal.length;
                updateWordHTML(w);
            } else {
                w.typedIndex = 0;
                updateWordHTML(w);
            }
        });

        // Cek jika kata selesai diketik 100%
        if (currentVal === matchedWord.text) {
            completeWord(matchedWord);
        }
    } else {
        // TYPO TERDETEKSI!
        triggerTypoEffect(sortedWords[0]);
    }
});

function triggerTypoEffect(targetWord) {
    typingInput.classList.add("input-error");
    gameState.combo = 0;
    updateHUD();

    // Tandai kata paling dekat sedang typo & beri kedip merah tanpa henti turun
    if (targetWord) {
        targetWord.hadTypo = true;
        targetWord.el.classList.add("typo-flash");
        setTimeout(() => {
            if (targetWord.el) targetWord.el.classList.remove("typo-flash");
        }, 220);
    }

    // Hapus karakter terakhir yang salah agar user bisa langsung lanjut ketik tanpa ribet backspace
    typingInput.value = typingInput.value.slice(0, -1);
    setTimeout(() => typingInput.classList.remove("input-error"), 200);
}

function resetWordProgress() {
    gameState.activeWords.forEach(w => {
        w.typedIndex = 0;
        updateWordHTML(w);
    });
}

function updateWordHTML(wordObj) {
    const typedPart = escapeHTML(wordObj.text.slice(0, wordObj.typedIndex));
    const untypedPart = escapeHTML(wordObj.text.slice(wordObj.typedIndex));
    wordObj.el.innerHTML = `<span class="typed">${typedPart}</span><span class="untyped">${untypedPart}</span>`;
}

function completeWord(wordObj) {
    const idx = gameState.activeWords.findIndex(w => w.id === wordObj.id);
    if (idx === -1) return;

    // Animasi pecah
    const centerX = wordObj.x + wordObj.el.offsetWidth / 2;
    const centerY = wordObj.y + wordObj.el.offsetHeight / 2;
    createExplosion(centerX, centerY, "#38bdf8");

    wordObj.el.remove();
    gameState.activeWords.splice(idx, 1);
    typingInput.value = "";
    resetWordProgress();

    // Hitung poin berdasarkan tingkat kesulitan, kecepatan, typo, dan panjang kata
    const elapsedSec = (performance.now() - wordObj.spawnTime) / 1000;
    const isFast = elapsedSec < 2.2;
    let earnedPoints;

    if (gameState.difficulty === "easy") {
        if (isFast && !wordObj.hadTypo) {
            earnedPoints = 25;
        } else if (wordObj.hadTypo) {
            earnedPoints = 20;
        } else {
            earnedPoints = 15;
        }
    } else {
        // Medium & Hard: poin normal 20–40 sesuai panjang kata
        const lengthBonus = Math.min(20, Math.floor(wordObj.text.length / 2));
        earnedPoints = 20 + lengthBonus;

        // Mengetik cepat tanpa typo langsung mendapat 70 poin
        if (isFast && !wordObj.hadTypo) {
            earnedPoints = 70;
        }
    }

    gameState.score += earnedPoints;

    // Combo didapat saat skor mencapai target bertahap:
    // 100, 250, 450, 700, 1000, dan seterusnya.
    while (gameState.score >= gameState.nextBonusThreshold) {
        gameState.combo++;

        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }

        showComboPopup(`${gameState.combo}x COMBO!`);

        gameState.nextBonusThreshold += gameState.nextComboThresholdIncrease;
        gameState.nextComboThresholdIncrease += 50;

        // Setiap 3 combo berturut-turut menambah 1 nyawa (maksimal 5)
        if (gameState.combo > 0 && gameState.combo % 3 === 0) {
            if (gameState.lives < 5) {
                gameState.lives++;
            }

            bonusBanner.classList.add("show");
            setTimeout(() => {
                bonusBanner.classList.remove("show");
            }, 2200);
        }
    }

    updateHUD();
}

// ==========================================
// 6. EFEK VISUAL, BONUS 100 POIN & GAME OVER
// ==========================================
function showComboPopup(text) {
    comboPopup.textContent = text;
    comboPopup.classList.remove("show");
    void comboPopup.offsetWidth; // trigger reflow agar animasi ulang
    comboPopup.classList.add("show");
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 16; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.backgroundColor = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        const angle = Math.random() * Math.PI * 2;
        const distance = randInt(30, 85);
        particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

        arena.appendChild(particle);
        setTimeout(() => particle.remove(), 550);
    }
}

function updateHUD() {
    livesDisplay.textContent = "❤️".repeat(Math.max(0, gameState.lives)) + "🖤".repeat(Math.max(0, 5 - gameState.lives));
    scoreDisplay.textContent = gameState.score;
    comboDisplay.textContent = `${gameState.combo}x`;
}

function triggerGameOver() {
    gameState.isRunning = false;
    clearAllTimers();
    document.getElementById("final-score").textContent = gameState.score;
    document.getElementById("final-combo").textContent = `${gameState.maxCombo}x`;
    gameoverModal.classList.remove("hidden");
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Pastikan input selalu fokus selama game berjalan
arena.addEventListener("click", () => {
    if (gameState.isRunning) typingInput.focus();
});