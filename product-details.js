// Product Details Page JavaScript
console.log('=== PRODUCT DETAILS PAGE INITIALIZATION ===');

// API Configuration
const API_BASE_URL = 'https://neo-server.rozana.in/api';
const PRODUCT_DETAIL_ENDPOINT = `${API_BASE_URL}/product-detail`;

// DOM Elements
const measureButtonsContainer = document.querySelector('.measure-buttons');
const currentPriceElement = document.querySelector('.current-price');
const originalPriceElement = document.querySelector('.original-price');
const productNameElement = document.querySelector('.product-name');
const productImageElement = document.querySelector('.product-image');
const productDescriptionElement = document.querySelector('.product-description p');
const addToCartBtn = document.getElementById('addToCartBtn');
const orderNowBtn = document.getElementById('orderNowBtn');
const successModal = document.getElementById('successModal');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');

// Product data
let productData = null;
let selectedVariant = null;
let cartItems = JSON.parse(localStorage.getItem('ondcCart')) || [];

// Get product ID from URL parameters
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    console.log('URL parameters:', window.location.search);
    console.log('Product ID from URL:', productId);
    
    if (!productId) {
        console.warn('No product ID found in URL, using default');
        return 'id_13owvn_0_0'; // Default product ID
    }
    
    return productId;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PRODUCT DETAILS PAGE INITIALIZATION ===');
    console.log('Current URL:', window.location.href);
    console.log('URL Search Params:', window.location.search);
    
    const productId = getProductIdFromUrl();
    console.log('Product ID:', productId);
    
    // Show loading state
    showLoadingState();
    
    // Add a visual indicator of what product ID we're loading
    showProductIdIndicator(productId);
    
    // Fetch product data from API
    fetchProductData(productId);
    
    setupActionButtons();
    updateCartCount();
    
    console.log('=== PRODUCT DETAILS PAGE INITIALIZATION COMPLETE ===');
});

// Show product ID indicator for debugging
function showProductIdIndicator(productId) {
    // Create a debug indicator
    const debugIndicator = document.createElement('div');
    debugIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: #3b82f6;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 10000;
        max-width: 300px;
        word-break: break-all;
    `;
    debugIndicator.innerHTML = `Loading Product ID:<br><strong>${productId}</strong>`;
    document.body.appendChild(debugIndicator);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (debugIndicator.parentNode) {
            debugIndicator.parentNode.removeChild(debugIndicator);
        }
    }, 5000);
}

// Show loading state
function showLoadingState() {
    const productNameElement = document.querySelector('.product-name');
    const productDescriptionElement = document.querySelector('.product-description p');
    const currentPriceElement = document.querySelector('.current-price');
    
    if (productNameElement) {
        productNameElement.textContent = 'Loading...';
    }
    
    if (productDescriptionElement) {
        productDescriptionElement.textContent = 'Please wait while we load the product details...';
    }
    
    if (currentPriceElement) {
        currentPriceElement.textContent = '₹---';
    }
    
    // Disable action buttons during loading
    if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Loading...';
    }
    
    if (orderNowBtn) {
        orderNowBtn.disabled = true;
        orderNowBtn.textContent = 'Loading...';
    }
}

// Fetch product data from API
async function fetchProductData(productId) {
    console.log('=== FETCHING PRODUCT DATA ===');
    console.log('Product ID:', productId);
    console.log('API Endpoint:', `${PRODUCT_DETAIL_ENDPOINT}/${productId}`);
    
    // Check if this is a mock product ID
    if (productId.startsWith('mock_')) {
        console.log('Mock product ID detected, loading mock data');
        loadMockProductData(productId);
        return;
    }
    
    try {
        console.log('Making API request...');
        
        // Get bearer token from localStorage
        const userToken = localStorage.getItem('ondcUserToken');
        const userData = localStorage.getItem('ondcUser');
        console.log('User token found:', userToken ? 'Yes' : 'No');
        console.log('User data found:', userData ? 'Yes' : 'No');
        console.log('Full user token:', userToken);
        console.log('Full user data:', userData);
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        // Add authorization header if token exists (optional)
        if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
            console.log('Adding Bearer token to request');
        } else {
            console.log('No Bearer token found, making request without authentication');
        }
        
        console.log('Full request details:', {
            url: `${PRODUCT_DETAIL_ENDPOINT}/${productId}`,
            method: 'GET',
            headers: headers
        });
        
        const response = await fetch(`${PRODUCT_DETAIL_ENDPOINT}/${productId}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            // Handle specific error cases without requiring authentication
            if (response.status === 404) {
                throw new Error(`Product not found: ${productId}`);
            } else if (response.status === 500) {
                throw new Error('Server error. The product details service is currently unavailable.');
            } else {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log('Product data received:', data);
        
        if (!data || Object.keys(data).length === 0) {
            throw new Error('Empty or invalid response from API');
        }
        
        productData = data;
        
        // Show success notification with product ID
        showNotification(`Successfully loaded product data for: ${productId}`, 'success');
        
        // Populate product information
        populateProductInfo();
        
        // Setup measure buttons based on variants
        setupMeasureButtons();
        
        console.log('Product data loaded successfully');
        console.log('Final productData:', productData);
        
    } catch (error) {
        console.error('Error fetching product data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            productId: productId,
            endpoint: `${PRODUCT_DETAIL_ENDPOINT}/${productId}`
        });
        
        // Show error message without authentication requirement
        showNotification(`Failed to load product details for ${productId}. Using fallback data.`, 'warning');
        console.log('API call failed, using fallback data instead of requiring authentication');
        
        // Fallback to default product data
        loadDefaultProductData();
    }
}

// Populate product information from API data
function populateProductInfo() {
    if (!productData) {
        console.error('No product data available to populate');
        return;
    }
    
    console.log('=== POPULATING PRODUCT INFO ===');
    console.log('Product data being used:', productData);
    console.log('Product name:', productData.name);
    
    // Update product name
    if (productNameElement) {
        console.log('Updating product name element:', productNameElement);
        productNameElement.textContent = productData.name;
        console.log('Product name updated to:', productData.name);
    } else {
        console.error('Product name element not found');
    }
    
    // Update product description
    if (productDescriptionElement) {
        productDescriptionElement.textContent = productData.description;
    }
    
    // Update product image if available
    if (productImageElement && productData.image) {
        productImageElement.src = productData.image;
        productImageElement.alt = productData.name;
    }
    
    // Update page title
    document.title = `${productData.name} - Product Details`;
    
    // Update breadcrumb
    const breadcrumbCurrent = document.querySelector('.breadcrumb .current');
    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = productData.name;
    }
    
    // Update product availability status
    updateProductAvailability();
    
    // Add additional product information
    addProductDetails();
    
    // Set default variant (first available variant)
    if (productData.variants && productData.variants.length > 0) {
        selectedVariant = productData.variants[0];
        updatePricing();
    }
    
    // Re-enable action buttons after loading
    if (addToCartBtn) {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'Add to cart';
    }
    
    if (orderNowBtn) {
        orderNowBtn.disabled = false;
        orderNowBtn.textContent = 'Order now';
    }
}

// Update product availability status
function updateProductAvailability() {
    const inStockElement = document.querySelector('.attribute.in-stock span');
    if (inStockElement) {
        if (productData.available) {
            inStockElement.textContent = 'In stock';
        } else {
            inStockElement.textContent = 'Out of stock';
            // Change styling for out of stock
            const inStockContainer = document.querySelector('.attribute.in-stock');
            if (inStockContainer) {
                inStockContainer.style.backgroundColor = '#fef2f2';
                inStockContainer.style.color = '#dc2626';
                inStockContainer.style.borderColor = '#fecaca';
            }
        }
    }
}

// Add additional product details
function addProductDetails() {
    const productDescription = document.querySelector('.product-description');
    if (!productDescription) return;
    
    // Add nutritional info if available
    if (productData.nutritional_info) {
        const nutritionalSection = document.createElement('div');
        nutritionalSection.innerHTML = `
            <h4>Nutritional Information:</h4>
            <p>${productData.nutritional_info}</p>
        `;
        productDescription.appendChild(nutritionalSection);
    }
    
    // Add additives info if available
    if (productData.additives_info) {
        const additivesSection = document.createElement('div');
        additivesSection.innerHTML = `
            <h4>Additives Information:</h4>
            <p>${productData.additives_info}</p>
        `;
        productDescription.appendChild(additivesSection);
    }
    
    // Add shipping information
    if (productData.time_to_ship) {
        const shippingSection = document.createElement('div');
        const timeToShip = productData.time_to_ship.replace('PT', '').replace('M', ' minutes');
        shippingSection.innerHTML = `
            <h4>Shipping Information:</h4>
            <p>Estimated delivery time: ${timeToShip}</p>
            <p>Cash on Delivery: ${productData.available_on_cod ? 'Available' : 'Not Available'}</p>
            <p>Returnable: ${productData.is_returnable ? 'Yes' : 'No'}</p>
            <p>Cancellable: ${productData.is_cancellable ? 'Yes' : 'No'}</p>
        `;
        productDescription.appendChild(shippingSection);
    }
    
    // Add contact information
    if (productData.consumer_care_contact) {
        const contactSection = document.createElement('div');
        const contactParts = productData.consumer_care_contact.split(',');
        const contactName = contactParts[0] || 'N/A';
        const contactEmail = contactParts[1] || 'N/A';
        const contactPhone = contactParts[2] || 'N/A';
        
        contactSection.innerHTML = `
            <h4>Consumer Care Contact:</h4>
            <p><strong>Name:</strong> ${contactName}</p>
            <p><strong>Email:</strong> ${contactEmail}</p>
            <p><strong>Phone:</strong> ${contactPhone}</p>
        `;
        productDescription.appendChild(contactSection);
    }
}

// Load mock product data for mock IDs
function loadMockProductData(mockId) {
    console.log('Loading mock product data for:', mockId);
    
    // Generate mock data based on the mock ID
    const productName = mockId.replace('mock_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    productData = {
        product_id: mockId,
        name: productName,
        description: `This is a mock product: ${productName}. Please note this is sample data for demonstration purposes.`,
        category: 'Mock Category',
        seller_id: 999,
        seller_name: 'Mock Store',
        price: '299.00',
        currency: 'INR',
        available: true,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        variants: [
            {
                item_id: `${mockId}_1kg`,
                variation_value: '1 kilogram',
                price: '299.00',
                currency: 'INR',
                available: 1
            },
            {
                item_id: `${mockId}_2kg`,
                variation_value: '2 kilogram',
                price: '598.00',
                currency: 'INR',
                available: 1
            },
            {
                item_id: `${mockId}_5kg`,
                variation_value: '5 kilogram',
                price: '1495.00',
                currency: 'INR',
                available: 1
            }
        ],
        nutritional_info: 'Mock nutritional information for demonstration.',
        additives_info: 'No artificial additives.',
        time_to_ship: 'PT45M',
        available_on_cod: true,
        is_returnable: true,
        is_cancellable: true,
        consumer_care_contact: 'Mock Support, support@mock.com, +91-9999999999'
    };
    
    populateProductInfo();
    setupMeasureButtons();
    
    // Show notification that this is mock data
    showNotification('This is mock product data for demonstration purposes.', 'info');
}

// Load default product data as fallback
function loadDefaultProductData() {
    console.log('Loading default product data');
    
    productData = {
        product_id: 'id_13owvn_0_0',
        name: 'Plain Atta',
        description: 'Awaken the taste buds of your customers with The Flour Awakens.',
        category: 'Atta, Flours and Sooji',
        seller_id: 9,
        seller_name: 'Flour Store',
        price: '65.00',
        currency: 'INR',
        available: true,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        variants: [
            {
                item_id: 'id_13owvn_0_0',
                variation_value: '1 kilogram',
                price: '65.00',
                currency: 'INR',
                available: 1
            },
            {
                item_id: 'id_ancc5_1_0',
                variation_value: '2 kilogram',
                price: '130.00',
                currency: 'INR',
                available: 1
            },
            {
                item_id: 'id_1bai73_2_0',
                variation_value: '5 kilogram',
                price: '325.00',
                currency: 'INR',
                available: 1
            }
        ]
    };
    
    populateProductInfo();
    setupMeasureButtons();
}

function setupMeasureButtons() {
    console.log('Setting up measure buttons');
    
    if (!productData || !productData.variants) {
        console.log('No product data or variants available');
        return;
    }
    
    // Clear existing buttons
    if (measureButtonsContainer) {
        measureButtonsContainer.innerHTML = '';
    }
    
    // Create buttons for each variant
    productData.variants.forEach((variant, index) => {
        if (!variant.available) return; // Skip unavailable variants
        
        const button = document.createElement('button');
        button.className = 'measure-btn';
        button.textContent = variant.variation_value;
        button.dataset.itemId = variant.item_id;
        button.dataset.price = variant.price;
        
        // Set first variant as active by default
        if (index === 0) {
            button.classList.add('active');
            selectedVariant = variant;
            updatePricing();
        }
        
        // Add click event listener
        button.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.measure-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update selected variant
            selectedVariant = variant;
            updatePricing();
            
            console.log('Selected variant:', variant);
        });
        
        // Append to container
        if (measureButtonsContainer) {
            measureButtonsContainer.appendChild(button);
        }
    });
    
    console.log('Measure buttons setup complete');
}

function updatePricing() {
    if (!selectedVariant) return;
    
    const currentPrice = parseFloat(selectedVariant.price);
    
    if (currentPriceElement) {
        currentPriceElement.textContent = `₹${currentPrice.toFixed(2)}`;
    }
    
    // Hide original price since API doesn't provide it
    if (originalPriceElement) {
        originalPriceElement.style.display = 'none';
    }
    
    console.log('Updated pricing:', currentPrice);
}

function setupActionButtons() {
    console.log('Setting up action buttons');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            console.log('Add to cart clicked');
            addToCart();
        });
    }
    
    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', function() {
            console.log('Order now clicked');
            orderNow();
        });
    }
    
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            hideSuccessModal();
        });
    }
}

function addToCart() {
    console.log('=== ADDING TO CART ===');
    
    if (!productData || !selectedVariant) {
        console.error('Product data or selected variant not available');
        showNotification('Unable to add item to cart. Please try again.', 'error');
        return;
    }
    
    const cartItem = {
        id: selectedVariant.item_id,
        product_id: productData.product_id,
        name: productData.name,
        price: `₹${selectedVariant.price}`,
        quantity: 1,
        image: productData.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        seller: productData.seller_name || `Seller ${productData.seller_id}` || 'Unknown Seller',
        measure: selectedVariant.variation_value,
        weight: selectedVariant.variation_value,
        seller_id: productData.seller_id,
        category: productData.category,
        currency: selectedVariant.currency,
        available: selectedVariant.available,
        is_returnable: productData.is_returnable,
        is_cancellable: productData.is_cancellable,
        time_to_ship: productData.time_to_ship,
        available_on_cod: productData.available_on_cod
    };
    
    console.log('Cart item:', cartItem);
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === cartItem.id);
    
    if (existingItemIndex > -1) {
        // Update quantity if item exists
        cartItems[existingItemIndex].quantity += 1;
        console.log('Updated existing item quantity');
    } else {
        // Add new item to cart
        cartItems.push(cartItem);
        console.log('Added new item to cart');
    }
    
    // Save to localStorage
    localStorage.setItem('ondcCart', JSON.stringify(cartItems));
    
    // Update cart count
    updateCartCount();
    
    // Show success modal
    showSuccessModal();
    
    // Show notification
    showNotification('Item added to cart successfully!', 'success');
    
    console.log('Cart updated:', cartItems);
}

function orderNow() {
    console.log('=== ORDER NOW ===');
    
    // First add to cart
    addToCart();
    
    // Then redirect to cart page
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1000);
}

function showSuccessModal() {
    if (successModal) {
        successModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideSuccessModal() {
    if (successModal) {
        successModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        
        // Show/hide cart count
        if (totalItems > 0) {
            cartCountElement.style.display = 'flex';
        } else {
            cartCountElement.style.display = 'none';
        }
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

// Close modal when clicking outside
if (successModal) {
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            hideSuccessModal();
        }
    });
}

// Handle cart icon click
const cartIcon = document.getElementById('cartIcon');
if (cartIcon) {
    cartIcon.addEventListener('click', function() {
        window.location.href = 'cart.html';
    });
}

// Add CSS animations if not already present
if (!document.querySelector('#product-details-animations')) {
    const style = document.createElement('style');
    style.id = 'product-details-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Debug functions - available in console
window.testProductDetails = function(productId) {
    console.log('=== TESTING PRODUCT DETAILS ===');
    console.log('Testing with product ID:', productId);
    
    // Show loading state
    showLoadingState();
    showProductIdIndicator(productId);
    
    // Fetch product data
    fetchProductData(productId);
};

window.debugProductDetails = function() {
    console.log('=== PRODUCT DETAILS DEBUG INFO ===');
    console.log('Current URL:', window.location.href);
    console.log('URL Search Params:', window.location.search);
    console.log('Current productData:', productData);
    console.log('Current selectedVariant:', selectedVariant);
    console.log('Product name element:', productNameElement);
    console.log('Product description element:', productDescriptionElement);
    console.log('Current price element:', currentPriceElement);
    console.log('User Token:', localStorage.getItem('ondcUserToken') ? 'Present' : 'Missing');
    console.log('User Data:', localStorage.getItem('ondcUser'));
};

window.testApiWithToken = function(token) {
    console.log('=== TESTING API WITH TOKEN ===');
    if (token) {
        localStorage.setItem('ondcUserToken', token);
        console.log('Token set in localStorage');
    }
    
    const currentProductId = getProductIdFromUrl();
    console.log('Testing with product ID:', currentProductId);
    
    // Show loading state
    showLoadingState();
    showProductIdIndicator(currentProductId);
    
    // Fetch product data
    fetchProductData(currentProductId);
};

window.testApiDirect = async function(productId, token) {
    console.log('=== DIRECT API TEST ===');
    console.log('Testing product ID:', productId);
    console.log('Using token:', token ? 'Yes' : 'No');
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${PRODUCT_DETAIL_ENDPOINT}/${productId}`;
    console.log('Request URL:', url);
    console.log('Request headers:', headers);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to read response body regardless of status
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        // Try to parse as JSON if possible
        try {
            const responseJson = JSON.parse(responseText);
            console.log('Parsed response:', responseJson);
        } catch (e) {
            console.log('Response is not valid JSON');
        }
        
        return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseText
        };
        
    } catch (error) {
        console.error('Network error:', error);
        return { error: error.message };
    }
};

window.showCurrentToken = function() {
    const token = localStorage.getItem('ondcUserToken');
    console.log('=== CURRENT TOKEN INFO ===');
    console.log('Token exists:', token ? 'Yes' : 'No');
    if (token) {
        console.log('Token value:', token);
        console.log('Token length:', token.length);
        console.log('Token starts with:', token.substring(0, 20) + '...');
    } else {
        console.log('No token found in localStorage');
        console.log('Available localStorage keys:', Object.keys(localStorage));
    }
};

window.clearToken = function() {
    localStorage.removeItem('ondcUserToken');
    localStorage.removeItem('ondcUser');
    console.log('Token and user data cleared');
};

window.checkLoginStatus = function() {
    console.log('=== LOGIN STATUS CHECK ===');
    const userToken = localStorage.getItem('ondcUserToken');
    const userData = localStorage.getItem('ondcUser');
    
    console.log('Token exists:', userToken ? 'YES' : 'NO');
    if (userToken) {
        console.log('Token value:', userToken);
        console.log('Token length:', userToken.length);
    }
    
    console.log('User data exists:', userData ? 'YES' : 'NO');
    if (userData) {
        try {
            const parsedUser = JSON.parse(userData);
            console.log('User data:', parsedUser);
        } catch (e) {
            console.log('User data (raw):', userData);
        }
    }
    
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    // Check if user appears logged in based on UI
    const loginBtn = document.getElementById('loginBtn');
    const userSection = document.getElementById('userSection');
    
    if (loginBtn && userSection) {
        console.log('Login button visible:', loginBtn.style.display !== 'none');
        console.log('User section visible:', userSection.style.display !== 'none');
    }
    
    return {
        hasToken: !!userToken,
        hasUserData: !!userData,
        token: userToken,
        userData: userData
    };
};

// Make functions available globally for debugging
window.testProductDetails = window.testProductDetails;
window.debugProductDetails = window.debugProductDetails;
window.showCurrentToken = window.showCurrentToken;
window.clearToken = window.clearToken;
window.checkLoginStatus = window.checkLoginStatus;

// Essential cart functions (copied from script.js)
// updateCartCount function is already defined above

// Handle login button click
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        window.location.href = 'login.html';
    });
}

// Handle user button click
const userBtn = document.getElementById('userBtn');
if (userBtn) {
    userBtn.addEventListener('click', function() {
        // Simple logout functionality
        localStorage.removeItem('ondcUser');
        localStorage.removeItem('ondcUserToken');
        location.reload();
    });
}

// Check authentication status
function checkAuthStatus() {
    const user = localStorage.getItem('ondcUser');
    const userToken = localStorage.getItem('ondcUserToken');
    
    if (user && userToken) {
        const userData = JSON.parse(user);
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (userName) userName.textContent = userData.name || 'User';
    }
}

// Initialize authentication status
checkAuthStatus();

// Login prompt function removed - no authentication required
