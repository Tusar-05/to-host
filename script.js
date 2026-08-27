document.addEventListener('DOMContentLoaded', () => {
    const apiUrlInput = document.getElementById('apiUrl');
    const apiKeyInput = document.getElementById('apiKey');
    const connectionStatus = document.getElementById('connectionStatus');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const loadingState = document.getElementById('loadingState');
    const uploadContent = document.querySelector('.upload-content');
    
    // Results elements
    const resultsSection = document.getElementById('resultsSection');
    const verdictText = document.getElementById('verdictText');
    const confidenceValue = document.getElementById('confidenceValue');
    const confidenceFill = document.getElementById('confidenceFill');
    const probReal = document.getElementById('probReal');
    const probFake = document.getElementById('probFake');
    const duration = document.getElementById('duration');
    const spectrogramImg = document.getElementById('spectrogramImg');

    // Health Check Ping
    let pingInterval;
    
    const checkHealth = async () => {
        const url = apiUrlInput.value.trim();
        if (!url) return;
        
        try {
            const res = await fetch(`${url}/api/health`, {
                headers: { 
                    'Bypass-Tunnel-Reminder': 'true',
                    'X-API-Key': apiKeyInput.value.trim()
                }
            });
            if (res.ok) {
                connectionStatus.textContent = "API Online & Connected";
                connectionStatus.className = "status-indicator online";
            } else {
                throw new Error("Bad response");
            }
        } catch (e) {
            connectionStatus.textContent = "API Offline / Unreachable";
            connectionStatus.className = "status-indicator offline";
        }
    };

    // Initial check and set interval
    checkHealth();
    apiUrlInput.addEventListener('change', checkHealth);
    apiKeyInput.addEventListener('change', checkHealth);
    pingInterval = setInterval(checkHealth, 5000);

    // File Upload Handling
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    async function handleFile(file) {
        const url = apiUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        if (!url || !apiKey) {
            alert("Please enter both the API Server URL and the API Key first.");
            return;
        }

        // Show loading state
        uploadContent.classList.add('hidden');
        loadingState.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        const formData = new FormData();
        formData.append('audio', file);

        try {
            const response = await fetch(`${url}/api/predict`, {
                method: 'POST',
                headers: { 
                    'Bypass-Tunnel-Reminder': 'true',
                    'X-API-Key': apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || err.error || "Failed to process audio");
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // Restore upload state
            loadingState.classList.add('hidden');
            uploadContent.classList.remove('hidden');
            fileInput.value = ''; // Reset input
        }
    }

    function displayResults(data) {
        // Update Verdict
        verdictText.textContent = data.is_fake ? "FAKE (AI Generated)" : "REAL (Human Speech)";
        verdictText.className = `verdict-main ${data.is_fake ? 'fake' : 'real'}`;

        // Update Confidence
        confidenceValue.textContent = `${data.confidence}%`;
        confidenceFill.style.width = `${data.confidence}%`;
        
        // Use primary color for real, danger color for fake on the progress bar
        confidenceFill.style.background = data.is_fake ? 'var(--danger)' : 'var(--success)';

        // Update Stats
        probReal.textContent = `${data.prob_real}%`;
        probFake.textContent = `${data.prob_fake}%`;
        duration.textContent = `${data.duration_sec}s`;

        // Update Spectrogram
        spectrogramImg.src = `data:image/png;base64,${data.spectrogram_b64}`;

        // Show Results
        resultsSection.classList.remove('hidden');
        
        // Scroll to results on mobile
        if (window.innerWidth <= 768) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
});
