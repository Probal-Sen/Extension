# Hospital Dashboard - Extension Integration Guide

## 🚀 Quick Start

This guide shows you how to create browser extensions that can access authenticated patient data and tokens from the Hospital Dashboard.

## 📋 Prerequisites

1. **Hospital Dashboard** running (open `index.html` in browser)
2. **Chrome/Edge Browser** with extension development enabled
3. **Basic JavaScript knowledge**

## 🔧 Extension Setup

### Step 1: Create Extension Directory
```
hospital-dashboard-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 2: Install Extension
1. Open Chrome/Edge
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select your extension directory

## 🔌 API Integration

### Basic Usage
```javascript
// Check if dashboard is loaded
if (window.HospitalDashboard) {
    // Get all authenticated patients
    const allPatients = window.HospitalDashboard.getAllStoredPatientData();
    
    // Get specific patient
    const patient = window.HospitalDashboard.getStoredPatientData('ABHA1234567890');
    
    // Check authentication status
    const isAuthenticated = window.HospitalDashboard.isPatientAuthenticated('ABHA1234567890');
    
    // Get patient token
    const token = window.HospitalDashboard.getStoredToken('ABHA1234567890');
}
```

### Advanced Usage
```javascript
// Get patient by token
const patient = window.HospitalDashboard.getPatientByToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123');

// Validate token
const isValid = window.HospitalDashboard.validateToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123');

// Get diagnosis data only
const diagnosis = window.HospitalDashboard.getDiagnosisData('ABHA1234567890');

// Export patient data to CSV
const csvData = window.HospitalDashboard.exportPatientCSV('ABHA1234567890');

// Listen for new patient authentications
window.HospitalDashboard.onPatientAuthenticated((patient) => {
    console.log('New patient authenticated:', patient.name);
    // Handle new patient data
});
```

## 📊 Data Structure

### Patient Object
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
        heartRate: { value: 75, unit: "BPM", status: "normal", icon: "fas fa-heartbeat" },
        bloodPressure: { value: "120/80", unit: "mmHg", status: "normal", icon: "fas fa-tint" },
        spo2: { value: 98, unit: "%", status: "normal", icon: "fas fa-lungs" },
        temperature: { value: "36.8", unit: "°C", status: "normal", icon: "fas fa-thermometer-half" },
        respiratoryRate: { value: 16, unit: "/min", status: "normal", icon: "fas fa-wind" },
        bloodSugar: { value: 95, unit: "mg/dL", status: "normal", icon: "fas fa-tint" },
        bmi: { value: "22.5", unit: "kg/m²", status: "normal", icon: "fas fa-weight" },
        height: { value: 175, unit: "cm", status: "normal", icon: "fas fa-ruler-vertical" },
        weight: { value: 70, unit: "kg", status: "normal", icon: "fas fa-weight-hanging" }
    }
}
```

## 🛠️ Extension Examples

### Example 1: Simple Patient Monitor
```javascript
// content.js
function monitorPatients() {
    if (window.HospitalDashboard) {
        const patients = window.HospitalDashboard.getAllStoredPatientData();
        console.log(`Monitoring ${Object.keys(patients).length} patients`);
        
        Object.values(patients).forEach(patient => {
            console.log(`${patient.name}: Heart Rate ${patient.diagnosis.heartRate.value} BPM`);
        });
    }
}

// Check every 30 seconds
setInterval(monitorPatients, 30000);
```

### Example 2: Token Validator
```javascript
// content.js
function validateAllTokens() {
    if (window.HospitalDashboard) {
        const tokens = window.HospitalDashboard.getAllStoredTokens();
        
        Object.entries(tokens).forEach(([abhaId, token]) => {
            const isValid = window.HospitalDashboard.validateToken(token);
            console.log(`Token for ${abhaId}: ${isValid ? 'Valid' : 'Invalid'}`);
        });
    }
}
```

### Example 3: Data Exporter
```javascript
// content.js
function exportAllData() {
    if (window.HospitalDashboard) {
        const csvData = window.HospitalDashboard.exportPatientCSV();
        
        // Create download link
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hospital_data.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
}
```

## 🔒 Security Considerations

### Token Validation
```javascript
function secureGetPatientData(abhaId, expectedToken) {
    if (!window.HospitalDashboard) {
        throw new Error('Dashboard not available');
    }
    
    // Validate token first
    if (!window.HospitalDashboard.validateToken(expectedToken)) {
        throw new Error('Invalid token');
    }
    
    // Get patient data
    const patient = window.HospitalDashboard.getStoredPatientData(abhaId);
    
    if (!patient) {
        throw new Error('Patient not found');
    }
    
    return patient;
}
```

### Error Handling
```javascript
function safeAccessPatientData(abhaId) {
    try {
        if (!window.HospitalDashboard) {
            return { success: false, error: 'Dashboard not loaded' };
        }
        
        if (!window.HospitalDashboard.isPatientAuthenticated(abhaId)) {
            return { success: false, error: 'Patient not authenticated' };
        }
        
        const patient = window.HospitalDashboard.getStoredPatientData(abhaId);
        return { success: true, data: patient };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

## 📱 Popup Integration

### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>Hospital Dashboard Extension</title>
</head>
<body>
    <div id="patientList"></div>
    <button id="refreshBtn">Refresh</button>
    <button id="exportBtn">Export CSV</button>
</body>
</html>
```

### JavaScript Integration
```javascript
// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const patientList = document.getElementById('patientList');
    
    refreshBtn.addEventListener('click', loadPatients);
    exportBtn.addEventListener('click', exportData);
    
    loadPatients();
});

async function loadPatients() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            if (window.HospitalDashboard) {
                return window.HospitalDashboard.getAllStoredPatientData();
            }
            return {};
        }
    });
    
    displayPatients(results[0].result);
}

function displayPatients(patients) {
    const patientList = document.getElementById('patientList');
    patientList.innerHTML = '';
    
    Object.values(patients).forEach(patient => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>${patient.name}</h3>
            <p>ABHA: ${patient.abha_id}</p>
            <p>Heart Rate: ${patient.diagnosis.heartRate.value} ${patient.diagnosis.heartRate.unit}</p>
        `;
        patientList.appendChild(div);
    });
}
```

## 🔄 Real-time Updates

### Event Listening
```javascript
// Listen for new patient authentications
window.HospitalDashboard.onPatientAuthenticated((patient) => {
    console.log('New patient authenticated:', patient.name);
    // Update your extension UI
    updatePatientList();
});

// Monitor changes
function startMonitoring() {
    setInterval(() => {
        if (window.HospitalDashboard) {
            const currentCount = window.HospitalDashboard.getPatientCount();
            // Check if count changed and update accordingly
        }
    }, 5000);
}
```

## 🧪 Testing Your Extension

### Test Checklist
1. ✅ Extension loads without errors
2. ✅ Can access dashboard API
3. ✅ Can retrieve patient data
4. ✅ Can validate tokens
5. ✅ Can export CSV data
6. ✅ Handles errors gracefully
7. ✅ Updates in real-time

### Debug Tips
```javascript
// Check API availability
console.log('Dashboard API:', !!window.HospitalDashboard);

// List all available methods
if (window.HospitalDashboard) {
    console.log('Available methods:', Object.keys(window.HospitalDashboard));
}

// Test data retrieval
if (window.HospitalDashboard) {
    const patients = window.HospitalDashboard.getAllStoredPatientData();
    console.log('Patient count:', Object.keys(patients).length);
}
```

## 🚀 Deployment

### For Development
1. Load extension in developer mode
2. Test with local dashboard
3. Debug using browser dev tools

### For Production
1. Package extension as .zip
2. Submit to Chrome Web Store
3. Update manifest with production URLs

## 📞 Support

### Common Issues
- **API not available**: Ensure dashboard is fully loaded
- **No patient data**: Check if patients are authenticated
- **Permission denied**: Verify extension permissions
- **CORS errors**: Use content scripts, not direct fetch

### Debug Commands
```javascript
// Check dashboard status
console.log('Dashboard loaded:', !!window.HospitalDashboard);

// List all stored data
console.log('All patients:', window.HospitalDashboard?.getAllStoredPatientData());

// Check specific patient
console.log('Patient authenticated:', window.HospitalDashboard?.isPatientAuthenticated('ABHA1234567890'));
```

## 📚 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts Guide](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

---

**Happy Coding! 🏥💻**
