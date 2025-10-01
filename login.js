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

// Password toggle elements
const passwordToggle = document.getElementById('passwordToggle');
const passwordToggleIcon = document.getElementById('passwordToggleIcon');

// Social login buttons
const facebookBtn = document.getElementById('facebookBtn');
const googleBtn = document.getElementById('googleBtn');

// Error message elements
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');


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
            // Redirect to home page - address can be added there
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
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
    
    // Password toggle button
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
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

function togglePasswordVisibility() {
    console.log('Password toggle clicked');
    
    if (passwordInput && passwordToggleIcon) {
        // Toggle input type between password and text
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordToggleIcon.className = 'fas fa-eye-slash';
            passwordToggle.setAttribute('aria-label', 'Hide password');
        } else {
            passwordInput.type = 'password';
            passwordToggleIcon.className = 'fas fa-eye';
            passwordToggle.setAttribute('aria-label', 'Show password');
        }
        
        // Keep focus on the input after toggling
        passwordInput.focus();
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
    
    // Note: We preserve address data across login sessions
    // Addresses are tied to the user account, not the session
    // If you want to clear addresses on logout, uncomment the lines below:
    // localStorage.removeItem('hasAddress');
    // localStorage.removeItem('userAddress');
    // localStorage.removeItem('userCoordinates');
    // localStorage.removeItem('userAddressData');
    
    console.log('User logged out successfully');
}


