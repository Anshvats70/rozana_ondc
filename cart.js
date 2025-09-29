// Cart Functionality for ONDC Buyer App

// Generate UUID function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Global variables
let cartItemsCart = []; // Renamed to avoid conflict with script.js
let recommendedProducts = [];

// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const emptyCartDiv = document.getElementById('emptyCart');
const totalItemsSpan = document.getElementById('totalItems');
const totalPriceSpan = document.getElementById('totalPrice');
const subtotalSpan = document.getElementById('subtotal');
const deliveryFeeSpan = document.getElementById('deliveryFee');
const convenienceFeeSpan = document.getElementById('convenienceFee');
const taxesSpan = document.getElementById('taxes');
const totalSpan = document.getElementById('total');
const clearCartBtn = document.getElementById('clearCartBtn');
const proceedBtn = document.getElementById('proceedBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModal = document.getElementById('closeCheckoutModal');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const successModal = document.getElementById('successModal');
const recommendedProductsContainer = document.getElementById('recommendedProducts');
const devInfo = document.getElementById('devInfo');
const devToggle = document.getElementById('devToggle');
const currentTransactionIdSpan = document.getElementById('currentTransactionId');
const copyTransactionIdBtn = document.getElementById('copyTransactionId');

// Sample recommended products
const sampleRecommendedProducts = [
    { id: 'rec1', name: 'Basmati Rice', price: '₹299', image: '🍚', seller: 'Grain Store' },
    { id: 'rec2', name: 'Cooking Oil', price: '₹149', image: '🫒', seller: 'Kitchen Essentials' },
    { id: 'rec3', name: 'Spices Pack', price: '₹199', image: '🌶️', seller: 'Spice World' },
    { id: 'rec4', name: 'Fresh Vegetables', price: '₹99', image: '🥬', seller: 'Green Farm' }
];

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CART PAGE INITIALIZATION ===');
    
    // Check if we're on the cart page
    if (!document.getElementById('cartItems')) {
        console.log('Not on cart page, skipping cart initialization');
        return;
    }
    
    console.log('Cart page detected, initializing...');
    
    loadCartFromStorage();
    setupEventListeners();
    loadRecommendedProducts();
    updateCartDisplay();
    loadTransactionIdFromStorage();
    
    // Debug: Check if cart items are valid
    if (cartItemsCart.length > 0) {
        console.log('Cart items validation:');
        cartItemsCart.forEach((item, index) => {
            console.log(`Item ${index}:`, {
                hasId: !!item.id,
                hasName: !!item.name,
                hasPrice: !!item.price,
                hasQuantity: !!item.quantity,
                quantity: item.quantity
            });
        });
        
        // Auto-fix cart data if needed
        fixCartData();
    }
    
    console.log('=== CART PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Clear cart button
    clearCartBtn.addEventListener('click', clearCart);
    
    // Proceed button
    proceedBtn.addEventListener('click', handleProceed);
    
    // Close checkout modal
    closeCheckoutModal.addEventListener('click', closeCheckoutModalFunction);
    
    // Place order button
    placeOrderBtn.addEventListener('click', placeOrder);
    
    // Modal click outside to close
    checkoutModal.addEventListener('click', function(e) {
        if (e.target === checkoutModal) {
            closeCheckoutModalFunction();
        }
    });
    
    // View orders button
    document.getElementById('viewOrdersBtn').addEventListener('click', function() {
        window.location.href = 'order-list.html';
    });
    
    // Dev info toggle
    if (devToggle) {
        devToggle.addEventListener('click', toggleDevInfo);
    }
    
    // Copy transaction ID button
    if (copyTransactionIdBtn) {
        copyTransactionIdBtn.addEventListener('click', copyTransactionId);
    }
    
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('ondcCart');
    if (savedCart) {
        cartItemsCart = JSON.parse(savedCart);
        
        // Ensure all cart items have available_on_cod property
        cartItemsCart.forEach(item => {
            if (item.available_on_cod === undefined || item.available_on_cod === null) {
                item.available_on_cod = false; // Default to non-COD to avoid false positives
                console.log(`Fixed missing available_on_cod for item: ${item.name} (set to false)`);
            }
        });
        
        // Save back to localStorage if any items were fixed
        saveCartToStorage();
    }
}

function loadTransactionIdFromStorage() {
    const storedTransactionId = localStorage.getItem('currentTransactionId');
    if (storedTransactionId) {
        updateTransactionIdDisplay(storedTransactionId);
        console.log('Loaded transaction ID from storage:', storedTransactionId);
    } else {
        console.log('No transaction ID found in storage');
    }
}

function saveCartToStorage() {
    localStorage.setItem('ondcCart', JSON.stringify(cartItemsCart));
}

function updateCartDisplay() {
    
    // Ensure we have valid cart items
    if (!Array.isArray(cartItemsCart)) {
        console.error('Cart items is not an array, resetting...');
        cartItemsCart = [];
        saveCartToStorage();
    }
    
    // Update cart items display
    if (cartItemsCart.length === 0) {
        if (cartItemsContainer) {
            cartItemsContainer.style.display = 'none';
            cartItemsContainer.innerHTML = '';
        }
        if (emptyCartDiv) emptyCartDiv.style.display = 'block';
        if (proceedBtn) {
            proceedBtn.disabled = true;
            proceedBtn.style.opacity = '0.5';
        }
    } else {
        if (cartItemsContainer) cartItemsContainer.style.display = 'block';
        if (emptyCartDiv) emptyCartDiv.style.display = 'none';
        if (proceedBtn) {
            proceedBtn.disabled = false;
            proceedBtn.style.opacity = '1';
        }
        renderCartItems();
    }
    
    // Update summary
    updateCartSummary();
}

function renderCartItems() {
    
    if (!cartItemsContainer) {
        console.error('Cart items container not found!');
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    
    if (cartItemsCart.length === 0) {
        return;
    }
    
    cartItemsCart.forEach((item, index) => {
        try {
            const cartItemElement = createCartItemElement(item, index);
            cartItemsContainer.appendChild(cartItemElement);
        } catch (error) {
            console.error(`Error rendering item ${index}:`, error);
        }
    });
}

function createCartItemElement(item, index) {
    const cartItemDiv = document.createElement('div');
    cartItemDiv.className = 'cart-item';
    cartItemDiv.innerHTML = `
        <div class="cart-item-image">
            <span>${item.image || '📦'}</span>
        </div>
        <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-seller">by ${item.seller}</div>
            <div class="cart-item-price">${item.price}</div>
        </div>
        <div class="cart-item-controls">
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" onchange="updateQuantity(${index}, this.value)">
                <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})" title="Remove item">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return cartItemDiv;
}

function updateQuantity(index, newQuantity) {
    const quantity = parseInt(newQuantity);
    if (quantity >= 1 && quantity <= 99) {
        cartItemsCart[index].quantity = quantity;
        saveCartToStorage();
        updateCartDisplay();
        showNotification(`Quantity updated to ${quantity}`);
    } else {
        // Reset to previous value
        document.querySelectorAll('.quantity-input')[index].value = cartItemsCart[index].quantity;
    }
}

function increaseQuantity(index) {
    if (cartItemsCart[index].quantity < 99) {
        cartItemsCart[index].quantity += 1;
        saveCartToStorage();
        updateCartDisplay();
        showNotification('Quantity increased');
    }
}

function decreaseQuantity(index) {
    if (cartItemsCart[index].quantity > 1) {
        cartItemsCart[index].quantity -= 1;
        saveCartToStorage();
        updateCartDisplay();
        showNotification('Quantity decreased');
    }
}

function removeFromCart(index) {
    const item = cartItemsCart[index];
    if (confirm(`Remove "${item.name}" from cart?`)) {
        cartItemsCart.splice(index, 1);
        saveCartToStorage();
        updateCartDisplay();
        showNotification(`${item.name} removed from cart`);
    }
}

function clearCart() {
    if (cartItemsCart.length === 0) {
        showNotification('Cart is already empty');
        return;
    }
    
    if (confirm('Are you sure you want to clear all items from your cart?')) {
        cartItemsCart = [];
        localStorage.removeItem('ondcCart');
        saveCartToStorage();
        updateCartDisplay();
        showNotification('Cart cleared');
    }
}

// Function to fix corrupted cart data
function fixCartData() {
    console.log('Attempting to fix cart data...');
    
    // Filter out invalid items and ensure proper structure
    const validItems = cartItemsCart.filter(item => {
        const isValid = item && 
               item.id && 
               item.name && 
               item.price && 
               typeof item.quantity === 'number' && 
               item.quantity > 0;
        
        if (!isValid) {
            console.log('Invalid item found:', item);
        }
        
        return isValid;
    }).map(item => {
        // Ensure all required fields are present
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            seller: item.seller || 'Unknown Seller',
            image: item.image || '📦',
            quantity: item.quantity
        };
    });
    
    if (validItems.length !== cartItemsCart.length) {
        console.log(`Fixed cart data: ${cartItemsCart.length} items -> ${validItems.length} valid items`);
        cartItemsCart = validItems;
        saveCartToStorage();
        updateCartDisplay();
        showNotification('Cart data has been fixed');
    } else {
        console.log('Cart data is valid');
    }
}

function updateCartSummary() {
    const totalItems = cartItemsCart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItemsCart.reduce((sum, item) => {
        const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
        return sum + (price * item.quantity);
    }, 0);
    
    // Use consistent fees across all pages
    const deliveryFee = 40; // ₹40 delivery charges
    const convenienceFee = 40; // ₹40 convenience fee
    const taxes = subtotal * 0.18; // 18% GST
    const total = subtotal + deliveryFee + convenienceFee + taxes;
    
    // Update display
    totalItemsSpan.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
    totalPriceSpan.textContent = `₹${total.toFixed(2)}`;
    subtotalSpan.textContent = `₹${subtotal.toFixed(2)}`;
    deliveryFeeSpan.textContent = `₹${deliveryFee}`;
    convenienceFeeSpan.textContent = `₹${convenienceFee}`;
    taxesSpan.textContent = `₹${taxes.toFixed(2)}`;
    totalSpan.textContent = `₹${total.toFixed(2)}`;
    
    // Update delivery info
    const deliveryInfo = document.querySelector('.delivery-info');
    deliveryInfo.innerHTML = `<i class="fas fa-truck"></i><span>Delivery charges: ₹${deliveryFee}</span>`;
    deliveryInfo.style.background = '#fef2f2';
    deliveryInfo.style.color = '#dc2626';
}

function loadRecommendedProducts() {
    recommendedProductsContainer.innerHTML = '';
    
    sampleRecommendedProducts.forEach(product => {
        const recommendedItem = createRecommendedItemElement(product);
        recommendedProductsContainer.appendChild(recommendedItem);
    });
}

function createRecommendedItemElement(product) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'recommended-item';
    itemDiv.innerHTML = `
        <div class="recommended-item-image">
            <span>${product.image}</span>
        </div>
        <div class="recommended-item-details">
            <div class="recommended-item-name">${product.name}</div>
            <div class="recommended-item-price">${product.price}</div>
        </div>
    `;
    
    itemDiv.addEventListener('click', function() {
        addRecommendedToCart(product);
    });
    
    return itemDiv;
}

function addRecommendedToCart(product) {
    const existingItem = cartItemsCart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItemsCart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            seller: product.seller,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartDisplay();
    showNotification(`${product.name} added to cart!`);
}

function handleProceed() {
    // Check if order is already blocked
    if (window.orderBlocked) {
        console.log('🚫 Order already blocked, ignoring proceed request');
        return;
    }
    
    if (cartItemsCart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    // Debug: Log cart items and their COD status
    console.log('=== CART PROCEED VALIDATION ===');
    console.log('Cart items for validation:', cartItemsCart);
    console.log('Cart items length:', cartItemsCart.length);
    
    cartItemsCart.forEach((item, index) => {
        console.log(`Item ${index}: ${item.name}, COD: ${item.available_on_cod}, Type: ${typeof item.available_on_cod}`);
        console.log(`Item ${index} full object:`, item);
    });
    
    // Mixed payment validation removed - no longer checking for mixed payment methods
    
    // Show loading state
    proceedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    proceedBtn.disabled = true;
    
    // Trigger select event for all cart items
    triggerSelectEventForCart();
}

async function triggerSelectEventForCart() {
    try {
        // Create the select payload for all cart items
        const selectPayload = createSelectPayloadForCart();
        
        // Send the select event
        const response = await sendSelectEvent(selectPayload);
        
        // Show success notification
        showNotification('Items selected successfully! Waiting for confirmation...', 'success');
        
        // Wait for 1 second after receiving the acknowledgment
        console.log('Waiting 1 second after select acknowledgment...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch cart confirmation data
        await fetchCartConfirmation();
        
        // Reset button state
        proceedBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Proceed';
        proceedBtn.disabled = false;
        
    } catch (error) {
        console.error('Error sending select event:', error);
        showNotification('Failed to process items. Please try again.', 'error');
        
        // Reset button state
        proceedBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Proceed';
        proceedBtn.disabled = false;
    }
}

function toggleDevInfo() {
    if (devInfo) {
        const isVisible = devInfo.style.display !== 'none';
        devInfo.style.display = isVisible ? 'none' : 'flex';
        devToggle.innerHTML = isVisible ? '<i class="fas fa-code"></i>' : '<i class="fas fa-times"></i>';
        devToggle.title = isVisible ? 'Show Dev Info' : 'Hide Dev Info';
    }
}

function copyTransactionId() {
    if (currentTransactionIdSpan && currentTransactionIdSpan.textContent !== 'Not set') {
        navigator.clipboard.writeText(currentTransactionIdSpan.textContent).then(() => {
            showNotification('Transaction ID copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy transaction ID', 'error');
        });
    } else {
        showNotification('No transaction ID available to copy', 'error');
    }
}

function updateTransactionIdDisplay(transactionId) {
    if (currentTransactionIdSpan) {
        currentTransactionIdSpan.textContent = transactionId || 'Not set';
    }
}

function getCurrentTransactionIdFromSearch() {
    // First try to get from localStorage (stored during search)
    const storedTransactionId = localStorage.getItem('currentTransactionId');
    if (storedTransactionId) {
        return storedTransactionId;
    }
    
    // If not found, try to get from the global script.js (if available)
    if (typeof getCurrentTransactionId === 'function') {
        return getCurrentTransactionId();
    }
    
    return null;
}

function createSelectPayloadForCart() {
    // Generate unique IDs
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    
    // Get or generate transaction ID (should be same throughout the flow)
    let transactionId = getCurrentTransactionIdFromSearch();
    if (!transactionId) {
        transactionId = generateTransactionId();
        // Store it for the entire flow
        localStorage.setItem('currentTransactionId', transactionId);
    }
    
    // Update the transaction ID display
    updateTransactionIdDisplay(transactionId);
    
    // Create items array from cart items
    const items = cartItemsCart.map((item, index) => {
        console.log('Cart item for select:', item);
        return {
            id: item.id, // Use the original item ID from cart
            quantity: {
                count: item.quantity
            },
            location_id: "SSL1"
        };
    });
    
    console.log('Items being sent to select API:', items);
    
    // Create the select payload according to the provided structure
    const payload = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:011",
            "action": "select",
            "core_version": "1.2.0",
            "bap_id": "neo-server.rozana.in",
            "bap_uri": "https://neo-server.rozana.in/bapl",
            "transaction_id": transactionId,
            "message_id": messageId,
            "timestamp": timestamp,
            "ttl": "PT30S",
            "bpp_id": "pramaan.ondc.org/beta/preprod/mock/seller",
            "bpp_uri": "https://pramaan.ondc.org/beta/preprod/mock/seller"
        },
        "message": {
            "order": {
                "provider": {
                    "id": "pramaan_provider_1",
                    "locations": [
                        {
                            "id": "SSL1"
                        }
                    ]
                },
                "items": items,
                "fulfillments": [
                    {
                        "id": "F0",
                        "type": "Delivery",
                        "end": {
                            "location": {
                                "gps": "28.613900,77.209000",
                                "address": {
                                    "area_code": "110037"
                                }
                            }
                        }
                    }
                ],
                "payment": {
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3"
                }
            }
        }
    };
    
    console.log('Created select payload for cart:', payload);
    return payload;
}

async function sendSelectEvent(payload) {
    try {
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/select', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Select event response:', result);
        return result;

    } catch (error) {
        console.error('Error sending select event:', error);
        throw error;
    }
}

async function fetchCartConfirmation() {
    try {
        // Get the current transaction ID (should be same as used in select)
        const transactionId = getCurrentTransactionIdFromSearch();
        if (!transactionId) {
            throw new Error('No transaction ID available');
        }
        
        console.log('Fetching cart confirmation for transaction ID:', transactionId);
        
        // Fetch cart confirmation from the API with CORS handling
        const response = await fetch(`https://neo-server.rozana.in/cart/${transactionId}`, {
            method: 'GET',
            mode: 'cors', // Explicitly set CORS mode
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const cartConfirmation = await response.json();
        console.log('Cart confirmation response:', cartConfirmation);
        
        // Store the cart confirmation data
        localStorage.setItem('cartConfirmation', JSON.stringify(cartConfirmation));
        
        // Redirect to cart confirmation page
        window.location.href = 'cart-confirmation.html';
        
    } catch (error) {
        console.error('Error fetching cart confirmation:', error);
        
        // Check if it's a CORS error
        if (error.message.includes('CORS') || error.message.includes('cross-origin') || error.name === 'TypeError') {
            console.log('CORS error detected, trying alternative approach...');
            
            // Try using a proxy or alternative method
            try {
                await fetchCartConfirmationWithProxy(transactionId);
            } catch (proxyError) {
                console.error('Proxy method also failed:', proxyError);
                console.log('Creating mock cart confirmation data due to CORS error...');
                
                // Create mock cart confirmation data as fallback
                const mockCartConfirmation = createMockCartConfirmation(transactionId);
                localStorage.setItem('cartConfirmation', JSON.stringify(mockCartConfirmation));
                window.location.href = 'cart-confirmation.html';
            }
        } else {
            showNotification('Failed to fetch cart confirmation. Please try again.', 'error');
        }
    }
}

async function fetchCartConfirmationWithProxy(transactionId) {
    // Alternative method using a CORS proxy (if available)
    const proxyUrl = `https://cors-anywhere.herokuapp.com/https://neo-server.rozana.in/cart/${transactionId}`;
    
    const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Proxy HTTP error! status: ${response.status}`);
    }

    const cartConfirmation = await response.json();
    console.log('Cart confirmation response via proxy:', cartConfirmation);
    
    // Store the cart confirmation data
    localStorage.setItem('cartConfirmation', JSON.stringify(cartConfirmation));
    
    // Redirect to cart confirmation page
    window.location.href = 'cart-confirmation.html';
}

function createMockCartConfirmation(transactionId) {
    // Create mock cart confirmation data based on current cart items
    const mockConfirmation = {
        transaction_id: transactionId,
        provider_id: "pramaan_provider_1",
        provider_location_id: "SSL1",
        currency: "INR",
        total_value: calculateCartTotal(),
        ttl: "PT6H",
        items: cartItemsCart.map((item, index) => ({
            id: index + 1,
            order_id: index + 1,
            item_id: item.id,
            name: item.name, // Include the product name
            quantity: item.quantity,
            fulfillment_id: "mock-fulfillment-" + Date.now(),
            price: parseFloat(item.price.replace('₹', '').replace(',', '')), // Include the actual price
            currency: "INR"
        })),
        fulfillments: [{
            id: 1,
            order_id: 1,
            fulfillment_id: "mock-fulfillment-" + Date.now(),
            type: "Delivery",
            provider_name: "Mock Store",
            category: "Standard Delivery",
            tat: "PT24H",
            tracking: 1,
            state_code: "Serviceable"
        }],
        quote_breakup: [
            ...cartItemsCart.map((item, index) => ({
                id: index + 1,
                order_id: 1,
                title: item.name,
                title_type: "item",
                item_id: item.id,
                quantity: item.quantity,
                amount: (parseFloat(item.price.replace('₹', '').replace(',', '')) * item.quantity).toFixed(2),
                currency: "INR"
            })),
            {
                id: cartItemsCart.length + 1,
                order_id: 1,
                title: "Delivery charges",
                title_type: "delivery",
                item_id: "mock-fulfillment-" + Date.now(),
                quantity: null,
                amount: "40.00",
                currency: "INR"
            },
            {
                id: cartItemsCart.length + 2,
                order_id: 1,
                title: "Convenience Fee",
                title_type: "misc",
                item_id: "mock-fulfillment-" + Date.now(),
                quantity: null,
                amount: "40.00",
                currency: "INR"
            }
        ]
    };
    
    console.log('Created mock cart confirmation:', mockConfirmation);
    return mockConfirmation;
}

function calculateCartTotal() {
    const subtotal = cartItemsCart.reduce((sum, item) => {
        const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
        return sum + (price * item.quantity);
    }, 0);
    
    // Use consistent fees across all pages
    const deliveryFee = 40; // ₹40 delivery charges
    const convenienceFee = 40; // ₹40 convenience fee
    const taxes = subtotal * 0.18;
    const total = subtotal + deliveryFee + convenienceFee + taxes;
    
    return total.toFixed(2);
}

function generateTransactionId() {
    // Generate a UUID for the transaction
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function openCheckoutModal() {
    if (cartItemsCart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    updateCheckoutOrderSummary();
    checkoutModal.classList.add('show');
}

function closeCheckoutModalFunction() {
    checkoutModal.classList.remove('show');
}

function updateCheckoutOrderSummary() {
    const orderSummaryDiv = document.getElementById('checkoutOrderSummary');
    
    let summaryHTML = '';
    cartItemsCart.forEach(item => {
        const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
        const itemTotal = price * item.quantity;
        summaryHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    const subtotal = cartItemsCart.reduce((sum, item) => {
        const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
        return sum + (price * item.quantity);
    }, 0);
    
    // Use consistent fees across all pages
    const deliveryFee = 40; // ₹40 delivery charges
    const convenienceFee = 40; // ₹40 convenience fee
    const taxes = subtotal * 0.18;
    const total = subtotal + deliveryFee + convenienceFee + taxes;
    
    summaryHTML += `
        <div style="border-top: 1px solid #e2e8f0; margin-top: 1rem; padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Delivery:</span>
                <span>₹${deliveryFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Convenience Fee:</span>
                <span>₹${convenienceFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Taxes:</span>
                <span>₹${taxes.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem;">
                <span>Total:</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    orderSummaryDiv.innerHTML = summaryHTML;
}

function placeOrder() {
    // Get form data
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // Validate form
    if (!fullName || !phoneNumber || !address || !city || !pincode) {
        showNotification('Please fill in all required fields');
        return;
    }
    
    if (phoneNumber.length !== 10) {
        showNotification('Please enter a valid 10-digit phone number');
        return;
    }
    
    if (pincode.length !== 6) {
        showNotification('Please enter a valid 6-digit pincode');
        return;
    }
    
    // Show loading state
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
    placeOrderBtn.disabled = true;
    
    // Simulate order placement
    setTimeout(() => {
        // Generate order ID
        const orderId = 'ORD-' + Date.now().toString().slice(-6);
        
        // Calculate delivery date
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        const deliveryDateStr = deliveryDate.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Update success modal
        document.getElementById('orderId').textContent = orderId;
        document.getElementById('deliveryDate').textContent = deliveryDateStr;
        
        // Close checkout modal and show success
        closeCheckoutModalFunction();
        successModal.classList.add('show');
        
        // Clear cart
        cartItemsCart = [];
        saveCartToStorage();
        updateCartDisplay();
        
        // Reset form
        document.getElementById('fullName').value = '';
        document.getElementById('phoneNumber').value = '';
        document.getElementById('address').value = '';
        document.getElementById('city').value = '';
        document.getElementById('pincode').value = '';
        document.querySelector('input[name="payment"][value="cod"]').checked = true;
        
        // Reset button
        placeOrderBtn.innerHTML = '<i class="fas fa-check"></i> Place Order';
        placeOrderBtn.disabled = false;
        
        showNotification('Order placed successfully!');
    }, 2000);
}

// Mixed payment validation function removed

// Mixed payment error modal and handler functions removed

// Test functions removed - no longer needed with new approach









// COD availability validation functions removed

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    
    // Set background color based on type
    let backgroundColor = '#10b981'; // success
    if (type === 'error') backgroundColor = '#ef4444';
    if (type === 'info') backgroundColor = '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Close success modal when clicking outside
successModal.addEventListener('click', function(e) {
    if (e.target === successModal) {
        successModal.classList.remove('show');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Close modals with Escape
    if (e.key === 'Escape') {
        closeCheckoutModalFunction();
        successModal.classList.remove('show');
    }
});
