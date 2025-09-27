// Login page JavaScript
console.log('=== LOGIN PAGE INITIALIZATION ===');

// API Configuration
const API_BASE_URL = 'https://neo-server.rozana.in/api';
const LOGIN_ENDPOINT = `${API_BASE_URL}/login`;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');

// Form fields
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Social login buttons
const facebookBtn = document.getElementById('facebookBtn');
const googleBtn = document.getElementById('googleBtn');

// Error message elements
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// Address modal elements
const addressModal = document.getElementById('addressModal');
const addressForm = document.getElementById('addressForm');
const closeAddressModal = document.getElementById('closeAddressModal');
const cancelAddress = document.getElementById('cancelAddress');
const addAddress = document.getElementById('addAddress');

// Geolocation elements
const getLocationBtn = document.getElementById('getLocationBtn');
const locationStatus = document.getElementById('locationStatus');
const mapPlaceholder = document.getElementById('mapPlaceholder');
const mapDisplay = document.getElementById('mapDisplay');
const mapIframe = document.getElementById('mapIframe');
const mapInfo = document.getElementById('mapInfo');

// Authentication elements
const logoutBtn = document.getElementById('logoutBtn');

// Initialize login page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== LOGIN PAGE INITIALIZATION ===');
    
    // Debug: Check if elements exist
    console.log('Login form:', loginForm);
    console.log('Login button:', loginBtn);
    console.log('Email input:', emailInput);
    console.log('Password input:', passwordInput);
    
    // Check if user is already authenticated
    checkAuthenticationStatus();
    
    setupEventListeners();
    initializeMap();
    
    console.log('=== LOGIN PAGE INITIALIZATION COMPLETE ===');
});

function checkAuthenticationStatus() {
    if (isUserAuthenticated()) {
        console.log('User is already authenticated');
        
        // Show logout button
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
        
        // Check if user has addresses
        const hasAddress = localStorage.getItem('hasAddress') === 'true';
        if (hasAddress) {
            console.log('User has addresses, redirecting to home');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            console.log('User needs to add address');
            // Show address modal after a short delay
            setTimeout(() => {
                showAddressModal();
            }, 1500);
        }
    } else {
        console.log('User not authenticated, showing login form');
        
        // Hide logout button
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

function handleLogout() {
    console.log('=== USER LOGOUT ===');
    
    // Clear all authentication data
    logout();
    
    // Show success message
    showNotification('Logged out successfully', 'success');
    
    // Hide logout button
    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
    
    // Reset form
    if (loginForm) {
        loginForm.reset();
    }
    
    // Clear any error messages
    clearAllErrors();
    
    console.log('User logged out successfully');
}

function setupEventListeners() {
    console.log('=== SETTING UP EVENT LISTENERS ===');
    
    // Form submission
    if (loginForm) {
        console.log('Adding submit event listener to login form');
        loginForm.addEventListener('submit', handleLogin);
        
        // Also add click listener to button as backup
        if (loginBtn) {
            console.log('Adding click event listener to login button');
            loginBtn.addEventListener('click', function(e) {
                console.log('Login button clicked');
                e.preventDefault();
                handleLogin(e);
            });
        }
    } else {
        console.error('Login form not found!');
    }
    
    // Social login buttons
    if (facebookBtn) {
        facebookBtn.addEventListener('click', handleFacebookLogin);
    }
    
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Real-time validation
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearError);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
        passwordInput.addEventListener('input', clearError);
    }
    
    // Address modal event listeners
    if (closeAddressModal) {
        closeAddressModal.addEventListener('click', hideAddressModal);
    }
    
    if (cancelAddress) {
        cancelAddress.addEventListener('click', hideAddressModal);
    }
    
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressSubmission);
    }
    
    // Geolocation button
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Close modal when clicking outside
    if (addressModal) {
        addressModal.addEventListener('click', function(e) {
            if (e.target === addressModal) {
                hideAddressModal();
            }
        });
    }
}

function clearError(event) {
    const fieldName = event.target.name;
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
        element.textContent = '';
    });
}

function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showFieldError('emailError', 'Email is required');
        return false;
    }
    if (!emailRegex.test(email)) {
        showFieldError('emailError', 'Please enter a valid email address');
        return false;
    }
    clearFieldError('emailError');
    return true;
}

function validatePassword() {
    const password = passwordInput.value;
    if (!password) {
        showFieldError('passwordError', 'Password is required');
        return false;
    }
    if (password.length < 6) {
        showFieldError('passwordError', 'Password must be at least 6 characters long');
        return false;
    }
    clearFieldError('passwordError');
    return true;
}

function showFieldError(errorElementId, message) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearFieldError(errorElementId) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    console.log('=== LOGIN FORM SUBMISSION ===');
    console.log('Event:', event);
    console.log('Form data:', {
        email: emailInput?.value,
        password: passwordInput?.value
    });
    
    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    // If any validation fails, stop here
    if (!isEmailValid || !isPasswordValid) {
        showNotification('Please fix the errors above', 'error');
        return;
    }
    
    // Test login for debugging (remove this in production)
    if (emailInput.value.trim() === 'test@test.com' && passwordInput.value === 'test123') {
        console.log('Test login detected, simulating successful login');
        simulateTestLogin();
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';
    
    try {
        // Prepare login data according to API specification
        const loginData = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };
        
        console.log('Login data:', loginData);
        console.log('API endpoint:', LOGIN_ENDPOINT);
        
        // Test API connectivity first
        console.log('Testing API connectivity...');
        
        // Make API call to the actual login endpoint
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        console.log('API call completed, response received');
        
        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', response.headers);
        
        // Parse the response
        const responseData = await response.json();
        console.log('API Response Data:', responseData);
        
        if (response.ok) {
            // Login successful
            showNotification('Login successful!', 'success');
            console.log('Login successful:', responseData);
            
            // Store user data and authentication state
            if (responseData.user) {
                localStorage.setItem('user', JSON.stringify(responseData.user));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userId', responseData.user.id || responseData.user.user_id || '1');
            }
            
            if (responseData.token) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('authToken', responseData.token); // Backup token storage
            }
            
            // Store login timestamp
            localStorage.setItem('loginTime', new Date().toISOString());
            
            // Store user session data
            const userSession = {
                isAuthenticated: true,
                userId: responseData.user?.id || responseData.user?.user_id || '1',
                token: responseData.token,
                loginTime: new Date().toISOString(),
                userData: responseData.user
            };
            localStorage.setItem('userSession', JSON.stringify(userSession));
            
            console.log('User session stored:', userSession);
            
            // Always redirect to index page after successful login
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            // Login failed
            const errorMessage = responseData.message || responseData.error || 'Login failed. Please check your credentials.';
            showNotification(errorMessage, 'error');
            console.error('Login failed:', responseData);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle different types of errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('Network error. Please check your internet connection.', 'error');
        } else {
            showNotification('Login failed. Please try again.', 'error');
        }
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
}

function handleFacebookLogin() {
    console.log('Facebook login clicked');
    showNotification('Facebook login feature coming soon!', 'info');
}

function handleGoogleLogin() {
    console.log('Google login clicked');
    showNotification('Google login feature coming soon!', 'info');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    
    // Set background color based on type
    let backgroundColor = '#10b981'; // success
    if (type === 'error') backgroundColor = '#ef4444';
    if (type === 'warning') backgroundColor = '#f59e0b';
    if (type === 'info') backgroundColor = '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Map Initialization
function initializeMap() {
    console.log('=== INITIALIZING MAP ===');
    
    // Default location (Delhi, India) - you can change this to any default location
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    
    // Check if we have stored coordinates
    const storedCoords = localStorage.getItem('userCoordinates');
    if (storedCoords) {
        try {
            const coords = JSON.parse(storedCoords);
            loadMapWithLocation(coords.lat, coords.lng, 'Stored Location');
        } catch (error) {
            console.error('Error loading stored coordinates:', error);
            loadMapWithLocation(defaultLat, defaultLng, 'Default Location');
        }
    } else {
        loadMapWithLocation(defaultLat, defaultLng, 'Default Location');
    }
}

function loadMapWithLocation(lat, lng, locationName) {
    console.log('=== LOADING MAP WITH LOCATION ===', { lat, lng, locationName });
    
    // Create OpenStreetMap embed URL
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    
    if (mapIframe) {
        mapIframe.src = mapUrl;
    }
    
    if (mapInfo) {
        mapInfo.innerHTML = `
            <strong>🗺️ ${locationName}</strong><br>
            <strong>🌍 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
            <small>Click "Use My Current Location" to auto-fill address</small>
        `;
    }
}

// Address Modal Functions
function showAddressModal() {
    if (addressModal) {
        addressModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Check if we have stored coordinates and show map
        const storedCoords = localStorage.getItem('userCoordinates');
        if (storedCoords) {
            try {
                const coords = JSON.parse(storedCoords);
                const addressData = localStorage.getItem('userAddressData');
                if (addressData) {
                    const address = JSON.parse(addressData);
                    updateMapDisplay(coords.lat, coords.lng, address.display_name || 'Stored Location');
                }
            } catch (error) {
                console.error('Error loading stored coordinates:', error);
            }
        }
        
        // Try to get current location automatically
        setTimeout(() => {
            if (navigator.geolocation) {
                console.log('Auto-detecting location...');
                getCurrentLocation();
            }
        }, 1000);
        
        // Check if user already has addresses
        checkExistingAddresses();
    }
}

function hideAddressModal() {
    if (addressModal) {
        addressModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset map display
        resetMapDisplay();
    }
}

function resetMapDisplay() {
    // Reset to default map view
    initializeMap();
    
    // Reset location status
    if (locationStatus) {
        locationStatus.textContent = '';
        locationStatus.className = 'location-status';
    }
}

function handleAddressSubmission(event) {
    event.preventDefault();
    
    console.log('=== ADDRESS FORM SUBMISSION ===');
    
    // Get form data
    const formData = new FormData(addressForm);
    const addressData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phoneNumber: formData.get('phoneNumber'),
        street: formData.get('street'),
        building: formData.get('building'),
        city: formData.get('city'),
        pinCode: formData.get('pinCode'),
        state: formData.get('state'),
        tag: formData.get('addressTag')
    };
    
    console.log('Address data:', addressData);
    
    // Validate required fields
    if (!validateAddressForm(addressData)) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    addAddress.disabled = true;
    addAddress.textContent = 'Adding Address...';
    
    // Get coordinates from localStorage or use default
    let coordinates = { lat: 28.6139, lng: 77.2090 }; // Default Delhi coordinates
    const storedCoords = localStorage.getItem('userCoordinates');
    if (storedCoords) {
        try {
            coordinates = JSON.parse(storedCoords);
        } catch (error) {
            console.error('Error parsing stored coordinates:', error);
        }
    }
    
    // Check if user is authenticated
    if (!isUserAuthenticated()) {
        showNotification('Please login first to add address', 'error');
        return;
    }
    
    // Get user ID using helper function
    const userId = getUserId();
    
    // Prepare API payload according to the provided format
    const apiPayload = {
        user_id: userId,
        Name: addressData.fullName,
        Email: addressData.email,
        PhoneNumber: addressData.phoneNumber,
        Street: addressData.street,
        Building: addressData.building,
        PinCode: addressData.pinCode,
        City: addressData.city,
        State: addressData.state,
        Latitude: coordinates.lat.toString(),
        Longitude: coordinates.lng.toString(),
        Tag: addressData.tag || 'Home'
    };
    
    console.log('API Payload:', apiPayload);
    
    // Make API call to store address
    submitAddressToAPI(apiPayload);
}

async function submitAddressToAPI(payload) {
    const API_BASE_URL = 'https://neo-server.rozana.in/api';
    const ADDRESS_ENDPOINT = `${API_BASE_URL}/addresses`;
    
    try {
        console.log('Submitting address to API:', ADDRESS_ENDPOINT);
        
        // Check if user is authenticated
        if (!isUserAuthenticated()) {
            showNotification('Authentication required. Please login again.', 'error');
            return;
        }
        
        // Get authentication headers
        const headers = getAuthHeaders();
        
        const response = await fetch(ADDRESS_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        console.log('API Response Status:', response.status);
        
        const responseData = await response.json();
        console.log('API Response Data:', responseData);
        
        if (response.ok) {
            // Address stored successfully
            showNotification('Address added successfully!', 'success');
            console.log('Address stored successfully:', responseData);
            
            // Store address in localStorage for local use
            localStorage.setItem('userAddress', JSON.stringify(payload));
            localStorage.setItem('hasAddress', 'true');
            
            // Hide modal and redirect to home page
            hideAddressModal();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            // API error
            const errorMessage = responseData.message || responseData.error || 'Failed to add address. Please try again.';
            showNotification(errorMessage, 'error');
            console.error('Address storage failed:', responseData);
        }
        
    } catch (error) {
        console.error('Address submission error:', error);
        
        // Handle different types of errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('Network error. Please check your internet connection.', 'error');
        } else {
            showNotification('Failed to add address. Please try again.', 'error');
        }
    } finally {
        // Reset button state
        addAddress.disabled = false;
        addAddress.textContent = 'Add Address';
    }
}

function validateAddressForm(data) {
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'street', 'building', 'city', 'pinCode', 'state'];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showFieldError(field + 'Error', `${field} is required`);
            return false;
        }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showFieldError('emailError', 'Please enter a valid email address');
        return false;
    }
    
    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.phoneNumber.replace(/\D/g, ''))) {
        showFieldError('phoneNumberError', 'Please enter a valid 10-digit phone number');
        return false;
    }
    
    // Validate pin code
    const pinCodeRegex = /^[0-9]{6}$/;
    if (!pinCodeRegex.test(data.pinCode)) {
        showFieldError('pinCodeError', 'Please enter a valid 6-digit pin code');
        return false;
    }
    
    return true;
}

// Test login function for debugging
function simulateTestLogin() {
    console.log('=== SIMULATING TEST LOGIN ===');
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';
    
    // Simulate API delay
    setTimeout(() => {
        // Simulate successful login response
        const mockUserData = {
            id: 1,
            name: 'Test User',
            email: 'test@test.com'
        };
        
        const mockToken = 'test_token_12345';
        
        // Store user data and authentication state
        localStorage.setItem('user', JSON.stringify(mockUserData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', '1');
        localStorage.setItem('token', mockToken);
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('loginTime', new Date().toISOString());
        
        // Store user session data
        const userSession = {
            isAuthenticated: true,
            userId: 1,
            token: mockToken,
            loginTime: new Date().toISOString(),
            userData: mockUserData
        };
        localStorage.setItem('userSession', JSON.stringify(userSession));
        
        console.log('Test login successful:', userSession);
        
        // Show success message
        showNotification('Test login successful!', 'success');
        
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
        
        // Redirect to index page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    }, 1500);
}

// Authentication Helper Functions
function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

function getUserId() {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        try {
            const session = JSON.parse(userSession);
            return session.userId || session.userData?.id || session.userData?.user_id || '1';
        } catch (error) {
            console.error('Error parsing user session:', error);
        }
    }
    
    // Fallback to individual storage
    return localStorage.getItem('userId') || '1';
}

function isUserAuthenticated() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userSession = localStorage.getItem('userSession');
    
    if (isLoggedIn && token && userSession) {
        try {
            const session = JSON.parse(userSession);
            return session.isAuthenticated && session.token;
        } catch (error) {
            console.error('Error parsing user session:', error);
        }
    }
    
    return false;
}

function logout() {
    // Clear all authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('userSession');
    localStorage.removeItem('hasAddress');
    localStorage.removeItem('userAddress');
    localStorage.removeItem('userCoordinates');
    localStorage.removeItem('userAddressData');
    
    console.log('User logged out successfully');
}

// Address Management Functions
async function checkExistingAddresses() {
    const API_BASE_URL = 'https://neo-server.rozana.in/api';
    const ADDRESS_ENDPOINT = `${API_BASE_URL}/addresses`;
    
    try {
        // Check if user is authenticated
        if (!isUserAuthenticated()) {
            console.log('User not authenticated, skipping address check');
            return;
        }
        
        // Get user ID using helper function
        const userId = getUserId();
        
        // Get authentication headers
        const headers = getAuthHeaders();
        
        console.log('Checking existing addresses for user:', userId);
        
        const response = await fetch(`${ADDRESS_ENDPOINT}?user_id=${userId}`, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const addresses = await response.json();
            console.log('Existing addresses:', addresses);
            
            if (addresses && addresses.length > 0) {
                // User already has addresses, skip the modal
                console.log('User already has addresses, skipping modal');
                localStorage.setItem('hasAddress', 'true');
                hideAddressModal();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        } else {
            console.log('No existing addresses found or API error');
        }
        
    } catch (error) {
        console.error('Error checking existing addresses:', error);
        // Continue with address modal if check fails
    }
}

// Geolocation Functions
function getCurrentLocation() {
    console.log('=== GETTING CURRENT LOCATION ===');
    
    if (!navigator.geolocation) {
        showLocationError('Geolocation is not supported by this browser.');
        return;
    }
    
    // Show loading state
    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
    updateLocationStatus('Getting your location...', 'loading');
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('Location obtained:', position);
            const { latitude, longitude } = position.coords;
            reverseGeocode(latitude, longitude);
        },
        function(error) {
            console.error('Geolocation error:', error);
            handleGeolocationError(error);
        },
        options
    );
}

function reverseGeocode(lat, lng) {
    console.log('=== REVERSE GEOCODING ===', { lat, lng });
    
    updateLocationStatus('Getting address details...', 'loading');
    
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'ONDC-Buyer-App/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Reverse geocoding result:', data);
        if (data && data.address) {
            fillAddressForm(data.address, lat, lng);
            updateLocationStatus('Location found!', 'success');
            updateMapDisplay(lat, lng, data.display_name);
        } else {
            showLocationError('Could not get address details for this location.');
        }
    })
    .catch(error => {
        console.error('Reverse geocoding error:', error);
        showLocationError('Failed to get address details. Please try again.');
    })
    .finally(() => {
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use My Current Location';
    });
}

function fillAddressForm(address, lat, lng) {
    console.log('=== FILLING ADDRESS FORM ===', address);
    
    // Fill form fields based on geocoded address
    const street = document.getElementById('street');
    const building = document.getElementById('building');
    const city = document.getElementById('city');
    const pinCode = document.getElementById('pinCode');
    const state = document.getElementById('state');
    
    // Street address with multiple fallbacks
    if (street) {
        const streetValue = address.road || 
                          address.street || 
                          address.pedestrian || 
                          address.footway || 
                          address.path || 
                          address.cycleway || '';
        street.value = streetValue;
    }
    
    // Building with multiple fallbacks
    if (building) {
        const buildingValue = address.house_number || 
                            address.building || 
                            address.house_name || 
                            address.amenity || '';
        building.value = buildingValue;
    }
    
    // City with multiple fallbacks
    if (city) {
        const cityValue = address.city || 
                         address.town || 
                         address.village || 
                         address.county || 
                         address.municipality || 
                         address.locality || '';
        city.value = cityValue;
    }
    
    // Pin code
    if (pinCode) {
        pinCode.value = address.postcode || '';
    }
    
    // State with enhanced fallbacks
    if (state) {
        let stateValue = address.state || 
                        address.region || 
                        address.province || 
                        address.administrative || 
                        address.state_district || '';
        
        // If state is still empty, try to get it from display_name
        if (!stateValue && address.display_name) {
            const displayParts = address.display_name.split(', ');
            for (let part of displayParts) {
                // Look for state-like patterns
                if (part.includes('State') || part.includes('Province') || part.includes('Region') || 
                    part.includes('Territory') || part.includes('Union Territory')) {
                    stateValue = part.replace(/State|Province|Region|Territory|Union Territory/gi, '').trim();
                    break;
                }
            }
        }
        
        // Additional fallback: try to extract from country/state combinations
        if (!stateValue && address.country) {
            const countryStateMap = {
                'India': ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Uttarakhand', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim', 'Arunachal Pradesh', 'Goa', 'Chhattisgarh', 'Jharkhand'],
                'United States': ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
                'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
                'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island', 'Northwest Territories', 'Yukon', 'Nunavut']
            };
            
            if (countryStateMap[address.country]) {
                for (let stateName of countryStateMap[address.country]) {
                    if (address.display_name && address.display_name.includes(stateName)) {
                        stateValue = stateName;
                        break;
                    }
                }
            }
        }
        
        state.value = stateValue;
        console.log('State field filled with:', stateValue);
    }
    
    // Store coordinates and address data for future use
    localStorage.setItem('userCoordinates', JSON.stringify({ lat, lng }));
    localStorage.setItem('userAddressData', JSON.stringify(address));
    
    showNotification('Address auto-filled from your location!', 'success');
}

function updateMapDisplay(lat, lng, displayName) {
    // Hide placeholder and show map
    if (mapPlaceholder) {
        mapPlaceholder.style.display = 'none';
    }
    
    if (mapDisplay) {
        mapDisplay.style.display = 'block';
    }
    
    // Create OpenStreetMap embed URL
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    
    if (mapIframe) {
        mapIframe.src = mapUrl;
    }
    
    if (mapInfo) {
        mapInfo.innerHTML = `
            <strong>📍 Location Found:</strong> ${displayName}<br>
            <strong>🌍 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
            <strong>🗺️ Map:</strong> Interactive OpenStreetMap view
        `;
    }
}

function updateLocationStatus(message, type = '') {
    if (locationStatus) {
        locationStatus.textContent = message;
        locationStatus.className = `location-status ${type}`;
        
        if (type === 'loading') {
            locationStatus.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        } else if (type === 'success') {
            locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        } else if (type === 'error') {
            locationStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
    }
}

function showLocationError(message) {
    updateLocationStatus(message, 'error');
    showNotification(message, 'error');
    
    getLocationBtn.disabled = false;
    getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use My Current Location';
}

function handleGeolocationError(error) {
    let message = 'Unable to get your location. ';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += 'Please allow location access and try again.';
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
        default:
            message += 'An unknown error occurred.';
            break;
    }
    
    showLocationError(message);
}
