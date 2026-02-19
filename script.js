const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

const API_URL = "https://script.google.com/macros/s/AKfycbyHDVJZMalmOmeu395uSe0NIM8Wyu6bjXdrUj17ZDT6VN1ZRgSTigElQya9Gp3yOSbR_g/exec;

// Shuffle function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Original names
const originalNames = ['Abby', 'AJ', 'Alicia', 'Anastasia', 'Asha', 'Bailey', 'Carla', 'Chevron', 'Daniel', 'Danielle', 'Dominic', 'Elizabeth', 'Jeremy', 'Jess', 'Johanna', 'Jordan', 'Juan', 'Karthika', 'Komal', 'Kristen', 'Leanne', 'Mahesh', 'Michael', 'Paul', 'Petra', 'Rakhee', 'Rayan', 'Ritchie', 'Safia', 'Samaira', 'Sarah', 'Satish', 'Sean', 'Simon', 'Sofia', 'Tom', 'Victoria', 'Victor', 'Zach', 'Zack', 'Vivien'];

let segments = [];
let selectedPeople = [];
let rotation = 0;
let isSpinning = false;

const SPIN_DURATION = 8500;
const REMOVE_DELAY = 2500;

/* ===============================
   GOOGLE SHEET LOAD + SAVE
================================ */

async function loadState() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (data.remaining) {
            segments = data.remaining.split(",").filter(Boolean);
        } else {
            segments = shuffleArray(originalNames);
        }

        if (data.history) {
            selectedPeople = data.history.split(",").filter(Boolean);
        } else {
            selectedPeople = [];
        }

    } catch (err) {
        console.log("Load failed, using default list");
        segments = shuffleArray(originalNames);
        selectedPeople = [];
    }

    updateUI();
}

async function saveState() {
    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                remaining: segments.join(","),
                history: selectedPeople.join(",")
            })
        });
    } catch (err) {
        console.log("Save failed:", err);
    }
}

/* ===============================
   RENDERING
================================ */

function renderWheel() {
    const segmentsContainer = document.getElementById('segments');
    segmentsContainer.innerHTML = '';

    if (segments.length === 0) return;

    segments.forEach((segment, index) => {
        const angle = (360 / segments.length) * index;
        const nextAngle = (360 / segments.length) * (index + 1);

        const x1 = 100 + 95 * Math.cos((angle - 90) * Math.PI / 180);
        const y1 = 100 + 95 * Math.sin((angle - 90) * Math.PI / 180);
        const x2 = 100 + 95 * Math.cos((nextAngle - 90) * Math.PI / 180);
        const y2 = 100 + 95 * Math.sin((nextAngle - 90) * Math.PI / 180);

        const largeArc = 360 / segments.length > 180 ? 1 : 0;
        const pathData = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;

        const textAngle = angle + (360 / segments.length) / 2;
        const textX = 100 + 65 * Math.cos((textAngle - 90) * Math.PI / 180);
        const textY = 100 + 65 * Math.sin((textAngle - 90) * Math.PI / 180);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', colors[index % colors.length]);
        path.setAttribute('stroke', '#333');
        path.setAttribute('stroke-width', '1');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');

        let fontSize = 5;
        if (segments.length < 30) fontSize = 6;
        if (segments.length < 20) fontSize = 7;
        if (segments.length < 10) fontSize = 9;
        if (segment.length > 10) fontSize = Math.max(4, fontSize - 1);

        text.setAttribute('font-size', fontSize);
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('transform', `rotate(${textAngle - 90}, ${textX}, ${textY})`);
        text.textContent = segment;

        g.appendChild(path);
        g.appendChild(text);
        segmentsContainer.appendChild(g);
    });
}

function updateUI() {
    renderWheel();
    renderSegmentsList();
    renderSelectedList();
    document.getElementById('completeBox').classList.toggle('hidden', segments.length > 0);
}

/* ===============================
   SPIN LOGIC
================================ */

function spinWheel() {
    if (isSpinning || segments.length === 0) return;

    isSpinning = true;
    document.getElementById('winnerBox').classList.add('hidden');
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('spinBtn').textContent = '🎮 Spinning...';

    const audio = document.getElementById('spinSound');
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio play failed:', e));

    const spins = 4 + Math.random() * 2;
    const randomDegree = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + randomDegree;

    const wheel = document.getElementById('wheel');
    wheel.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    rotation = totalRotation;

    setTimeout(() => {
        const normalizedRotation = totalRotation % 360;
        const segmentAngle = 360 / segments.length;
        const winningIndex = Math.floor((90 - normalizedRotation) / segmentAngle + segments.length) % segments.length;

        const winnerName = segments[winningIndex];
        document.getElementById('winnerName').textContent = winnerName;
        document.getElementById('winnerBox').classList.remove('hidden');

        setTimeout(() => {
            selectedPeople.push(winnerName);
            segments.splice(winningIndex, 1);

            rotation = 0;
            wheel.style.transition = 'none';
            wheel.style.transform = 'rotate(0deg)';

            updateUI();
            saveState();   // ✅ SAVE HERE

            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            document.getElementById('spinBtn').textContent = '🎮 Spin the Wheel!';
            document.getElementById('winnerBox').classList.add('hidden');
        }, REMOVE_DELAY);

    }, SPIN_DURATION);
}

/* ===============================
   INITIAL LOAD
================================ */

document.getElementById('spinBtn').addEventListener('click', spinWheel);

loadState();  // ✅ load from Google Sheet on page open
