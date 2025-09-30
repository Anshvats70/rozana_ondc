// Address Modal JavaScript for Index Page

// DOM Elements
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

// Location search elements
const pincodeSearch = document.getElementById('pincodeSearch');
const searchLocationBtn = document.getElementById('searchLocationBtn');
const searchResults = document.getElementById('searchResults');
const selectedLocationText = document.getElementById('selectedLocationText');
const confirmLocationBtn = document.getElementById('confirmLocationBtn');
const cancelLocationBtn = document.getElementById('cancelLocationBtn');

// Map interface elements
const mapSearchIcon = document.getElementById('mapSearchIcon');
const mapSearchInput = document.getElementById('mapSearchInput');
const mapPincodeSearch = document.getElementById('mapPincodeSearch');
const mapSearchBtn = document.getElementById('mapSearchBtn');
const closeMapSearch = document.getElementById('closeMapSearch');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const recenterBtn = document.getElementById('recenterBtn');
const mapTypeBtn = document.getElementById('mapTypeBtn');

// Google Maps variables
let map;
let marker;
let selectedLocation = null;

// Initialize address modal
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ADDRESS MODAL INITIALIZATION ===');
    
    setupAddressModalEventListeners();
    initializeMap();
    
    // Automatically load map with default pincode 110011
    setTimeout(() => {
        const locationSearchSection = document.querySelector('.location-search-section');
        if (locationSearchSection) {
            locationSearchSection.style.display = 'block';
            console.log('Location search section initialized');
        }
        
        // Auto-load map with default pincode
        loadMapWithDefaultPincode();
    }, 100);
});

function setupAddressModalEventListeners() {
    // Close modal buttons
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

    // Location confirmation event listeners
    if (confirmLocationBtn) {
        confirmLocationBtn.addEventListener('click', confirmLocationSelection);
    }

    if (cancelLocationBtn) {
        cancelLocationBtn.addEventListener('click', cancelLocationSelection);
    }

    // Map interface event listeners
    if (mapSearchIcon) {
        mapSearchIcon.addEventListener('click', toggleMapSearch);
    }

    if (mapSearchBtn) {
        mapSearchBtn.addEventListener('click', searchMapLocation);
    }

    if (closeMapSearch) {
        closeMapSearch.addEventListener('click', hideMapSearch);
    }

    if (mapPincodeSearch) {
        mapPincodeSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMapLocation();
            }
        });
    }

    // Map controls
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', zoomInMap);
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', zoomOutMap);
    }

    if (recenterBtn) {
        recenterBtn.addEventListener('click', recenterMap);
    }

    if (mapTypeBtn) {
        mapTypeBtn.addEventListener('click', toggleMapType);
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

// Address Modal Functions
function showAddressModal() {
    console.log('=== ADDRESS-MODAL.JS SHOW ADDRESS MODAL CALLED ===');
    
    // Don't show address modal on login page
    const currentPath = window.location.pathname || window.location.href;
    const isLoginPage = currentPath.includes('login.html') || 
                       currentPath.includes('/login') || 
                       window.location.href.includes('login.html');
    
    if (isLoginPage) {
        console.log('🚫 On login page, preventing address modal from showing. Path:', currentPath);
        return;
    }
    
    // Check if user already has addresses
    const hasAddressFlag = localStorage.getItem('hasAddress') === 'true';
    const storedAddress = localStorage.getItem('userAddress');
    const userCoordinates = localStorage.getItem('userCoordinates');
    
    const hasAddress = hasAddressFlag || 
                      (storedAddress && storedAddress !== 'null' && storedAddress !== 'undefined' && storedAddress.trim() !== '') ||
                      (userCoordinates && userCoordinates !== 'null' && userCoordinates !== 'undefined');
    
    console.log('Address check in address-modal.js:', {
        hasAddressFlag,
        storedAddress: storedAddress ? 'EXISTS' : 'MISSING',
        userCoordinates: userCoordinates ? 'EXISTS' : 'MISSING',
        hasAddress
    });
    
    if (hasAddress) {
        console.log('🚫 User already has addresses, preventing modal from showing');
        return;
    }
    
    if (addressModal) {
        console.log('✅ Showing address modal from address-modal.js');
        addressModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Automatically load map with default pincode 110011
        showPincodeSearchInterface();
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

function showPincodeSearchInterface() {
    console.log('=== SHOWING DEFAULT MAP WITH PINCODE 110011 ===');
    
    // Hide the current location button
    if (getLocationBtn) {
        getLocationBtn.style.display = 'none';
    }
    
    // Show location search section
    const locationSearchSection = document.querySelector('.location-search-section');
    if (locationSearchSection) {
        locationSearchSection.style.display = 'block';
        console.log('Location search section shown');
    }
    
    // Automatically load map with default pincode 110011
    loadMapWithDefaultPincode();
    
    // Update location status
    updateLocationStatus('Map loaded with default location (110011)', 'info');
}

function loadMapWithDefaultPincode() {
    console.log('=== LOADING MAP WITH DEFAULT PINCODE 110011 ===');
    
    // Default pincode 110011 (Delhi)
    const defaultPincode = '110011';
    
    // Force show search results section
    if (searchResults) {
        searchResults.style.display = 'block';
        searchResults.style.visibility = 'visible';
        searchResults.style.opacity = '1';
        console.log('Search results section forced visible');
    }
    
    // Initialize map with default location
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    
    // Try Google Maps first, fallback to OpenStreetMap
    if (typeof google !== 'undefined' && google.maps) {
        console.log('Using Google Maps for default location');
        initGoogleMapWithMarker(defaultLat, defaultLng);
    } else {
        console.log('Using OpenStreetMap for default location');
        initOpenStreetMapWithMarker(defaultLat, defaultLng);
    }
    
    // Update location info
    if (selectedLocationText) {
        selectedLocationText.textContent = 'Delhi, India (110011)';
    }
    
    // Store selected location
    selectedLocation = {
        lat: defaultLat,
        lng: defaultLng,
        address: null,
        formatted_address: 'Delhi, India (110011)'
    };
    
    // Enable confirm button
    if (confirmLocationBtn) {
        confirmLocationBtn.disabled = false;
    }
    
    console.log('Map loading completed');
}

function showDefaultPincodeMap() {
    console.log('=== SHOWING DEFAULT PINCODE MAP ===');
    
    // Hide placeholder and show map
    if (mapPlaceholder) {
        mapPlaceholder.style.display = 'none';
    }
    
    if (mapDisplay) {
        mapDisplay.style.display = 'block';
    }
    
    // Show default India map centered on Delhi
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    
    // Create OpenStreetMap embed URL for India view
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${defaultLng-2},${defaultLat-2},${defaultLng+2},${defaultLat+2}&layer=mapnik`;
    
    if (mapIframe) {
        mapIframe.src = mapUrl;
    }
    
    if (mapInfo) {
        mapInfo.innerHTML = `
            <strong>🗺️ India Map</strong><br>
            <strong>📍 Enter pincode above to find your location</strong><br>
            <small>Search by pincode to automatically fill address details</small>
        `;
    }
}

// Map Initialization
function initializeMap() {
    console.log('=== INITIALIZING MAP ===');
    
    // Default location (Delhi, India) - you can change this to any default location
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    
    // Always show default India map for pincode search
    loadMapWithLocation(defaultLat, defaultLng, 'India - Enter pincode to search');
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
            <small>Enter a pincode above to search and select your location</small>
        `;
    }
}

// Address Form Submission
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
            
            // Don't auto-hide modal, let user close it manually
            // hideAddressModal();
            
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

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-size: 0.875rem;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Google Maps initialization
function initGoogleMaps() {
    console.log('Google Maps initialized successfully');
}

// Handle Google Maps API errors
function handleGoogleMapsError() {
    console.error('Google Maps API failed to load');
    showNotification('Google Maps API not available. Please check your API key.', 'error');
    
    // Hide map-related functionality
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="map-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>Google Maps Not Available</h4>
                <p>Please configure a valid Google Maps API key to use location search.</p>
                <div class="error-actions">
                    <button type="button" class="btn-primary" onclick="window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank')">
                        Get API Key
                    </button>
                    <button type="button" class="btn-secondary" onclick="useManualAddress()">
                        Enter Address Manually
                    </button>
                </div>
            </div>
        `;
    }
}

// Fallback for manual address entry
function useManualAddress() {
    console.log('Using manual address entry');
    showNotification('Please fill the address form manually', 'info');
    
    // Hide search results and show form
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Location search by pincode
async function searchLocationByPincode() {
    const pincode = pincodeSearch.value.trim();
    
    if (!pincode) {
        showNotification('Please enter a pincode', 'error');
        return;
    }

    if (!/^\d{6}$/.test(pincode)) {
        showNotification('Please enter a valid 6-digit pincode', 'error');
        return;
    }

    console.log('Searching location for pincode:', pincode);

    // Show loading state
    searchLocationBtn.disabled = true;
    searchLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';

    try {
        // Try Google Maps first if available
        if (typeof google !== 'undefined' && google.maps) {
            console.log('Using Google Maps for geocoding');
            await searchWithGoogleMaps(pincode);
        } else {
            console.log('Google Maps not available, using OpenStreetMap Nominatim');
            await searchWithNominatim(pincode);
        }

    } catch (error) {
        console.error('Error searching location:', error);
        searchLocationBtn.disabled = false;
        searchLocationBtn.innerHTML = '<i class="fas fa-search"></i> Search';
        showNotification('Error searching location. Please try again.', 'error');
    }
}

// Google Maps geocoding function
async function searchWithGoogleMaps(pincode) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({
            address: pincode + ', India',
            region: 'IN'
        }, function(results, status) {
            searchLocationBtn.disabled = false;
            searchLocationBtn.innerHTML = '<i class="fas fa-search"></i> Search';

            if (status === 'OK' && results.length > 0) {
                const location = results[0];
                const lat = location.geometry.location.lat();
                const lng = location.geometry.location.lng();
                
                console.log('Google Maps location found:', location);
                
                // Show search results
                showSearchResults(lat, lng, location);
                resolve(location);
                
            } else {
                console.error('Google Maps geocoding failed:', status);
                // Fallback to Nominatim
                searchWithNominatim(pincode).then(resolve).catch(reject);
            }
        });
    });
}

// OpenStreetMap Nominatim geocoding function
async function searchWithNominatim(pincode) {
    try {
        console.log('Using OpenStreetMap Nominatim for geocoding');
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${pincode},India&limit=1&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ONDC-Buyer-App/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        
        searchLocationBtn.disabled = false;
        searchLocationBtn.innerHTML = '<i class="fas fa-search"></i> Search';
        
        if (results && results.length > 0) {
            const location = results[0];
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lon);
            
            console.log('Nominatim location found:', location);
            
            // Create a Google Maps-like result object for compatibility
            const googleMapsResult = {
                geometry: {
                    location: {
                        lat: () => lat,
                        lng: () => lng
                    }
                },
                formatted_address: location.display_name,
                address_components: parseNominatimAddress(location.address),
                place_id: location.place_id
            };
            
            // Show search results
            showSearchResults(lat, lng, googleMapsResult);
            
        } else {
            console.error('No results found for pincode:', pincode);
            showNotification('Location not found for this pincode', 'error');
        }
        
    } catch (error) {
        console.error('Nominatim geocoding error:', error);
        searchLocationBtn.disabled = false;
        searchLocationBtn.innerHTML = '<i class="fas fa-search"></i> Search';
        showNotification('Error searching location. Please try again.', 'error');
    }
}

// Parse Nominatim address into Google Maps format
function parseNominatimAddress(address) {
    const components = [];
    
    if (address.house_number) {
        components.push({
            long_name: address.house_number,
            short_name: address.house_number,
            types: ['street_number']
        });
    }
    
    if (address.road) {
        components.push({
            long_name: address.road,
            short_name: address.road,
            types: ['route']
        });
    }
    
    if (address.suburb || address.neighbourhood) {
        components.push({
            long_name: address.suburb || address.neighbourhood,
            short_name: address.suburb || address.neighbourhood,
            types: ['sublocality']
        });
    }
    
    if (address.city || address.town || address.village) {
        components.push({
            long_name: address.city || address.town || address.village,
            short_name: address.city || address.town || address.village,
            types: ['locality']
        });
    }
    
    if (address.postcode) {
        components.push({
            long_name: address.postcode,
            short_name: address.postcode,
            types: ['postal_code']
        });
    }
    
    if (address.state) {
        components.push({
            long_name: address.state,
            short_name: address.state,
            types: ['administrative_area_level_1']
        });
    }
    
    if (address.country) {
        components.push({
            long_name: address.country,
            short_name: address.country,
            types: ['country']
        });
    }
    
    return components;
}

function showSearchResults(lat, lng, location) {
    console.log('Showing search results for:', lat, lng);
    
    // Show search results section
    if (searchResults) {
        searchResults.style.display = 'block';
    }
    
    // Initialize Google Map with moveable marker
    initGoogleMapWithMarker(lat, lng);
    
    // Update location info
    if (selectedLocationText) {
        selectedLocationText.textContent = location.formatted_address || `${lat}, ${lng}`;
    }
    
    // Store selected location
    selectedLocation = {
        lat: lat,
        lng: lng,
        address: location,
        formatted_address: location.formatted_address
    };
    
    // Enable confirm button
    if (confirmLocationBtn) {
        confirmLocationBtn.disabled = false;
    }
}

function initGoogleMapWithMarker(lat, lng) {
    const mapElement = document.getElementById('googleMap');
    if (!mapElement) return;
    
    // Check if Google Maps is available
    if (typeof google === 'undefined' || !google.maps) {
        console.log('Google Maps not available, using OpenStreetMap with moveable marker');
        initOpenStreetMapWithMarker(lat, lng);
        return;
    }
    
    // Initialize map
    map = new google.maps.Map(mapElement, {
        center: { lat: lat, lng: lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Add draggable marker
    marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        draggable: true,
        title: 'Drag to select your exact location',
        animation: google.maps.Animation.DROP
    });
    
    // Update location when marker is dragged
    marker.addListener('dragend', function() {
        const newPosition = marker.getPosition();
        const newLat = newPosition.lat();
        const newLng = newPosition.lng();
        
        console.log('Marker dragged to:', newLat, newLng);
        
        // Update selected location
        selectedLocation.lat = newLat;
        selectedLocation.lng = newLng;
        
        // Reverse geocode to get new address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            location: newPosition
        }, function(results, status) {
            if (status === 'OK' && results.length > 0) {
                selectedLocation.address = results[0];
                selectedLocation.formatted_address = results[0].formatted_address;
                
                if (selectedLocationText) {
                    selectedLocationText.textContent = results[0].formatted_address;
                }
                
                // Update address form with new location
                updateAddressFormFromLocation(selectedLocation);
                
                console.log('Address updated from marker drag:', results[0].formatted_address);
            } else {
                console.error('Reverse geocoding failed:', status);
                // Fallback to coordinates
                if (selectedLocationText) {
                    selectedLocationText.textContent = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
                }
            }
        });
    });
    
    // Add click listener to map to move marker
    map.addListener('click', function(event) {
        const clickedLat = event.latLng.lat();
        const clickedLng = event.latLng.lng();
        
        console.log('Map clicked at:', clickedLat, clickedLng);
        
        // Move marker to clicked location
        marker.setPosition({ lat: clickedLat, lng: clickedLng });
        
        // Update selected location
        selectedLocation.lat = clickedLat;
        selectedLocation.lng = clickedLng;
        
        // Reverse geocode clicked location
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            location: event.latLng
        }, function(results, status) {
            if (status === 'OK' && results.length > 0) {
                selectedLocation.address = results[0];
                selectedLocation.formatted_address = results[0].formatted_address;
                
                if (selectedLocationText) {
                    selectedLocationText.textContent = results[0].formatted_address;
                }
                
                // Update address form with new location
                updateAddressFormFromLocation(selectedLocation);
                
                console.log('Address updated from map click:', results[0].formatted_address);
            }
        });
    });
}

function initGoogleMap(lat, lng) {
    const mapElement = document.getElementById('googleMap');
    if (!mapElement) return;
    
    // Initialize map
    map = new google.maps.Map(mapElement, {
        center: { lat: lat, lng: lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Add marker
    marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        draggable: true,
        title: 'Selected Location'
    });
    
    // Update location when marker is dragged
    marker.addListener('dragend', function() {
        const newPosition = marker.getPosition();
        selectedLocation.lat = newPosition.lat();
        selectedLocation.lng = newPosition.lng();
        
        // Reverse geocode to get new address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            location: newPosition
        }, function(results, status) {
            if (status === 'OK' && results.length > 0) {
                selectedLocation.address = results[0];
                selectedLocation.formatted_address = results[0].formatted_address;
                
                if (selectedLocationText) {
                    selectedLocationText.textContent = results[0].formatted_address;
                }
            }
        });
    });
}

function confirmLocationSelection() {
    if (!selectedLocation) {
        showNotification('Please select a location first', 'error');
        return;
    }
    
    console.log('Confirming location selection:', selectedLocation);
    
    // Fill address form with location data
    fillAddressFormFromLocation(selectedLocation);
    
    // Keep search results visible (don't hide the map)
    if (searchResults) {
        searchResults.style.display = 'block';
    }
    
    // Update location status to show confirmation
    updateLocationStatus('Location confirmed! You can still adjust by dragging the marker.', 'success');
    
    showNotification('Location selected! Address form filled automatically. You can still adjust the marker.', 'success');
}

function cancelLocationSelection() {
    console.log('Canceling location selection');
    
    // Keep search results visible (don't hide the map)
    if (searchResults) {
        searchResults.style.display = 'block';
    }
    
    // Reset selected location
    selectedLocation = null;
    
    // Disable confirm button
    if (confirmLocationBtn) {
        confirmLocationBtn.disabled = true;
    }
    
    // Update location status
    updateLocationStatus('Location selection cancelled. You can still select a new location.', 'info');
    
    showNotification('Location selection cancelled. You can still select a new location on the map.', 'info');
}

function fillAddressFormFromLocation(location) {
    console.log('Filling address form from location:', location);
    
    const address = location.address;
    const addressComponents = address.address_components || [];
    
    // Helper function to get component by type
    function getComponent(type) {
        const component = addressComponents.find(comp => 
            comp.types.includes(type)
        );
        return component ? component.long_name : '';
    }
    
    // Fill form fields
    const street = document.getElementById('street');
    const building = document.getElementById('building');
    const city = document.getElementById('city');
    const pinCode = document.getElementById('pinCode');
    const state = document.getElementById('state');
    
    // Street address
    if (street) {
        const streetNumber = getComponent('street_number');
        const route = getComponent('route');
        street.value = `${streetNumber} ${route}`.trim();
    }
    
    // Building (use sublocality or neighborhood)
    if (building) {
        building.value = getComponent('sublocality') || getComponent('neighborhood') || '';
    }
    
    // City
    if (city) {
        city.value = getComponent('locality') || getComponent('administrative_area_level_2') || '';
    }
    
    // Pin code
    if (pinCode) {
        pinCode.value = getComponent('postal_code') || '';
    }
    
    // State
    if (state) {
        state.value = getComponent('administrative_area_level_1') || '';
    }
    
    // Store coordinates
    localStorage.setItem('userCoordinates', JSON.stringify({
        lat: location.lat,
        lng: location.lng
    }));
    
    localStorage.setItem('userAddressData', JSON.stringify(location.address));
}

function updateAddressFormFromLocation(location) {
    console.log('Updating address form from marker location:', location);
    
    // This function is called when marker is moved
    // It updates the form with new location data
    
    if (location.address && location.address.address_components) {
        // Use Google Maps format
        fillAddressFormFromLocation(location);
    } else if (location.address && location.address.address) {
        // Use OpenStreetMap Nominatim format
        fillAddressFormFromNominatim(location);
    } else {
        // Fallback - just update coordinates
        updateCoordinatesOnly(location.lat, location.lng);
    }
}

function fillAddressFormFromNominatim(location) {
    console.log('Filling address form from Nominatim data:', location);
    
    const address = location.address.address;
    
    // Fill form fields from Nominatim address
    const street = document.getElementById('street');
    const building = document.getElementById('building');
    const city = document.getElementById('city');
    const pinCode = document.getElementById('pinCode');
    const state = document.getElementById('state');
    
    // Street address
    if (street) {
        const streetValue = address.road || address.street || '';
        const houseNumber = address.house_number || '';
        street.value = `${houseNumber} ${streetValue}`.trim();
    }
    
    // Building
    if (building) {
        building.value = address.house_name || address.building || '';
    }
    
    // City
    if (city) {
        city.value = address.city || address.town || address.village || '';
    }
    
    // Pin code
    if (pinCode) {
        pinCode.value = address.postcode || '';
    }
    
    // State
    if (state) {
        state.value = address.state || '';
    }
    
    // Store coordinates
    localStorage.setItem('userCoordinates', JSON.stringify({
        lat: location.lat,
        lng: location.lng
    }));
    
    localStorage.setItem('userAddressData', JSON.stringify(location.address));
}

function updateCoordinatesOnly(lat, lng) {
    console.log('Updating coordinates only:', lat, lng);
    
    // Store coordinates
    localStorage.setItem('userCoordinates', JSON.stringify({
        lat: lat,
        lng: lng
    }));
    
    // Show notification
    showNotification(`Location updated to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
}

// Map Interface Functions
function toggleMapSearch() {
    console.log('Toggling map search');
    if (mapSearchInput) {
        if (mapSearchInput.style.display === 'none') {
            mapSearchInput.style.display = 'flex';
            mapPincodeSearch.focus();
        } else {
            mapSearchInput.style.display = 'none';
        }
    }
}

function hideMapSearch() {
    console.log('Hiding map search');
    if (mapSearchInput) {
        mapSearchInput.style.display = 'none';
    }
    if (mapPincodeSearch) {
        mapPincodeSearch.value = '';
    }
}

async function searchMapLocation() {
    const pincode = mapPincodeSearch.value.trim();
    
    if (!pincode) {
        showNotification('Please enter a pincode', 'error');
        return;
    }

    if (!/^\d{6}$/.test(pincode)) {
        showNotification('Please enter a valid 6-digit pincode', 'error');
        return;
    }

    console.log('Searching map location for pincode:', pincode);

    // Show loading state
    mapSearchBtn.disabled = true;
    mapSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        // Try Google Maps first if available
        if (typeof google !== 'undefined' && google.maps) {
            console.log('Using Google Maps for map search');
            await searchMapWithGoogleMaps(pincode);
        } else {
            console.log('Google Maps not available, using OpenStreetMap Nominatim for map search');
            await searchMapWithNominatim(pincode);
        }

    } catch (error) {
        console.error('Error searching map location:', error);
        mapSearchBtn.disabled = false;
        mapSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
        showNotification('Error searching location. Please try again.', 'error');
    }
}

// Google Maps map search function
async function searchMapWithGoogleMaps(pincode) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({
            address: pincode + ', India',
            region: 'IN'
        }, function(results, status) {
            mapSearchBtn.disabled = false;
            mapSearchBtn.innerHTML = '<i class="fas fa-search"></i>';

            if (status === 'OK' && results.length > 0) {
                const location = results[0];
                const lat = location.geometry.location.lat();
                const lng = location.geometry.location.lng();
                
                console.log('Google Maps map location found:', location);
                
                // Update map to new location
                updateMapLocation(lat, lng, location);
                
                // Hide search input
                hideMapSearch();
                
                resolve(location);
                
            } else {
                console.error('Google Maps geocoding failed:', status);
                // Fallback to Nominatim
                searchMapWithNominatim(pincode).then(resolve).catch(reject);
            }
        });
    });
}

// OpenStreetMap Nominatim map search function
async function searchMapWithNominatim(pincode) {
    try {
        console.log('Using OpenStreetMap Nominatim for map search');
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${pincode},India&limit=1&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ONDC-Buyer-App/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        
        mapSearchBtn.disabled = false;
        mapSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
        
        if (results && results.length > 0) {
            const location = results[0];
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lon);
            
            console.log('Nominatim map location found:', location);
            
            // Create a Google Maps-like result object for compatibility
            const googleMapsResult = {
                geometry: {
                    location: {
                        lat: () => lat,
                        lng: () => lng
                    }
                },
                formatted_address: location.display_name,
                address_components: parseNominatimAddress(location.address),
                place_id: location.place_id
            };
            
            // Update map to new location
            updateMapLocation(lat, lng, googleMapsResult);
            
            // Hide search input
            hideMapSearch();
            
        } else {
            console.error('No results found for pincode:', pincode);
            showNotification('Location not found for this pincode', 'error');
        }
        
    } catch (error) {
        console.error('Nominatim map search error:', error);
        mapSearchBtn.disabled = false;
        mapSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
        showNotification('Error searching location. Please try again.', 'error');
    }
}

function initOpenStreetMapWithMarker(lat, lng) {
    console.log('Initializing OpenStreetMap with moveable marker:', lat, lng);
    
    // Create OpenStreetMap with Leaflet (if available) or use iframe with custom marker
    const mapElement = document.getElementById('googleMap');
    if (!mapElement) return;
    
    // For now, use OpenStreetMap iframe with marker overlay
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    
    if (mapIframe) {
        mapIframe.src = mapUrl;
    }
    
    // Create custom marker overlay for OpenStreetMap
    createOpenStreetMapMarker(lat, lng);
    
    // Store selected location
    selectedLocation = {
        lat: lat,
        lng: lng,
        address: null,
        formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
    
    // Enable confirm button
    if (confirmLocationBtn) {
        confirmLocationBtn.disabled = false;
    }
}

function createOpenStreetMapMarker(lat, lng) {
    console.log('Creating OpenStreetMap marker overlay');
    
    // Create marker overlay div
    const markerOverlay = document.createElement('div');
    markerOverlay.id = 'openstreetmap-marker';
    markerOverlay.className = 'openstreetmap-marker';
    markerOverlay.innerHTML = '📍';
    markerOverlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -100%);
        font-size: 24px;
        cursor: move;
        z-index: 1000;
        user-select: none;
        pointer-events: auto;
    `;
    
    // Add to map container
    const mapContainer = document.querySelector('.map-wrapper');
    if (mapContainer) {
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(markerOverlay);
        
        // Make marker draggable
        makeMarkerDraggable(markerOverlay, lat, lng);
    }
}

function makeMarkerDraggable(markerElement, initialLat, initialLng) {
    let isDragging = false;
    let startX, startY;
    
    markerElement.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        markerElement.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const currentTop = parseInt(markerElement.style.top) || 0;
        const currentLeft = parseInt(markerElement.style.left) || 0;
        
        markerElement.style.top = (currentTop + deltaY) + 'px';
        markerElement.style.left = (currentLeft + deltaX) + 'px';
        
        startX = e.clientX;
        startY = e.clientY;
    });
    
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        
        isDragging = false;
        markerElement.style.cursor = 'move';
        
        // Calculate new coordinates based on marker position
        const newCoords = calculateCoordinatesFromMarker(markerElement);
        if (newCoords) {
            updateLocationFromMarker(newCoords.lat, newCoords.lng);
        }
    });
    
    // Add click to move functionality
    const mapIframe = document.getElementById('mapIframe');
    if (mapIframe) {
        mapIframe.addEventListener('click', function(e) {
            // Calculate coordinates from click position
            const newCoords = calculateCoordinatesFromClick(e);
            if (newCoords) {
                moveMarkerToPosition(markerElement, newCoords.lat, newCoords.lng);
                updateLocationFromMarker(newCoords.lat, newCoords.lng);
            }
        });
    }
}

function calculateCoordinatesFromMarker(markerElement) {
    // This is a simplified calculation - in a real implementation,
    // you'd need to account for map bounds, zoom level, etc.
    const mapContainer = markerElement.parentElement;
    const rect = mapContainer.getBoundingClientRect();
    const markerRect = markerElement.getBoundingClientRect();
    
    const x = (markerRect.left - rect.left) / rect.width;
    const y = (markerRect.top - rect.top) / rect.height;
    
    // Convert to lat/lng (simplified calculation)
    // This would need proper map projection calculations
    const lat = 28.6139 + (0.5 - y) * 0.1; // Rough calculation
    const lng = 77.2090 + (x - 0.5) * 0.1;
    
    return { lat, lng };
}

function calculateCoordinatesFromClick(event) {
    // Simplified coordinate calculation from click
    // In a real implementation, you'd need proper map projection
    const mapContainer = event.target.parentElement;
    const rect = mapContainer.getBoundingClientRect();
    
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    const lat = 28.6139 + (0.5 - y) * 0.1;
    const lng = 77.2090 + (x - 0.5) * 0.1;
    
    return { lat, lng };
}

function moveMarkerToPosition(markerElement, lat, lng) {
    // Move marker to new position (simplified)
    markerElement.style.top = '50%';
    markerElement.style.left = '50%';
}

function updateLocationFromMarker(lat, lng) {
    console.log('Updating location from marker:', lat, lng);
    
    // Update selected location
    selectedLocation.lat = lat;
    selectedLocation.lng = lng;
    selectedLocation.formatted_address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Update location text
    if (selectedLocationText) {
        selectedLocationText.textContent = selectedLocation.formatted_address;
    }
    
    // Reverse geocode using Nominatim
    reverseGeocodeNominatim(lat, lng);
}

function reverseGeocodeNominatim(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'ONDC-Buyer-App/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.display_name) {
            selectedLocation.address = data;
            selectedLocation.formatted_address = data.display_name;
            
            if (selectedLocationText) {
                selectedLocationText.textContent = data.display_name;
            }
            
            // Update address form
            updateAddressFormFromLocation(selectedLocation);
            
            console.log('Address updated from marker:', data.display_name);
        }
    })
    .catch(error => {
        console.error('Reverse geocoding failed:', error);
    });
}

function updateMapLocation(lat, lng, location) {
    console.log('Updating map location:', lat, lng);
    
    if (map) {
        // Update map center
        map.setCenter({ lat: lat, lng: lng });
        map.setZoom(15);
        
        // Update marker position
        if (marker) {
            marker.setPosition({ lat: lat, lng: lng });
        } else {
            // Create new marker if it doesn't exist
            marker = new google.maps.Marker({
                position: { lat: lat, lng: lng },
                map: map,
                draggable: true,
                title: 'Selected Location'
            });
        }
        
        // Update selected location
        selectedLocation = {
            lat: lat,
            lng: lng,
            address: location,
            formatted_address: location.formatted_address
        };
        
        // Enable done button
        if (confirmLocationBtn) {
            confirmLocationBtn.disabled = false;
        }
        
        showNotification('Location updated on map!', 'success');
    }
}

function zoomInMap() {
    if (map) {
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
    }
}

function zoomOutMap() {
    if (map) {
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
    }
}

function recenterMap() {
    if (selectedLocation && map) {
        map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        map.setZoom(15);
        showNotification('Map recentered to selected location', 'success');
    } else {
        showNotification('No location selected to recenter', 'error');
    }
}

function toggleMapType() {
    if (map) {
        const currentType = map.getMapTypeId();
        const newType = currentType === google.maps.MapTypeId.ROADMAP 
            ? google.maps.MapTypeId.SATELLITE 
            : google.maps.MapTypeId.ROADMAP;
        map.setMapTypeId(newType);
        
        const typeName = newType === google.maps.MapTypeId.SATELLITE ? 'Satellite' : 'Road';
        showNotification(`Map view changed to ${typeName}`, 'success');
    }
}

// Function to show current location button (optional)
function showCurrentLocationOption() {
    if (getLocationBtn) {
        getLocationBtn.style.display = 'block';
        updateLocationStatus('You can also use your current location or search by pincode', 'info');
    }
}

// Function to hide current location button
function hideCurrentLocationOption() {
    if (getLocationBtn) {
        getLocationBtn.style.display = 'none';
    }
}

// Debug function to check pincode search interface
function debugPincodeInterface() {
    console.log('🔍 Debugging pincode search interface...');
    
    const locationSearchSection = document.querySelector('.location-search-section');
    const searchInputGroup = document.querySelector('.search-input-group');
    const pincodeInput = document.getElementById('pincodeSearch');
    const searchBtn = document.getElementById('searchLocationBtn');
    
    console.log('Location search section:', locationSearchSection);
    console.log('Search input group:', searchInputGroup);
    console.log('Pincode input:', pincodeInput);
    console.log('Search button:', searchBtn);
    
    if (locationSearchSection) {
        console.log('Location search section display:', getComputedStyle(locationSearchSection).display);
    }
    
    if (searchInputGroup) {
        console.log('Search input group display:', getComputedStyle(searchInputGroup).display);
    }
}

// Test function for pincode search functionality
function testPincodeSearch() {
    console.log('🧪 Testing pincode search functionality...');
    
    // First debug the interface
    debugPincodeInterface();
    
    // Test with a known pincode (Delhi - 110001)
    const testPincode = '110001';
    
    if (pincodeSearch) {
        pincodeSearch.value = testPincode;
        console.log('Testing with pincode:', testPincode);
        
        // Trigger the search
        searchLocationByPincode();
    } else {
        console.error('Pincode search input not found');
    }
}

// Function to force show pincode interface
function forceShowPincodeInterface() {
    console.log('🔧 Force showing pincode interface...');
    
    const locationSearchSection = document.querySelector('.location-search-section');
    const searchInputGroup = document.querySelector('.search-input-group');
    
    if (locationSearchSection) {
        locationSearchSection.style.display = 'block';
        locationSearchSection.style.visibility = 'visible';
        locationSearchSection.style.opacity = '1';
        console.log('Location search section forced visible');
    }
    
    if (searchInputGroup) {
        searchInputGroup.style.display = 'flex';
        searchInputGroup.style.visibility = 'visible';
        searchInputGroup.style.opacity = '1';
        console.log('Search input group forced visible');
    }
    
    // Focus on pincode input
    if (pincodeSearch) {
        pincodeSearch.focus();
        console.log('Pincode input focused');
    }
}

// Test function for moveable marker functionality
function testMoveableMarker() {
    console.log('🧪 Testing moveable marker functionality...');
    
    // Test with a known location (Delhi)
    const testLat = 28.6139;
    const testLng = 77.2090;
    
    console.log('Testing marker at:', testLat, testLng);
    
    // Initialize map with marker
    if (typeof google !== 'undefined' && google.maps) {
        console.log('Using Google Maps for marker test');
        initGoogleMapWithMarker(testLat, testLng);
    } else {
        console.log('Using OpenStreetMap for marker test');
        initOpenStreetMapWithMarker(testLat, testLng);
    }
    
    // Show instructions
    showNotification('Marker test initialized! Try dragging the marker or clicking on the map.', 'success');
}

// Function to force show the map
function forceShowMap() {
    console.log('🔧 Force showing map...');
    
    // Force show search results
    if (searchResults) {
        searchResults.style.display = 'block';
        searchResults.style.visibility = 'visible';
        searchResults.style.opacity = '1';
        console.log('Search results forced visible');
    }
    
    // Load default map
    loadMapWithDefaultPincode();
    
    showNotification('Map forced to show!', 'success');
}

// Make functions globally available
window.showAddressModal = showAddressModal;
window.testPincodeSearch = testPincodeSearch;
window.showCurrentLocationOption = showCurrentLocationOption;
window.hideCurrentLocationOption = hideCurrentLocationOption;
window.debugPincodeInterface = debugPincodeInterface;
window.forceShowPincodeInterface = forceShowPincodeInterface;
window.testMoveableMarker = testMoveableMarker;
window.forceShowMap = forceShowMap;
