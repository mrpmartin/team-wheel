const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

const API_URL = "https://script.google.com/a/macros/zayzoon.com/s/AKfycbyHDVJZMalmOmeu395uSe0NIM8Wyu6bjXdrUj17ZDT6VN1ZRgSTigElQya9Gp3yOSbR_g/exec";

// Shuffle function to randomize array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Original names in alphabetical order
const originalNames = ['Abby', 'AJ', 'Alicia', 'Anastasia', 'Asha', 'Bailey', 'Carla', 'Chevron', 'Daniel', 'Danielle', 'Dominic', 'Elizabeth', 'Jeremy', 'Jess', 'Johanna', 'Jordan', 'Juan', 'Karthika', 'Komal', 'Kristen', 'Leanne', 'Mahesh', 'Michael', 'Paul', 'Petra', 'Rakhee', 'Rayan', 'Ritchie', 'Safia', 'Samaira', 'Sarah', 'Satish', 'Sean', 'Simon', 'Sofia', 'Tom', 'Victoria', 'Victor', 'Zach', 'Zack', 'Vivien'];

// Randomize the names when page loads
let segments = shuffleArray(originalNames);
let selectedPeople = [];
let rotation = 0;
let isSpinning = false;

// TIMING CONFIGURATION
const SPIN_DURATION = 8500; // 8.5 seconds - when voice announces winner
const DISPLAY_WINNER_DURATION = 2000; // 2 seconds to show winner before removing
const REMOVE_DELAY = 2500; // Extra time after audio ends to remove from wheel

function renderWheel() {
    const segmentsContainer = document.getElementById('segments');
    segmentsContainer.innerHTML = '';
    
    segments.forEach((segment, index) => {
        const angle = (360 / segments.length) * index;
        const nextAngle = (360 / segments.length) * (index + 1);
        
        const x1 = 100 + 95 * Math.cos((angle - 90) * Math.PI / 180);
        const y1 = 100 + 95 * Math.sin((angle - 90) * Math.PI / 180);
        const x2 = 100 + 95 * Math.cos((nextAngle - 90) * Math.PI / 180);
        const y2 = 100 + 95 * Math.sin((nextAngle - 90) * Math.PI / 180);
        
        const largeArc = 360 / segments.length > 180 ? 1 : 0;
        const pathData = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;

        // Calculate text position - middle of the segment
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
        
        // Dynamic font size based on number of segments and name length
        let fontSize = 5;
        if (segments.length < 30) fontSize = 6;
        if (segments.length < 20) fontSize = 7;
        if (segments.length < 10) fontSize = 9;
        if (segment.length > 10) fontSize = Math.max(4, fontSize - 1);
        
        text.setAttribute('font-size', fontSize);
        text.setAttribute('font-weight', 'bold');
        
        // Rotate text so it's horizontal when at 9 o'clock position (left side)
        // We subtract 90 to make text horizontal and right-side-up at 9 o'clock
        text.setAttribute('transform', `rotate(${textAngle - 90}, ${textX}, ${textY})`);
        text.textContent = segment;
        
        g.appendChild(path);
        g.appendChild(text);
        segmentsContainer.appendChild(g);
    });
}

function renderSegmentsList() {
    const list = document.getElementById('segmentsList');
    list.innerHTML = '';
    
    segments.forEach((segment, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded" style="background-color: ${colors[index % colors.length]}"></div>
                <span class="text-gray-800">${segment}</span>
            </div>
            <button class="text-red-500 hover:text-red-700 transition-colors ${segments.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}" ${segments.length <= 1 ? 'disabled' : ''}>
                🗑️
            </button>
        `;
        
        const deleteBtn = div.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            if (segments.length > 1) {
                segments.splice(index, 1);
                updateUI();
            }
        });
        
        list.appendChild(div);
    });
    
    document.getElementById('segmentCount').textContent = segments.length;
}

function renderSelectedList() {
    const section = document.getElementById('selectedSection');
    const list = document.getElementById('selectedList');
    
    if (selectedPeople.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    section.classList.remove('hidden');
    list.innerHTML = '';
    
    selectedPeople.forEach((person, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200';
        div.innerHTML = `
            <span class="text-gray-800">${index + 1}. ${person}</span>
            <button class="text-blue-500 hover:text-blue-700 transition-colors text-sm">
                🔄 Add Back
            </button>
        `;
        
        const addBackBtn = div.querySelector('button');
        addBackBtn.addEventListener('click', () => {
            segments.push(person);
            selectedPeople = selectedPeople.filter(p => p !== person);
            updateUI();
        });
        
        list.appendChild(div);
    });
    
    document.getElementById('selectedCount').textContent = selectedPeople.length;
}

function updateUI() {
    renderWheel();
    renderSegmentsList();
    renderSelectedList();
    
    document.getElementById('completeBox').classList.toggle('hidden', segments.length > 0);
}
function spinWheel() {
    if (isSpinning || segments.length === 0) return;
    
    isSpinning = true;
    document.getElementById('winnerBox').classList.add('hidden');
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('spinBtn').textContent = '🎮 Spinning...';
    
    const audio = document.getElementById('spinSound');
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio play failed:', e));
    
    // Calculate spins to sync with audio
    const spins = 4 + Math.random() * 2; // 4-6 full rotations
    const randomDegree = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + randomDegree;
    
    const wheel = document.getElementById('wheel');
    
    // Update CSS transition to match spin duration
    wheel.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    rotation = totalRotation;
    
    // Show winner exactly when voice announces it (8.5 seconds)
    setTimeout(() => {
        const normalizedRotation = totalRotation % 360;
        const segmentAngle = 360 / segments.length;
        
        // Calculate winning index for 3 o'clock position
        const winningIndex = Math.floor((90 - normalizedRotation) / segmentAngle + segments.length) % segments.length;
        
        const winnerName = segments[winningIndex];
        document.getElementById('winnerName').textContent = winnerName;
        document.getElementById('winnerBox').classList.remove('hidden');
        
        // Wait for audio to finish + display time, then remove from wheel
        setTimeout(() => {
            selectedPeople.push(winnerName);
            segments.splice(winningIndex, 1);
            rotation = 0;
            wheel.style.transition = 'none';
            wheel.style.transform = 'rotate(0deg)';
            
            updateUI();
            
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            document.getElementById('spinBtn').textContent = '🎮 Spin the Wheel!';
            document.getElementById('winnerBox').classList.add('hidden');
        }, REMOVE_DELAY);
    }, SPIN_DURATION);
}
document.getElementById('spinBtn').addEventListener('click', spinWheel);

document.getElementById('addBtn').addEventListener('click', () => {
    const input = document.getElementById('newSegment');
    const value = input.value.trim();
    if (value) {
        segments.push(value);
        input.value = '';
        updateUI();
    }
});

document.getElementById('newSegment').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('addBtn').click();
    }
});

document.getElementById('addAllBackBtn').addEventListener('click', () => {
    segments = [...segments, ...selectedPeople];
    selectedPeople = [];
    updateUI();
});

updateUI();