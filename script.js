// --- AUDIO SYSTEM (Hybrid) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let lastHoverTime = 0;

const sfxCorrect = new Audio('correct.mp3');
const sfxWrong = new Audio('wrong.mp3');
sfxCorrect.volume = 0.8; sfxWrong.volume = 0.8;

function playSound(type) {
    if (type === 'hover') {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (Date.now() - lastHoverTime < 50) return; 
        lastHoverTime = Date.now();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        osc.type = 'sine'; osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.01, now);
        osc.start(now); osc.stop(now + 0.05);
    } 
    else if (type === 'correct') {
        sfxCorrect.currentTime = 0; sfxCorrect.play();
    } 
    else if (type === 'wrong') {
        sfxWrong.currentTime = 0; sfxWrong.play();
    }
}

// --- UI HELPERS (Theme & Modal) ---
function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
}

let modalCallback = null;
function showModal(title, message, callback) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').style.display = 'flex';
    modalCallback = callback;
}
function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
    if (modalCallback) modalCallback();
}


// --- DATA & STATE ---
let isMultiplayer = false;
let isHost = false;
let peer, connection;
let myScore = 0, opponentScore = 0;
let highScore = localStorage.getItem('atlasHighScore') || 0;

let allValidCountries = [];
let currentTarget = "";
let iFinishedRound = false;
let opponentFinishedRound = false;
const microstates = [
    { name: "Vatican", coords: [12.4534, 41.9029] }, { name: "Monaco", coords: [7.4246, 43.7384] },
    { name: "San Marino", coords: [12.4578, 43.9424] }, { name: "Liechtenstein", coords: [9.5209, 47.1410] },
    { name: "Andorra", coords: [1.5218, 42.5063] }, { name: "Malta", coords: [14.4058, 35.9375] },
    { name: "Singapore", coords: [103.8198, 1.3521] }, { name: "Bahrain", coords: [50.5577, 26.0667] },
    { name: "Maldives", coords: [73.2207, 3.2028] }, { name: "Seychelles", coords: [55.4920, -4.6796] },
    { name: "Sao Tome and Principe", coords: [6.6131, 0.1864] }, { name: "Antigua and Barbuda", coords: [-61.7964, 17.0608] },
    { name: "Barbados", coords: [-59.5432, 13.1939] }, { name: "Dominica", coords: [-61.3710, 15.4150] },
    { name: "Grenada", coords: [-61.6790, 12.1165] }, { name: "Saint Kitts and Nevis", coords: [-62.7830, 17.3578] },
    { name: "Saint Lucia", coords: [-60.9789, 13.9094] }, { name: "Saint Vincent and the Grenadines", coords: [-61.2872, 13.2528] },
    { name: "Fiji", coords: [178.0650, -17.7134] }, { name: "Kiribati", coords: [173.0000, 1.4167] },
    { name: "Marshall Islands", coords: [171.1845, 7.1315] }, { name: "Micronesia", coords: [158.2500, 6.8500] },
    { name: "Nauru", coords: [166.9315, -0.5228] }, { name: "Palau", coords: [134.5825, 7.5150] },
    { name: "Samoa", coords: [-172.1046, -13.7590] }, { name: "Tonga", coords: [-175.1982, -21.1790] },
    { name: "Tuvalu", coords: [179.1940, -8.5222] }, { name: "Vanuatu", coords: [166.9592, -15.3767] }
];

const excludedTerritories = ["Antarctica", "Greenland", "Falkland Islands", "Western Sahara", "French Southern and Antarctic Lands", "New Caledonia", "Puerto Rico"];

// --- INITIALIZATION ---
document.getElementById('lobby-high-score').innerText = highScore;
document.getElementById('high-score-display').innerText = "High Score: " + highScore;

function initUI() {
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    drawMap();
}

function startSoloGame() {
    isMultiplayer = false;
    initUI();
}

// --- MULTIPLAYER SETUP ---
function hostGame() {
    peer = new Peer();
    isHost = true;
    peer.on('open', (id) => {
        document.getElementById('room-id-display').innerText = "Room ID: " + id;
    });
    peer.on('connection', (conn) => {
        connection = conn;
        setupMultiplayer();
    });
}

function joinGame() {
    const roomId = document.getElementById('join-id').value.trim();
    if (!roomId) {
        showModal("Error", "Please enter a Room ID.", null);
        return;
    }
    peer = new Peer();
    peer.on('open', () => {
        connection = peer.connect(roomId);
        setupMultiplayer();
    });
}

function setupMultiplayer() {
    isMultiplayer = true;
    document.getElementById('p2-score-text').style.display = 'inline';
    document.getElementById('high-score-display').style.display = 'none';
    
    connection.on('open', () => initUI());

    connection.on('data', (data) => {
        if (data.type === 'new_target') {
            // New round started! Reset the "finished" trackers for the client
            iFinishedRound = false;
            opponentFinishedRound = false;
            currentTarget = data.country;
            document.getElementById('target-country').innerText = currentTarget;
            
        } else if (data.type === 'score_update') {
            // Opponent found the country!
            opponentScore = data.score;
            document.getElementById('p2-score-text').innerText = " | Opponent: " + opponentScore;
            opponentFinishedRound = true;
            
            // If we have BOTH found it, and I am the Host, move to the next country
            if (iFinishedRound && opponentFinishedRound && isHost) {
                // Wait 1 second so the players can register they both got it
                setTimeout(nextTurn, 1000); 
            }
            
        } else if (data.type === 'game_over') {
            showModal("You Win!", "Your opponent clicked the wrong country!", () => location.reload());
        }
    });
}

function nextTurn() {
    if (isMultiplayer && !isHost) return;
    
    // Reset trackers for the Host
    iFinishedRound = false;
    opponentFinishedRound = false;

    const randomIdx = Math.floor(Math.random() * allValidCountries.length);
    currentTarget = allValidCountries[randomIdx];
    document.getElementById('target-country').innerText = currentTarget;

    if (isMultiplayer && isHost) {
        connection.send({ type: 'new_target', country: currentTarget });
    }
}

function handleCountryClick(clickedName) {
    if (!currentTarget) return; 

    // NEW FIX: If you already clicked the correct country this round, ignore further clicks
    if (isMultiplayer && iFinishedRound) return; 

    if (clickedName === currentTarget) {
        // CORRECT
        playSound('correct');
        myScore++;
        document.getElementById('p1-score-text').innerText = "Score: " + myScore;
        
        if (!isMultiplayer) {
            // Solo Mode
            if (myScore > highScore) {
                highScore = myScore;
                localStorage.setItem('atlasHighScore', highScore);
                document.getElementById('high-score-display').innerText = "High Score: " + highScore;
            }
            nextTurn();
        } else {
            // Multiplayer Mode: Mark that you finished the round
            iFinishedRound = true;
            connection.send({ type: 'score_update', score: myScore });
            
            if (opponentFinishedRound) {
                // You were the last one to find it!
                document.getElementById('target-country').innerText = "Both found it! Loading next...";
                if (isHost) {
                    setTimeout(nextTurn, 1000); 
                }
            } else {
                // You found it first, now you have to wait for them.
                document.getElementById('target-country').innerText = "Waiting for opponent...";
            }
        }
    } else {
        // WRONG (Instant Death)
        playSound('wrong');
        
        if (!isMultiplayer) {
            showModal("Game Over", `Wrong! You clicked ${clickedName}.\nFinal Score: ${myScore}`, () => {
                myScore = 0;
                document.getElementById('p1-score-text').innerText = "Score: " + myScore;
                nextTurn();
            });
        } else {
            connection.send({ type: 'game_over' });
            showModal("You Lose!", `Wrong! You clicked ${clickedName}.`, () => location.reload());
        }
    }
}

// --- MAP RENDERING (D3.js) ---
function drawMap() {
    const svg = d3.select("#map");
    const g = svg.append("g");

    svg.call(d3.zoom().scaleExtent([1, 25]).on("zoom", (event) => {
        g.attr("transform", event.transform);
        g.selectAll(".microstate").attr("r", 3 / event.transform.k);
    }));

    const projection = d3.geoMercator().scale(140).translate([window.innerWidth / 2, window.innerHeight / 1.5]);
    const path = d3.geoPath().projection(projection);

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(data => {
        data.features = data.features.filter(d => !excludedTerritories.includes(d.properties.name));
        
        allValidCountries = data.features.map(d => d.properties.name);
        microstates.forEach(m => allValidCountries.push(m.name));

        // Draw Countries (No Tooltips)
        g.selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("mouseover", () => playSound('hover'))
            .on("click", (event, d) => handleCountryClick(d.properties.name));

        // Draw Microstates (No Tooltips)
        g.selectAll("circle")
            .data(microstates)
            .enter()
            .append("circle")
            .attr("class", "microstate")
            .attr("cx", d => projection(d.coords)[0])
            .attr("cy", d => projection(d.coords)[1])
            .attr("r", 3)
            .on("mouseover", () => playSound('hover'))
            .on("click", (event, d) => handleCountryClick(d.name));

        if (!isMultiplayer || isHost) {
            setTimeout(nextTurn, 500); 
        }
    });
}
