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
const STORAGE_KEY = "typo_games_records_v1";

function generateRandomMixedWord(difficulty) {
    let targetLen = difficulty === "easy" ? randInt(4, 10) : difficulty === "medium" ? randInt(10, 15) : randInt(16, 22);
    let result = "";

    while (result.length < targetLen) {
        const mode = Math.random();
        if (mode < 0.45) {
            const word = RANDOM_ITEMS[Math.floor(Math.random() * RANDOM_ITEMS.length)];
            result += (result.length > 0 && difficulty === "hard" ? " " : "") + word;
        } else {
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
// 2. LOCAL STORAGE & GRADE / NILAI
// ==========================================
function getRecords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getDefaultTargetForDifficulty(difficulty) {
    return difficulty === "easy" ? 450 : 600;
}

/**
 * Aturan Grade:
 * - Menang / capai target poin maksimal -> "A+"
 * - Jika pakai target poin (bukan unlimited):
 *     >= 80% target -> "A"
 *     >= 75% target -> "B"
 *     >= 50% target -> "D/C"
 *     < 50% target  -> "LOSE"
 * - Jika Unlimited -> "UNLIMITED"
 */
function calculateGrade(score, targetScore, isWin) {
    if (targetScore === null || targetScore === "unlimited") {
        return { code: "UNLIMITED", cssClass: "grade-unlim" };
    }

    const numericTarget = Number(targetScore);
    if (isWin || score >= numericTarget) {
        return { code: "A+", cssClass: "grade-aplus" };
    }

    const ratio = numericTarget > 0 ? (score / numericTarget) * 100 : 0;

    if (ratio >= 80) {
        return { code: "A", cssClass: "grade-a" };
    }
    if (ratio >= 75) {
        return { code: "B", cssClass: "grade-b" };
    }
    if (ratio >= 50) {
        return { code: "D/C", cssClass: "grade-dc" };
    }
    return { code: "LOSE", cssClass: "grade-lose" };
}

function formatDateTime(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    const tgl = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    const jam = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return `${tgl} ${jam}`;
}

function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const menit = Math.floor(totalSec / 60);
    const detik = totalSec % 60;
    if (menit > 0) {
        return `${menit}m ${detik}d`;
    }
    return `${detik}d`;
}

function recordGameResult(isWin) {
    const elapsedMs = performance.now() - gameState.startTime;
    const gradeInfo = calculateGrade(gameState.score, gameState.targetScore, isWin);

    const entry = {
        id: Date.now() + Math.random(),
        score: gameState.score,
        difficulty: gameState.difficulty,
        category: gameState.category,
        targetScore: gameState.targetScore, // angka atau "unlimited"
        grade: gradeInfo.code,
        cssClass: gradeInfo.cssClass,
        isWin,
        typoCount: gameState.typoCount,
        lifeLostCount: gameState.lifeLostCount,
        comboEarnedCount: gameState.comboEarnedCount,
        durationStr: formatDuration(elapsedMs),
        dateTime: formatDateTime(new Date())
    };

    const records = getRecords();
    records.unshift(entry);
    // Simpan maksimal 50 riwayat terbaru
    if (records.length > 50) {
        records.length = 50;
    }
    saveRecords(records);
    return entry;
}

function renderRecordsPage() {
    const records = getRecords();
    const tbody = document.getElementById("records-tbody");
    const banner = document.getElementById("best-score-banner");

    if (records.length === 0) {
        banner.textContent = "Skor Tertinggi: 0 Poin";
        tbody.innerHTML = `<tr><td colspan="6" class="empty-records">Belum ada riwayat skor tersimpan.</td></tr>`;
        return;
    }

    const bestEntry = [...records].sort((a, b) => b.score - a.score)[0];
    banner.textContent = `Skor Tertinggi: ${bestEntry.score} Poin (${bestEntry.difficulty.toUpperCase()} • ${bestEntry.dateTime})`;

    tbody.innerHTML = records
        .map((rec, idx) => {
            const targetLabel = rec.targetScore === "unlimited" ? "Unlimited" : `${rec.targetScore}`;
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${rec.score}</strong></td>
                    <td>${rec.difficulty.toUpperCase()} / ${rec.category}</td>
                    <td>${targetLabel}</td>
                    <td><span class="grade-pill ${rec.cssClass}">${rec.grade}</span></td>
                    <td>${rec.dateTime}</td>
                </tr>
            `;
        })
        .join("");
}

// ==========================================
// 3. STATE PERMAINAN & ELEMEN DOM
// ==========================================
const pages = {
    home: document.getElementById("page-home"),
    difficulty: document.getElementById("page-difficulty"),
    category: document.getElementById("page-category"),
    target: document.getElementById("page-target"),
    records: document.getElementById("page-records"),
    game: document.getElementById("page-game")
};

const arena = document.getElementById("game-arena");
const dangerLine = document.getElementById("danger-line");
const typingInput = document.getElementById("typing-input");
const livesDisplay = document.getElementById("lives-display");
const scoreDisplay = document.getElementById("score-display");
const targetDisplay = document.getElementById("target-display");
const comboDisplay = document.getElementById("combo-display");
const comboPopup = document.getElementById("combo-popup");
const bonusBanner = document.getElementById("bonus-banner");
const gameoverModal = document.getElementById("gameover-modal");
const winModal = document.getElementById("win-modal");

let gameState = {
    difficulty: "easy",
    category: "makanan",
    targetScore: 450, // angka atau "unlimited"
    lives: 3,
    score: 0,
    combo: 0,
    maxCombo: 0,
    typoCount: 0,
    lifeLostCount: 0,
    comboEarnedCount: 0,
    startTime: 0,
    nextBonusThreshold: 100,
    nextComboThresholdIncrease: 150,
    activeWords: [],
    isRunning: false,
    waveCount: 0,
    lastFrameTime: 0,
    spawnTimers: []
};

// ==========================================
// 4. NAVIGASI HALAMAN
// ==========================================
function switchPage(pageName) {
    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[pageName].classList.add("active");
    if (pageName === "records") {
        renderRecordsPage();
    }
}

function closeAllModals() {
    gameoverModal.classList.add("hidden");
    winModal.classList.add("hidden");
}

document.getElementById("btn-play").addEventListener("click", () => switchPage("difficulty"));
document.getElementById("btn-home-records").addEventListener("click", () => switchPage("records"));
document.getElementById("btn-diff-records").addEventListener("click", () => switchPage("records"));
document.getElementById("btn-back-from-records").addEventListener("click", () => switchPage("home"));
document.getElementById("btn-back-home").addEventListener("click", () => switchPage("home"));
document.getElementById("btn-back-diff").addEventListener("click", () => switchPage("difficulty"));
document.getElementById("btn-back-category").addEventListener("click", () => switchPage("category"));

document.getElementById("btn-clear-records").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderRecordsPage();
});

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
        openTargetPage();
    });
});

function openTargetPage() {
    const defaultTarget = getDefaultTargetForDifficulty(gameState.difficulty);
    document.getElementById("target-summary-label").textContent =
        `${gameState.difficulty.toUpperCase()} • ${gameState.category.toUpperCase()}`;

    document.querySelectorAll(".target-btn").forEach(btn => {
        const val = btn.dataset.target;
        btn.classList.toggle("recommended", Number(val) === defaultTarget);
    });

    switchPage("target");
}

document.querySelectorAll(".target-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const rawTarget = btn.dataset.target;
        gameState.targetScore = rawTarget === "unlimited" ? "unlimited" : Number(rawTarget);
        startGame();
    });
});

// Tombol di modal Game Over
document.getElementById("btn-retry-lose").addEventListener("click", () => {
    closeAllModals();
    startGame();
});

document.getElementById("btn-lobby-lose").addEventListener("click", () => {
    closeAllModals();
    switchPage("home");
});

// Tombol di modal Win
document.getElementById("btn-retry-win").addEventListener("click", () => {
    closeAllModals();
    startGame();
});

document.getElementById("btn-lobby-win").addEventListener("click", () => {
    closeAllModals();
    switchPage("home");
});

// ==========================================
// 5. LOGIKA UTAMA PERMAINAN
// ==========================================
function startGame() {
    clearAllTimers();
    closeAllModals();
    document.querySelectorAll(".falling-word").forEach(el => el.remove());

    gameState.lives = 3;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.typoCount = 0;
    gameState.lifeLostCount = 0;
    gameState.comboEarnedCount = 0;
    gameState.startTime = performance.now();
    gameState.nextBonusThreshold = 100;
    gameState.nextComboThresholdIncrease = 150;
    gameState.activeWords = [];
    gameState.waveCount = 0;
    gameState.isRunning = true;

    updateHUD();
    switchPage("game");
    typingInput.value = "";
    typingInput.focus();

    scheduleNextWave(true);

    gameState.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function clearAllTimers() {
    gameState.spawnTimers.forEach(t => clearTimeout(t));
    gameState.spawnTimers = [];
}

function scheduleNextWave(isFirstWave = false) {
    if (!gameState.isRunning) return;

    gameState.waveCount++;
    let count = 1;

    if (!isFirstWave) {
        if (gameState.difficulty === "easy") {
            count = gameState.waveCount === 2 ? 3 : randInt(3, 5);
        } else {
            count = gameState.waveCount === 2 ? 4 : randInt(5, 7);
        }
    }

    const staggerDelay = gameState.difficulty === "easy" ? 1300 : gameState.difficulty === "medium" ? 1500 : 2100;

    for (let i = 0; i < count; i++) {
        const timer = setTimeout(() => {
            if (gameState.isRunning) spawnWord();
        }, i * staggerDelay);
        gameState.spawnTimers.push(timer);
    }

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
    const wordWidth = el.offsetWidth || 120;
    const maxX = Math.max(20, arenaWidth - wordWidth - 30);
    const randomX = randInt(20, maxX);

    el.style.left = `${randomX}px`;

    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    let fallDurationSec;

    if (gameState.difficulty === "easy") {
        fallDurationSec = isMobile ? randInt(10, 12) : randInt(8, 12);
    } else if (gameState.difficulty === "medium") {
        fallDurationSec = isMobile ? randInt(8, 10) : randInt(7, 8);
    } else {
        fallDurationSec = isMobile ? randInt(8, 10) : randInt(7, 8);
    }

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

function gameLoop(now) {
    if (!gameState.isRunning) return;

    const dt = (now - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = now;

    const dangerY = dangerLine.offsetTop;

    for (let i = gameState.activeWords.length - 1; i >= 0; i--) {
        const wordObj = gameState.activeWords[i];
        wordObj.y += wordObj.speed * dt;
        wordObj.el.style.top = `${wordObj.y}px`;

        if (wordObj.y + wordObj.el.offsetHeight >= dangerY) {
            handleWordMissed(i);
        }
    }

    if (gameState.isRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function handleWordMissed(index) {
    const wordObj = gameState.activeWords[index];
    createExplosion(wordObj.x + wordObj.el.offsetWidth / 2, wordObj.y, "#ef4444");
    wordObj.el.remove();
    gameState.activeWords.splice(index, 1);

    gameState.combo = 0;
    gameState.lives--;
    gameState.lifeLostCount++;
    typingInput.value = "";
    updateHUD();

    if (gameState.lives <= 0) {
        triggerGameOver();
    }
}

// ==========================================
// 6. DETEKSI KETIKAN, TYPO, COMBO & POIN
// ==========================================
typingInput.addEventListener("input", () => {
    if (!gameState.isRunning) return;

    const currentVal = typingInput.value;
    if (currentVal.length === 0) {
        resetWordProgress();
        return;
    }

    const sortedWords = [...gameState.activeWords].sort((a, b) => b.y - a.y);
    const matchedWord = sortedWords.find(w => w.text.startsWith(currentVal));

    if (matchedWord) {
        typingInput.classList.remove("input-error");

        gameState.activeWords.forEach(w => {
            w.typedIndex = w.id === matchedWord.id ? currentVal.length : 0;
            updateWordHTML(w);
        });

        if (currentVal === matchedWord.text) {
            completeWord(matchedWord);
        }
    } else {
        triggerTypoEffect(sortedWords[0]);
    }
});

function triggerTypoEffect(targetWord) {
    gameState.typoCount++;
    typingInput.classList.add("input-error");
    gameState.combo = 0;
    updateHUD();

    if (targetWord) {
        targetWord.hadTypo = true;
        targetWord.el.classList.add("typo-flash");
        setTimeout(() => {
            if (targetWord.el) targetWord.el.classList.remove("typo-flash");
        }, 220);
    }

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

    const centerX = wordObj.x + wordObj.el.offsetWidth / 2;
    const centerY = wordObj.y + wordObj.el.offsetHeight / 2;
    createExplosion(centerX, centerY, "#38bdf8");

    wordObj.el.remove();
    gameState.activeWords.splice(idx, 1);
    typingInput.value = "";
    resetWordProgress();

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
        const lengthBonus = Math.min(20, Math.floor(wordObj.text.length / 2));
        earnedPoints = 20 + lengthBonus;

        if (isFast && !wordObj.hadTypo) {
            earnedPoints = 70;
        }
    }

    gameState.score += earnedPoints;

    while (gameState.score >= gameState.nextBonusThreshold) {
        gameState.combo++;
        gameState.comboEarnedCount++;

        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }

        showComboPopup(`${gameState.combo}x COMBO!`);

        gameState.nextBonusThreshold += gameState.nextComboThresholdIncrease;
        gameState.nextComboThresholdIncrease += 50;

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

    // Cek kemenangan jika bukan mode unlimited
    if (gameState.targetScore !== "unlimited" && gameState.score >= Number(gameState.targetScore)) {
        triggerWin();
    }
}

// ==========================================
// 7. EFEK VISUAL, WIN & GAME OVER
// ==========================================
function showComboPopup(text) {
    comboPopup.textContent = text;
    comboPopup.classList.remove("show");
    void comboPopup.offsetWidth;
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
    targetDisplay.textContent = gameState.targetScore === "unlimited" ? "∞" : gameState.targetScore;
    comboDisplay.textContent = `${gameState.combo}x`;
}

function triggerWin() {
    gameState.isRunning = false;
    clearAllTimers();

    const saved = recordGameResult(true);
    const targetText = saved.targetScore === "unlimited" ? "Unlimited" : `${saved.targetScore} Poin`;

    document.getElementById("win-subtitle").textContent =
        `Target ${targetText} pada mode ${saved.difficulty.toUpperCase()} tercapai!`;
    document.getElementById("win-score").textContent = saved.score;
    document.getElementById("win-target-label").textContent = targetText;
    document.getElementById("win-grade").textContent = saved.grade;
    document.getElementById("win-typo-count").textContent = saved.typoCount;
    document.getElementById("win-life-lost").textContent = saved.lifeLostCount;
    document.getElementById("win-combo-earned").textContent = saved.comboEarnedCount;
    document.getElementById("win-duration").textContent = saved.durationStr;

    winModal.classList.remove("hidden");
}

function triggerGameOver() {
    gameState.isRunning = false;
    clearAllTimers();

    const saved = recordGameResult(false);
    const targetText = saved.targetScore === "unlimited" ? "Unlimited" : `${saved.targetScore} Poin`;
    const gradeEl = document.getElementById("lose-grade");

    document.getElementById("final-score").textContent = saved.score;
    document.getElementById("lose-target-label").textContent = targetText;
    document.getElementById("final-combo").textContent = `${gameState.maxCombo}x`;
    document.getElementById("lose-typo-count").textContent = saved.typoCount;
    document.getElementById("lose-life-lost").textContent = saved.lifeLostCount;
    document.getElementById("lose-combo-earned").textContent = saved.comboEarnedCount;
    document.getElementById("lose-duration").textContent = saved.durationStr;

    gradeEl.textContent = saved.grade;
    gradeEl.className = `grade-pill ${saved.cssClass}`;

    gameoverModal.classList.remove("hidden");
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

arena.addEventListener("click", () => {
    if (gameState.isRunning) typingInput.focus();
});