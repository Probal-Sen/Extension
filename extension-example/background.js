// background.js - Service worker for Hospital Dashboard Extension
console.log('Hospital Dashboard Extension: Background script loaded');

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    switch (request.action) {
        case 'getPatientData':
            handleGetPatientData(request, sendResponse);
            break;
        case 'patientDataChanged':
            handlePatientDataChanged(request, sender);
            break;
        case 'exportData':
            handleExportData(request, sendResponse);
            break;
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async responses
});

// Handle get patient data request
async function handleGetPatientData(request, sendResponse) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            sendResponse({ success: false, error: 'No active tab found' });
            return;
        }
        
        // Inject script to get data from dashboard
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getDashboardData,
            args: [request.abhaId]
        });
        
        sendResponse(results[0].result);
    } catch (error) {
        console.error('Error getting patient data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Function to be injected into dashboard page
function getDashboardData(abhaId = null) {
    if (!window.HospitalDashboard) {
        return { success: false, error: 'Hospital Dashboard not loaded' };
    }
    
    try {
        if (abhaId) {
            const patientData = window.HospitalDashboard.getStoredPatientData(abhaId);
            const isAuthenticated = window.HospitalDashboard.isPatientAuthenticated(abhaId);
            
            return {
                success: true,
                data: {
                    patient: patientData,
                    isAuthenticated: isAuthenticated
                }
            };
        } else {
            const allPatients = window.HospitalDashboard.getAllStoredPatientData();
            const allTokens = window.HospitalDashboard.getAllStoredTokens();
            
            return {
                success: true,
                data: {
                    patients: allPatients,
                    tokens: allTokens,
                    count: Object.keys(allPatients).length
                }
            };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle patient data changed notification
function handlePatientDataChanged(request, sender) {
    console.log('Patient data changed:', request.data);
    
    // Store the latest data in extension storage
    chrome.storage.local.set({
        lastPatientData: request.data,
        lastUpdate: Date.now()
    });
    
    // You can add additional logic here, such as:
    // - Sending notifications
    // - Updating badge text
    // - Logging to external service
}

// Handle export data request
async function handleExportData(request, sendResponse) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            sendResponse({ success: false, error: 'No active tab found' });
            return;
        }
        
        // Inject script to export data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: exportDashboardData
        });
        
        sendResponse(results[0].result);
    } catch (error) {
        console.error('Error exporting data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Function to export data (injected into dashboard)
function exportDashboardData() {
    if (!window.HospitalDashboard) {
        return { success: false, error: 'Hospital Dashboard not loaded' };
    }
    
    try {
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
            data: csvRows.join('\n')
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Set up periodic data sync
chrome.alarms.create('syncPatientData', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncPatientData') {
        syncPatientData();
    }
});

// Sync patient data periodically
async function syncPatientData() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab && tab.url && (tab.url.includes('localhost:8000') || tab.url.includes('hospital-dashboard'))) {
            // Only sync if we're on the dashboard page
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: getDashboardData
            });
            
            if (results[0].result.success) {
                // Store synced data
                chrome.storage.local.set({
                    syncedPatientData: results[0].result.data,
                    lastSync: Date.now()
                });
                
                console.log('Patient data synced successfully');
            }
        }
    } catch (error) {
        console.error('Error syncing patient data:', error);
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details);
    
    // Set up initial storage
    chrome.storage.local.set({
        extensionInstalled: true,
        installDate: Date.now()
    });
});

// Handle tab updates to monitor dashboard page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('localhost:8000') || tab.url.includes('hospital-dashboard')) {
            console.log('Dashboard page loaded, ready for data access');
        }
    }
});
