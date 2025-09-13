# API-VEDA Extension

A browser extension for accessing authenticated patient data from the Hospital Dashboard.

## Features

- **Real-time Patient Data Access**: View authenticated patient information
- **Medical Diagnosis Display**: Heart rate, blood pressure, SpO2, and more
- **Token Management**: Access and validate authentication tokens
- **CSV Export**: Export patient data to CSV format
- **Data Management**: Clear stored patient data

## Installation

1. **Download Extension Files**
   - Copy the entire `extension-example` folder
   - Rename it to `api-veda-extension`

2. **Load in Browser**
   - Open Chrome/Edge
   - Go to `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

3. **Verify Installation**
   - Extension icon should appear in browser toolbar
   - Icon shows "API-VEDA" on hover

## Usage

### Prerequisites
- Hospital Dashboard must be open (`index.html`)
- At least one patient must be authenticated

### Using the Extension

1. **Open Hospital Dashboard**
   - Open `index.html` in your browser
   - Authenticate a patient by clicking their card and entering ABHA ID

2. **Access Extension**
   - Click the API-VEDA extension icon in browser toolbar
   - Extension popup will open

3. **View Patient Data**
   - Click "Refresh Patient Data" to load current data
   - View patient information and medical diagnosis
   - Export data using "Export All Data" button

### Available Actions

- **🔄 Refresh Patient Data**: Load latest patient information
- **📊 Export All Data**: Download patient data as CSV
- **🗑️ Clear All Data**: Remove all stored patient data

## Data Access

The extension provides access to:

### Patient Information
- Name, ABHA ID, Date of Birth
- Gender, Mobile Number
- Authentication timestamp

### Medical Diagnosis
- Heart Rate (BPM)
- Blood Pressure (mmHg)
- SpO2 (Oxygen Saturation %)
- Temperature (°C)
- Respiratory Rate (/min)
- Blood Sugar (mg/dL)
- BMI (kg/m²)
- Height (cm), Weight (kg)

### Status Indicators
- **Normal** (Green): Values within healthy ranges
- **Warning** (Yellow): Values slightly outside normal
- **Critical** (Red): Values significantly outside normal

## Technical Details

### Permissions
- `activeTab`: Access current tab
- `scripting`: Inject scripts into dashboard
- `storage`: Store extension data

### Host Permissions
- `file:///*`: Access local files
- `http://localhost:8000/*`: Access local server
- `https://your-hospital-dashboard.com/*`: Access production server

### API Integration
The extension uses the Hospital Dashboard's global API:
```javascript
window.HospitalDashboard.getAllStoredPatientData()
window.HospitalDashboard.getStoredToken(abhaId)
window.HospitalDashboard.isPatientAuthenticated(abhaId)
```

## File Structure

```
extension-example/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── content.js            # Content script for dashboard interaction
├── background.js         # Background service worker
└── README.md            # This documentation
```

## Security

- **Token Validation**: All tokens are validated before use
- **Permission Management**: Minimal required permissions
- **Data Encryption**: Sensitive data handled securely
- **Error Handling**: Comprehensive error management

## Troubleshooting

### Extension Not Working
1. Ensure Hospital Dashboard is open
2. Verify patient authentication
3. Check extension permissions
4. Reload extension if needed

### No Patient Data
1. Authenticate a patient in the dashboard
2. Click "Refresh Patient Data"
3. Check browser console for errors

### Export Issues
1. Ensure patient data is loaded
2. Check browser download permissions
3. Verify CSV generation

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify extension permissions
3. Ensure dashboard is properly loaded
4. Test with a fresh browser session

## Version

- **Version**: 1.0.0
- **Manifest**: V3
- **Compatibility**: Chrome 88+, Edge 88+

---

**API-VEDA Extension** - Secure access to authenticated patient data
