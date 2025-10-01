// Registration page JavaScript
console.log('=== REGISTRATION PAGE INITIALIZATION ===');

// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const registerBtn = document.getElementById('registerBtn');
const successModal = document.getElementById('successModal');
const loadingModal = document.getElementById('loadingModal');

// Form fields
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('password_confirmation');
const agreeTermsCheckbox = document.getElementById('agreeTerms');

// Password toggle buttons (will be initialized in DOMContentLoaded)
let passwordToggle;
let passwordToggleIcon;
let confirmPasswordToggle;
let confirmPasswordToggleIcon;

// Error message elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const termsError = document.getElementById('termsError');

// Initialize registration page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== REGISTRATION PAGE INITIALIZATION ===');
    
    // Initialize password toggle elements
    passwordToggle = document.getElementById('passwordToggle');
    passwordToggleIcon = document.getElementById('passwordToggleIcon');
    confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    confirmPasswordToggleIcon = document.getElementById('confirmPasswordToggleIcon');
    
    // Debug: Check if password toggle elements exist
    console.log('Password toggle:', passwordToggle);
    console.log('Password toggle icon:', passwordToggleIcon);
    console.log('Confirm password toggle:', confirmPasswordToggle);
    console.log('Confirm password toggle icon:', confirmPasswordToggleIcon);
    
    setupEventListeners();
    
    // Fallback: Use event delegation for password toggles
    document.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.password-toggle')) {
            const toggleBtn = e.target.closest('.password-toggle');
            const inputContainer = toggleBtn.closest('.password-input-container');
            const input = inputContainer.querySelector('input[type="password"], input[type="text"]');
            const icon = toggleBtn.querySelector('i');
            
            if (input && icon) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Password toggle clicked via delegation');
                togglePasswordVisibility(input, icon, toggleBtn);
            }
        }
    });
    
    console.log('=== REGISTRATION PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Form submission
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
    
    // Password toggle buttons
    if (passwordToggle) {
        console.log('Adding event listener to password toggle');
        passwordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Password toggle clicked');
            togglePasswordVisibility(passwordInput, passwordToggleIcon, passwordToggle);
        });
    } else {
        console.log('Password toggle button not found');
    }
    
    if (confirmPasswordToggle) {
        console.log('Adding event listener to confirm password toggle');
        confirmPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Confirm password toggle clicked');
            togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggleIcon, confirmPasswordToggle);
        });
    } else {
        console.log('Confirm password toggle button not found');
    }
    
    // Real-time validation
    if (nameInput) {
        nameInput.addEventListener('blur', validateName);
        nameInput.addEventListener('input', clearError);
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearError);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
        passwordInput.addEventListener('input', clearError);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
        confirmPasswordInput.addEventListener('input', clearError);
    }
    
    if (agreeTermsCheckbox) {
        agreeTermsCheckbox.addEventListener('change', clearError);
    }
}

function togglePasswordVisibility(input, icon, toggleBtn) {
    console.log('Password toggle clicked');
    
    if (input && icon && toggleBtn) {
        // Toggle input type between password and text
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
            toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
            toggleBtn.setAttribute('aria-label', 'Show password');
        }
        
        // Keep focus on the input after toggling
        input.focus();
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

function validateName() {
    const name = nameInput.value.trim();
    if (!name) {
        showFieldError('nameError', 'Name is required');
        return false;
    }
    if (name.length < 2) {
        showFieldError('nameError', 'Name must be at least 2 characters long');
        return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
        showFieldError('nameError', 'Name can only contain letters and spaces');
        return false;
    }
    clearFieldError('nameError');
    return true;
}

function validateEmail() {
    const email = emailInput.value.trim();
    if (!email) {
        showFieldError('emailError', 'Email is required');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showFieldError('passwordError', 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
        return false;
    }
    clearFieldError('passwordError');
    return true;
}

function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (!confirmPassword) {
        showFieldError('confirmPasswordError', 'Please confirm your password');
        return false;
    }
    if (password !== confirmPassword) {
        showFieldError('confirmPasswordError', 'Passwords do not match');
        return false;
    }
    clearFieldError('confirmPasswordError');
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

async function handleRegistration(event) {
    event.preventDefault();
    
    console.log('=== REGISTRATION FORM SUBMISSION ===');
    
    // Validate all fields
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    // Check terms agreement
    if (!agreeTermsCheckbox.checked) {
        showFieldError('termsError', 'Please agree to the Terms and Conditions');
        return;
    } else {
        clearFieldError('termsError');
    }
    
    // If any validation fails, stop here
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        showNotification('Please fix the errors above', 'error');
        return;
    }
    
    // Show loading state
    showLoadingModal();
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    
    try {
        // Prepare registration data
        const registrationData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            password_confirmation: confirmPasswordInput.value
        };
        
        console.log('Registration data:', registrationData);
        
        // Send registration request
        const response = await fetch('https://neo-server.rozana.in/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });
        
        const result = await response.json();
        console.log('Registration response:', result);
        
        if (response.ok) {
            // Registration successful
            hideLoadingModal();
            showNotification('Registration successful! Please login to continue.', 'success');
            console.log('Registration successful:', result);
            
            // Redirect to login page after successful registration
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            // Registration failed
            hideLoadingModal();
            handleRegistrationError(result);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        hideLoadingModal();
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        // Reset button state
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

function handleRegistrationError(errorData) {
    console.log('Registration error data:', errorData);
    
    // Handle different types of errors
    if (errorData.errors) {
        // Handle validation errors
        Object.keys(errorData.errors).forEach(field => {
            const errorMessages = errorData.errors[field];
            const errorMessage = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages;
            
            switch (field) {
                case 'name':
                    showFieldError('nameError', errorMessage);
                    break;
                case 'email':
                    showFieldError('emailError', errorMessage);
                    break;
                case 'password':
                    showFieldError('passwordError', errorMessage);
                    break;
                case 'password_confirmation':
                    showFieldError('confirmPasswordError', errorMessage);
                    break;
                default:
                    showNotification(errorMessage, 'error');
            }
        });
    } else if (errorData.message) {
        // Handle general error message
        showNotification(errorData.message, 'error');
    } else {
        // Handle unknown error
        showNotification('Registration failed. Please try again.', 'error');
    }
}

function showLoadingModal() {
    if (loadingModal) {
        loadingModal.classList.add('show');
    }
}

function hideLoadingModal() {
    if (loadingModal) {
        loadingModal.classList.remove('show');
    }
}

function showSuccessModal() {
    if (successModal) {
        successModal.classList.add('show');
    }
}

function hideSuccessModal() {
    if (successModal) {
        successModal.classList.remove('show');
    }
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

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target === successModal) {
        hideSuccessModal();
    }
    if (e.target === loadingModal) {
        // Don't allow closing loading modal by clicking outside
        return;
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideSuccessModal();
    }
});
