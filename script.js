const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let planets = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";

    startButton.x = canvas.width / 2 - 80;
    startButton.y = canvas.height / 2 - 30;

    highScoreButton.x = canvas.width / 2 - 80;
    highScoreButton.y = canvas.height / 2 + 50;

    restartButton.x = canvas.width / 2 - 120;
    restartButton.y = canvas.height / 2 + 90;

    if (planets.length > 0) 
    planets.forEach(p => {
        p.x = canvas.width * p.xRatio;
        p.y = canvas.height * p.yRatio;
    });
}

let bird = { x: 80, y: 200, size: 15, velocity: 0 };

let gravity = 0.5;
let jump = -8;

let pipes = [];
let score = 0;

// 🏆 TAMBAHAN
let highScore = localStorage.getItem("highScore") || 0;

// 🔊 FIX: LOAD VOLUME
let savedVolume = localStorage.getItem("volume");
if (savedVolume === null) savedVolume = 0.3;

let lastClick = 0;
let gameStarted = false;
let gameOver = false;
let gameOverTriggered = false;
let showHighScore = false;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundBuffers = {};
let soundsReady = false;

let bgMusicSource = null;
let bgMusicGain = null;
let bgMusicStarted = false;

async function loadSoundBuffer(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    soundBuffers[name] = audioBuffer;
}

function playSound(name, volume = 1) {
    if (!soundsReady) return;

    const buffer = soundBuffers[name];
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(0);
}

function startBgMusic(volume = 1) {
    const buffer = soundBuffers["bgmusic"];
    if (!buffer) return;

    stopBgMusic();

    bgMusicSource = audioCtx.createBufferSource();
    bgMusicGain = audioCtx.createGain();

    bgMusicSource.buffer = buffer;
    bgMusicSource.loop = true;
    bgMusicGain.gain.value = volume;

    bgMusicSource.connect(bgMusicGain);
    bgMusicGain.connect(audioCtx.destination);

    bgMusicSource.start(0);
    bgMusicStarted = true;
}

function stopBgMusic() {
    if (bgMusicSource) {
        try {
            bgMusicSource.stop(0);
        } catch (e) {}
        bgMusicSource.disconnect();
        bgMusicSource = null;
    }

    if (bgMusicGain) {
        bgMusicGain.disconnect();
        bgMusicGain = null;
    }

    bgMusicStarted = false;
}

function setBgMusicVolume(volume) {
    if (bgMusicGain) {
        bgMusicGain.gain.value = volume;
    }
}

// ✨ EFFECT START & RESTART
let startEffect = 0;
let restartEffect = 0;


// 🔘 BUTTON
let startButton = {
    x: canvas.width / 2 - 80,
    y: canvas.height / 2 - 30,
    width: 160,
    height: 60
};

let highScoreButton = {
    x: canvas.width / 2 - 80,
    y: canvas.height / 2 + 50,
    width: 160,
    height: 60
};

let restartButton = {
    x: canvas.width / 2 - 120,
    y: 380,
    width: 240,
    height: 55
};

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

window.addEventListener("DOMContentLoaded", function() {
    let bar = document.getElementById("progress-bar");
    let width = 0;

    let loading = setInterval(function() {
       if (width >= 100) {
    clearInterval(loading);
    document.getElementById("loading-screen").remove();
    document.getElementById("game").style.display = "block";

    warmUpSpeech();

    Promise.all([
    loadSoundBuffer("jump", "jump.wav"),
    loadSoundBuffer("start", "startsound.ogg"),
    loadSoundBuffer("crash", "crash.ogg"),
    loadSoundBuffer("bgmusic", "bgmusic.ogg")
]).then(() => {
    soundsReady = true;
}).catch(err => console.log("Sound load error:", err));
}
         else {
            width += 2;
            bar.style.width = width + "%";
        }
    }, 30);
});

function startGameFromMenu(firstLaunch = false) {
    showHighScore = false;

    playSound("start", savedVolume);

    setTimeout(() => {
        startBgMusic(savedVolume);
    }, firstLaunch ? 120 : 60);

    startEffect = 10;

    setTimeout(() => {
        gameStarted = true;
    }, 120);
}

async function warmUpSounds() {
    if (audioCtx.state === "suspended") {
        await audioCtx.resume();
    }
}



// ⭐ BINTANG
let stars = [];
for (let i = 0; i < 140; i++) {
    let yPos = Math.random() * canvas.height;
    if (Math.random() < 0.25) {
        yPos = canvas.height * (0.65 + Math.random() * 0.3);
    }

    stars.push({
        x: Math.random() * canvas.width,
        y: yPos,
        size: 0.8 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.7
    });
}
let earth = {
    x: 300,
    y: 120,
    size: 35
};

let orbitPlanets = [
    { radius: 60, angle: 0, speed: 0.02, size: 6, color: "#aaa" },     // Mercury
    { radius: 80, angle: 1, speed: 0.015, size: 8, color: "#eccc9a" }, // Venus
    { radius: 100, angle: 2, speed: 0.01, size: 10, color: "#2a7fff" },// Earth-like
    { radius: 120, angle: 3, speed: 0.008, size: 9, color: "#c1440e" } // Mars
];

// 🪐 PLANET
planets = [
    { name: "Mercury", color: "#aaa", size: 6, speed: 0.18, xRatio: 0.18, yRatio: 0.18 },
    { name: "Venus", color: "#eccc9a", size: 10, speed: 0.14, xRatio: 0.82, yRatio: 0.16 },
    { name: "Earth", color: "#2a7fff", size: 12, speed: 0.12, xRatio: 0.72, yRatio: 0.32 },
    { name: "Mars", color: "#c1440e", size: 9, speed: 0.15, xRatio: 0.25, yRatio: 0.38 },
    { name: "Jupiter", color: "#d9a066", size: 20, speed: 0.08, xRatio: 0.88, yRatio: 0.55 },
    { name: "Saturn", color: "#e5d3a1", size: 18, speed: 0.07, xRatio: 0.14, yRatio: 0.62 },
    { name: "Uranus", color: "#7fffd4", size: 14, speed: 0.06, xRatio: 0.30, yRatio: 0.78 },
    { name: "Neptune", color: "#4169e1", size: 14, speed: 0.06, xRatio: 0.78, yRatio: 0.82 }
].map(p => ({
    ...p,
    x: canvas.width * p.xRatio,
    y: canvas.height * p.yRatio
}));

let isSpeaking = false;
let speechTimeout = null;
let speechRunId = 0;


function warmUpSpeech() {
    if (!("speechSynthesis" in window)) return;

    const warm = new SpeechSynthesisUtterance("");
    warm.volume = 0;
    warm.lang = "en-US";

    speechSynthesis.cancel();
    speechSynthesis.speak(warm);
}

function numberToEnglish(n) {
    const ones = [
        "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"
    ];

    const tens = [
        "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    ];

    if (n < 20) return ones[n];

    if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "");
    }

    if (n < 1000) {
        return ones[Math.floor(n / 100)] + " hundred" +
            (n % 100 ? " and " + numberToEnglish(n % 100) : "");
    }

    if (n < 100000) {
        return numberToEnglish(Math.floor(n / 1000)) + " thousand" +
            (n % 1000
                ? (n % 1000 < 100 ? " and " : " ") + numberToEnglish(n % 1000)
                : "");
    }

    return String(n);
}

function speakGameOverWithScore(score) {
    speechRunId++;
    const currentRun = speechRunId;

    if (isSpeaking) return;

    isSpeaking = true;
    clearTimeout(speechTimeout);
    speechTimeout = null;
    speechSynthesis.cancel();

    const scoreWords = numberToEnglish(score);

    let voices = speechSynthesis.getVoices();
    let englishVoice =
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang === "en-GB") ||
        voices.find(v => v.lang.startsWith("en")) ||
        null;

    let speech1 = new SpeechSynthesisUtterance("Game over...");
    let speech2 = new SpeechSynthesisUtterance("You scored " + scoreWords + ".");

    speech1.lang = "en-US";
    speech2.lang = "en-US";

    if (englishVoice) {
        speech1.voice = englishVoice;
        speech2.voice = englishVoice;
    }

    speech1.rate = 0.92;
    speech2.rate = 0.9;
    speech1.pitch = 1.0;
    speech2.pitch = 1.0;
    speech1.volume = 1;
    speech2.volume = 1;

    speech1.onend = () => {
        if (!gameOver || currentRun !== speechRunId) {
            isSpeaking = false;
            return;
        }

        speechTimeout = setTimeout(() => {
            if (!gameOver || currentRun !== speechRunId) {
                isSpeaking = false;
                return;
            }
            speechSynthesis.speak(speech2);
        }, 180);
    };

    speech2.onend = () => {
        if (currentRun === speechRunId) {
            isSpeaking = false;
        }
    };

    speechSynthesis.speak(speech1);
}

function handleInput(e) {
    e.preventDefault();

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let padding = 25;

    let tappedStartButton =
        x > startButton.x - padding &&
        x < startButton.x + startButton.width + padding &&
        y > startButton.y - padding &&
        y < startButton.y + startButton.height + padding;

    if (!window.audioUnlocked) {
        window.audioUnlocked = true;

        warmUpSounds().then(() => {
            if (!gameStarted && tappedStartButton) {
                startGameFromMenu(true);
            }
        });

        if (tappedStartButton) return;
    }

    let now = Date.now();
    if (now - lastClick < 120) return;
    lastClick = now;

    if (!gameStarted) {
    if (showHighScore) {
        let padding = 25;

        let tappedHighScoreButton =
            x > highScoreButton.x - padding &&
            x < highScoreButton.x + highScoreButton.width + padding &&
            y > highScoreButton.y - padding &&
            y < highScoreButton.y + highScoreButton.height + padding;

        let tappedStartButton =
            x > startButton.x - padding &&
            x < startButton.x + startButton.width + padding &&
            y > startButton.y - padding &&
            y < startButton.y + startButton.height + padding;

        if (!tappedHighScoreButton && !tappedStartButton) {
            showHighScore = false;
            return;
        }
    }
    
     if (
    x > startButton.x - padding &&
    x < startButton.x + startButton.width + padding &&
    y > startButton.y - padding &&
    y < startButton.y + startButton.height + padding
) {
    startGameFromMenu();
return;
}

        if (
            x > highScoreButton.x - padding &&
            x < highScoreButton.x + highScoreButton.width + padding &&
            y > highScoreButton.y - padding &&
            y < highScoreButton.y + highScoreButton.height + padding
        ) {
            showHighScore = !showHighScore;
            return;
        }

        return;
    }

    if (gameOver) {
        let restartPadding = 30;

        if (
            x > restartButton.x - restartPadding &&
            x < restartButton.x + restartButton.width + restartPadding &&
            y > restartButton.y - restartPadding &&
            y < restartButton.y + restartButton.height + restartPadding
        ) {
            restartEffect = 20;

            setTimeout(() => {
    clearTimeout(speechTimeout);
    speechTimeout = null;
    speechRunId++;
    speechSynthesis.cancel();
    isSpeaking = false;
    resetGame();
}, 150);

            return;
        }

        return;
    }

    playSound("jump", savedVolume);
bird.velocity = jump;
}

// 🔥 DI LUAR FUNCTION
canvas.addEventListener("pointerdown", handleInput);

// KEY
document.addEventListener("keydown", () => {
    if (gameOver) return;
    if (gameStarted) {
        playSound("jump", savedVolume);
        bird.velocity = jump;
    }
});

// PIPE
function createPipe() {
    if (!gameStarted || gameOver) return;

    let gap = 150;
    let top = Math.random() * 300;

    pipes.push({
        x: canvas.width,
        top: top,
        bottom: canvas.height - top - gap
    });
}

// BACKGROUND
function drawBackground() {
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#050010");
    sky.addColorStop(1, "#12002b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ⭐ BINTANG
    stars.forEach(star => {
        star.alpha += (Math.random() - 0.5) * 0.05;
        star.alpha = Math.max(0, Math.min(1, star.alpha));
        ctx.fillStyle = "rgba(255,255,255," + star.alpha + ")";
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // 🪐 PLANET REALISTIS
planets.forEach(p => {

    let grad = ctx.createRadialGradient(
        p.x - p.size * 0.3,
        p.y - p.size * 0.3,
        2,
        p.x,
        p.y,
        p.size
    );

    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, p.color);
    grad.addColorStop(1, "#000");

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // ✨ glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 🪐 Saturn ring
    if (p.name === "Saturn") {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size + 10, p.size / 2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 🌍 Earth detail
    if (p.name === "Earth") {
        ctx.fillStyle = "rgba(0,255,0,0.5)";
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // moon orbit
        let moonAngle = Date.now() * 0.0012;
        let moonDistance = p.size + 8;
        let moonX = p.x + Math.cos(moonAngle) * moonDistance;
        let moonY = p.y + Math.sin(moonAngle) * moonDistance;

        // orbit line tipis
        ctx.beginPath();
        ctx.arc(p.x, p.y, moonDistance, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // moon
        ctx.beginPath();
        ctx.arc(moonX, moonY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#d8d8d8";
        ctx.fill();
    }

    // 🟠 Jupiter stripes
    if (p.name === "Jupiter") {
        for (let i = -2; i < 3; i++) {
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(p.x - p.size, p.y + i * 4, p.size * 2, 2);
        }
    }

    // gerak
    p.x -= p.speed;
    if (p.x < -p.size - 20) {
        p.x = canvas.width + p.size + 20;
    }
});

// glow bumi
ctx.shadowColor = "#2a7fff";
ctx.shadowBlur = 25;
ctx.fill();
ctx.shadowBlur = 0;

} // ✅ penutup drawBackground()


// BUTTON
function drawButton(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function drawNeonPipe3D(x, y, w, h) {
    ctx.shadowColor = "#8b5cf6";
    ctx.shadowBlur = 12;

    let grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#2a0055");
    grad.addColorStop(0.3, "#7c3aed");
    grad.addColorStop(0.5, "#a855f7");
    grad.addColorStop(0.7, "#7c3aed");
    grad.addColorStop(1, "#2a0055");

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // highlight tipis
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x + 5, y, 3, h);

    ctx.shadowBlur = 0;
}

// LOOP
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (!gameStarted) {
        let glow = 20 + Math.sin(Date.now() * 0.005) * 10;

        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 38px Arial";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = glow;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("COSMIC HOPPER", canvas.width / 2, canvas.height * 0.25);
        ctx.shadowBlur = 0;

        ctx.shadowColor = "#8a2be2";
        ctx.shadowBlur = 25;

        let grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, "#a855f7");
        grad.addColorStop(1, "#6d28d9");

        ctx.fillStyle = grad;
if (startEffect > 0) {
    ctx.save();

    ctx.translate(
        startButton.x + startButton.width / 2,
        startButton.y + startButton.height / 2
    );

   ctx.scale(1 + startEffect * 0.02, 1 + startEffect * 0.02);

    ctx.translate(
        -startButton.width / 2,
        -startButton.height / 2
    );

    drawButton(0, 0, startButton.width, startButton.height, 20);

    ctx.restore();

    startEffect *= 0.85;
} else {
    drawButton(startButton.x, startButton.y, startButton.width, startButton.height, 20);
}

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText("START",
            startButton.x + startButton.width / 2,
            startButton.y + startButton.height / 2
        );

        ctx.fillStyle = grad;
drawButton(highScoreButton.x, highScoreButton.y, highScoreButton.width, highScoreButton.height, 20);

ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#ffffff";
ctx.font = "16px Arial";

ctx.fillText(
    "HIGH SCORE",
    highScoreButton.x + highScoreButton.width / 2,
    highScoreButton.y + highScoreButton.height / 2
);

ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";

        if (showHighScore) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(
        canvas.width / 2 - 120,
        canvas.height / 2 + 60,
        240,
        100
    );

    let boxX = canvas.width / 2 - 120;
let boxY = canvas.height / 2 + 60;
let boxW = 240;
let boxH = 100;

// background kotak
ctx.fillStyle = "rgba(0,0,0,0.7)";
ctx.fillRect(boxX, boxY, boxW, boxH);

// teks center
ctx.textAlign = "center";
ctx.textBaseline = "middle";

// judul
ctx.fillStyle = "#00ffff";
ctx.font = "bold 18px Arial";
ctx.fillText("BEST SCORE", boxX + boxW / 2, boxY + boxH / 3);

// score
ctx.fillStyle = "#ffffff";
ctx.font = "bold 28px Arial";
ctx.fillText(highScore, boxX + boxW / 2, boxY + (boxH / 3) * 2);

// balikin normal
ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";
}
    }

    else if (gameOver) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let shakeX = (Math.random() - 0.5) * 10;
        let shakeY = (Math.random() - 0.5) * 10;

     let centerY = canvas.height / 2;

     // 🎯 GAME OVER (tetap)
ctx.fillStyle = "red";
ctx.fillText("GAME OVER", canvas.width / 2 + shakeX + 3, centerY - 80 + shakeY);

ctx.fillStyle = "cyan";
ctx.fillText("GAME OVER", canvas.width / 2 + shakeX - 3, centerY - 80 + shakeY);

ctx.fillStyle = "#fff";
ctx.font = "40px Arial";
ctx.fillText("GAME OVER", canvas.width / 2 + shakeX, centerY - 80 + shakeY);

// 🏆 BEST SCORE (NAIKIN)
ctx.fillStyle = "#ffffff";
drawButton(canvas.width / 2 - 100, centerY - 40, 200, 50, 15);

ctx.fillStyle = "#000";
ctx.font = "20px Arial";
ctx.fillText("Best: " + highScore, canvas.width / 2, centerY - 15);

// 🎮 SCORE (IKUT NAIK)
ctx.fillStyle = "#ffffff";
drawButton(canvas.width / 2 - 100, centerY + 20, 200, 50, 15);

ctx.fillStyle = "#000";
ctx.fillText("Score: " + score, canvas.width / 2, centerY + 45);

        ctx.fillStyle = "#ff0040";
if (restartEffect > 0 && gameOver) {
    ctx.save();

    ctx.translate(
        restartButton.x + restartButton.width / 2,
        restartButton.y + restartButton.height / 2
    );

   ctx.scale(1 + restartEffect * 0.02, 1 + restartEffect * 0.02);

    ctx.translate(
        -restartButton.width / 2,
        -restartButton.height / 2
    );

    drawButton(0, 0, restartButton.width, restartButton.height, 15);
    ctx.restore();

    restartEffect *= 0.85;
} else {
    drawButton(restartButton.x, restartButton.y, restartButton.width, restartButton.height, 15);
}

        ctx.fillStyle = "#fff";
        ctx.font = "18px Arial";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

       ctx.fillText(
    "CLICK TO RESTART",
    restartButton.x + restartButton.width / 2,
    restartButton.y + restartButton.height / 2
);

ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";
    }

    else {
        bird.velocity += gravity;
        bird.y += bird.velocity;

    // 🛸 UFO EMOJI FIX (PROPORSI BAGUS)

let x = bird.x;
let y = bird.y;
let s = bird.size * 1.4; // dibesarin dikit biar keliatan

// glow halus
ctx.shadowColor = "#00ffcc";
ctx.shadowBlur = 12;

// === BADAN UFO (lebih bulat & pas) ===
let bodyGrad = ctx.createLinearGradient(x, y, x, y + s);
bodyGrad.addColorStop(0, "#e5e5e5");
bodyGrad.addColorStop(1, "#666");

ctx.beginPath();
ctx.ellipse(x + s/2, y + s/2, s * 0.9, s * 0.4, 0, 0, Math.PI * 2);
ctx.fillStyle = bodyGrad;
ctx.fill();

// === KUBAH (lebih tengah & natural) ===
let glassGrad = ctx.createRadialGradient(
    x + s/2, y + s/2.2, 2,
    x + s/2, y + s/2.2, s * 0.5
);
glassGrad.addColorStop(0, "#c7f9ff");
glassGrad.addColorStop(1, "#0ea5e9");

ctx.beginPath();
ctx.ellipse(x + s/2, y + s/2.2, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
ctx.fillStyle = glassGrad;
ctx.fill();

// === RING BAWAH (biar kayak emoji asli) ===
ctx.beginPath();
ctx.ellipse(x + s/2, y + s*0.75, s * 0.6, s * 0.2, 0, 0, Math.PI * 2);
ctx.fillStyle = "rgba(168,85,247,0.5)";
ctx.fill();

// === LAMPU SIMETRIS (INI KUNCI BIAR BAGUS) ===
let lampCount = 4;
for (let i = 0; i < lampCount; i++) {
    let angle = (i / (lampCount - 1)) * Math.PI;
    let lx = x + s/2 + Math.cos(angle - Math.PI) * (s * 0.6);
    let ly = y + s*0.7;

    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#34d399";
    ctx.fill();
}

ctx.shadowBlur = 0;


     pipes.forEach(pipe => {
    pipe.x -= 2;

    drawNeonPipe3D(pipe.x, 0, 40, pipe.top);
    drawNeonPipe3D(pipe.x, canvas.height - pipe.bottom, 40, pipe.bottom);

    if (
        bird.x < pipe.x + 40 &&
        bird.x + bird.size > pipe.x &&
        (bird.y < pipe.top || bird.y + bird.size > canvas.height - pipe.bottom)
    ) {
        if (!gameOver && !gameOverTriggered) {
            gameOverTriggered = true;

            playSound("crash", savedVolume * 0.8);

            stopBgMusic();
              gameOver = true;
            speakGameOverWithScore(score);
            

            if (score > highScore) {
                highScore = score;
                localStorage.setItem("highScore", highScore);
            }
        }
    }

    if (pipe.x === bird.x) score++;
});

if (bird.y > canvas.height || bird.y < 0) {
    if (!gameOver) {
        playSound("crash", savedVolume * 0.8);

        stopBgMusic();
        speakGameOverWithScore(score);
        gameOver = true;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }
    }
}

        // 🔵 SCORE (TENGAH + BULAT)
        let scoreX = canvas.width / 2;
        let scoreY = 60;

        ctx.beginPath();
        ctx.arc(scoreX, scoreY, 25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fill();

        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(score, scoreX, scoreY);

        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }

    requestAnimationFrame(update);
}

setInterval(createPipe, 2000);
update();

function resetGame() {
    clearTimeout(speechTimeout);
    speechTimeout = null;
    speechRunId++;
    speechSynthesis.cancel();
    isSpeaking = false;

    gameOverTriggered = false;
    
    bird.y = 200;
    bird.velocity = 0;

    pipes = [];
    score = 0;

    gameOver = false;
    gameStarted = false;
    showHighScore = false;

    stopBgMusic();

    restartEffect = 0;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("SW registered"))
    .catch(err => console.log("SW error:", err));
}