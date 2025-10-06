// Payment page JavaScript
console.log('=== PAYMENT PAGE INITIALIZATION ===');

// Generate UUID function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// DOM Elements
const paymentTransactionIdSpan = document.getElementById('paymentTransactionId');
const paymentTotalAmountSpan = document.getElementById('paymentTotalAmount');
const orderItemsDiv = document.getElementById('orderItems');
const subtotalAmountSpan = document.getElementById('subtotalAmount');
const deliveryAmountSpan = document.getElementById('deliveryAmount');
const convenienceAmountSpan = document.getElementById('convenienceAmount');
const finalTotalAmountSpan = document.getElementById('finalTotalAmount');
const billingInfoDiv = document.getElementById('billingInfo');
const paymentForm = document.getElementById('paymentForm');
const payNowBtn = document.getElementById('payNowBtn');
const loadingModal = document.getElementById('loadingModal');
const successModal = document.getElementById('successModal');

// Payment type and method radio buttons
const paymentTypeRadios = document.querySelectorAll('input[name="paymentType"]');
const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
const paymentMethodsSection = document.getElementById('paymentMethodsSection');
const cardDetailsDiv = document.getElementById('cardDetails');
const upiDetailsDiv = document.getElementById('upiDetails');
const netbankingDetailsDiv = document.getElementById('netbankingDetails');
const walletDetailsDiv = document.getElementById('walletDetails');
const postpaidDetailsDiv = document.getElementById('postpaidDetails');

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PAYMENT PAGE INITIALIZATION ===');
    
    loadPaymentData();
    setupEventListeners();
    setupPaymentMethodHandlers();
    setupPaymentTypeOptions();
    
    console.log('=== PAYMENT PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Payment form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmission);
    }
    
    // Payment type selection
    paymentTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            handlePaymentTypeChange(this.value);
        });
    });
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }
    
    // Expiry date formatting
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', formatExpiryDate);
    }
    
    // CVV formatting
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', formatCVV);
    }
}

function setupPaymentMethodHandlers() {
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            showPaymentDetails(this.value);
        });
    });
}

function setupPaymentTypeOptions() {
    // Check COD availability and set payment type options accordingly
    const codValidation = validateCODAvailabilityForPayment();
    console.log('Payment page - COD validation result:', codValidation);
    
    if (!codValidation.isValid) {
        console.log('❌ Some items don\'t support COD, disabling COD option on payment page');
        disableCODOnPaymentPage(codValidation.nonCODItems);
    } else {
        console.log('✅ All items support COD, enabling COD option on payment page');
        enableCODOnPaymentPage();
    }
}

function validateCODAvailabilityForPayment() {
    // Get cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('ondcCart') || '[]');
    const nonCODItems = cartItems.filter(item => {
        // Check if item has COD availability info and it's false
        return item.available_on_cod === false || item.available_on_cod === 0;
    });
    
    return {
        isValid: nonCODItems.length === 0,
        nonCODItems: nonCODItems
    };
}

function disableCODOnPaymentPage(nonCODItems) {
    // Find the postpaid (COD) payment type option
    const postpaidRadio = document.querySelector('input[name="paymentType"][value="postpaid"]');
    const postpaidLabel = postpaidRadio?.parentElement;
    
    if (!postpaidRadio || !postpaidLabel) {
        console.error('Postpaid payment option elements not found');
        return;
    }
    
    // Disable COD option
    postpaidRadio.disabled = true;
    postpaidLabel.classList.add('disabled');
    
    // Add disabled indicator
    const existingIndicator = postpaidLabel.querySelector('.cod-disabled-indicator');
    if (!existingIndicator) {
        const indicator = document.createElement('span');
        indicator.className = 'cod-disabled-indicator';
        indicator.textContent = '(Not available for some items)';
        postpaidLabel.appendChild(indicator);
    }
    
    // Select prepaid (online payment) by default
    const prepaidRadio = document.querySelector('input[name="paymentType"][value="prepaid"]');
    if (prepaidRadio) {
        prepaidRadio.checked = true;
        postpaidRadio.checked = false;
    }
    
    console.log('COD option disabled on payment page due to incompatible items:', nonCODItems.map(item => item.name));
    
    // Show notification
    const itemNames = nonCODItems.map(item => item.name).join(', ');
    showNotification(`COD not available for: ${itemNames}. Online payment selected.`, 'warning');
}

function enableCODOnPaymentPage() {
    // Find the postpaid (COD) payment type option
    const postpaidRadio = document.querySelector('input[name="paymentType"][value="postpaid"]');
    const postpaidLabel = postpaidRadio?.parentElement;
    
    if (!postpaidRadio || !postpaidLabel) {
        console.error('Postpaid payment option elements not found');
        return;
    }
    
    // Enable COD option
    postpaidRadio.disabled = false;
    postpaidLabel.classList.remove('disabled');
    
    // Remove disabled indicator
    const existingIndicator = postpaidLabel.querySelector('.cod-disabled-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Set COD as default
    postpaidRadio.checked = true;
    const prepaidRadio = document.querySelector('input[name="paymentType"][value="prepaid"]');
    if (prepaidRadio) {
        prepaidRadio.checked = false;
    }
}

function loadPaymentData() {
    // Load transaction ID
    const transactionId = localStorage.getItem('currentTransactionId');
    if (transactionId && paymentTransactionIdSpan) {
        paymentTransactionIdSpan.textContent = `Transaction ID: ${transactionId}`;
        paymentTransactionIdSpan.style.color = '#fff';
        paymentTransactionIdSpan.style.fontWeight = '500';
    }
    
    // Load cart confirmation data
    const cartConfirmation = JSON.parse(localStorage.getItem('cartConfirmation') || '{}');
    console.log('Cart confirmation data:', cartConfirmation);
    
    // Display order items
    displayOrderItems(cartConfirmation);
    
    // Display billing information
    displayBillingInfo();
    
    // Update totals
    updatePaymentTotals(cartConfirmation);
}

function displayOrderItems(cartConfirmation) {
    if (!orderItemsDiv) return;
    
    orderItemsDiv.innerHTML = '';
    
    // Get original cart items for display
    const originalCartItems = JSON.parse(localStorage.getItem('ondcCart') || '[]');
    
    if (originalCartItems.length === 0) {
        orderItemsDiv.innerHTML = '<div class="no-items">No items in cart</div>';
        return;
    }
    
    originalCartItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
        itemDiv.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name} ${item.measure ? '(' + item.measure + ')' : ''}</div>
                <div class="item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="item-price">${item.price}</div>
        `;
        
        // Apply styling to ensure visibility
        const itemName = itemDiv.querySelector('.item-name');
        const itemPrice = itemDiv.querySelector('.item-price');
        
        if (itemName) {
            itemName.style.color = '#1f2937';
            itemName.style.fontWeight = '500';
        }
        if (itemPrice) {
            itemPrice.style.color = '#1f2937';
            itemPrice.style.fontWeight = '600';
        }
        orderItemsDiv.appendChild(itemDiv);
    });
}

function displayBillingInfo() {
    if (!billingInfoDiv) return;
    
    // Get delivery information from localStorage (stored during checkout)
    const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
    
    if (Object.keys(deliveryInfo).length > 0) {
        billingInfoDiv.innerHTML = `
            <div class="billing-address">
                <div class="billing-name">${deliveryInfo.buyerName}</div>
                <div class="billing-phone">${deliveryInfo.buyerPhone}</div>
                <div class="billing-email">${deliveryInfo.buyerEmail}</div>
                <div class="billing-address-details">
                    ${deliveryInfo.building}<br>
                    ${deliveryInfo.street}<br>
                    ${deliveryInfo.locality}, ${deliveryInfo.city}<br>
                    ${deliveryInfo.state} - ${deliveryInfo.pincode}
                    ${deliveryInfo.landmark ? `<br>Landmark: ${deliveryInfo.landmark}` : ''}
                </div>
            </div>
        `;
    } else {
        billingInfoDiv.innerHTML = '<div class="error-message">Billing information not available</div>';
    }
}

function updatePaymentTotals(cartConfirmation) {
    console.log('Updating payment totals with data:', cartConfirmation);
    
    // Get original cart items to calculate subtotal
    const originalCartItems = JSON.parse(localStorage.getItem('ondcCart') || '[]');
    let subtotal = 0;
    
    // Calculate subtotal from original cart items
    originalCartItems.forEach(item => {
        const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
        subtotal += price * item.quantity;
    });
    
    // Use consistent fees across all pages
    const delivery = 40; // ₹40 delivery charges
    const convenience = 40; // ₹40 convenience fee
    
    // Calculate total
    const total = subtotal + delivery + convenience;
    
    console.log('Calculated totals:', { subtotal, delivery, convenience, total });
    
    // Update display with proper styling
    if (subtotalAmountSpan) {
        subtotalAmountSpan.textContent = `₹${subtotal.toFixed(2)}`;
        subtotalAmountSpan.style.color = '#fff';
        subtotalAmountSpan.style.fontWeight = '600';
    }
    if (deliveryAmountSpan) {
        deliveryAmountSpan.textContent = `₹${delivery.toFixed(2)}`;
        deliveryAmountSpan.style.color = '#fff';
        deliveryAmountSpan.style.fontWeight = '600';
    }
    if (convenienceAmountSpan) {
        convenienceAmountSpan.textContent = `₹${convenience.toFixed(2)}`;
        convenienceAmountSpan.style.color = '#fff';
        convenienceAmountSpan.style.fontWeight = '600';
    }
    if (finalTotalAmountSpan) {
        finalTotalAmountSpan.textContent = `₹${total.toFixed(2)}`;
        finalTotalAmountSpan.style.color = '#fff';
        finalTotalAmountSpan.style.fontWeight = '700';
        finalTotalAmountSpan.style.fontSize = '1.2rem';
    }
    if (paymentTotalAmountSpan) {
        paymentTotalAmountSpan.textContent = `Total: ₹${total.toFixed(2)}`;
        paymentTotalAmountSpan.style.color = '#fff';
        paymentTotalAmountSpan.style.fontWeight = '600';
    }
}

function handlePaymentTypeChange(paymentType) {
    if (paymentType === 'postpaid') {
        // Hide payment methods section for post-paid
        if (paymentMethodsSection) {
            paymentMethodsSection.style.display = 'none';
        }
        
        // Hide all payment method details
        const allDetails = [cardDetailsDiv, upiDetailsDiv, netbankingDetailsDiv, walletDetailsDiv];
        allDetails.forEach(div => {
            if (div) div.style.display = 'none';
        });
        
        // Show post-paid details
        if (postpaidDetailsDiv) {
            postpaidDetailsDiv.style.display = 'block';
        }
        
        // Update pay button text
        if (payNowBtn) {
            payNowBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Order';
        }
    } else {
        // Show payment methods section for pre-paid
        if (paymentMethodsSection) {
            paymentMethodsSection.style.display = 'block';
        }
        
        // Hide post-paid details
        if (postpaidDetailsDiv) {
            postpaidDetailsDiv.style.display = 'none';
        }
        
        // Show default payment method (card)
        showPaymentDetails('card');
        
        // Update pay button text
        if (payNowBtn) {
            payNowBtn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
        }
    }
}

function showPaymentDetails(paymentMethod) {
    // Hide all payment details
    const allDetails = [cardDetailsDiv, upiDetailsDiv, netbankingDetailsDiv, walletDetailsDiv];
    allDetails.forEach(div => {
        if (div) div.style.display = 'none';
    });
    
    // Show selected payment method details
    switch (paymentMethod) {
        case 'card':
            if (cardDetailsDiv) cardDetailsDiv.style.display = 'block';
            break;
        case 'upi':
            if (upiDetailsDiv) upiDetailsDiv.style.display = 'block';
            break;
        case 'netbanking':
            if (netbankingDetailsDiv) netbankingDetailsDiv.style.display = 'block';
            break;
        case 'wallet':
            if (walletDetailsDiv) walletDetailsDiv.style.display = 'block';
            break;
    }
}

function formatCardNumber(event) {
    let value = event.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    event.target.value = formattedValue;
}

function formatExpiryDate(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
}

function formatCVV(event) {
    let value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
}

async function handlePaymentSubmission(event) {
    event.preventDefault();
    
    // Check if payment is already blocked
    if (window.paymentBlocked) {
        console.log('🚫 Payment already blocked, ignoring submission request');
        return;
    }

    try {
        // Debug: Log cart items from localStorage
        const cartItems = JSON.parse(localStorage.getItem('ondcCart') || '[]');
        console.log('=== PAYMENT PAGE VALIDATION ===');
        console.log('Payment page - Cart items for validation:', cartItems);
        console.log('Payment page - Cart items length:', cartItems.length);
        
        cartItems.forEach((item, index) => {
            console.log(`Payment Item ${index}: ${item.name}, COD: ${item.available_on_cod}, Type: ${typeof item.available_on_cod}`);
        });
        
        // Payment validation completed - mixed payment handling moved to cart page

        // Validate form
        if (!validatePaymentForm()) {
            return;
        }
        
        // Show loading modal
        showLoadingModal();
        
        // Simulate payment processing
        await processPayment();
        
        // Hide loading modal
        hideLoadingModal();
        
        // Show success modal
        showSuccessModal();
        
        // Redirect to order confirmation page after a short delay
        setTimeout(() => {
            window.location.href = 'order-confirmation.html';
        }, 2000);
        
    } catch (error) {
        console.error('Payment processing error:', error);
        hideLoadingModal();
        
        if (error.message.includes('confirm')) {
            showNotification('Order confirmation failed. Please try again.', 'error');
        } else {
            showNotification('Payment failed. Please try again.', 'error');
        }
    }
}

function validatePaymentForm() {
    // Check if terms and conditions are agreed to
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    if (!agreeTermsCheckbox || !agreeTermsCheckbox.checked) {
        showNotification('Please accept the Terms and Conditions to proceed', 'error');
        return false;
    }
    
    const selectedType = document.querySelector('input[name="paymentType"]:checked');
    
    // Check if payment type is selected and valid
    if (!selectedType) {
        showNotification('Please select a payment type');
        return false;
    }
    
    // Check if COD is selected but disabled
    if (selectedType.value === 'postpaid' && selectedType.disabled) {
        showNotification('COD is not available for some items in your cart. Please select online payment.');
        return false;
    }
    
    if (selectedType.value === 'postpaid') {
        // For post-paid, no additional validation needed
        return true;
    } else {
        // For pre-paid, validate payment method
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        switch (selectedMethod) {
            case 'card':
                return validateCardPayment();
            case 'upi':
                return validateUPIPayment();
            case 'netbanking':
                return validateNetBankingPayment();
            case 'wallet':
                return validateWalletPayment();
            default:
                return false;
        }
    }
}

function validateCardPayment() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value.trim();
    
    if (!cardNumber || cardNumber.length < 16) {
        showNotification('Please enter a valid card number', 'error');
        return false;
    }
    
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showNotification('Please enter a valid expiry date (MM/YY)', 'error');
        return false;
    }
    
    if (!cvv || cvv.length < 3) {
        showNotification('Please enter a valid CVV', 'error');
        return false;
    }
    
    if (!cardName) {
        showNotification('Please enter the name on card', 'error');
        return false;
    }
    
    return true;
}

function validateUPIPayment() {
    const upiId = document.getElementById('upiId').value.trim();
    
    if (!upiId) {
        showNotification('Please enter your UPI ID', 'error');
        return false;
    }
    
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId)) {
        showNotification('Please enter a valid UPI ID', 'error');
        return false;
    }
    
    return true;
}

function validateNetBankingPayment() {
    const bankName = document.getElementById('bankName').value;
    
    if (!bankName) {
        showNotification('Please select your bank', 'error');
        return false;
    }
    
    return true;
}

function validateWalletPayment() {
    const walletType = document.getElementById('walletType').value;
    
    if (!walletType) {
        showNotification('Please select your wallet', 'error');
        return false;
    }
    
    return true;
}

async function processPayment() {
    const selectedType = document.querySelector('input[name="paymentType"]:checked').value;
    
    if (selectedType === 'postpaid') {
        // For post-paid, just simulate order confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Order confirmed for COD');
        
        // Send confirm event for post-paid
        await sendConfirmEvent();
    } else {
        // For pre-paid, simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('Payment processed successfully');
        
        // Send confirm event for pre-paid
        await sendConfirmEvent();
    }
    
    // Clear cart after successful order confirmation
    clearCartAfterOrder();
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
        const selectedType = document.querySelector('input[name="paymentType"]:checked');
        const isPostpaid = selectedType && selectedType.value === 'postpaid';
        
        const successTitle = document.getElementById('successTitle');
        const successMessage = document.getElementById('successMessage');
        
        if (isPostpaid) {
            if (successTitle) successTitle.textContent = 'Order Confirmed!';
            if (successMessage) successMessage.textContent = 'Your order has been confirmed. You will pay in cash when the delivery person arrives.';
        } else {
            if (successTitle) successTitle.textContent = 'Payment Successful!';
            if (successMessage) successMessage.textContent = 'Your order has been confirmed and payment processed successfully.';
        }
        
        successModal.classList.add('show');
    }
}

async function sendConfirmEvent() {
    try {
        const confirmPayload = createConfirmPayload();
        console.log('Sending confirm event:', confirmPayload);
        
        // Validate payload before sending
        if (!confirmPayload.message || !confirmPayload.message.order || !confirmPayload.message.order.items || confirmPayload.message.order.items.length === 0) {
            throw new Error('Invalid confirm payload: items array is empty or missing');
        }
        
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(confirmPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Confirm event response:', result);
        return result;

    } catch (error) {
        console.error('Error sending confirm event:', error);
        throw error;
    }
}

function createConfirmPayload() {
    const transactionId = localStorage.getItem('currentTransactionId');
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    const orderId = 'O' + Date.now();
    
    // Get cart confirmation data
    const cartConfirmation = JSON.parse(localStorage.getItem('cartConfirmation') || '{}');
    const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
    const selectedType = document.querySelector('input[name="paymentType"]:checked').value;
    
    console.log('Cart confirmation data:', cartConfirmation);
    console.log('Delivery info:', deliveryInfo);
    console.log('Selected payment type:', selectedType);
    
    // Create items array from cart confirmation
    let items = [];
    
    if (cartConfirmation.items && cartConfirmation.items.length > 0) {
        items = cartConfirmation.items.map(item => ({
            id: item.item_id,
            fulfillment_id: "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
            quantity: {
                count: item.quantity
            }
        }));
    } else {
        // Fallback: try to get items from original cart data
        const originalCartItems = JSON.parse(localStorage.getItem('ondcCart') || '[]');
        console.log('Cart confirmation items not found, using original cart items:', originalCartItems);
        
        if (originalCartItems.length > 0) {
            items = originalCartItems.map((item, index) => ({
                id: item.id || `item_${index + 1}`,
                fulfillment_id: "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
                quantity: {
                    count: item.quantity || 1
                }
            }));
        }
    }
    
    // Ensure we have at least one item - create a default item if none exist
    if (items.length === 0) {
        console.log('No items found in cart confirmation or original cart, creating default item');
        items.push({
            id: "default_item_1",
            fulfillment_id: "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
            quantity: {
                count: 1
            }
        });
    }
    
    console.log('Items array:', items);
    
    // Create offers array (if any)
    const offers = cartConfirmation.offers || [
        {
            "id": "BUY2GET3",
            "descriptor": {
                "code": "discount",
                "name": "Buy 2 Get 3 Offer"
            },
            "location_ids": [
                "SSL1"
            ],
            "item_ids": [
                "id_13owvn_0_0"
            ],
            "time": {
                "label": "valid",
                "range": {
                    "start": "2025-09-09T05:37:37.522Z",
                    "end": "2025-09-09T23:59:59.000Z"
                }
            }
        }
    ];
    
    // Create quote breakdown
    let quoteBreakup = cartConfirmation.quote_breakup || [];
    
    // Ensure we have at least one quote breakdown item
    if (quoteBreakup.length === 0) {
        quoteBreakup = [
            {
                "@ondc/org/item_id": items[0].id,
                "@ondc/org/item_quantity": {
                    "count": items[0].quantity.count
                },
                "title": "Product",
                "@ondc/org/title_type": "item",
                "price": {
                    "currency": "INR",
                    "value": "65.00"
                },
                "item": {
                    "price": {
                        "currency": "INR",
                        "value": "65.00"
                    }
                }
            },
            {
                "@ondc/org/item_id": "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
                "title": "Delivery charges",
                "@ondc/org/title_type": "delivery",
                "price": {
                    "currency": "INR",
                    "value": "40.00"
                }
            },
            {
                "@ondc/org/item_id": "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
                "title": "Convenience Fee",
                "@ondc/org/title_type": "misc",
                "price": {
                    "currency": "INR",
                    "value": "40.00"
                }
            }
        ];
    }
    
    console.log('Quote breakdown:', quoteBreakup);
    
    const payload = {
        "context": {
            "domain": "ONDC:RET10",
            "action": "confirm",
            "core_version": "1.2.0",
            "bap_id": "neo-server.rozana.in",
            "bap_uri": "https://neo-server.rozana.in/bapl",
            "bpp_id": "pramaan.ondc.org/beta/preprod/mock/seller",
            "bpp_uri": "https://pramaan.ondc.org/beta/preprod/mock/seller",
            "transaction_id": transactionId,
            "message_id": messageId,
            "timestamp": timestamp,
            "city": "std:011",
            "country": "IND",
            "ttl": "PT30S"
        },
        "message": {
            "order": {
                "id": orderId,
                "state": "Created",
                "provider": {
                    "id": "pramaan_provider_1",
                    "locations": [
                        {
                            "id": "SSL1"
                        }
                    ]
                },
                "items": items,
                "offers": offers,
                "billing": {
                    "name": deliveryInfo.buyerName || "ONDC buyer",
                    "address": {
                        "name": deliveryInfo.buyerName || "my house or door or floor #",
                        "building": deliveryInfo.building || "my building name or house #",
                        "locality": deliveryInfo.locality || "N. Caldwell",
                        "city": deliveryInfo.city || "New Delhi",
                        "state": deliveryInfo.state || "New Delhi",
                        "country": "IND",
                        "area_code": deliveryInfo.pincode || "110030"
                    },
                    "phone": deliveryInfo.buyerPhone || "9886098860",
                    "email": deliveryInfo.buyerEmail || "nobody@nomail.com",
                    "created_at": timestamp,
                    "updated_at": timestamp
                },
                "fulfillments": [
                    {
                        "id": "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
                        "type": "Delivery",
                        "@ondc/org/TAT": "PT24H",
                        "tracking": true,
                        "end": {
                            "person": {
                                "name": deliveryInfo.buyerName || "John Doe"
                            },
                            "contact": {
                                "email": deliveryInfo.buyerEmail || "ss_seller_1@ss.com",
                                "phone": deliveryInfo.buyerPhone || "9876543210"
                            },
                            "location": {
                                "gps": "28.527300,77.182100",
                                "address": {
                                    "name": deliveryInfo.buyerName || "my house or door or floor #",
                                    "building": deliveryInfo.building || "my building name or house #",
                                    "locality": deliveryInfo.locality || "N. Caldwell",
                                    "city": deliveryInfo.city || "New Delhi",
                                    "state": deliveryInfo.state || "New Delhi",
                                    "country": "IND",
                                    "area_code": deliveryInfo.pincode || "110030"
                                }
                            }
                        },
                        "vehicle": {
                            "registration": "DL01AB1234"
                        }
                    }
                ],
                "quote": {
                    "price": {
                        "currency": "INR",
                        "value": cartConfirmation.total_value || "145.00"
                    },
                    "breakup": quoteBreakup,
                    "ttl": "PT6H"
                },
                "payment": {
                    "uri": "https://ondc.transaction.com/payment",
                    "tl_method": "http/get",
                    "params": {
                        "currency": "INR",
                        "transaction_id": "3937",
                        "amount": cartConfirmation.total_value || "145.00"
                    },
                    "status": selectedType === 'postpaid' ? "NOT-PAID" : "PAID",
                    "type": selectedType === 'postpaid' ? "ON-Fulfillment" : "PREPAID",
                    "collected_by":  selectedType === 'postpaid' ? "BPP" : "BAP",
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3",
                    "@ondc/org/settlement_basis": "delivery",
                    "@ondc/org/settlement_window": "P1D",
                    "@ondc/org/withholding_amount": "10.00",
                    "@ondc/org/settlement_details": [
                        {
                            "settlement_counterparty": "seller-app",
                            "settlement_phase": "sale-amount",
                            "settlement_type": "upi",
                            "upi_address": "gft@oksbi",
                            "settlement_bank_account_no": "XXXXXXXXXX",
                            "settlement_ifsc_code": "XXXXXXXXX",
                            "beneficiary_name": "xxxxx",
                            "bank_name": "xxxx",
                            "branch_name": "xxxx"
                        }
                    ]
                },
                "tags": [
                    {
                        "code": "bpp_terms",
                        "list": [
                            {
                                "code": "np_type",
                                "value": "MSN"
                            }
                        ]
                    },
                    {
                        "code": "bap_terms",
                        "list": [
                            {
                                "code": "static_terms_new",
                                "value": "https://github.com/ONDC-Official/NP-Static-Terms/buyerNP_BNP/1.0/tc.pdf"
                            }
                        ]
                    }
                ],
                "created_at": timestamp,
                "updated_at": timestamp
            }
        }
    };
    
    console.log('Created confirm payload:', payload);
    return payload;
}

function clearCartAfterOrder() {
    try {
        // Clear cart from localStorage
        localStorage.removeItem('ondcCart');
        localStorage.removeItem('cartConfirmation');
        localStorage.removeItem('deliveryInfo');
        
        console.log('Cart cleared after successful order confirmation');
        
        // Show notification
        showNotification('Order confirmed! Cart has been cleared.', 'success');
        
    } catch (error) {
        console.error('Error clearing cart after order:', error);
    }
}

// Mixed payment validation function removed - now handled in cart page

// Mixed payment error functions removed - now handled in cart page

// Test function to demonstrate COD availability handling on payment page
function testPaymentPageCODAvailability() {
    console.log('🧪 Testing COD availability handling on payment page...');
    
    // Create test cart with mixed payment methods
    const testItems = [
        {
            id: 'cod-item-1',
            name: 'Fresh Vegetables (COD Available)',
            price: '₹150',
            seller: 'Green Farm',
            available_on_cod: true,
            quantity: 1
        },
        {
            id: 'non-cod-item-1',
            name: 'Electronics (Online Payment Only)',
            price: '₹5000',
            seller: 'Tech Store',
            available_on_cod: false,
            quantity: 1
        }
    ];
    
    // Save test cart to localStorage
    localStorage.setItem('ondcCart', JSON.stringify(testItems));
    
    console.log('✅ Test cart created with mixed payment methods');
    console.log('Test items:', testItems);
    
    // Test the validation
    const codValidation = validateCODAvailabilityForPayment();
    console.log('Payment page COD validation result:', codValidation);
    
    if (!codValidation.isValid) {
        console.log('✅ COD validation working - non-COD items detected');
        console.log('Non-COD items:', codValidation.nonCODItems.map(item => item.name));
        
        // Disable COD option
        disableCODOnPaymentPage(codValidation.nonCODItems);
        console.log('✅ COD option disabled on payment page');
    } else {
        console.log('❌ COD validation not working - should detect non-COD items');
    }
}

// Make test function globally available
window.testPaymentPageCODAvailability = testPaymentPageCODAvailability;

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
