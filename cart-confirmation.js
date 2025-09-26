// Cart Confirmation Page JavaScript

// Generate UUID function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Global variables
let cartConfirmationData = null;

// DOM Elements
const transactionIdSpan = document.getElementById('transactionId');
const totalValueSpan = document.getElementById('totalValue');
const itemsListDiv = document.getElementById('itemsList');
const quoteBreakdownDiv = document.getElementById('quoteBreakdown');
const totalValueDisplaySpan = document.getElementById('totalValueDisplay');
const fulfillmentDetailsDiv = document.getElementById('fulfillmentDetails');
const providerDetailsDiv = document.getElementById('providerDetails');
const proceedToCheckoutBtn = document.getElementById('proceedToCheckout');
const copyTransactionIdConfirmationBtn = document.getElementById('copyTransactionIdConfirmation');
const deliveryInfoModal = document.getElementById('deliveryInfoModal');
const closeDeliveryModal = document.getElementById('closeDeliveryModal');
const cancelDeliveryBtn = document.getElementById('cancelDelivery');
const proceedToInitBtn = document.getElementById('proceedToInit');

// Initialize cart confirmation page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CART CONFIRMATION PAGE INITIALIZATION ===');
    
    // Check if we're on the cart confirmation page
    if (!document.getElementById('transactionId')) {
        console.log('Not on cart confirmation page, skipping initialization');
        return;
    }
    
    console.log('Cart confirmation page detected, initializing...');
    
    loadCartConfirmationData();
    setupEventListeners();
    loadTransactionIdFromStorage();
    
    // Ensure transaction ID is displayed immediately
    updateTransactionIdDisplay();
    
    console.log('=== CART CONFIRMATION PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Proceed to checkout button
    if (proceedToCheckoutBtn) {
        proceedToCheckoutBtn.addEventListener('click', function() {
            openDeliveryInfoModal();
        });
    }
    
    // Copy transaction ID button
    if (copyTransactionIdConfirmationBtn) {
        copyTransactionIdConfirmationBtn.addEventListener('click', copyTransactionIdConfirmation);
    }
    
    // Delivery modal event listeners
    if (closeDeliveryModal) {
        closeDeliveryModal.addEventListener('click', closeDeliveryInfoModal);
    }
    
    if (cancelDeliveryBtn) {
        cancelDeliveryBtn.addEventListener('click', closeDeliveryInfoModal);
    }
    
    if (proceedToInitBtn) {
        proceedToInitBtn.addEventListener('click', handleInitEvent);
    }
    
    // Modal click outside to close
    if (deliveryInfoModal) {
        deliveryInfoModal.addEventListener('click', function(e) {
            if (e.target === deliveryInfoModal) {
                closeDeliveryInfoModal();
            }
        });
    }
}

function updateTransactionIdDisplay() {
    if (transactionIdSpan) {
        const storedTransactionId = localStorage.getItem('currentTransactionId');
        if (storedTransactionId) {
            transactionIdSpan.textContent = `Transaction ID: ${storedTransactionId}`;
        } else {
            transactionIdSpan.textContent = 'Transaction ID: Not available';
        }
    }
}

async function loadCartConfirmationData() {
    // First try to get from API using transaction ID
    const transactionId = localStorage.getItem('currentTransactionId');
    
    if (transactionId) {
        try {
            console.log('Fetching order confirmation from API for transaction:', transactionId);
            const orderData = await fetchOrderConfirmation(transactionId);
            if (orderData) {
                cartConfirmationData = orderData;
                displayCartConfirmation();
                return;
            }
        } catch (error) {
            console.error('Error fetching order confirmation from API:', error);
        }
    }
    
    // Fallback to localStorage data
    const savedConfirmation = localStorage.getItem('cartConfirmation');
    
    if (savedConfirmation) {
        try {
            cartConfirmationData = JSON.parse(savedConfirmation);
            displayCartConfirmation();
        } catch (error) {
            console.error('Error parsing cart confirmation data:', error);
            showErrorState();
        }
    } else {
        console.log('No cart confirmation data found');
        showErrorState();
    }
}

function loadTransactionIdFromStorage() {
    const storedTransactionId = localStorage.getItem('currentTransactionId');
    if (storedTransactionId) {
        console.log('Loaded transaction ID from storage:', storedTransactionId);
        // Update the display immediately if we have the transaction ID
        if (transactionIdSpan) {
            transactionIdSpan.textContent = `Transaction ID: ${storedTransactionId}`;
        }
    } else {
        console.log('No transaction ID found in storage');
        // Show "Not available" if no transaction ID is found
        if (transactionIdSpan) {
            transactionIdSpan.textContent = 'Transaction ID: Not available';
        }
    }
}

function displayCartConfirmation() {
    if (!cartConfirmationData) {
        showErrorState();
        return;
    }
    
    console.log('Displaying cart confirmation data:', cartConfirmationData);
    
    // Update transaction ID and total value
    if (transactionIdSpan) {
        const transactionId = cartConfirmationData.transaction_id || localStorage.getItem('currentTransactionId') || 'Not available';
        transactionIdSpan.textContent = `Transaction ID: ${transactionId}`;
    }
    
    if (totalValueSpan) {
        totalValueSpan.textContent = `Total: ₹${cartConfirmationData.total_value}`;
    }
    
    if (totalValueDisplaySpan) {
        totalValueDisplaySpan.textContent = `₹${cartConfirmationData.total_value}`;
    }
    
    // Display order status
    displayOrderStatus();
    
    // Update timeline if on order confirmation page
    if (typeof updateStatusTimeline === 'function') {
        updateStatusTimeline();
    }
    
    // Display items
    displayItems();
    
    // Display quote breakdown
    displayQuoteBreakdown();
    
    // Display fulfillment details
    displayFulfillmentDetails();
    
    // Display provider details
    displayProviderDetails();
}

function displayItems() {
    if (!itemsListDiv || !cartConfirmationData.items) return;
    
    itemsListDiv.innerHTML = '';
    
    // Get original cart items from localStorage to get product names and prices
    const originalCartItems = JSON.parse(localStorage.getItem('ondcCart') || '[]');
    console.log('Original cart items:', originalCartItems);
    console.log('Confirmation data items:', cartConfirmationData.items);
    
    cartConfirmationData.items.forEach((item, index) => {
        // Try to find the original cart item by item_id
        const originalCartItem = originalCartItems.find(cartItem => cartItem.id === item.item_id);
        console.log(`Looking for item ${item.item_id}, found:`, originalCartItem);
        
        const itemName = originalCartItem ? originalCartItem.name : (item.name || `Item ${index + 1}`);
        const itemPrice = originalCartItem ? originalCartItem.price : (item.price ? `₹${item.price}` : 'Price not available');
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-row';
        itemDiv.innerHTML = `
            <div class="item-info">
                <div class="item-name">${itemName}</div>
                <div class="item-details">
                    <span class="item-id">ID: ${item.item_id}</span>
                    <span class="item-quantity">Qty: ${item.quantity}</span>
                </div>
            </div>
            <div class="item-price">
                ${itemPrice}
            </div>
        `;
        itemsListDiv.appendChild(itemDiv);
    });
}

function displayQuoteBreakdown() {
    if (!quoteBreakdownDiv || !cartConfirmationData.quote_breakup) return;
    
    quoteBreakdownDiv.innerHTML = '';
    
    cartConfirmationData.quote_breakup.forEach(item => {
        const breakdownDiv = document.createElement('div');
        breakdownDiv.className = 'breakdown-row';
        breakdownDiv.innerHTML = `
            <div class="breakdown-title">${item.title}</div>
            <div class="breakdown-amount">₹${item.amount}</div>
        `;
        quoteBreakdownDiv.appendChild(breakdownDiv);
    });
}

function displayFulfillmentDetails() {
    if (!fulfillmentDetailsDiv || !cartConfirmationData.fulfillments) return;
    
    fulfillmentDetailsDiv.innerHTML = '';
    
    cartConfirmationData.fulfillments.forEach(fulfillment => {
        const fulfillmentDiv = document.createElement('div');
        fulfillmentDiv.className = 'fulfillment-item';
        fulfillmentDiv.innerHTML = `
            <div class="fulfillment-type">
                <i class="fas fa-truck"></i>
                <span>${fulfillment.type}</span>
            </div>
            <div class="fulfillment-details">
                <div class="provider-name">${fulfillment.provider_name}</div>
                <div class="delivery-category">${fulfillment.category}</div>
                <div class="delivery-tat">Estimated delivery: ${fulfillment.tat}</div>
                <div class="delivery-status">Status: ${fulfillment.state_code}</div>
            </div>
        `;
        fulfillmentDetailsDiv.appendChild(fulfillmentDiv);
    });
}

function displayOrderStatus() {
    // Update order status elements
    const orderStatusElement = document.getElementById('orderStatus');
    const paymentStatusElement = document.getElementById('paymentStatus');
    const ondcOrderIdElement = document.getElementById('ondcOrderId');
    
    if (orderStatusElement) {
        const status = cartConfirmationData.order_status || 'Order Placed';
        orderStatusElement.textContent = status;
        orderStatusElement.className = `status-value status-${status.toLowerCase().replace(' ', '-')}`;
    }
    
    if (paymentStatusElement) {
        const paymentStatus = cartConfirmationData.payment_status || 'Unknown';
        paymentStatusElement.textContent = paymentStatus;
        paymentStatusElement.className = `status-value status-${paymentStatus.toLowerCase()}`;
    }
    
    if (ondcOrderIdElement) {
        const ondcOrderId = cartConfirmationData.ondc_order_id || 'Not assigned';
        ondcOrderIdElement.textContent = ondcOrderId;
    }
}

function displayProviderDetails() {
    if (!providerDetailsDiv) return;
    
    providerDetailsDiv.innerHTML = `
        <div class="provider-info">
            <div class="provider-id">Provider ID: ${cartConfirmationData.provider_id}</div>
            <div class="provider-location">Location: ${cartConfirmationData.provider_location_id}</div>
            <div class="currency">Currency: ${cartConfirmationData.currency}</div>
            <div class="ttl">Valid for: ${cartConfirmationData.ttl}</div>
        </div>
    `;
}

function copyTransactionIdConfirmation() {
    if (transactionIdSpan && cartConfirmationData && cartConfirmationData.transaction_id) {
        navigator.clipboard.writeText(cartConfirmationData.transaction_id).then(() => {
            showNotification('Transaction ID copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy transaction ID', 'error');
        });
    } else {
        showNotification('No transaction ID available to copy', 'error');
    }
}

function showErrorState() {
    if (transactionIdSpan) {
        transactionIdSpan.textContent = 'Transaction ID: Not available';
    }
    
    if (totalValueSpan) {
        totalValueSpan.textContent = 'Total: Not available';
    }
    
    if (itemsListDiv) {
        itemsListDiv.innerHTML = '<div class="error-message">No cart confirmation data available</div>';
    }
    
    if (quoteBreakdownDiv) {
        quoteBreakdownDiv.innerHTML = '<div class="error-message">No quote breakdown available</div>';
    }
    
    if (fulfillmentDetailsDiv) {
        fulfillmentDetailsDiv.innerHTML = '<div class="error-message">No fulfillment details available</div>';
    }
    
    if (providerDetailsDiv) {
        providerDetailsDiv.innerHTML = '<div class="error-message">No provider details available</div>';
    }
}

function openDeliveryInfoModal() {
    if (deliveryInfoModal) {
        deliveryInfoModal.classList.add('show');
    }
}

function closeDeliveryInfoModal() {
    if (deliveryInfoModal) {
        deliveryInfoModal.classList.remove('show');
    }
}

async function handleInitEvent() {
    try {
        // Validate form
        const deliveryInfo = validateDeliveryForm();
        if (!deliveryInfo) {
            return;
        }
        
        // Show loading state
        proceedToInitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        proceedToInitBtn.disabled = true;
        
        // Create init payload
        const initPayload = createInitPayload(deliveryInfo);
        
        // Send init event
        const response = await sendInitEvent(initPayload);
        
        // Store delivery information for payment page
        localStorage.setItem('deliveryInfo', JSON.stringify(deliveryInfo));
        
        // Show success notification
        showNotification('Order initialized successfully! Redirecting to payment...', 'success');
        
        // Close modal
        closeDeliveryInfoModal();
        
        // Redirect to payment page
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error handling init event:', error);
        showNotification('Failed to initialize order. Please try again.', 'error');
        
        // Reset button state
        proceedToInitBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Proceed to Payment';
        proceedToInitBtn.disabled = false;
    }
}

function validateDeliveryForm() {
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();
    const buyerEmail = document.getElementById('buyerEmail').value.trim();
    const building = document.getElementById('building').value.trim();
    const street = document.getElementById('street').value.trim();
    const locality = document.getElementById('locality').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const landmark = document.getElementById('landmark').value.trim();
    const taxNumber = document.getElementById('taxNumber').value.trim();
    
    // Validate required fields
    if (!buyerName || !buyerPhone || !buyerEmail || !building || !street || !locality || !city || !state || !pincode) {
        showNotification('Please fill in all required fields', 'error');
        return null;
    }
    
    // Validate phone number
    if (buyerPhone.length !== 10) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return null;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
        showNotification('Please enter a valid email address', 'error');
        return null;
    }
    
    // Validate pincode
    if (pincode.length !== 6) {
        showNotification('Please enter a valid 6-digit pincode', 'error');
        return null;
    }
    
    return {
        buyerName,
        buyerPhone,
        buyerEmail,
        building,
        street,
        locality,
        city,
        state,
        pincode,
        landmark,
        taxNumber
    };
}

function createInitPayload(deliveryInfo) {
    const transactionId = localStorage.getItem('currentTransactionId');
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    const orderId = 'order-' + Date.now();
    
    // Get cart confirmation data
    const cartConfirmation = JSON.parse(localStorage.getItem('cartConfirmation') || '{}');
    
    // Create items array from cart confirmation - using exact structure from payload
    const items = cartConfirmation.items ? cartConfirmation.items.map(item => ({
        id: item.item_id,
        descriptor: {
            name: item.name || 'Product'
        },
        quantity: {
            count: item.quantity,
            measure: {
                unit: "kilogram",
                value: "1"
            }
        },
        price: {
            currency: "INR",
            value: item.price ? item.price.toString() : "0.00",
            maximum_value: item.price ? item.price.toString() : "0.00"
        },
        location_id: "SSL1",
        fulfillment_id: "f1166011-2ef3-4392-a5c8-9362ebe59c5b"
    })) : [];
    
    // Create quote breakdown from cart confirmation
    const quoteBreakup = cartConfirmation.quote_breakup || [];
    
    const payload = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:01Q1",
            "action": "init",
            "core_version": "1.2.0",
            "bap_id": "neo-server.rozana.in",
            "bap_uri": "https://neo-server.rozana.in/bapl",
            "bpp_id": "pramaan.ondc.org/beta/preprod/mock/seller",
            "bpp_uri": "https://pramaan.ondc.org/beta/preprod/mock/seller",
            "transaction_id": transactionId,
            "message_id": messageId,
            "timestamp": timestamp,
            "ttl": "PT30S"
        },
        "message": {
            "order": {
                "id": orderId,
                "state": "Created",
                "created_at": timestamp,
                "updated_at": timestamp,
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
                        "id": "f1166011-2ef3-4392-a5c8-9362ebe59c5b",
                        "type": "Delivery",
                        "tracking": true,
                        "@ondc/org/provider_name": "Pramaan Store 1",
                        "@ondc/org/category": "Standard Delivery",
                        "@ondc/org/TAT": "PT24H",
                        "start": {
                            "location": {
                                "id": "SSL1",
                                "gps": "28.527300,77.182100",
                                "address": {
                                    "name": "Pramaan Store SSL1",
                                    "building": "Building A, Shop 12",
                                    "locality": "N. Caldwell",
                                    "street": "633 Stagtrail Rd",
                                    "city": "New Delhi",
                                    "state": "New Delhi",
                                    "country": "IND",
                                    "area_code": "110030",
                                    "landmark": "Near Mall Entrance"
                                }
                            },
                            "contact": {
                                "phone": "9876543210",
                                "email": "ss_seller_1@ss.com"
                            }
                        },
                        "end": {
                            "location": {
                                "gps": "28.613900,77.209000",
                                "address": {
                                    "name": deliveryInfo.buyerName,
                                    "building": deliveryInfo.building,
                                    "locality": deliveryInfo.locality,
                                    "street": deliveryInfo.street,
                                    "city": deliveryInfo.city,
                                    "state": deliveryInfo.state,
                                    "country": "IND",
                                    "area_code": deliveryInfo.pincode,
                                    "landmark": deliveryInfo.landmark || ""
                                }
                            },
                            "contact": {
                                "phone": deliveryInfo.buyerPhone,
                                "email": deliveryInfo.buyerEmail
                            },
                            "person": {
                                "name": deliveryInfo.buyerName,
                                "phones": [
                                    {
                                        "type": "mobile",
                                        "number": deliveryInfo.buyerPhone
                                    }
                                ],
                                "emails": [
                                    deliveryInfo.buyerEmail
                                ]
                            }
                        }
                    }
                ],
                "billing": {
                    "name": deliveryInfo.buyerName,
                    "address": {
                        "name": deliveryInfo.buyerName,
                        "building": deliveryInfo.building,
                        "locality": deliveryInfo.locality,
                        "street": deliveryInfo.street,
                        "city": deliveryInfo.city,
                        "state": deliveryInfo.state,
                        "country": "IND",
                        "area_code": deliveryInfo.pincode,
                        "landmark": deliveryInfo.landmark || ""
                    },
                    "phone": deliveryInfo.buyerPhone,
                    "email": deliveryInfo.buyerEmail,
                    "tax_number": deliveryInfo.taxNumber || "",
                    "created_at": timestamp,
                    "updated_at": timestamp
                },
                "quote": {
                    "price": {
                        "currency": "INR",
                        "value": cartConfirmation.total_value || "0.00"
                    },
                    "breakup": quoteBreakup,
                    "ttl": "PT6H"
                },
                // "payment": {
                //     "type": "PREPAID",
                //     "status": "NOT-PAID",
                //     "collected_by": "BAP",
                //     "params": {
                //         "amount": cartConfirmation.total_value || "0.00",
                //         "currency": "INR",
                //         "transaction_reference": "payref-" + orderId,
                //         "transaction_id": "txn-" + orderId,
                //         "collected_at": timestamp
                //     },
                //     "uri": "https://example.payment.gateway/collect",
                //     "@ondc/org/settlement_basis": "seller_app_billing",
                //     "@ondc/org/settlement_window": "T+2",
                //     "@ondc/org/withholding_amount": "0.00",
                //     "@ondc/org/buyer_app_finder_fee_type": "percent",
                //     "@ondc/org/buyer_app_finder_fee_amount": "3.00",
                //     "@ondc/org/settlement_details": [
                //         {
                //             "settlement_counterparty": "seller-app",
                //             "beneficiary_name": "SEQUELSTRING AI",
                //             "settlement_bank_account_no": "9876543210012",
                //             "settlement_ifsc_code": "AXIS123456",
                //             "settlement_phase": "sale-amount",
                //             "settlement_status": "NOT-PAID",
                //             "bank_name": "AXIS BANK LTD",
                //             "branch_name": "NAVI MUMBAI",
                //             "settlement_type": "neft"
                //         }
                //     ]
                // },
                // "tags": [
                //     {
                //         "code": "payment_intent",
                //         "value": "prepaid",
                //         "list": [
                //             {
                //                 "name": "intent",
                //                 "value": "prepaid"
                //             }
                //         ]
                //     },
                //     {
                //         "code": "delivery_type",
                //         "value": "standard",
                //         "list": [
                //             {
                //                 "name": "type",
                //                 "value": "standard"
                //             }
                //         ]
                //     }
                // ]
            }
        }
    };
    
    console.log('Created init payload:', payload);
    return payload;
}

async function sendInitEvent(payload) {
    try {
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/init', {
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
        console.log('Init event response:', result);
        return result;

    } catch (error) {
        console.error('Error sending init event:', error);
        throw error;
    }
}


async function fetchOrderConfirmation(transactionId) {
    try {
        const response = await fetch(`https://neo-server.rozana.in/order/${transactionId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const orderData = await response.json();
        console.log('Order confirmation API response:', orderData);
        
        // Store the order data for future reference
        localStorage.setItem('orderConfirmation', JSON.stringify(orderData));
        
        return orderData;

    } catch (error) {
        console.error('Error fetching order confirmation:', error);
        throw error;
    }
}

async function checkOrderStatus() {
    const transactionId = localStorage.getItem('currentTransactionId');
    
    if (!transactionId) {
        showNotification('No transaction ID found', 'error');
        return;
    }
    
    try {
        showNotification('Checking order status...', 'info');
        
        const orderData = await fetchOrderConfirmation(transactionId);
        
        if (orderData) {
            // Update the display with fresh data
            cartConfirmationData = orderData;
            displayCartConfirmation();
            
            // Show status-specific notification
            const status = orderData.order_status || 'Unknown';
            const paymentStatus = orderData.payment_status || 'Unknown';
            
            showNotification(`Order Status: ${status} | Payment: ${paymentStatus}`, 'success');
        }
        
    } catch (error) {
        console.error('Error checking order status:', error);
        showNotification('Failed to check order status. Please try again.', 'error');
    }
}

function showNotification(message, type = 'info') {
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
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
