# Hospital Dashboard - Extension API Documentation

## Overview
This document explains how browser extensions can access authenticated patient data and tokens from the Hospital Dashboard.

## API Access Methods

### 1. Direct Window Object Access
The dashboard exposes a global `HospitalDashboard` object that extensions can access:

```javascript
// Check if dashboard is loaded
if (window.HospitalDashboard) {
    // Access the API
    const api = window.HospitalDashboard;
}
```

### 2. Available API Methods

#### `getStoredToken(abhaId)`
Returns the authentication token for a specific patient.

```javascript
const token = HospitalDashboard.getStoredToken('ABHA1234567890');
console.log('Patient token:', token);
```

#### `getStoredPatientData(abhaId)`
Returns complete patient data including diagnosis information.

```javascript
const patientData = HospitalDashboard.getStoredPatientData('ABHA1234567890');
console.log('Patient data:', patientData);
```

#### `isPatientAuthenticated(abhaId)`
Checks if a patient is currently authenticated.

```javascript
const isAuthenticated = HospitalDashboard.isPatientAuthenticated('ABHA1234567890');
if (isAuthenticated) {
    console.log('Patient is authenticated');
}
```

#### `getAllStoredTokens()`
Returns all stored authentication tokens.

```javascript
const allTokens = HospitalDashboard.getAllStoredTokens();
console.log('All tokens:', allTokens);
```

#### `getAllStoredPatientData()`
Returns all stored patient data.

```javascript
const allPatients = HospitalDashboard.getAllStoredPatientData();
console.log('All patients:', allPatients);
```

## Data Structure

### Patient Data Object
```javascript
{
    abha_id: "ABHA1234567890",
    name: "Rajesh Kumar",
    date_of_birth: "1985-06-15",
    gender: "M",
    mobile_number: "9876543210",
    generated_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123",
    authenticated_at: "2024-01-15T10:30:00.000Z",
    diagnosis: {
        heartRate: {
            value: 75,
            unit: "BPM",
            status: "normal",
            icon: "fas fa-heartbeat"
        },
        bloodPressure: {
            value: "120/80",
            unit: "mmHg",
            status: "normal",
            icon: "fas fa-tint"
        },
        spo2: {
            value: 98,
            unit: "%",
            status: "normal",
            icon: "fas fa-lungs"
        },
        // ... more diagnosis data
    }
}
```

## Extension Integration Examples

### Content Script Example
```javascript
// content.js
function checkPatientAuthentication() {
    if (window.HospitalDashboard) {
        const allPatients = window.HospitalDashboard.getAllStoredPatientData();
        
        allPatients.forEach(patient => {
            console.log(`Patient: ${patient.name}`);
            console.log(`ABHA ID: ${patient.abha_id}`);
            console.log(`Token: ${patient.generated_token}`);
            console.log(`Authenticated: ${patient.authenticated_at}`);
            console.log(`Heart Rate: ${patient.diagnosis.heartRate.value} ${patient.diagnosis.heartRate.unit}`);
        });
    }
}

// Check when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPatientAuthentication);
} else {
    checkPatientAuthentication();
}
```

### Background Script Example
```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPatientData') {
        // Inject content script to access dashboard data
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: getDashboardData
            }, (results) => {
                sendResponse(results[0].result);
            });
        });
        return true; // Keep message channel open
    }
});

function getDashboardData() {
    if (window.HospitalDashboard) {
        return {
            success: true,
            data: {
                allTokens: window.HospitalDashboard.getAllStoredTokens(),
                allPatients: window.HospitalDashboard.getAllStoredPatientData()
            }
        };
    }
    return {success: false, error: 'Dashboard not loaded'};
}
```

### Popup Script Example
```javascript
// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const getDataBtn = document.getElementById('getDataBtn');
    
    getDataBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: getPatientData
            }, (results) => {
                if (results[0].result.success) {
                    displayPatientData(results[0].result.data);
                } else {
                    console.error('Failed to get patient data');
                }
            });
        });
    });
});

function getPatientData() {
    if (window.HospitalDashboard) {
        return {
            success: true,
            data: window.HospitalDashboard.getAllStoredPatientData()
        };
    }
    return {success: false, error: 'Dashboard not available'};
}

function displayPatientData(patients) {
    const container = document.getElementById('patientList');
    container.innerHTML = '';
    
    Object.values(patients).forEach(patient => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>${patient.name}</h3>
            <p>ABHA ID: ${patient.abha_id}</p>
            <p>Heart Rate: ${patient.diagnosis.heartRate.value} ${patient.diagnosis.heartRate.unit}</p>
            <p>Blood Pressure: ${patient.diagnosis.bloodPressure.value} ${patient.diagnosis.bloodPressure.unit}</p>
            <p>SpO2: ${patient.diagnosis.spo2.value} ${patient.diagnosis.spo2.unit}</p>
        `;
        container.appendChild(div);
    });
}
```

## Security Considerations

1. **Token Validation**: Always validate tokens before using them
2. **Data Encryption**: Consider encrypting sensitive data in storage
3. **Permission Management**: Request minimal required permissions
4. **HTTPS Only**: Ensure dashboard is served over HTTPS in production

## Error Handling

```javascript
function safeGetPatientData(abhaId) {
    try {
        if (!window.HospitalDashboard) {
            throw new Error('Hospital Dashboard not loaded');
        }
        
        if (!window.HospitalDashboard.isPatientAuthenticated(abhaId)) {
            throw new Error('Patient not authenticated');
        }
        
        return window.HospitalDashboard.getStoredPatientData(abhaId);
    } catch (error) {
        console.error('Error accessing patient data:', error);
        return null;
    }
}
```

## Testing Extension Integration

1. Load the Hospital Dashboard in a browser tab
2. Authenticate a patient
3. Install your extension
4. Use the extension to access patient data
5. Verify data integrity and token validity

## Troubleshooting

### Common Issues

1. **Dashboard not loaded**: Ensure the dashboard page is fully loaded before accessing the API
2. **No patient data**: Check if patients are properly authenticated
3. **Permission denied**: Verify extension has necessary permissions
4. **CORS issues**: Ensure proper content script injection

### Debug Tips

```javascript
// Check if API is available
console.log('Dashboard API available:', !!window.HospitalDashboard);

// List all stored data
if (window.HospitalDashboard) {
    console.log('All tokens:', window.HospitalDashboard.getAllStoredTokens());
    console.log('All patients:', window.HospitalDashboard.getAllStoredPatientData());
}
```
