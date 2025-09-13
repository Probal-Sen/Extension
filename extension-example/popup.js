// popup.js - Extension popup script
let statusDiv, patientList;

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchTerm = document.getElementById('searchTerm');
    const healthBtn = document.getElementById('healthBtn');
    statusDiv = document.getElementById('status');
    patientList = document.getElementById('patientList');
    
    // Load patient data on popup open
    loadPatientData();
    
    // Event listeners
    refreshBtn.addEventListener('click', loadPatientData);
    exportBtn.addEventListener('click', exportAllData);
    clearBtn.addEventListener('click', clearAllData);
    searchBtn.addEventListener('click', searchICD11);
    healthBtn.addEventListener('click', checkHealth);
    searchTerm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchICD11();
        }
    });
});

// Load patient data from dashboard
async function loadPatientData(retryCount = 0) {
    try {
        statusDiv.textContent = 'Loading patient data...';
        patientList.innerHTML = '<div class="loading">Loading patient data...</div>';
        
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if we're on the right page
        if (!tab.url || (!tab.url.includes('index.html') && !tab.url.includes('localhost:8000') && !tab.url.includes('127.0.0.1:5500') && !tab.url.includes('hospital-dashboard'))) {
            showError('Please open the Hospital Dashboard (index.html) first');
            return;
        }
        
        // Inject script to get dashboard data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getDashboardData
        });
        
        if (results && results[0] && results[0].result) {
            const result = await results[0].result; // Wait for the Promise to resolve
            
            if (result.success) {
                displayPatientData(result.data);
                statusDiv.textContent = `Found ${Object.keys(result.data).length} authenticated patients`;
            } else {
                // Retry up to 2 times if dashboard not loaded
                if (result.error.includes('not loaded') && retryCount < 2) {
                    statusDiv.textContent = `Retrying... (${retryCount + 1}/2)`;
                    setTimeout(() => loadPatientData(retryCount + 1), 1000);
                    return;
                }
                showError(result.error || 'Failed to load patient data');
            }
        } else {
            showError('Failed to execute script on dashboard page');
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
        showError(`Error: ${error.message}. Make sure you are on the Hospital Dashboard page and the extension has proper permissions.`);
    }
}

// Function to be injected into the dashboard page
function getDashboardData() {
    // Wait a bit for the dashboard to load
    return new Promise((resolve) => {
        const checkDashboard = () => {
            if (window.HospitalDashboard) {
                try {
                    const allPatients = window.HospitalDashboard.getAllStoredPatientData();
                    resolve({
                        success: true,
                        data: allPatients
                    });
                } catch (error) {
                    resolve({ success: false, error: error.message });
                }
            } else {
                // Wait up to 3 seconds for dashboard to load
                setTimeout(() => {
                    if (window.HospitalDashboard) {
                        try {
                            const allPatients = window.HospitalDashboard.getAllStoredPatientData();
                            resolve({
                                success: true,
                                data: allPatients
                            });
                        } catch (error) {
                            resolve({ success: false, error: error.message });
                        }
                    } else {
                        resolve({ success: false, error: 'Hospital Dashboard not loaded. Please refresh the page and try again.' });
                    }
                }, 1000);
            }
        };
        
        checkDashboard();
    });
}

// Display patient data in popup
function displayPatientData(patients) {
    
    if (Object.keys(patients).length === 0) {
        patientList.innerHTML = '<div class="loading">No authenticated patients found</div>';
        return;
    }
    
    patientList.innerHTML = Object.values(patients).map(patient => {
        const diagnosis = patient.diagnosis || {};
        const heartRate = diagnosis.heartRate || { value: 'N/A', unit: '', status: 'normal' };
        const bloodPressure = diagnosis.bloodPressure || { value: 'N/A', unit: '', status: 'normal' };
        const spo2 = diagnosis.spo2 || { value: 'N/A', unit: '', status: 'normal' };
        
        return `
            <div class="patient-item">
                <div class="patient-name">${patient.name}</div>
                <div class="patient-details">
                    <div><strong>ABHA ID:</strong> ${patient.abha_id}</div>
                    <div><strong>Age:</strong> ${calculateAge(patient.date_of_birth)} years</div>
                    <div><strong>Gender:</strong> ${patient.gender === 'M' ? 'Male' : 'Female'}</div>
                    <div><strong>Authenticated:</strong> ${new Date(patient.authenticated_at).toLocaleString()}</div>
                    <div class="diagnosis-item">
                        <span>❤️ Heart Rate:</span>
                        <span class="status-${heartRate.status}">${heartRate.value} ${heartRate.unit}</span>
                    </div>
                    <div class="diagnosis-item">
                        <span>🩸 Blood Pressure:</span>
                        <span class="status-${bloodPressure.status}">${bloodPressure.value} ${bloodPressure.unit}</span>
                    </div>
                    <div class="diagnosis-item">
                        <span>🫁 SpO2:</span>
                        <span class="status-${spo2.status}">${spo2.value} ${spo2.unit}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Export all patient data to CSV
async function exportAllData() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: exportPatientDataToCSV
        });
        
        const result = results[0].result;
        
        if (result.success) {
            // Download the CSV file
            const blob = new Blob([result.csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hospital_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            statusDiv.textContent = 'Data exported successfully!';
        } else {
            showError(result.error || 'Failed to export data');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('Error exporting data');
    }
}

// Function to export data (injected into dashboard)
function exportPatientDataToCSV() {
    if (!window.HospitalDashboard) {
        return { success: false, error: 'Dashboard not available' };
    }
    
    const allPatients = window.HospitalDashboard.getAllStoredPatientData();
    
    if (Object.keys(allPatients).length === 0) {
        return { success: false, error: 'No patient data to export' };
    }
    
    // Create CSV content
    const csvRows = [
        'ABHA ID,Name,Date of Birth,Gender,Mobile,Authenticated At,Token,Heart Rate,Blood Pressure,SpO2,Temperature,Respiratory Rate,Blood Sugar,BMI,Height,Weight'
    ];
    
    Object.values(allPatients).forEach(patient => {
        const diagnosis = patient.diagnosis || {};
        const row = [
            patient.abha_id,
            `"${patient.name}"`,
            patient.date_of_birth,
            patient.gender === 'M' ? 'Male' : 'Female',
            patient.mobile_number,
            patient.authenticated_at,
            `"${patient.generated_token}"`,
            diagnosis.heartRate?.value || 'N/A',
            diagnosis.bloodPressure?.value || 'N/A',
            diagnosis.spo2?.value || 'N/A',
            diagnosis.temperature?.value || 'N/A',
            diagnosis.respiratoryRate?.value || 'N/A',
            diagnosis.bloodSugar?.value || 'N/A',
            diagnosis.bmi?.value || 'N/A',
            diagnosis.height?.value || 'N/A',
            diagnosis.weight?.value || 'N/A'
        ];
        csvRows.push(row.join(','));
    });
    
    return {
        success: true,
        csvData: csvRows.join('\n')
    };
}

// Clear all patient data
async function clearAllData() {
    if (!confirm('Are you sure you want to clear all patient data? This action cannot be undone.')) {
        return;
    }
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: clearAllPatientData
        });
        
        statusDiv.textContent = 'All patient data cleared';
        patientList.innerHTML = '<div class="loading">No authenticated patients found</div>';
    } catch (error) {
        console.error('Error clearing data:', error);
        showError('Error clearing data');
    }
}

// Function to clear all data (injected into dashboard)
function clearAllPatientData() {
    if (window.HospitalDashboard) {
        // Clear all patient-related localStorage items
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('patient_token_') || key.startsWith('patient_data_')) {
                localStorage.removeItem(key);
            }
        });
        return { success: true };
    }
    return { success: false, error: 'Dashboard not available' };
}

// Show error message
function showError(message) {
    statusDiv.innerHTML = `<div class="error">${message}</div>`;
}

// Check API health
async function checkHealth() {
    const searchResults = document.getElementById('searchResults');
    
    try {
        searchResults.innerHTML = '<div class="loading">Checking API health...</div>';
        
        const healthData = await checkAPIHealth();
        
        searchResults.innerHTML = `
            <div class="search-result-item" style="background: rgba(46, 204, 113, 0.2); border-left-color: #2ecc71;">
                <div class="search-result-title">✅ API Health Check</div>
                <div class="search-result-details">
                    <div><strong>Status:</strong> API is healthy</div>
                    <div><strong>Response:</strong> ${JSON.stringify(healthData, null, 2)}</div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Health check error:', error);
        searchResults.innerHTML = `
            <div class="search-result-item" style="background: rgba(231, 76, 60, 0.2); border-left-color: #e74c3c;">
                <div class="search-result-title">❌ API Health Check Failed</div>
                <div class="search-result-details">
                    <div><strong>Error:</strong> ${error.message}</div>
                    <div><strong>Status:</strong> API may be down or unreachable</div>
                </div>
            </div>
        `;
    }
}

// Search ICD-11 using API-VEDA
async function searchICD11() {
    const searchTerm = document.getElementById('searchTerm');
    const searchResults = document.getElementById('searchResults');
    const term = searchTerm.value.trim();
    
    if (!term) {
        searchResults.innerHTML = '<div class="error">Please enter a search term</div>';
        return;
    }
    
    try {
        searchResults.innerHTML = '<div class="loading">Searching ICD-11...</div>';
        
        // Try multiple endpoints in order of preference
        let result = null;
        
        // First try: GET /api/search?q={term}&system={system} (most comprehensive)
        try {
            result = await searchWithAPI(term);
        } catch (e) {
            console.log('API search failed, trying alternative...');
        }
        
        // Second try: GET /search?q={term}&system={system}
        if (!result) {
            try {
                result = await searchWithQuery(term);
            } catch (e) {
                console.log('Query search failed, trying path parameter...');
            }
        }
        
        // Third try: GET /search/{term} (path parameter)
        if (!result) {
            try {
                result = await searchWithPath(term);
            } catch (e) {
                console.log('Path search failed, trying lookup...');
            }
        }
        
        // Fourth try: POST /lookup (exact match)
        if (!result) {
            try {
                result = await lookupTerm(term);
            } catch (e) {
                console.log('Lookup failed');
            }
        }
        
        if (result && result.data) {
            displaySearchResults(result);
        } else {
            searchResults.innerHTML = '<div class="error">No results found for this term</div>';
        }
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `<div class="error">Search failed: ${error.message}</div>`;
    }
}

// Display search results
function displaySearchResults(resultObj) {
    const searchResults = document.getElementById('searchResults');
    
    // Handle both direct results and result objects with endpoint info
    let results, endpoint = 'Unknown';
    if (resultObj && resultObj.data && resultObj.endpoint) {
        results = resultObj.data;
        endpoint = resultObj.endpoint;
    } else {
        results = resultObj;
    }
    
    // Handle different response formats
    if (!results) {
        searchResults.innerHTML = '<div class="error">No response received</div>';
        return;
    }
    
    // Convert to array if it's not already
    let resultsArray = [];
    if (Array.isArray(results)) {
        resultsArray = results;
    } else if (typeof results === 'object') {
        // If it's an object, try to find array data or convert to array
        if (results.results && Array.isArray(results.results)) {
            resultsArray = results.results;
        } else if (results.data && Array.isArray(results.data)) {
            resultsArray = results.data;
        } else if (results.matches && Array.isArray(results.matches)) {
            resultsArray = results.matches;
        } else {
            // Convert single object to array
            resultsArray = [results];
        }
    } else if (typeof results === 'string') {
        // If it's a string, wrap it in an array
        resultsArray = [results];
    } else {
        searchResults.innerHTML = `
            <div class="search-result-item" style="background: rgba(231, 76, 60, 0.2); border-left-color: #e74c3c;">
                <div class="search-result-title">❌ Invalid Response Format</div>
                <div class="search-result-details">
                    <div><strong>Received:</strong> ${typeof results}</div>
                    <div><strong>Data:</strong> ${JSON.stringify(results, null, 2)}</div>
                </div>
            </div>
        `;
        return;
    }
    
    if (resultsArray.length === 0) {
        searchResults.innerHTML = '<div class="error">No results found</div>';
        return;
    }
    
    const resultsHtml = `
        <div class="search-result-item" style="background: rgba(52, 152, 219, 0.2); border-left-color: #3498db;">
            <div class="search-result-title">🔍 Search Results (${endpoint})</div>
            <div class="search-result-details">Found ${resultsArray.length} result(s)</div>
        </div>
        ${resultsArray.map((result, index) => {
            return `
                <div class="search-result-item">
                    <div class="search-result-title">Result ${index + 1}</div>
                    <div class="search-result-details">
                        ${formatSearchResult(result)}
                    </div>
                </div>
            `;
        }).join('')}
    `;
    
    searchResults.innerHTML = resultsHtml;
}

// Format search result for display
function formatSearchResult(result) {
    let html = '';
    
    // Handle different result formats
    if (typeof result === 'string') {
        html += `<div><strong>Term:</strong> ${result}</div>`;
    } else if (typeof result === 'number') {
        html += `<div><strong>Value:</strong> ${result}</div>`;
    } else if (typeof result === 'boolean') {
        html += `<div><strong>Status:</strong> ${result ? 'True' : 'False'}</div>`;
    } else if (typeof result === 'object' && result !== null) {
        // Handle nested objects and arrays
        for (const [key, value] of Object.entries(result)) {
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    html += `<div><strong>${key}:</strong> [${value.length} items] ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}</div>`;
                } else if (typeof value === 'object') {
                    html += `<div><strong>${key}:</strong> ${JSON.stringify(value, null, 2)}</div>`;
                } else {
                    html += `<div><strong>${key}:</strong> ${value}</div>`;
                }
            }
        }
    } else {
        html += `<div><strong>Raw Data:</strong> ${JSON.stringify(result)}</div>`;
    }
    
    return html || '<div>No details available</div>';
}

// Individual endpoint functions
/*
// 1. GET /api/search?q={term}&system={system} - Most comprehensive search
async function searchWithAPI(term, system = 'icd11') {
    try {
        const response = await fetch(`https://api-veda-kjax.onrender.com/api/search?q=${encodeURIComponent(term)}&system=${system}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return { data: await response.json(), endpoint: 'API Search' };
    } catch (error) {
        console.error('API search error:', error);
        throw error;
    }
}

// 2. GET /search?q={term}&system={system} - Query parameter search
async function searchWithQuery(term, system = 'icd11') {
    try {
        const response = await fetch(`https://api-veda-kjax.onrender.com/search?q=${encodeURIComponent(term)}&system=${system}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return { data: await response.json(), endpoint: 'Query Search' };
    } catch (error) {
        console.error('Query search error:', error);
        throw error;
    }
}

// 3. GET /search/{term} - Path parameter search (partial match)
async function searchWithPath(term) {
    try {
        const response = await fetch(`https://api-veda-kjax.onrender.com/search/${encodeURIComponent(term)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return { data: await response.json(), endpoint: 'Path Search' };
    } catch (error) {
        console.error('Path search error:', error);
        throw error;
    }
}

// 4. POST /lookup - Exact term lookup
async function lookupTerm(term) {
    try {
        const response = await fetch('https://api-veda-kjax.onrender.com/lookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ term: term })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return { data: await response.json(), endpoint: 'Lookup' };
    } catch (error) {
        console.error('Lookup error:', error);
        throw error;
    }
}

// 5. GET /health - Health check
async function checkAPIHealth() {
    try {
        const response = await fetch('https://api-veda-kjax.onrender.com/health');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Health check error:', error);
        throw error;
    }
}

// 6. POST /generate-fhir-report - Generate FHIR R4 report
async function generateFHIRReport(patientData) {
    try {
        const response = await fetch('https://api-veda-kjax.onrender.com/generate-fhir-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('FHIR report generation error:', error);
        throw error;
    }
}*/
// ✅ Corrected API endpoint functions for NAMASTE to ICD-11 Mapping API
const API_BASE_URL = 'https://api-veda-kjax.onrender.com';

// 1. GET /api/search?q={term}&system={system} - API search endpoint with multiple parameter options
async function searchWithAPI(term, system = 'icd11') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(term)}&system=${system}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { data: await response.json(), endpoint: 'API Search' };
    } catch (error) {
        console.error('API search error:', error);
        throw error;
    }
}

// 2. GET /search?q={term}&system={system} - Search using query parameters
async function searchWithQuery(term, system = 'icd11') {
    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(term)}&system=${system}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { data: await response.json(), endpoint: 'Query Search' };
    } catch (error) {
        console.error('Query search error:', error);
        throw error;
    }
}

// 3. GET /search/{term} - Path parameter search for partial matches
async function searchWithPath(term) {
    try {
        const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(term)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { data: await response.json(), endpoint: 'Path Search' };
    } catch (error) {
        console.error('Path search error:', error);
        throw error;
    }
}

// 4. POST /lookup - Look up a traditional term to get ICD-11 mapping (exact match)
async function lookupTerm(term) {
    try {
        const response = await fetch(`${API_BASE_URL}/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { data: await response.json(), endpoint: 'Lookup' };
    } catch (error) {
        console.error('Lookup error:', error);
        throw error;
    }
}

// 5. GET /health - Health check endpoint
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Health check error:', error);
        throw error;
    }
}

// 6. POST /generate-fhir-report - Generate a FHIR R4 report
async function generateFHIRReport(patientData) {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-fhir-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('FHIR report generation error:', error);
        throw error;
    }
}

