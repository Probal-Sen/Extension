// Global variables
let patientsData = [];
let selectedPatient = null;
let currentAuthenticatedPatient = null;

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPatientsData();
    initializeEventListeners();
});

// Load patient data from embedded CSV data
function loadPatientsData() {
    try {
        // Embedded CSV data to avoid CORS issues when opening file directly
        const csvData = `abha_id,name,date_of_birth,gender,mobile_number,generated_token
ABHA1234567890,Rajesh Kumar,1985-06-15,M,9876543210,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123
ABHA0987654321,Priya Sharma,1990-12-22,F,9123456780,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.def456
ABHA1122334455,Ankit Verma,1988-03-05,M,9988776655,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ghi789
ABHA5566778899,Sneha Singh,1995-11-10,F,9876501234,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.jkl012
ABHA6677889900,Vikram Patel,1978-07-25,M,9012345678,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mno345
ABHA3344556677,Aarti Mehra,1982-01-17,F,9123456701,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.pqr678
ABHA7788990011,Manoj Joshi,1987-09-30,M,9988770011,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stu901
ABHA2233445566,Neha Reddy,1993-05-12,F,9876540987,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.vwx234
ABHA4455667788,Sanjay Yadav,1980-02-28,M,9011223344,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yza567
ABHA8899001122,Pooja Agarwal,1992-08-03,F,9123001122,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bcd890`;
        
        patientsData = parseCSV(csvData);
        renderPatientsGrid();
        showNotification('Patient data loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading patient data:', error);
        showNotification('Error loading patient data', 'error');
        renderEmptyState();
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const patients = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            const patient = {};
            
            headers.forEach((header, index) => {
                patient[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            // Only include patients with valid data
            if (patient.abha_id && patient.name) {
                patients.push(patient);
            }
        }
    }
    
    return patients;
}

// Render the patients grid
function renderPatientsGrid() {
    const grid = document.getElementById('patientsGrid');
    
    if (patientsData.length === 0) {
        renderEmptyState();
        return;
    }
    
    grid.innerHTML = patientsData.map(patient => createPatientCard(patient)).join('');
}

// Create a patient card element
function createPatientCard(patient) {
    const genderClass = patient.gender === 'M' ? 'male' : 'female';
    const genderText = patient.gender === 'M' ? 'Male' : 'Female';
    
    return `
        <div class="patient-card" onclick="selectPatient('${patient.abha_id}')" data-abha-id="${patient.abha_id}">
            <div class="patient-header">
                <div class="patient-name">${patient.name}</div>
                <div class="patient-gender ${genderClass}">${genderText}</div>
            </div>
            <div class="patient-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-alt detail-icon"></i>
                    <span class="detail-label">DOB:</span>
                    <span class="detail-value">${formatDate(patient.date_of_birth)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone detail-icon"></i>
                    <span class="detail-label">Mobile:</span>
                    <span class="detail-value">${patient.mobile_number}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-id-card detail-icon"></i>
                    <span class="detail-label">ABHA ID:</span>
                    <span class="detail-value">${patient.abha_id}</span>
                </div>
            </div>
        </div>
    `;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Select a patient and show authentication modal
function selectPatient(abhaId) {
    selectedPatient = patientsData.find(p => p.abha_id === abhaId);
    
    if (!selectedPatient) {
        showNotification('Patient not found', 'error');
        return;
    }
    
    // Update card selection
    document.querySelectorAll('.patient-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-abha-id="${abhaId}"]`).classList.add('selected');
    
    // Show authentication modal
    showAuthModal();
}

// Show authentication modal
function showAuthModal() {
    const modal = document.getElementById('authModal');
    const patientInfo = document.getElementById('selectedPatientInfo');
    
    // Display selected patient info
    patientInfo.innerHTML = `
        <h3>Patient Details</h3>
        <p><strong>Name:</strong> ${selectedPatient.name}</p>
        <p><strong>Date of Birth:</strong> ${formatDate(selectedPatient.date_of_birth)}</p>
        <p><strong>Gender:</strong> ${selectedPatient.gender === 'M' ? 'Male' : 'Female'}</p>
        <p><strong>Mobile:</strong> ${selectedPatient.mobile_number}</p>
    `;
    
    // Clear the form
    document.getElementById('authForm').reset();
    
    // Show modal
    modal.style.display = 'block';
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('abhaId').focus();
    }, 100);
}

// Close authentication modal
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    selectedPatient = null;
    
    // Remove selection from cards
    document.querySelectorAll('.patient-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Authenticate patient
function authenticatePatient(event) {
    event.preventDefault();
    
    const enteredAbhaId = document.getElementById('abhaId').value.trim();
    
    if (!enteredAbhaId) {
        showNotification('Please enter ABHA ID', 'error');
        return;
    }
    
    if (enteredAbhaId !== selectedPatient.abha_id) {
        showNotification('Invalid ABHA ID. Please try again.', 'error');
        return;
    }
    
    // Generate medical diagnosis data
    const diagnosisData = generateMedicalDiagnosis(selectedPatient);
    
    // Store token and patient data in localStorage
    const token = selectedPatient.generated_token;
    const patientData = {
        abha_id: selectedPatient.abha_id,
        name: selectedPatient.name,
        date_of_birth: selectedPatient.date_of_birth,
        gender: selectedPatient.gender,
        mobile_number: selectedPatient.mobile_number,
        generated_token: token,
        authenticated_at: new Date().toISOString(),
        diagnosis: diagnosisData
    };
    
    localStorage.setItem(`patient_token_${selectedPatient.abha_id}`, token);
    localStorage.setItem(`patient_data_${selectedPatient.abha_id}`, JSON.stringify(patientData));
    
    // Set current authenticated patient
    currentAuthenticatedPatient = patientData;
    
    // Trigger event for extensions
    if (window.HospitalDashboard && window.HospitalDashboard.triggerPatientAuthenticated) {
        window.HospitalDashboard.triggerPatientAuthenticated(patientData);
    }
    
    // Show success modal
    showSuccessModal(token);
    
    // Close auth modal
    closeAuthModal();
}

// Show success modal
function showSuccessModal(token) {
    const modal = document.getElementById('successModal');
    const tokenSpan = document.getElementById('storedToken');
    
    tokenSpan.textContent = token;
    modal.style.display = 'block';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    showNotification('Authentication successful! Token stored in localStorage.', 'success');
}

// Generate medical diagnosis data
function generateMedicalDiagnosis(patient) {
    // Generate realistic medical data based on patient demographics
    const age = calculateAge(patient.date_of_birth);
    const isMale = patient.gender === 'M';
    
    // Heart Rate (BPM) - varies by age and gender
    const baseHeartRate = isMale ? 70 : 75;
    const heartRate = baseHeartRate + Math.floor(Math.random() * 20) - 10;
    
    // Blood Pressure - varies by age
    const systolicBase = age > 60 ? 130 : age > 40 ? 120 : 110;
    const diastolicBase = age > 60 ? 80 : age > 40 ? 75 : 70;
    const systolic = systolicBase + Math.floor(Math.random() * 20) - 10;
    const diastolic = diastolicBase + Math.floor(Math.random() * 15) - 7;
    
    // SpO2 (Oxygen Saturation) - generally stable
    const spo2 = 95 + Math.floor(Math.random() * 5);
    
    // Temperature - normal range
    const temperature = 36.5 + (Math.random() * 1.5);
    
    // Respiratory Rate - varies by age
    const respiratoryRate = age > 60 ? 18 : 16 + Math.floor(Math.random() * 4);
    
    // Blood Sugar - random but realistic
    const bloodSugar = 80 + Math.floor(Math.random() * 40);
    
    // Weight and Height (simulated)
    const height = isMale ? 170 + Math.floor(Math.random() * 20) : 160 + Math.floor(Math.random() * 15);
    const weight = isMale ? 70 + Math.floor(Math.random() * 20) : 55 + Math.floor(Math.random() * 15);
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    
    return {
        heartRate: {
            value: heartRate,
            unit: 'BPM',
            status: heartRate < 60 ? 'warning' : heartRate > 100 ? 'warning' : 'normal',
            icon: 'fas fa-heartbeat'
        },
        bloodPressure: {
            value: `${systolic}/${diastolic}`,
            unit: 'mmHg',
            status: systolic > 140 || diastolic > 90 ? 'critical' : systolic > 120 || diastolic > 80 ? 'warning' : 'normal',
            icon: 'fas fa-tint'
        },
        spo2: {
            value: spo2,
            unit: '%',
            status: spo2 < 95 ? 'critical' : spo2 < 97 ? 'warning' : 'normal',
            icon: 'fas fa-lungs'
        },
        temperature: {
            value: temperature.toFixed(1),
            unit: '°C',
            status: temperature > 37.5 ? 'warning' : temperature < 36 ? 'warning' : 'normal',
            icon: 'fas fa-thermometer-half'
        },
        respiratoryRate: {
            value: respiratoryRate,
            unit: '/min',
            status: respiratoryRate > 20 ? 'warning' : respiratoryRate < 12 ? 'warning' : 'normal',
            icon: 'fas fa-wind'
        },
        bloodSugar: {
            value: bloodSugar,
            unit: 'mg/dL',
            status: bloodSugar > 140 ? 'warning' : bloodSugar < 70 ? 'warning' : 'normal',
            icon: 'fas fa-tint'
        },
        bmi: {
            value: bmi,
            unit: 'kg/m²',
            status: bmi > 30 ? 'warning' : bmi < 18.5 ? 'warning' : 'normal',
            icon: 'fas fa-weight'
        },
        height: {
            value: height,
            unit: 'cm',
            status: 'normal',
            icon: 'fas fa-ruler-vertical'
        },
        weight: {
            value: weight,
            unit: 'kg',
            status: 'normal',
            icon: 'fas fa-weight-hanging'
        }
    };
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

// Open patient detail screen
function openPatientDetailScreen() {
    if (!currentAuthenticatedPatient) {
        showNotification('No authenticated patient found', 'error');
        return;
    }
    
    const detailScreen = document.getElementById('patientDetailScreen');
    detailScreen.classList.add('active');
    
    // Populate patient information
    populatePatientInfo();
    
    // Populate diagnosis data
    populateDiagnosisData();
    
    // Populate token information
    populateTokenInfo();
    
    // Close success modal
    closeSuccessModal();
}

// Close patient detail screen
function closePatientDetailScreen() {
    const detailScreen = document.getElementById('patientDetailScreen');
    detailScreen.classList.remove('active');
    currentAuthenticatedPatient = null;
}

// Populate patient information
function populatePatientInfo() {
    const patientInfoGrid = document.getElementById('patientInfoGrid');
    const patient = currentAuthenticatedPatient;
    
    patientInfoGrid.innerHTML = `
        <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${patient.name}</div>
        </div>
        <div class="info-item">
            <div class="info-label">ABHA ID</div>
            <div class="info-value">${patient.abha_id}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${formatDate(patient.date_of_birth)}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Age</div>
            <div class="info-value">${calculateAge(patient.date_of_birth)} years</div>
        </div>
        <div class="info-item">
            <div class="info-label">Gender</div>
            <div class="info-value">${patient.gender === 'M' ? 'Male' : 'Female'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Mobile Number</div>
            <div class="info-value">${patient.mobile_number}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Authenticated At</div>
            <div class="info-value">${new Date(patient.authenticated_at).toLocaleString()}</div>
        </div>
    `;
}

// Populate diagnosis data
function populateDiagnosisData() {
    const diagnosisGrid = document.getElementById('diagnosisGrid');
    const diagnosis = currentAuthenticatedPatient.diagnosis;
    
    diagnosisGrid.innerHTML = Object.keys(diagnosis).map(key => {
        const item = diagnosis[key];
        return `
            <div class="diagnosis-item">
                <div class="diagnosis-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="diagnosis-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                <div class="diagnosis-value">${item.value}</div>
                <div class="diagnosis-unit">${item.unit}</div>
                <div class="diagnosis-status ${item.status}">${item.status}</div>
            </div>
        `;
    }).join('');
}

// Populate token information
function populateTokenInfo() {
    const tokenDisplay = document.getElementById('tokenDisplay');
    const patient = currentAuthenticatedPatient;
    
    tokenDisplay.innerHTML = `
        <div><strong>Token:</strong> ${patient.generated_token}</div>
        <div><strong>ABHA ID:</strong> ${patient.abha_id}</div>
        <div><strong>Generated At:</strong> ${new Date(patient.authenticated_at).toLocaleString()}</div>
        <div><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">ACTIVE</span></div>
    `;
}

// Export patient data to CSV
function exportPatientData() {
    if (!currentAuthenticatedPatient) {
        showNotification('No patient data to export', 'error');
        return;
    }
    
    const patient = currentAuthenticatedPatient;
    const diagnosis = patient.diagnosis;
    
    // Create CSV content
    const csvContent = [
        // Header
        'Field,Value,Unit,Status',
        // Patient data
        `ABHA ID,${patient.abha_id},,`,
        `Name,${patient.name},,`,
        `Date of Birth,${patient.date_of_birth},,`,
        `Gender,${patient.gender === 'M' ? 'Male' : 'Female'},,`,
        `Mobile Number,${patient.mobile_number},,`,
        `Authenticated At,${patient.authenticated_at},,`,
        `Token,${patient.generated_token},,`,
        // Diagnosis data
        ...Object.keys(diagnosis).map(key => {
            const item = diagnosis[key];
            return `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())},${item.value},${item.unit},${item.status}`;
        })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient_${patient.abha_id}_medical_record.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Patient data exported successfully', 'success');
}

// Refresh diagnosis data
function refreshDiagnosis() {
    if (!currentAuthenticatedPatient) {
        showNotification('No patient data to refresh', 'error');
        return;
    }
    
    // Generate new diagnosis data
    const newDiagnosis = generateMedicalDiagnosis(currentAuthenticatedPatient);
    currentAuthenticatedPatient.diagnosis = newDiagnosis;
    
    // Update localStorage
    localStorage.setItem(`patient_data_${currentAuthenticatedPatient.abha_id}`, JSON.stringify(currentAuthenticatedPatient));
    
    // Refresh display
    populateDiagnosisData();
    
    showNotification('Diagnosis data refreshed', 'success');
}

// Refresh data
function refreshData() {
    showNotification('Refreshing data...', 'success');
    loadPatientsData();
}

// Clear localStorage
function clearStorage() {
    if (confirm('Are you sure you want to clear all stored patient tokens?')) {
        // Clear all patient-related localStorage items
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('patient_token_') || key.startsWith('patient_data_')) {
                localStorage.removeItem(key);
            }
        });
        
        showNotification('All stored tokens cleared', 'success');
    }
}

// Render empty state
function renderEmptyState() {
    const grid = document.getElementById('patientsGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No Patients Found</h3>
            <p>Unable to load patient data. Please check the CSV file.</p>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize event listeners
function initializeEventListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const authModal = document.getElementById('authModal');
        const successModal = document.getElementById('successModal');
        
        if (event.target === authModal) {
            closeAuthModal();
        }
        
        if (event.target === successModal) {
            closeSuccessModal();
        }
    });
    
    // Handle Enter key in ABHA ID input
    document.getElementById('abhaId').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('authForm').dispatchEvent(new Event('submit'));
        }
    });
}

// Utility function to get stored token for a patient
function getStoredToken(abhaId) {
    return localStorage.getItem(`patient_token_${abhaId}`);
}

// Utility function to get stored patient data
function getStoredPatientData(abhaId) {
    const data = localStorage.getItem(`patient_data_${abhaId}`);
    return data ? JSON.parse(data) : null;
}

// Utility function to check if patient is authenticated
function isPatientAuthenticated(abhaId) {
    return localStorage.getItem(`patient_token_${abhaId}`) !== null;
}

// Export functions for external use (e.g., by extensions)
window.HospitalDashboard = {
    getStoredToken,
    getStoredPatientData,
    isPatientAuthenticated,
    getAllStoredTokens: function() {
        const tokens = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('patient_token_')) {
                const abhaId = key.replace('patient_token_', '');
                tokens[abhaId] = localStorage.getItem(key);
            }
        });
        return tokens;
    },
    getAllStoredPatientData: function() {
        const patients = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('patient_data_')) {
                const abhaId = key.replace('patient_data_', '');
                patients[abhaId] = JSON.parse(localStorage.getItem(key));
            }
        });
        return patients;
    },
    // Additional methods for extensions
    getPatientCount: function() {
        const patients = this.getAllStoredPatientData();
        return Object.keys(patients).length;
    },
    getPatientByToken: function(token) {
        const allPatients = this.getAllStoredPatientData();
        for (const [abhaId, patient] of Object.entries(allPatients)) {
            if (patient.generated_token === token) {
                return patient;
            }
        }
        return null;
    },
    validateToken: function(token) {
        const patient = this.getPatientByToken(token);
        return patient !== null;
    },
    getDiagnosisData: function(abhaId) {
        const patient = this.getStoredPatientData(abhaId);
        return patient ? patient.diagnosis : null;
    },
    exportPatientCSV: function(abhaId = null) {
        if (abhaId) {
            const patient = this.getStoredPatientData(abhaId);
            if (!patient) return null;
            return this.createPatientCSV(patient);
        } else {
            const allPatients = this.getAllStoredPatientData();
            return this.createAllPatientsCSV(Object.values(allPatients));
        }
    },
    createPatientCSV: function(patient) {
        const diagnosis = patient.diagnosis || {};
        const csvRows = [
            'Field,Value,Unit,Status',
            `ABHA ID,${patient.abha_id},,`,
            `Name,${patient.name},,`,
            `Date of Birth,${patient.date_of_birth},,`,
            `Gender,${patient.gender === 'M' ? 'Male' : 'Female'},,`,
            `Mobile Number,${patient.mobile_number},,`,
            `Authenticated At,${patient.authenticated_at},,`,
            `Token,${patient.generated_token},,`,
            ...Object.keys(diagnosis).map(key => {
                const item = diagnosis[key];
                return `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())},${item.value},${item.unit},${item.status}`;
            })
        ];
        return csvRows.join('\n');
    },
    createAllPatientsCSV: function(patients) {
        const csvRows = [
            'ABHA ID,Name,Date of Birth,Gender,Mobile,Authenticated At,Token,Heart Rate,Blood Pressure,SpO2,Temperature,Respiratory Rate,Blood Sugar,BMI,Height,Weight'
        ];
        
        patients.forEach(patient => {
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
        
        return csvRows.join('\n');
    },
    // Event system for extensions
    onPatientAuthenticated: function(callback) {
        if (!window.HospitalDashboard._eventListeners) {
            window.HospitalDashboard._eventListeners = {};
        }
        if (!window.HospitalDashboard._eventListeners.patientAuthenticated) {
            window.HospitalDashboard._eventListeners.patientAuthenticated = [];
        }
        window.HospitalDashboard._eventListeners.patientAuthenticated.push(callback);
    },
    triggerPatientAuthenticated: function(patient) {
        if (window.HospitalDashboard._eventListeners && window.HospitalDashboard._eventListeners.patientAuthenticated) {
            window.HospitalDashboard._eventListeners.patientAuthenticated.forEach(callback => {
                try {
                    callback(patient);
                } catch (error) {
                    console.error('Error in patient authenticated callback:', error);
                }
            });
        }
    }
};
