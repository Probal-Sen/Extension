// content.js - Content script for Hospital Dashboard Extension
console.log('Hospital Dashboard Extension: Content script loaded');

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    switch (request.action) {
        case 'getPatientData':
            sendResponse(getPatientData());
            break;
        case 'getAllPatients':
            sendResponse(getAllPatients());
            break;
        case 'isPatientAuthenticated':
            sendResponse(isPatientAuthenticated(request.abhaId));
            break;
        case 'exportData':
            sendResponse(exportPatientData());
            break;
        case 'clearData':
            sendResponse(clearAllData());
            break;
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async responses
});

// Get patient data for a specific ABHA ID
function getPatientData(abhaId = null) {
    try {
        if (!window.HospitalDashboard) {
            return { success: false, error: 'Hospital Dashboard not loaded' };
        }
        
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
            // Return all patients
            const allPatients = window.HospitalDashboard.getAllStoredPatientData();
            const allTokens = window.HospitalDashboard.getAllStoredTokens();
            
            return {
                success: true,
                data: {
                    patients: allPatients,
                    tokens: allTokens
                }
            };
        }
    } catch (error) {
        console.error('Error getting patient data:', error);
        return { success: false, error: error.message };
    }
}

// Get all authenticated patients
function getAllPatients() {
    try {
        if (!window.HospitalDashboard) {
            return { success: false, error: 'Hospital Dashboard not loaded' };
        }
        
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
    } catch (error) {
        console.error('Error getting all patients:', error);
        return { success: false, error: error.message };
    }
}

// Check if a specific patient is authenticated
function isPatientAuthenticated(abhaId) {
    try {
        if (!window.HospitalDashboard) {
            return { success: false, error: 'Hospital Dashboard not loaded' };
        }
        
        if (!abhaId) {
            return { success: false, error: 'ABHA ID required' };
        }
        
        const isAuthenticated = window.HospitalDashboard.isPatientAuthenticated(abhaId);
        const patientData = isAuthenticated ? window.HospitalDashboard.getStoredPatientData(abhaId) : null;
        
        return {
            success: true,
            data: {
                isAuthenticated: isAuthenticated,
                patient: patientData
            }
        };
    } catch (error) {
        console.error('Error checking authentication:', error);
        return { success: false, error: error.message };
    }
}

// Export all patient data to CSV format
function exportPatientData() {
    try {
        if (!window.HospitalDashboard) {
            return { success: false, error: 'Hospital Dashboard not loaded' };
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
            data: csvRows.join('\n')
        };
    } catch (error) {
        console.error('Error exporting data:', error);
        return { success: false, error: error.message };
    }
}

// Clear all patient data
function clearAllData() {
    try {
        if (!window.HospitalDashboard) {
            return { success: false, error: 'Hospital Dashboard not loaded' };
        }
        
        // Clear all patient-related localStorage items
        const keys = Object.keys(localStorage);
        let clearedCount = 0;
        
        keys.forEach(key => {
            if (key.startsWith('patient_token_') || key.startsWith('patient_data_')) {
                localStorage.removeItem(key);
                clearedCount++;
            }
        });
        
        return {
            success: true,
            data: {
                clearedCount: clearedCount,
                message: `Cleared ${clearedCount} patient records`
            }
        };
    } catch (error) {
        console.error('Error clearing data:', error);
        return { success: false, error: error.message };
    }
}

// Monitor dashboard changes and notify extension
function monitorDashboardChanges() {
    if (window.HospitalDashboard) {
        console.log('Hospital Dashboard detected, monitoring for changes...');
        
        // Check for new patient authentications
        let lastPatientCount = 0;
        
        setInterval(() => {
            try {
                const allPatients = window.HospitalDashboard.getAllStoredPatientData();
                const currentCount = Object.keys(allPatients).length;
                
                if (currentCount !== lastPatientCount) {
                    console.log(`Patient count changed: ${lastPatientCount} -> ${currentCount}`);
                    lastPatientCount = currentCount;
                    
                    // Notify background script about changes
                    chrome.runtime.sendMessage({
                        action: 'patientDataChanged',
                        data: {
                            patientCount: currentCount,
                            patients: allPatients
                        }
                    });
                }
            } catch (error) {
                console.error('Error monitoring dashboard changes:', error);
            }
        }, 5000); // Check every 5 seconds
    }
}

// Initialize monitoring when dashboard is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorDashboardChanges);
} else {
    monitorDashboardChanges();
}

// Also check periodically in case dashboard loads after content script
setTimeout(monitorDashboardChanges, 2000);
