# Hospital Dashboard

A modern, responsive hospital dashboard that displays patient information from a CSV dataset with ABHA ID authentication and token storage functionality.

## Features

- **Patient Grid Display**: Shows patient details in an attractive card-based layout
- **ABHA ID Authentication**: Secure authentication using ABHA ID verification
- **Token Storage**: Stores generated tokens in localStorage for external access
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Extension Ready**: Provides API for browser extensions to access stored tokens

## Files Structure

```
Hospital Dashboard/
├── index.html          # Main dashboard page
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality and API
├── abha_id_dataset.csv # Patient data (CSV format)
├── test.html           # Test page for functionality verification
└── README.md           # This documentation
```

## How to Use

1. **Open the Dashboard**: Open `index.html` in a web browser
2. **View Patients**: Browse through the patient cards displayed in the grid
3. **Authenticate Patient**: Click on any patient card to open the authentication modal
4. **Enter ABHA ID**: Enter the correct ABHA ID for the selected patient
5. **Access Token**: Once authenticated, the token is stored in localStorage

## Patient Data Display

The dashboard displays the following patient information (excluding `generated_token` and `abha_id` from the main view):
- Patient Name
- Date of Birth
- Gender
- Mobile Number
- ABHA ID (shown in card details)

## Authentication Process

1. Click on any patient card
2. A modal will open showing the patient's details
3. Enter the correct ABHA ID in the input field
4. Click "Authenticate" to verify
5. Upon successful authentication, the token is stored in localStorage

## Token Storage

Tokens are stored in localStorage with the following keys:
- `patient_token_{ABHA_ID}`: Contains the generated token
- `patient_data_{ABHA_ID}`: Contains complete patient data with authentication timestamp

## API for Extensions

The dashboard provides a global `HospitalDashboard` object with the following methods:

```javascript
// Get stored token for a specific patient
HospitalDashboard.getStoredToken(abhaId)

// Get stored patient data
HospitalDashboard.getStoredPatientData(abhaId)

// Check if patient is authenticated
HospitalDashboard.isPatientAuthenticated(abhaId)

// Get all stored tokens
HospitalDashboard.getAllStoredTokens()

// Get all stored patient data
HospitalDashboard.getAllStoredPatientData()
```

## Testing

Use `test.html` to verify:
- localStorage functionality
- Dashboard API availability
- Token storage and retrieval
- Data persistence

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Notes

- Tokens are stored in localStorage (client-side)
- No server-side validation is implemented
- For production use, implement proper server-side authentication
- Consider using sessionStorage for more secure token storage

## Customization

### Styling
Modify `styles.css` to customize:
- Color scheme
- Layout spacing
- Card designs
- Modal appearance

### Functionality
Modify `script.js` to add:
- Additional validation
- New authentication methods
- Enhanced security features
- Custom API endpoints

## Requirements

- Modern web browser with JavaScript enabled
- Local web server (for CSV file loading) or serve files via HTTP/HTTPS
- No additional dependencies required

## Installation

1. Download all files to a directory
2. Serve the files using a local web server (e.g., Python's http.server, Node.js http-server, or any web server)
3. Open `index.html` in your browser

## Example Usage

```javascript
// Check if a patient is authenticated
if (HospitalDashboard.isPatientAuthenticated('ABHA1234567890')) {
    const token = HospitalDashboard.getStoredToken('ABHA1234567890');
    console.log('Patient token:', token);
}

// Get all authenticated patients
const allTokens = HospitalDashboard.getAllStoredTokens();
console.log('All stored tokens:', allTokens);
```

## Troubleshooting

- **CSV not loading**: Ensure files are served via HTTP/HTTPS, not opened directly
- **localStorage not working**: Check browser settings and privacy mode
- **Authentication failing**: Verify ABHA ID matches exactly (case-sensitive)
- **Styling issues**: Check browser compatibility and CSS support

## License

This project is open source and available under the MIT License.
