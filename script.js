// ====================================================================
// SECTION 1: DOM Elements and State Variables
// ====================================================================

// --- ENDURANCE APP DOM Elements ---
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const repDurationDisplay = document.getElementById('rep-duration');
const statusMessage = document.getElementById('status-message');
const resetButton = document.getElementById('reset-button');
const countdownTimerDisplay = document.getElementById('countdown-timer');
const incrementDurationDisplay = document.getElementById('increment-duration');
const incrementButton = document.getElementById('increment-increment-button');
const decrementButton = document.getElementById('decrement-increment-button');
const startDurationDisplay = document.getElementById('start-duration');
const incrementStartButton = document.getElementById('increment-start-button');
const decrementStartButton = document.getElementById('decrement-start-button');

// --- NEW COMPANION TIMER DOM ELEMENTS ---
const trackerStartButton = document.getElementById('tracker-start-button');
const trackerStopButton = document.getElementById('tracker-stop-button');
const trackerResetButton = document.getElementById('tracker-reset-button');
const playTimeDisplay = document.getElementById('play-time-display');
const restTimeDisplay = document.getElementById('rest-time-display');
const trackerStatus = document.getElementById('tracker-status');


// --- ENDURANCE APP State Variables ---
let startingRepDuration = 5; 
let currentRepDuration = 5;  
let currentIncrement = 1;    
let currentTimeRemaining = 0; 
let isPlaying = false;      
let activeRepInterval = null; 

// --- NEW COMPANION TIMER STATE VARIABLES ---
let trackerIsPlaying = false;
let playTimeSeconds = 0;
let restTimeSeconds = 0;
let playInterval = null;
let restInterval = null;


// --- TONE FREQUENCIES (Hz) ---
const PLAY_TONE_FREQ = 660; // Start of Play (High)
const REST_TONE_FREQ = 440; // Start of Rest (Medium)
const WARNING_TONE_3S = 800; 
const WARNING_TONE_2S = 850;
const WARNING_TONE_1S = 900; 
const WARNING_TONE_DURATION = 0.1; // Quick beep for warnings
const TRACKER_STOP_TONE = 550; // New tone for "Stop Playing"
const TRACKER_REST_COMPLETE_TONE = 750; // New tone for "Rest Complete"

let audioContext;


// ====================================================================
// SECTION 2: Utility Functions (Used by both apps)
// ====================================================================

/**
 * Formats seconds into MM:SS string.
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Creates and plays a simple sine wave tone.
 */
function playTone(duration, frequency) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}


// ====================================================================
// SECTION 3: Progressive Endurance App Logic (Original App)
// ====================================================================

function updateIncrement(delta) {
    const newIncrement = currentIncrement + delta;
    if (newIncrement >= 0) {
        currentIncrement = newIncrement;
        incrementDurationDisplay.textContent = currentIncrement;
    }
}

function updateStartDuration(delta) {
    const newDuration = startingRepDuration + delta;
    if (newDuration >= 1) { 
        startingRepDuration = newDuration;
        startDurationDisplay.textContent = startingRepDuration;
        
        if (!isPlaying) {
             currentRepDuration = startingRepDuration;
             repDurationDisplay.textContent = currentRepDuration;
             countdownTimerDisplay.textContent = formatTime(0);
        }
    }
}

function handleRestPhase() {
    currentTimeRemaining = currentRepDuration;
    playTone(1.0, REST_TONE_FREQ);
    
    statusMessage.textContent = `⏸️ REST for ${currentRepDuration}s`;
    countdownTimerDisplay.textContent = formatTime(currentTimeRemaining);

    activeRepInterval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(activeRepInterval);
            activeRepInterval = null;
            return;
        }

        currentTimeRemaining--;
        countdownTimerDisplay.textContent = formatTime(currentTimeRemaining); 
        
        // WARNING TONES LOGIC
        if (currentRepDuration >= 4) { 
            if (currentTimeRemaining === 3) {
                playTone(WARNING_TONE_DURATION, WARNING_TONE_3S); 
            } else if (currentTimeRemaining === 2) {
                playTone(WARNING_TONE_DURATION, WARNING_TONE_2S); 
            } else if (currentTimeRemaining === 1) {
                playTone(WARNING_TONE_DURATION, WARNING_TONE_1S); 
            }
        }
        
        if (currentTimeRemaining <= 0) {
            clearInterval(activeRepInterval);
            currentRepDuration += currentIncrement;
            repDurationDisplay.textContent = currentRepDuration;
            runRep(); 
        }
    }, 1000); 
}

function runRep() {
    if (activeRepInterval) {
        clearInterval(activeRepInterval);
        activeRepInterval = null;
    }
    
    currentTimeRemaining = currentRepDuration;

    playTone(1.0, PLAY_TONE_FREQ); 
    statusMessage.textContent = `▶️ PLAY for ${currentRepDuration}s`;
    countdownTimerDisplay.textContent = formatTime(currentTimeRemaining);

    activeRepInterval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(activeRepInterval);
            activeRepInterval = null;
            return;
        }

        currentTimeRemaining--;
        countdownTimerDisplay.textContent = formatTime(currentTimeRemaining); 
        
        if (currentTimeRemaining <= 0) {
            clearInterval(activeRepInterval); 
            activeRepInterval = null;
            handleRestPhase();
        }
    }, 1000); 
}

function startApp() {
    if (isPlaying) return; 

    isPlaying = true;
    currentRepDuration = startingRepDuration;
    repDurationDisplay.textContent = currentRepDuration;
    
    startButton.disabled = true;
    stopButton.disabled = false;
    resetButton.disabled = false; 
    
    incrementButton.disabled = true;
    decrementButton.disabled = true;
    incrementStartButton.disabled = true; 
    decrementStartButton.disabled = true; 
    
    statusMessage.textContent = 'Starting...';
    runRep();
}

function stopApp() {
    if (!isPlaying) return; 

    isPlaying = false;
    
    if (activeRepInterval) {
        clearInterval(activeRepInterval);
        activeRepInterval = null;
    }
    
    startButton.disabled = false;
    stopButton.disabled = true;
    
    incrementButton.disabled = false;
    decrementButton.disabled = false;
    incrementStartButton.disabled = false; 
    decrementStartButton.disabled = false; 

    statusMessage.textContent = `⏸️ Paused at Rep: ${currentRepDuration}s. Time remaining: ${formatTime(currentTimeRemaining)}. Press START to resume.`;
}

function resetApp() {
    isPlaying = false;
    if (activeRepInterval) {
        clearInterval(activeRepInterval);
        activeRepInterval = null;
    }
    
    currentRepDuration = startingRepDuration; 
    currentTimeRemaining = 0;

    repDurationDisplay.textContent = currentRepDuration;
    countdownTimerDisplay.textContent = formatTime(0); 
    
    startButton.disabled = false;
    stopButton.disabled = true;
    resetButton.disabled = true; 
    
    incrementButton.disabled = false;
    decrementButton.disabled = false;
    incrementStartButton.disabled = false;
    decrementStartButton.disabled = false;
    
    statusMessage.textContent = `✅ Reset to ${startingRepDuration} seconds. Press START to begin.`;
}


// ====================================================================
// SECTION 4: Companion Tracker Logic (New App)
// ====================================================================

/**
 * Counts up the playing time.
 */
function startPlayingCount() {
    playInterval = setInterval(() => {
        playTimeSeconds++;
        playTimeDisplay.textContent = formatTime(playTimeSeconds);
    }, 1000);
}

/**
 * Counts down the resting time.
 */
function startRestCountdown() {
    // Set the initial rest time equal to the total play time
    restTimeSeconds = playTimeSeconds;
    restTimeDisplay.textContent = formatTime(restTimeSeconds);
    trackerStatus.textContent = `⏸️ RESTING. Countdown from ${formatTime(playTimeSeconds)}.`;
    
    restInterval = setInterval(() => {
        if (restTimeSeconds <= 0) {
            clearInterval(restInterval);
            // Tone to indicate rest is over
            playTone(1.0, TRACKER_REST_COMPLETE_TONE); 
            
            trackerStopButton.disabled = true; 
            trackerResetButton.disabled = false;
            trackerStatus.textContent = "✅ REST COMPLETE! Press RESET Tracker to clear.";
            return;
        }
        
        restTimeSeconds--;
        restTimeDisplay.textContent = formatTime(restTimeSeconds);
    }, 1000);
}

function startTracker() {
    if (trackerIsPlaying) return;
    
    // Ensure we start from a clean slate
    playTimeSeconds = 0; 
    playTimeDisplay.textContent = formatTime(playTimeSeconds);
    restTimeDisplay.textContent = formatTime(0);

    trackerIsPlaying = true;
    
    trackerStartButton.disabled = true;
    trackerStopButton.disabled = false;
    trackerResetButton.disabled = true; 
    trackerStatus.textContent = "▶️ PLAYING... tracking time.";
    
    startPlayingCount();
}

function stopAndStartRest() {
    if (!trackerIsPlaying) return;
    
    trackerIsPlaying = false;
    
    clearInterval(playInterval); // Stop the upward count
    
    trackerStopButton.disabled = true;
    trackerStartButton.disabled = true; 
    trackerResetButton.disabled = false;
    
    // Sound a tone to indicate "stop playing"
    playTone(1.0, TRACKER_STOP_TONE); 
    
    startRestCountdown();
}

function resetTracker() {
    clearInterval(playInterval);
    clearInterval(restInterval);
    
    trackerIsPlaying = false;
    playTimeSeconds = 0;
    restTimeSeconds = 0;

    playTimeDisplay.textContent = formatTime(0);
    restTimeDisplay.textContent = formatTime(0);

    trackerStartButton.disabled = false;
    trackerStopButton.disabled = true;
    trackerResetButton.disabled = true;
    trackerStatus.textContent = "Press START Play to begin tracking.";
}


// ====================================================================
// SECTION 5: Event Listeners and Initialization
// ====================================================================

// --- ENDURANCE APP Listeners ---
startButton.addEventListener('click', startApp);
stopButton.addEventListener('click', stopApp);
resetButton.addEventListener('click', resetApp);
incrementButton.addEventListener('click', () => updateIncrement(1));
decrementButton.addEventListener('click', () => updateIncrement(-1));
incrementStartButton.addEventListener('click', () => updateStartDuration(1));
decrementStartButton.addEventListener('click', () => updateStartDuration(-1));

// Initialize endurance app buttons
stopButton.disabled = true;
resetButton.disabled = true;


// --- COMPANION TIMER Listeners ---
trackerStartButton.addEventListener('click', startTracker);
trackerStopButton.addEventListener('click', stopAndStartRest);
trackerResetButton.addEventListener('click', resetTracker);

// Initialize companion app buttons
trackerStopButton.disabled = true;
trackerResetButton.disabled = true;