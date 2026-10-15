// --- State & Config ---

const CONFIG = {
    apiUrl: `${window.VOICESHIELD_API_URL || 'http://127.0.0.1:5000'}/analyze`,
    useMockData: false
};


let currentAudioFile = null;
let MODEL_METRICS = {};

// --- Mock Data Scenarios ---
const MOCK_SCENARIOS = {
    genuine: {
        voice_analysis: {
            classification: "genuine",
            ai_probability: 0.00043943675077111327,
            human_probability: 0.9995605632492289,
            member2_classification: "bonafide",
            bonafide_probability: 0.9926851671208738,
            spoof_probability: 0.0073148328791261315,
            member2_dsp: {
                classification: "bonafide",
                spoof_probability: 0.0073148328791261315,
                bonafide_probability: 0.9926851671208738,
                duration_seconds: 3.4580625,
                sample_rate: 16000
            },
            dsp_summary: {
                rms_mean: 0.1250, rms_std: 0.0600,
                pitch_mean: 210.50, pitch_std: 15.20, voiced_ratio: 0.90,
                spectral_bandwidth_mean: 1400.00, spectral_bandwidth_std: 380.00,
                spectral_centroid_mean: 1600.00, spectral_centroid_std: 400.00,
                spectral_rolloff_mean: 3000.00, spectral_rolloff_std: 900.00,
                zcr_mean: 0.1000, zcr_std: 0.0400
            },
            pause_summary: {
                average_pause: 0.050, maximum_pause: 0.080, pause_count: 3, silence_ratio: 0.15, speech_ratio: 0.85
            }
        },
        risk_analysis: {
            risk_score: 2.02,
            risk_level: "LOW"
        },
        risk_factors: {
            caller_risk: 10,
            context_risk: 0,
            transaction_risk: 0,
            voice_risk: 0.04
        },
        explanation: [
            "No major suspicious indicators detected",
            "Natural human pitch fluctuation detected",
            "Normal respiration pauses observed"
        ],
        recommendation: "ALLOW",
        _raw: {} // Placeholder for full json
    },
    spoof: {
        voice_analysis: {
            classification: "synthetic",
            ai_probability: 0.9999999393019539,
            human_probability: 0.0000000606980459,
            member2_classification: "spoof",
            bonafide_probability: 0.0000022273292584751303,
            spoof_probability: 0.9999977726707415,
            member2_dsp: {
                classification: "spoof",
                spoof_probability: 0.9999977726707415,
                bonafide_probability: 0.0000022273292584751303,
                duration_seconds: 1.9230625,
                sample_rate: 16000
            },
            dsp_summary: {
                rms_mean: 0.0874239281, rms_std: 0.0499346890,
                pitch_mean: 247.0957792, pitch_std: 21.9090295, voiced_ratio: 0.8524590,
                spectral_bandwidth_mean: 1316.557507, spectral_bandwidth_std: 354.719825,
                spectral_centroid_mean: 1500.795584, spectral_centroid_std: 434.555148,
                spectral_rolloff_mean: 2866.675204, spectral_rolloff_std: 888.944827,
                zcr_mean: 0.09071625, zcr_std: 0.03794077
            },
            pause_summary: {
                average_pause: 0.032, maximum_pause: 0.032, pause_count: 1, silence_ratio: 0.1180734, speech_ratio: 0.8819266
            }
        },
        risk_analysis: {
            risk_score: 96.25,
            risk_level: "CRITICAL"
        },
        risk_factors: {
            caller_risk: 100,
            context_risk: 75,
            transaction_risk: 100,
            voice_risk: 100
        },
        explanation: [
            "Synthetic voice probability is high (100%)",
            "Caller identity is unknown",
            "Caller claims an authority identity (ceo)",
            "Financial transaction requested: ₹500,000",
            "Sensitive information requested",
            "High urgency detected (high)"
        ],
        recommendation: "BLOCK / ESCALATE",
        _raw: {}
    }
};

// --- Formatters ---
function formatProbability(value) {
    if (value == null) return "0.00%";
    const pct = value * 100;
    if (pct > 99.9) return "99.99%";
    if (pct < 0.01) return "0.01%";
    return pct.toFixed(2) + "%";
}

function formatRiskScore(value) {
    if (value == null) return "0.0";
    return Number(value).toFixed(1);
}

// --- DOM Elements ---
const screens = document.querySelectorAll('.screen');
const navBtns = document.querySelectorAll('.nav-btn[data-target], .back-btn[data-target], #btn-cancel-processing');
const robot = document.getElementById('ai-robot');
const robotMsg = document.getElementById('robot-msg');
const audioFileInput = document.getElementById('audio-file');
const btnAnalyze = document.getElementById('btn-analyze');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initCanvasBackground();
    initNavigation();
    initUploadArea();
    initContextForm();
    initConfigModal();
    initDemoPresets();
    
    // Fetch model metrics with cache-buster
    fetch('model-metrics.json?t=' + new Date().getTime())
        .then(r => r.json())
        .then(data => { MODEL_METRICS = data; })
        .catch(e => console.error("Failed to load model metrics", e));

    initTechPanel();

    // Main CTA
    document.getElementById('btn-start-analysis').addEventListener('click', () => {
        showScreen('voice-analysis');
        setRobotState('idle', 'Ready to analyze audio.');
    });

    // Analyze Button
    btnAnalyze.addEventListener('click', performAnalysis);
});

// --- Navigation ---
function initNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.classList.contains('disabled')) return;
            const target = btn.getAttribute('data-target');
            if (target) showScreen(target);
            
            // Special handling for live protection demo
            if (target === 'live-protection') {
                startLiveSimulation('safe');
            }
        });
    });
}

function showScreen(screenId) {
    // Hide all
    screens.forEach(s => s.classList.remove('active'));
    // Show target
    const targetScreen = document.getElementById(screenId);
    if(targetScreen) targetScreen.classList.add('active');
    
    // Update Nav bar
    document.querySelectorAll('.top-nav .nav-btn').forEach(btn => {
        if (btn.getAttribute('data-target') === screenId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- File Upload Handling ---
function initUploadArea() {
    const dropZone = document.getElementById('drop-zone');
    const browseBtn = document.getElementById('browse-btn');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');

    browseBtn.addEventListener('click', () => audioFileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    audioFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });

    removeFileBtn.addEventListener('click', () => {
        currentAudioFile = null;
        audioFileInput.value = '';
        fileInfo.classList.add('hidden');
        dropZone.querySelector('h3').style.display = 'block';
        dropZone.querySelector('p').style.display = 'block';
        dropZone.querySelector('.upload-icon').style.display = 'block';
        btnAnalyze.classList.add('disabled');
    });

    function handleFileSelection(file) {
        if (!file.type.startsWith('audio/')) {
            alert('Please select a valid audio file (WAV, MP3, etc).');
            return;
        }
        currentAudioFile = file;
        fileNameDisplay.textContent = file.name;
        
        dropZone.querySelector('h3').style.display = 'none';
        dropZone.querySelector('p').style.display = 'none';
        dropZone.querySelector('.upload-icon').style.display = 'none';
        fileInfo.classList.remove('hidden');
        
        btnAnalyze.classList.remove('disabled');
    }
}

// --- Context Form ---
function initContextForm() {
    const toggleBtn = document.getElementById('toggle-context');
    const formBody = document.getElementById('context-form');
    
    toggleBtn.addEventListener('click', () => {
        formBody.classList.toggle('hidden');
        const expandBtn = toggleBtn.querySelector('.expand-btn');
        if (formBody.classList.contains('hidden')) {
            expandBtn.innerHTML = 'Expand Parameters &or;';
        } else {
            expandBtn.innerHTML = 'Hide Parameters &and;';
        }
    });
}

// --- Config Modal ---
function initConfigModal() {
    const modal = document.getElementById('config-modal');
    // Open via clicking the logo (secret trigger)
    document.querySelector('.logo-icon').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    document.getElementById('btn-save-config').addEventListener('click', () => {
        CONFIG.apiUrl = document.getElementById('config-api-url').value;
        CONFIG.useMockData = document.getElementById('config-mock-mode').checked;
        modal.classList.add('hidden');
    });
}

// --- Analysis Flow & API Integration ---
async function performAnalysis() {
    if (!currentAudioFile && !CONFIG.useMockData) return;

    // Show processing
    showScreen('processing-screen');
    const errorMsg = document.getElementById('processing-error');
    errorMsg.classList.add('hidden');
    document.getElementById('btn-cancel-processing').classList.add('hidden');
    
    setRobotState('analyzing', 'Listening...');

    try {
        // Collect Context
        const contextData = {
            caller_id: document.getElementById('caller_id').value,
            caller_type: document.getElementById('caller_type').value,
            claimed_identity: document.getElementById('claimed_identity').value,
            transaction_amount: document.getElementById('transaction_amount').value,
            urgency: document.getElementById('urgency').value,
            transaction_requested: document.getElementById('transaction_requested').checked,
            sensitive_information_requested: document.getElementById('sensitive_information_requested').checked
        };

        let result;

        if (CONFIG.useMockData) {
            // Simulate processing delay
            await simulateProcessingSteps();
            // Determine which mock to use based on inputs to simulate backend logic
            const isDanger = contextData.transaction_amount > 50000 || contextData.urgency === 'critical' || contextData.sensitive_information_requested;
            result = isDanger ? MOCK_SCENARIOS.spoof : MOCK_SCENARIOS.genuine;
            // Inject raw data for technical details
            result._raw = JSON.parse(JSON.stringify(result)); 
        } else {
            // Real API Call
            await animateProcessingStep(3, 'Voice analysis');
            const formData = new FormData();
            formData.append('audio', currentAudioFile);
            
            // Append context exactly as expected
            Object.keys(contextData).forEach(key => {
                formData.append(key, contextData[key]);
            });

            await animateProcessingStep(4, 'Risk assessment');
            
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            result = await response.json();
            result._raw = JSON.parse(JSON.stringify(result));
            await animateProcessingStep(5, 'Security recommendation');
        }

        renderResult(result);
        
        // Enable nav button for security report
        document.getElementById('nav-security-report').classList.remove('disabled');
        showScreen('security-report');

    } catch (error) {
        console.error("Analysis Error:", error);
        errorMsg.textContent = "Unable to analyze this recording. " + error.message;
        errorMsg.classList.remove('hidden');
        document.getElementById('btn-cancel-processing').classList.remove('hidden');
        setRobotState('idle', 'Error occurred.');
    }
}

async function simulateProcessingSteps() {
    await new Promise(r => setTimeout(r, 800));
    await animateProcessingStep(3, 'Voice analysis');
    await new Promise(r => setTimeout(r, 800));
    await animateProcessingStep(4, 'Risk assessment');
    await new Promise(r => setTimeout(r, 800));
    await animateProcessingStep(5, 'Security recommendation');
    await new Promise(r => setTimeout(r, 500));
}

function animateProcessingStep(stepNum, text) {
    const prev = document.getElementById(`proc-step-${stepNum-1}`);
    if(prev) {
        prev.classList.remove('active');
        prev.classList.add('done');
        prev.innerHTML = `✓ ${prev.innerHTML.replace('&rarr; ', '')}`;
    }
    
    const curr = document.getElementById(`proc-step-${stepNum}`);
    if(curr) {
        curr.classList.add('active');
        curr.innerHTML = `&rarr; ${text}`;
    }
}

// --- Animation Utilities ---
function animateNumber(element, start, end, duration, formatFn) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out
        const currentVal = start + (end - start) * easeProgress;
        
        element.textContent = formatFn ? formatFn(currentVal) : currentVal.toFixed(2);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = formatFn ? formatFn(end) : end.toFixed(2);
        }
    };
    window.requestAnimationFrame(step);
}

// --- Result Rendering ---
function renderResult(data) {
    const { voice_analysis, risk_analysis, risk_factors, explanation, recommendation, _raw } = data;
    
    const container = document.getElementById('report-container');
    const level = risk_analysis.risk_level.toUpperCase();
    
    // Set classes for dynamic coloring
    container.className = 'glass-panel result-panel';
    let stateClass = 'risk-low';
    let titleStr = "Genuine Voice Verified";
    let robotAnim = 'idle';
    let robotText = 'System Secure';

    if (level === 'MEDIUM') {
        stateClass = 'risk-medium';
        titleStr = "Suspicious Indicators";
        robotAnim = 'suspicious';
        robotText = 'Something looks unusual.';
    } else if (level === 'HIGH') {
        stateClass = 'risk-high';
        titleStr = "High Risk Detected";
        robotAnim = 'suspicious';
        robotText = 'Verification required.';
    } else if (level === 'CRITICAL') {
        stateClass = 'risk-critical';
        titleStr = "AI Voice Impersonation Detected";
        robotAnim = 'critical';
        robotText = 'Threat detected.';
    }
    
    container.classList.add(stateClass);
    
    // Dynamic Hero Title
    if (voice_analysis.classification && voice_analysis.classification.toLowerCase() === 'synthetic') {
        titleStr = "⚠ DEEPFAKE VOICE DETECTED";
    } else if (voice_analysis.classification && voice_analysis.classification.toLowerCase() === 'genuine') {
        titleStr = "✓ GENUINE VOICE VERIFIED";
    }
    
    const titleEl = document.getElementById('res-title');
    const classEl = document.getElementById('res-classification');
    const dspClassEl = document.getElementById('res-dsp-class');

    [titleEl, classEl, dspClassEl].forEach(el => {
        if (el) el.classList.remove('semantic-genuine', 'semantic-synthetic', 'semantic-genuine-text', 'semantic-synthetic-text');
    });

    if (voice_analysis.classification && voice_analysis.classification.toLowerCase() === 'synthetic') {
        if (titleEl) titleEl.classList.add('semantic-synthetic');
        if (classEl) classEl.classList.add('semantic-synthetic-text');
    } else if (voice_analysis.classification && voice_analysis.classification.toLowerCase() === 'genuine') {
        if (titleEl) titleEl.classList.add('semantic-genuine');
        if (classEl) classEl.classList.add('semantic-genuine-text');
    }

    if (titleEl) titleEl.textContent = titleStr;

    // Hero Score Animation
    const heroScoreEl = document.getElementById('res-score');
    const heroRing = document.getElementById('hero-progress-ring');
    const targetScore = risk_analysis.risk_score;
    
    animateNumber(heroScoreEl, 0, targetScore, 2000, (v) => formatRiskScore(v));
    if (heroRing) {
        // 515.22 is full length
        const offset = 515.22 - (515.22 * (targetScore / 100));
        heroRing.style.strokeDashoffset = 515.22; // reset
        setTimeout(() => heroRing.style.strokeDashoffset = offset, 50);
    }
    document.getElementById('res-level').textContent = level + " RISK";

    // Analysis Grid
    if (classEl) classEl.textContent = voice_analysis.classification || 'Unknown';
    document.getElementById('res-ai-prob').textContent = formatProbability(voice_analysis.ai_probability);
    
    const dspClass = voice_analysis?.member2_dsp?.classification?.toLowerCase() === 'spoof' ? 'Synthetic' : 'Genuine';
    if (dspClassEl) {
        dspClassEl.textContent = dspClass;
        if (dspClass === 'Genuine') dspClassEl.classList.add('semantic-genuine-text');
        else if (dspClass === 'Synthetic') dspClassEl.classList.add('semantic-synthetic-text');
    }
    document.getElementById('res-spoof-prob').textContent = formatProbability(voice_analysis?.member2_dsp?.spoof_probability);

    // Risk Breakdown Radial Modules
    const factors = [
        { id: 'voice-risk', val: risk_factors.voice_risk || 0 },
        { id: 'caller-risk', val: risk_factors.caller_risk || 0 },
        { id: 'transaction-risk', val: risk_factors.transaction_risk || 0 },
        { id: 'context-risk', val: risk_factors.context_risk || 0 }
    ];

    factors.forEach(f => {
        const valEl = document.getElementById(`val-${f.id}`);
        const ringEl = document.getElementById(`semi-${f.id}`);
        if (valEl) animateNumber(valEl, 0, f.val, 1500, (v) => formatRiskScore(v));
        if (ringEl) {
            // Semi-circle length is ~125.6 (radius 40, pi * 40)
            const targetOffset = 125.6 - (125.6 * Math.min(f.val / 100, 1));
            ringEl.style.strokeDashoffset = 125.6; // reset
            setTimeout(() => ringEl.style.strokeDashoffset = targetOffset, 50);
        }
    });

    // Console Explanations
    const explContainer = document.getElementById('res-explanation');
    explContainer.innerHTML = '';
    const explArray = Array.isArray(explanation) ? explanation : [explanation || "No explanation provided."];
    
    explArray.forEach((msg, idx) => {
        const div = document.createElement('div');
        div.className = 'console-event';
        div.style.animationDelay = `${idx * 0.15}s`;
        const idStr = String(idx + 1).padStart(2, '0');
        div.innerHTML = `<span class="event-id">${idStr}</span><span class="event-text">${msg}</span>`;
        explContainer.appendChild(div);
    });

    // Recommendation Console
    const recActionHero = document.getElementById('res-rec-action');
    let recText = "✓ ALLOW";
    if (level === 'CRITICAL') recText = "🛡 BLOCK / ESCALATE";
    else if (level === 'HIGH') recText = "⚠ SECONDARY VERIFICATION";
    else if (level === 'MEDIUM') recText = "⚠ WARN";
    
    if (recommendation) {
        if (recommendation.toUpperCase().includes('BLOCK')) recText = "🛡 BLOCK / ESCALATE";
        else if (recommendation.toUpperCase().includes('ALLOW')) recText = "✓ ALLOW";
    }
    recActionHero.textContent = recText;

    // Tech Details Update
    renderDSPAnalysis(voice_analysis.dsp_summary);
    renderAudioStatistics(voice_analysis.member2_dsp);
    renderPauseAnalysis(voice_analysis.pause_summary);
    renderFeatureVector(voice_analysis.member2_dsp?.feature_vector_53);

    // Update timeline logic for "Live" run
    document.querySelectorAll('.pipeline-node').forEach(n => {
        n.classList.remove('pulse'); // Stop pulsing
    });

    // Reset panel if it was open
    const techPanel = document.getElementById('tech-panel');
    const btnToggleTech = document.getElementById('btn-toggle-tech');
    if (techPanel && !techPanel.classList.contains('hidden')) {
        techPanel.classList.add('hidden');
        if (btnToggleTech) btnToggleTech.querySelector('.tech-caret').innerHTML = '&or;';
        document.querySelectorAll('.tech-section').forEach(el => {
            el.classList.remove('visible');
            el.classList.add('hidden');
        });
    }

    setRobotState(robotAnim, robotText);
}

// --- Demo Presets ---
function initDemoPresets() {
    const presetBtns = document.querySelectorAll('.result-panel .preset-btn, .screen .header-action .preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from siblings
            const parent = e.target.parentElement;
            parent.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const preset = e.target.getAttribute('data-preset');
            if (preset && MOCK_SCENARIOS[preset]) {
                const data = JSON.parse(JSON.stringify(MOCK_SCENARIOS[preset]));
                data._raw = data;
                renderResult(data);
            }
        });
    });

    // Live Protection presets
    document.getElementById('btn-live-safe').addEventListener('click', () => startLiveSimulation('safe'));
    document.getElementById('btn-live-fraud').addEventListener('click', () => startLiveSimulation('fraud'));
}


// --- Live Protection Simulation ---
let liveTimerInterval;
let liveTimelineSteps = [];

function startLiveSimulation(type) {
    clearInterval(liveTimerInterval);
    
    let seconds = 0;
    const timerDisplay = document.getElementById('live-timer');
    const aiProbDisplay = document.getElementById('live-ai-prob');
    const scoreDisplay = document.getElementById('live-score');
    const levelDisplay = document.getElementById('live-level');
    const timelineList = document.getElementById('live-timeline');
    const counterDisplay = document.getElementById('timeline-counter');
    
    // Reset UI
    timerDisplay.textContent = 'Active 00:00';
    aiProbDisplay.textContent = '--';
    scoreDisplay.textContent = '--';
    levelDisplay.textContent = '--';
    levelDisplay.className = 'value'; // Reset color
    timelineList.innerHTML = '';
    
    // Build Timeline based on type
    const events = type === 'fraud' ? [
        { time: 1, title: 'Call connected', desc: 'Inbound session established', prob: '1.2%', score: 5, level: 'LOW', color: 'green-text' },
        { time: 3, title: 'Voice analysis started', desc: 'Continuous stream buffer feeding neural classifier', prob: '4.5%', score: 12, level: 'LOW', color: 'green-text' },
        { time: 6, title: 'Caller context detected', desc: 'Claimed identity: CEO. Transaction requested.', prob: '14.2%', score: 45, level: 'MEDIUM', color: 'yellow-text' },
        { time: 9, title: 'Voice signal anomaly', desc: 'Pitch variance compressed. Potential synthetic artifacts.', prob: '89.4%', score: 75, level: 'HIGH', color: 'orange-text' },
        { time: 12, title: 'Security alert triggered', desc: 'Voice impersonation clone signature detected. High transaction amount.', prob: '99.9%', score: 96, level: 'CRITICAL', color: 'red-text' }
    ] : [
        { time: 1, title: 'Call connected', desc: 'Inbound session established', prob: '0.1%', score: 1, level: 'LOW', color: 'green-text' },
        { time: 3, title: 'Voice analysis started', desc: 'Continuous stream buffer feeding neural classifier', prob: '0.2%', score: 2, level: 'LOW', color: 'green-text' },
        { time: 6, title: 'Caller context detected', desc: 'Standard inquiry', prob: '0.1%', score: 2, level: 'LOW', color: 'green-text' },
        { time: 9, title: 'Analysis stable', desc: 'Natural vocal fold tract resonances confirmed.', prob: '0.04%', score: 1, level: 'LOW', color: 'green-text' }
    ];

    let currentEventIdx = 0;
    setRobotState('analyzing', 'Monitoring stream...');

    liveTimerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = `Active 00:${seconds.toString().padStart(2, '0')}`;
        
        if (currentEventIdx < events.length && seconds >= events[currentEventIdx].time) {
            const ev = events[currentEventIdx];
            
            // Mark previous active as done
            const prevLi = timelineList.querySelector('li.active');
            if (prevLi) {
                prevLi.classList.remove('active');
                prevLi.classList.add('done');
            }

            // Create new event
            const li = document.createElement('li');
            li.className = 'active';
            li.innerHTML = `
                <div class="time">00:${ev.time.toString().padStart(2,'0')}</div>
                <div class="content">
                    <h4>${ev.title}</h4>
                    <p>${ev.desc}</p>
                </div>
            `;
            timelineList.appendChild(li);
            
            // Update Metrics
            aiProbDisplay.textContent = ev.prob;
            scoreDisplay.textContent = ev.score;
            levelDisplay.textContent = ev.level;
            levelDisplay.className = `value ${ev.color}`;
            
            counterDisplay.textContent = `${currentEventIdx + 1} OF ${events.length}`;
            
            // Update Robot
            if (ev.level === 'CRITICAL') setRobotState('critical', 'Threat detected!');
            else if (ev.level === 'HIGH' || ev.level === 'MEDIUM') setRobotState('suspicious', 'Suspicious activity.');

            currentEventIdx++;
        }
    }, 1000);
}


// --- AI Robot ---
function setRobotState(state, message) {
    robot.className = `robot state-${state}`;
    if (message) {
        robotMsg.textContent = message;
        robot.classList.add('speaking');
        setTimeout(() => robot.classList.remove('speaking'), 3000);
    }
}


// --- 3D Canvas Background Animation ---
function initCanvasBackground() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let time = 0;
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();

    // Mouse interaction
    let mouseX = width / 2;
    let mouseY = height / 2;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function draw() {
        ctx.fillStyle = '#07090f';
        ctx.fillRect(0, 0, width, height);

        time += 0.005;

        // Draw flowing ribbon / waves
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            
            // Gradients mimicking the Spline clarity stream
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            if (i % 3 === 0) {
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)'); // Cyan
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)'); // Blue
            } else if (i % 3 === 1) {
                gradient.addColorStop(0, 'rgba(217, 70, 239, 0.1)'); // Magenta
                gradient.addColorStop(1, 'rgba(76, 29, 149, 0.05)'); // Purple
            } else {
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
                gradient.addColorStop(1, 'rgba(148, 163, 184, 0.02)');
            }
            
            ctx.strokeStyle = gradient;

            for (let x = 0; x < width; x += 20) {
                // Math.sin generates the wave
                // Mouse position gently affects the amplitude and phase
                const mouseInfluence = (mouseY / height) * 50;
                const phase = time * (1 + i * 0.2) + x * 0.002;
                const y = height / 2 + Math.sin(phase) * (100 + i * 20 + mouseInfluence) + Math.cos(time + x * 0.001) * 50;
                
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Draw some subtle floating particles
        for(let p = 0; p < 20; p++) {
            const px = (Math.sin(time * 2 + p) * 0.5 + 0.5) * width;
            const py = (Math.cos(time * 1.5 + p) * 0.5 + 0.5) * height;
            
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time*3+p)*0.1})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }
    
    draw();
}

// --- Technical Intelligence Panel ---
function initTechPanel() {
    const btnToggleTech = document.getElementById('btn-toggle-tech');
    if (!btnToggleTech) return;
    
    btnToggleTech.addEventListener('click', () => {
        const techPanel = document.getElementById('tech-panel');
        const isHidden = techPanel.classList.contains('hidden');
        
        if (isHidden) {
            techPanel.classList.remove('hidden');
            btnToggleTech.querySelector('span').innerHTML = '&and;';
            
            const sections = [
                'sec-model-eval',
                'sec-dsp-analysis',
                'sec-audio-signal',
                'sec-pause-analysis',
                'sec-feature-vector'
            ];
            
            sections.forEach((id, idx) => {
                const el = document.getElementById(id);
                if(el) {
                    el.classList.remove('hidden');
                    setTimeout(() => el.classList.add('visible'), 150 * (idx + 1));
                }
            });

            // Trigger animations
            renderModelMetrics();
        } else {
            techPanel.classList.add('hidden');
            btnToggleTech.querySelector('.tech-caret').innerHTML = '&or;';
            document.querySelectorAll('.tech-section').forEach(el => {
                el.classList.remove('visible');
                el.classList.add('hidden');
            });
        }
    });
}

function renderModelMetrics() {
    renderMetricRow('metrics-svm', MODEL_METRICS.member1_svm);
    renderMetricRow('metrics-logreg', MODEL_METRICS.member2_logistic_regression);
}

function renderMetricRow(containerId, modelData) {
    const container = document.getElementById(containerId);
    if (!container || !modelData) return;
    container.innerHTML = '';

    const metrics = [
        { label: 'Accuracy', key: 'accuracy', isPct: true },
        { label: 'Precision', key: 'precision', isPct: true },
        { label: 'Recall', key: 'recall', isPct: true },
        { label: 'F1 Score', key: 'f1', isPct: true },
        { label: 'ROC-AUC', key: 'roc_auc', isPct: false }
    ];

    metrics.forEach(m => {
        let val = modelData[m.key];
        let isPending = (val === 'PENDING');
        
        const wrapper = document.createElement('div');
        wrapper.className = 'metric-ring-container';
        
        // Target values
        let targetText = 'PENDING';
        let targetNum = 0;
        let progressOffset = 226.2; // completely empty

        if (!isPending) {
            targetNum = Number(val);
            if (m.isPct && targetNum <= 1) targetNum *= 100; // e.g. 0.9742 -> 97.42
            targetText = m.isPct ? targetNum.toFixed(2) + '%' : targetNum.toFixed(4);
            progressOffset = 226.2 - (226.2 * (m.isPct ? targetNum / 100 : targetNum));
        }

        wrapper.innerHTML = `
        <div class="metric-ring">
            <svg>
                <circle class="bg" cx="40" cy="40" r="36"></circle>
                <circle class="progress" cx="40" cy="40" r="36" style="stroke-dashoffset: 226.2"></circle>
            </svg>
            <div class="value">${isPending ? 'PENDING' : '0'}</div>
        </div>
        <div class="metric-label">${m.label}</div>
    `;
        
        container.appendChild(wrapper);

        // Animation
        setTimeout(() => {
            const circle = wrapper.querySelector('.progress');
            const valueEl = wrapper.querySelector('.value');
            
            if (isPending) {
                valueEl.textContent = 'PENDING';
                return;
            }

            // Animate stroke
            circle.style.strokeDashoffset = progressOffset;
            
            // Animate number count-up
            let startTimestamp = null;
            const duration = 1500;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                // ease-out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = targetNum * easeProgress;
                
                valueEl.textContent = m.isPct ? currentVal.toFixed(2) + '%' : currentVal.toFixed(4);
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    valueEl.textContent = targetText; // snap to exact final
                }
            };
            window.requestAnimationFrame(step);

        }, 50);
    });
}

function renderDSPAnalysis(dsp) {
    const container = document.getElementById('dsp-container');
    if (!container) return;
    container.innerHTML = '';
    if (!dsp) return;

    // Helper to generate horizontal telemetry meters
    const buildMeter = (label, tooltipTxt, val, maxExpected, formatFn) => {
        let widthPct = Math.min((val / maxExpected) * 100, 100) || 0;
        let vStr = formatFn ? formatFn(val) : (val?.toFixed(4) || '--');
        
        return `
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${tooltipTxt}">${label} <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${vStr}</span>
                </div>
                <div style="font-size: 0.6rem; color: var(--text-muted); margin-bottom: 4px; letter-spacing: 1px;">SIGNAL SCALE</div>
                <div class="telemetry-meter">
                    <div class="tm-bar-fill" style="width: 0%;" data-target="${widthPct}"></div>
                </div>
            </div>
        `;
    };

    // Helper for simple rows without meter
    const buildRow = (label, tooltipTxt, val, formatFn) => {
        let vStr = formatFn ? formatFn(val) : (val?.toFixed(4) || '--');
        return `
            <div class="telemetry-row" style="margin-bottom:8px; border-bottom:none;">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${tooltipTxt}">${label} <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${vStr}</span>
                </div>
            </div>
        `;
    };

    // Tooltips
    const ttRmsMean = "RMS Mean\n\nShows the average energy level of the voice signal.\nHigher values generally mean a stronger/louder signal.";
    const ttRmsStd = "RMS Standard Deviation\n\nShows how much the signal's energy changes over time.";
    const ttPitchMean = "Pitch Mean\n\nShows the average fundamental frequency of the speaker's voice,\nmeasured in Hertz (Hz).";
    const ttPitchStd = "Pitch Standard Deviation\n\nShows how much the speaker's pitch changes during the recording.";
    const ttVoiced = "Voiced Ratio\n\nShows the percentage of the recording where speech-like\nvoiced sound was detected.";
    const ttCentroidMean = "Spectral Centroid\n\nDescribes where the center of the sound's frequency energy lies.\nIt is often related to how bright or sharp a sound appears.";
    const ttCentroidStd = "Spectral Centroid Standard Deviation\n\nShows how much the sound's frequency center changes over time.";
    const ttBandwidthMean = "Spectral Bandwidth\n\nShows how widely the sound energy is spread around the\nspectral center.";
    const ttBandwidthStd = "Spectral Bandwidth Standard Deviation\n\nShows how much the frequency spread changes over time.";
    const ttRolloffMean = "Spectral Rolloff\n\nShows the frequency below which most of the signal's\nspectral energy is concentrated.";
    const ttRolloffStd = "Spectral Rolloff Standard Deviation\n\nShows how much the spectral rolloff frequency changes\nduring the recording.";
    const ttZcrMean = "Zero Crossing Rate\n\nMeasures how frequently the audio waveform crosses\nthe zero-amplitude line.\n\nIt can provide information about the characteristics\nof the sound.";
    const ttZcrStd = "Zero Crossing Rate Standard Deviation\n\nShows how much the zero-crossing rate changes\nthroughout the recording.";

    const energy = dsp?.energy || {};
    const prosody = dsp?.prosody || {};
    const spectral = dsp?.spectral || {};
    const zcr = dsp?.zero_crossing_rate || {};

    // Energy
    container.innerHTML += `
        <div class="data-group">
            <div class="data-group-title">ENERGY</div>
            ${buildMeter('RMS MEAN', ttRmsMean, energy.rms_mean, 0.25)}
            ${buildMeter('RMS STD', ttRmsStd, energy.rms_std, 0.1)}
        </div>
    `;
    
    // Prosody
    container.innerHTML += `
        <div class="data-group">
            <div class="data-group-title">PROSODY</div>
            ${buildRow('PITCH MEAN', ttPitchMean, prosody.pitch_mean_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildRow('PITCH STD', ttPitchStd, prosody.pitch_std_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildMeter('VOICED RATIO', ttVoiced, prosody.voiced_ratio, 1, (v) => v ? (v * 100).toFixed(2) + '%' : '--')}
        </div>
    `;

    // Spectral
    container.innerHTML += `
        <div class="data-group">
            <div class="data-group-title">SPECTRAL</div>
            ${buildRow('CENTROID MEAN', ttCentroidMean, spectral.centroid_mean_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildRow('CENTROID STD', ttCentroidStd, spectral.centroid_std_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildRow('BANDWIDTH MEAN', ttBandwidthMean, spectral.bandwidth_mean_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildRow('BANDWIDTH STD', ttBandwidthStd, spectral.bandwidth_std_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildRow('ROLLOFF MEAN', ttRolloffMean, spectral.rolloff_mean_hz, (v) => v?.toFixed(2) + ' Hz')}
            ${buildRow('ROLLOFF STD', ttRolloffStd, spectral.rolloff_std_hz, (v) => v?.toFixed(2) + ' Hz')}
        </div>
    `;

    // ZCR
    container.innerHTML += `
        <div class="data-group">
            <div class="data-group-title">ZERO CROSSING RATE</div>
            ${buildRow('ZCR MEAN', ttZcrMean, zcr.mean)}
            ${buildRow('ZCR STD', ttZcrStd, zcr.std)}
        </div>
    `;

    // Animate the fill bars when panel opens
    setTimeout(() => {
        container.querySelectorAll('.tm-bar-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-target') + '%';
        });
    }, 100);
}

function renderAudioStatistics(member2_dsp) {
    const container = document.getElementById('audio-container');
    const durEl = document.getElementById('wf-duration');
    
    if (durEl && member2_dsp?.duration_seconds) {
        durEl.textContent = member2_dsp.duration_seconds.toFixed(2) + ' s';
    }

    if (!container) return;
    if (!member2_dsp) {
        container.innerHTML = '<div class="data-group"><div class="data-row"><span>No data available</span></div></div>';
        return;
    }
    
    const ttDur = "Duration\n\nThe total length of the analyzed audio recording.";
    const ttSr = "Sample Rate\n\nThe number of audio samples recorded per second.\n16 kHz means 16,000 samples per second.";

    container.innerHTML = `
        <div class="data-group">
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttDur}">DURATION <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${member2_dsp.duration_seconds ? member2_dsp.duration_seconds.toFixed(2) + ' s' : '--'}</span>
                </div>
            </div>
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttSr}">SAMPLE RATE <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${member2_dsp.sample_rate ? (member2_dsp.sample_rate / 1000) + ' kHz' : '--'}</span>
                </div>
            </div>
        </div>
    `;
}

function renderPauseAnalysis(pause) {
    const container = document.getElementById('pause-container');
    
    // Update visuals
    const speechBar = document.getElementById('ps-speech-bar');
    const silenceBar = document.getElementById('ps-silence-bar');
    const speechVal = document.getElementById('ps-val-speech');
    const silenceVal = document.getElementById('ps-val-silence');
    
    if (pause && pause.speech_ratio && speechBar) {
        let sp = pause.speech_ratio * 100;
        let si = pause.silence_ratio * 100;
        
        speechBar.style.width = sp + '%';
        silenceBar.style.width = si + '%';
        
        animateNumber(speechVal, 0, sp, 1500, v => v.toFixed(2)+'%');
        animateNumber(silenceVal, 0, si, 1500, v => v.toFixed(2)+'%');
    }

    if (!container) return;
    if (!pause) {
        container.innerHTML = '<div class="data-group"><div class="data-row"><span>No data available</span></div></div>';
        return;
    }

    const ttAvg = "Average Pause\n\nThe average duration of detected silent gaps\nbetween speech segments.";
    const ttMax = "Maximum Pause\n\nThe longest detected silent gap in the recording.";
    const ttCount = "Pause Count\n\nThe number of detected silent gaps in the recording.";
    const ttSil = "Silence Ratio\n\nThe percentage of the recording classified as silence\nor a pause.";
    const ttSp = "Speech Ratio\n\nThe percentage of the recording containing detected speech.";

    container.innerHTML = `
        <div class="data-group">
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttAvg}">AVERAGE PAUSE <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${pause.average_pause_duration_seconds !== undefined ? pause.average_pause_duration_seconds.toFixed(2) + ' s' : '--'}</span>
                </div>
            </div>
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttMax}">MAXIMUM PAUSE <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${pause.maximum_pause_duration_seconds !== undefined ? pause.maximum_pause_duration_seconds.toFixed(2) + ' s' : '--'}</span>
                </div>
            </div>
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttCount}">PAUSE COUNT <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${pause.pause_count !== undefined ? pause.pause_count : '--'}</span>
                </div>
            </div>
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttSil}">SILENCE RATIO <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${pause.silence_ratio ? (pause.silence_ratio * 100).toFixed(2) + '%' : '--'}</span>
                </div>
            </div>
            <div class="telemetry-row">
                <div class="telemetry-header">
                    <div class="tooltip-container" data-tooltip="${ttSp}">SPEECH RATIO <span class="info-icon-btn">ⓘ</span></div>
                    <span class="telemetry-val">${pause.speech_ratio ? (pause.speech_ratio * 100).toFixed(2) + '%' : '--'}</span>
                </div>
            </div>
        </div>
    `;
}

function renderFeatureVector(features) {
    const container = document.getElementById('feature-vector-content');
    if (!container) return;

    if (!Array.isArray(features) || features.length !== 53) {
        container.innerHTML = `
            <div class="fv-card">
                <div class="fv-row">
                    <span class="fv-label">Feature vector unavailable</span>
                </div>
            </div>
        `;
        return;
    }

    const featureNames = [
        ...Array.from({ length: 13 }, (_, i) => `MFCC ${i + 1} MEAN`),
        ...Array.from({ length: 13 }, (_, i) => `MFCC ${i + 1} STD`),
        'RMS MEAN', 'RMS STD',
        'ZCR MEAN', 'ZCR STD',
        'SPECTRAL CENTROID MEAN', 'SPECTRAL CENTROID STD',
        'SPECTRAL BANDWIDTH MEAN', 'SPECTRAL BANDWIDTH STD',
        'SPECTRAL ROLLOFF MEAN', 'SPECTRAL ROLLOFF STD',
        ...Array.from({ length: 7 }, (_, i) => `SPECTRAL CONTRAST ${i + 1} MEAN`),
        ...Array.from({ length: 7 }, (_, i) => `SPECTRAL CONTRAST ${i + 1} STD`),
        'PITCH MEAN', 'PITCH STD', 'VOICED RATIO'
    ];

    // Compute robust min-max normalization for visualization ONLY
    let logVals = features.map(v => Math.log1p(Math.abs(v)));
    let maxLog = Math.max(...logVals);
    let minLog = Math.min(...logVals);
    let range = maxLog - minLog || 1;

    const getGroup = (i) => {
        if (i < 26) return "MFCC";
        if (i < 28) return "ENERGY";
        if (i < 30) return "WAVEFORM";
        if (i < 50) return "SPECTRAL";
        return "PROSODY";
    };

    let barsHTML = '';
    features.forEach((val, i) => {
        let norm = (logVals[i] - minLog) / range;
        let heightPct = Math.max(norm * 100, 5); // min 5% height
        let fName = featureNames[i];
        let fGroup = getGroup(i);
        let fVal = typeof val === 'number' ? val.toFixed(6) : val;
        
        let readOutData = `data-name="${fName}" data-val="${fVal}" data-group="${fGroup}" data-idx="#${(i+1).toString().padStart(2, '0')}"`;
        let tooltipText = `FEATURE #${(i+1).toString().padStart(2, '0')}\n${fName}\n\nVALUE\n${fVal}\n\nGROUP\n${fGroup}`;
        
        barsHTML += `
            <div class="fv-bar-wrapper">
                <div class="fv-cinematic-bar tooltip-container" style="height: 0%" data-target-height="${heightPct}%" data-tooltip="${tooltipText}" ${readOutData}></div>
                ${i === 12 ? '<div class="fv-group-label" style="left: -100%;">MFCC</div>' : ''}
                ${i === 26 ? '<div class="fv-group-label">NRG</div>' : ''}
                ${i === 28 ? '<div class="fv-group-label">WVF</div>' : ''}
                ${i === 39 ? '<div class="fv-group-label">SPECTRAL</div>' : ''}
                ${i === 51 ? '<div class="fv-group-label">PRS</div>' : ''}
            </div>
        `;
        
        // Add separators between groups
        if (i === 25 || i === 27 || i === 29 || i === 49) {
            barsHTML += `<div class="fv-bar-group-separator"></div>`;
        }
    });

    const buildRow = (index, label, val) => `
        <div class="fv-row">
            <span class="fv-label">${label}</span>
            <span class="fv-val">${typeof val === 'number' ? val.toFixed(6) : val}</span>
        </div>`;

    let mfccHTML = '';
    for(let i=0; i<13; i++) {
        mfccHTML += `<div>`;
        mfccHTML += buildRow(i, `MFCC ${i+1} MEAN`, features[i]);
        mfccHTML += buildRow(i+13, `MFCC ${i+1} STD`, features[i+13]);
        mfccHTML += `</div>`;
    }

    let energyHTML = buildRow(26, 'RMS MEAN', features[26]) + buildRow(27, 'RMS STD', features[27]);
    let zcrHTML = buildRow(28, 'ZCR MEAN', features[28]) + buildRow(29, 'ZCR STD', features[29]);
    
    let specHTML1 = buildRow(30, 'CENTROID MEAN', features[30]) + 
                    buildRow(32, 'BANDWIDTH MEAN', features[32]) + 
                    buildRow(34, 'ROLLOFF MEAN', features[34]) + 
                    buildRow(36, 'CONTRAST 1 MEAN', features[36]) + 
                    buildRow(37, 'CONTRAST 2 MEAN', features[37]) + 
                    buildRow(38, 'CONTRAST 3 MEAN', features[38]) + 
                    buildRow(39, 'CONTRAST 4 MEAN', features[39]);

    let specHTML2 = buildRow(31, 'CENTROID STD', features[31]) + 
                    buildRow(33, 'BANDWIDTH STD', features[33]) + 
                    buildRow(35, 'ROLLOFF STD', features[35]) + 
                    buildRow(43, 'CONTRAST 1 STD', features[43]) + 
                    buildRow(44, 'CONTRAST 2 STD', features[44]) + 
                    buildRow(45, 'CONTRAST 3 STD', features[45]) + 
                    buildRow(46, 'CONTRAST 4 STD', features[46]);
                    
    let specHTML3 = buildRow(40, 'CONTRAST 5 MEAN', features[40]) + 
                    buildRow(41, 'CONTRAST 6 MEAN', features[41]) + 
                    buildRow(42, 'CONTRAST 7 MEAN', features[42]);

    let specHTML4 = buildRow(47, 'CONTRAST 5 STD', features[47]) + 
                    buildRow(48, 'CONTRAST 6 STD', features[48]) + 
                    buildRow(49, 'CONTRAST 7 STD', features[49]);

    let prosodyHTML = buildRow(50, 'PITCH MEAN', features[50]) + buildRow(51, 'PITCH STD', features[51]) + buildRow(52, 'VOICED RATIO', features[52]);

    container.innerHTML = `
        <div class="fv-header">53-DIMENSIONAL ACOUSTIC FINGERPRINT</div>
        <div class="fv-subtitle">Extracted DSP feature representation</div>
        
        <div class="fv-status-hud">
            <span><strong>53 / 53</strong> FEATURES</span>
            <span>FEATURE GROUPS <strong>5</strong></span>
            <span>SOURCE <strong>LIVE AUDIO</strong></span>
            <span>PIPELINE <strong>MEMBER 2 DSP</strong></span>
            <span>STATUS <strong>ANALYZED</strong></span>
        </div>

        <div class="fv-visualization-container" id="fv-viz-container">
            <div class="fv-scan-line" id="fv-scan-line"></div>
            
            ${barsHTML}
        </div>

        <details class="fv-raw-details">
            <summary>VIEW RAW FEATURE VALUES</summary>
            
            <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 20px;">
                <div class="fv-card">
                    <div class="fv-card-title">MFCC</div>
                    <div class="fv-card-desc">cepstral characteristics</div>
                    <div class="fv-mfcc-matrix">
                        ${mfccHTML}
                    </div>
                </div>
                
                <div class="fv-grid">
                    <div class="fv-card">
                        <div class="fv-card-title">ENERGY</div>
                        <div class="fv-card-desc">signal strength</div>
                        ${energyHTML}
                    </div>
                    <div class="fv-card">
                        <div class="fv-card-title">WAVEFORM</div>
                        <div class="fv-card-desc">waveform crossing behavior</div>
                        ${zcrHTML}
                    </div>
                    <div class="fv-card">
                        <div class="fv-card-title">PROSODY</div>
                        <div class="fv-card-desc">pitch and voiced characteristics</div>
                        ${prosodyHTML}
                    </div>
                </div>
                
                <div class="fv-card">
                    <div class="fv-card-title">SPECTRAL</div>
                    <div class="fv-card-desc">frequency distribution</div>
                    <div class="fv-mfcc-matrix">
                        <div>${specHTML1}</div>
                        <div>${specHTML2}</div>
                    </div>
                    <div class="fv-mfcc-matrix" style="margin-top: 15px;">
                        <div>${specHTML3}</div>
                        <div>${specHTML4}</div>
                    </div>
                </div>
            </div>
        </details>
    `;

    // Cinematic Animations & Hover Logic
    const bars = container.querySelectorAll('.fv-cinematic-bar');
    setTimeout(() => {
        bars.forEach((bar, idx) => {
            setTimeout(() => {
                bar.style.height = bar.getAttribute('data-target-height');
                bar.classList.add('pulsing');
            }, idx * 20); // 20ms staggered reveal across 53 bars ~ 1000ms total
        });
        
        const scan = document.getElementById('fv-scan-line');
        if (scan) scan.classList.add('active');
    }, 100);
}

// --- Global Tooltip Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const globalTooltip = document.getElementById('global-tooltip');
    if (!globalTooltip) return;

    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.tooltip-container');
        if (!target) return;
        
        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        globalTooltip.textContent = tooltipText;
        globalTooltip.classList.add('visible');
        
        const rect = target.getBoundingClientRect();
        const tooltipRect = globalTooltip.getBoundingClientRect();
        
        // Default position: below the element, horizontally centered
        let top = rect.bottom + 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Horizontal clamping
        if (left + tooltipRect.width > window.innerWidth - 20) {
            left = window.innerWidth - tooltipRect.width - 20; // push left
        }
        if (left < 20) {
            left = 20; // push right
        }
        
        // Vertical clamping (if it goes off screen below, put it above)
        if (top + tooltipRect.height > window.innerHeight - 20) {
            top = rect.top - tooltipRect.height - 10;
        }
        if (top < 20) {
            top = 20;
        }
        
        globalTooltip.style.top = top + 'px';
        globalTooltip.style.left = left + 'px';
    });
    
    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('.tooltip-container');
        if (!target) return;
        
        // If moving to a child element inside the same container, do not hide
        if (e.relatedTarget && target.contains(e.relatedTarget)) {
            return;
        }
        globalTooltip.classList.remove('visible');
    });
});
