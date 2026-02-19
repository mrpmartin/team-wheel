const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E2'];

const API_URL = "https://script.google.com/macros/s/AKfycbyHDVJZMalmOmeu395uSe0NIM8Wyu6bjXdrUj17ZDT6VN1ZRgSTigElQya9Gp3yOSbR_g/exec";

const originalNames = ['Abby','AJ','Alicia','Anastasia','Asha','Bailey','Carla','Chevron','Daniel','Danielle','Dominic','Elizabeth','Jeremy','Jess','Johanna','Jordan','Juan','Karthika','Komal','Kristen','Leanne','Mahesh','Michael','Paul','Petra','Rakhee','Rayan','Ritchie','Safia','Samaira','Sarah','Satish','Sean','Simon','Sofia','Tom','Victoria','Victor','Zach','Zack','Vivien'];

let segments = [];
let selectedPeople = [];
let rotation = 0;
let isSpinning = false;

const SPIN_DURATION = 8000;
const REMOVE_DELAY = 2000;

/* ================= LOAD STATE ================= */

async function loadState(){
    try{
        const res = await fetch(API_URL);
        const data = await res.json();

        segments = data.remaining
            ? data.remaining.split(",").filter(Boolean)
            : [...originalNames];

        selectedPeople = data.history
            ? data.history.split(",").filter(Boolean)
            : [];

    }catch{
        segments = [...originalNames];
        selectedPeople = [];
    }

    updateUI();
}

async function saveState(){
    await fetch(API_URL,{
        method:"POST",
        body:JSON.stringify({
            remaining:segments.join(","),
            history:selectedPeople.join(",")
        })
    });
}

/* ================= RENDER ================= */

function renderWheel(){
    const container = document.getElementById("segments");
    container.innerHTML="";

    if(segments.length===0) return;

    segments.forEach((name,index)=>{
        const angle=(360/segments.length)*index;
        const nextAngle=(360/segments.length)*(index+1);

        const x1=100+95*Math.cos((angle-90)*Math.PI/180);
        const y1=100+95*Math.sin((angle-90)*Math.PI/180);
        const x2=100+95*Math.cos((nextAngle-90)*Math.PI/180);
        const y2=100+95*Math.sin((nextAngle-90)*Math.PI/180);

        const largeArc=360/segments.length>180?1:0;
        const pathData=`M100 100 L ${x1} ${y1} A95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;

        const g=document.createElementNS("http://www.w3.org/2000/svg","g");

        const path=document.createElementNS("http://www.w3.org/2000/svg","path");
        path.setAttribute("d",pathData);
        path.setAttribute("fill",colors[index%colors.length]);

        const textAngle=angle+(360/segments.length)/2;
        const textX=100+65*Math.cos((textAngle-90)*Math.PI/180);
        const textY=100+65*Math.sin((textAngle-90)*Math.PI/180);

        const text=document.createElementNS("http://www.w3.org/2000/svg","text");
        text.setAttribute("x",textX);
        text.setAttribute("y",textY);
        text.setAttribute("text-anchor","middle");
        text.setAttribute("dominant-baseline","middle");
        text.setAttribute("fill","white");
        text.setAttribute("font-size","7");
        text.setAttribute("transform",`rotate(${textAngle-90},${textX},${textY})`);
        text.textContent=name;

        g.appendChild(path);
        g.appendChild(text);
        container.appendChild(g);
    });
}

function renderSegmentsList(){
    const container=document.getElementById("segmentsList");
    container.innerHTML="";
    segments.forEach(name=>{
        const row=document.createElement("div");
        row.className="flex justify-between bg-gray-100 px-3 py-2 rounded";
        row.innerHTML=`<span>${name}</span>`;
        container.appendChild(row);
    });
    document.getElementById("segmentCount").textContent=segments.length;
}

function renderSelectedList(){
    const container=document.getElementById("selectedList");
    container.innerHTML="";
    selectedPeople.forEach(name=>{
        const row=document.createElement("div");
        row.className="flex justify-between bg-yellow-100 px-3 py-2 rounded";
        row.innerHTML=`<span>${name}</span>`;
        container.appendChild(row);
    });
    document.getElementById("selectedCount").textContent=selectedPeople.length;
    document.getElementById("selectedSection")
        .classList.toggle("hidden",selectedPeople.length===0);
}

function updateUI(){
    renderWheel();
    renderSegmentsList();
    renderSelectedList();
}

/* ================= ADD ALL BACK ================= */

function addAllBack(){
    segments = [...segments, ...selectedPeople];
    selectedPeople = [];
    updateUI();
    saveState();
}

/* ================= SPIN ================= */

function spinWheel() {
    if (isSpinning || segments.length === 0) return;

    isSpinning = true;
    document.getElementById("spinBtn").disabled = true;

    // 🔊 PLAY SOUND
    const audio = document.getElementById("spinSound");
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => {
            console.log("Audio play prevented:", err);
        });
    }

    const spins = 4 + Math.random() * 2;
    const randomDegree = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + randomDegree;

    const wheel = document.getElementById("wheel");
    wheel.style.transition = `transform ${SPIN_DURATION}ms ease-out`;
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    rotation = totalRotation;

    setTimeout(() => {

        const normalized = totalRotation % 360;
        const segmentAngle = 360 / segments.length;

        const winningIndex =
            Math.floor((90 - normalized) / segmentAngle + segments.length) %
            segments.length;

        const winner = segments[winningIndex];

        document.getElementById("winnerName").textContent = winner;
        document.getElementById("winnerBox").classList.remove("hidden");

        setTimeout(() => {

            selectedPeople.push(winner);
            segments.splice(winningIndex, 1);

            // reset wheel cleanly
            rotation = 0;
            wheel.style.transition = "none";
            wheel.style.transform = "rotate(0deg)";

            updateUI();
            saveState();

            document.getElementById("spinBtn").disabled = false;
            isSpinning = false;

            if (segments.length === 0) {
                document.getElementById("completeBox").classList.remove("hidden");
            }

        }, REMOVE_DELAY);

    }, SPIN_DURATION);
}

/* ================= INIT ================= */

document.getElementById("spinBtn").addEventListener("click",spinWheel);
document.getElementById("addBtn").addEventListener("click",()=>{
    const input=document.getElementById("newSegment");
    const value=input.value.trim();
    if(!value) return;
    segments.push(value);
    input.value="";
    updateUI();
    saveState();
});
document.getElementById("addAllBackBtn").addEventListener("click",addAllBack);

loadState();
