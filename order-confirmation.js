// Order Confirmation Page JavaScript

// Generate UUID function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Global variables
let orderConfirmationData = null;

// DOM Elements
const transactionIdSpan = document.getElementById('transactionId');
const totalValueSpan = document.getElementById('totalValue');
const totalValueDisplaySpan = document.getElementById('totalValueDisplay');
const itemsListDiv = document.getElementById('itemsList');
const quoteBreakdownDiv = document.getElementById('quoteBreakdown');
const fulfillmentDetailsDiv = document.getElementById('fulfillmentDetails');
const providerDetailsDiv = document.getElementById('providerDetails');
const copyTransactionIdConfirmationBtn = document.getElementById('copyTransactionIdConfirmation');
const cancelOrderBtn = document.getElementById('cancelOrderBtn');
const paymentMethodElement = document.getElementById('paymentMethod');

// Initialize order confirmation page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ORDER CONFIRMATION PAGE INITIALIZATION ===');
    
    // Check if we're on the order confirmation page
    if (!document.getElementById('transactionId')) {
        console.log('Not on order confirmation page, skipping initialization');
        return;
    }
    
    console.log('Order confirmation page detected, initializing...');
    
    loadOrderConfirmationData();
    setupEventListeners();
    loadTransactionIdFromStorage();
    
    // Ensure transaction ID is displayed immediately
    updateTransactionIdDisplay();
    
    console.log('=== ORDER CONFIRMATION PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Copy transaction ID button
    if (copyTransactionIdConfirmationBtn) {
        copyTransactionIdConfirmationBtn.addEventListener('click', copyTransactionIdConfirmation);
    }
}

async function loadOrderConfirmationData() {
    // First try to get from API using transaction ID
    const transactionId = localStorage.getItem('currentTransactionId');
    
    if (transactionId) {
        try {
            console.log('Fetching order confirmation from API for transaction:', transactionId);
            const orderData = await fetchOrderConfirmation(transactionId);
            if (orderData) {
                orderConfirmationData = orderData;
                displayOrderConfirmation();
                return;
            }
        } catch (error) {
            console.error('Error fetching order confirmation from API:', error);
        }
    }
    
    // Fallback to localStorage data
    const savedConfirmation = localStorage.getItem('orderConfirmation');
    
    if (savedConfirmation) {
        try {
            orderConfirmationData = JSON.parse(savedConfirmation);
            displayOrderConfirmation();
        } catch (error) {
            console.error('Error parsing order confirmation data:', error);
            showErrorState();
        }
    } else {
        console.log('No order confirmation data found');
        showErrorState();
    }
}

function loadTransactionIdFromStorage() {
    const storedTransactionId = localStorage.getItem('currentTransactionId');
    if (storedTransactionId) {
        console.log('Loaded transaction ID from storage:', storedTransactionId);
        // Update the display immediately if we have the transaction ID
        if (transactionIdSpan) {
            transactionIdSpan.textContent = storedTransactionId;
        }
    } else {
        console.log('No transaction ID found in storage');
        // Show "Not available" if no transaction ID is found
        if (transactionIdSpan) {
            transactionIdSpan.textContent = 'Not available';
        }
    }
}

function displayOrderConfirmation() {
    if (!orderConfirmationData) {
        showErrorState();
        return;
    }
    
    console.log('Displaying order confirmation data:', orderConfirmationData);
    
    // Set flag to refresh orders list when user navigates to orders page
    localStorage.setItem('refreshOrdersList', 'true');
    
    // Update order ID, transaction ID and total value
    const orderIdElement = document.getElementById('orderId');
    if (orderIdElement) {
        orderIdElement.textContent = orderConfirmationData.ondc_order_id || orderConfirmationData.transaction_id || 'Not assigned';
    }
    
    if (transactionIdSpan) {
        const transactionId = orderConfirmationData.transaction_id || localStorage.getItem('currentTransactionId') || 'Not available';
        transactionIdSpan.textContent = transactionId;
    }
    
    if (totalValueSpan) {
        totalValueSpan.textContent = `₹${orderConfirmationData.total_value || '0.00'}`;
    }
    
    if (totalValueDisplaySpan) {
        totalValueDisplaySpan.textContent = `₹${orderConfirmationData.total_value || '0.00'}`;
    }
    
    // Display payment method
    if (paymentMethodElement) {
        paymentMethodElement.textContent = orderConfirmationData.payment_mode || 'Online Payment';
    }
    
    // Display order status
    displayOrderStatus();
    
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
    if (!itemsListDiv) return;
    
    itemsListDiv.innerHTML = '';
    
    // Use order_details if available, otherwise fallback to items array
    const itemsToDisplay = orderConfirmationData.order_details || orderConfirmationData.items || [];
    
    if (itemsToDisplay.length === 0) {
        itemsListDiv.innerHTML = '<div class="no-items">No items found</div>';
        return;
    }
    
    itemsToDisplay.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-row';
        
        // Determine item status and styling
        const status = item.status || 'Unknown';
        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        const isCancelled = status.toLowerCase() === 'cancelled';
        
        // Build cancellation info if item is cancelled
        let cancellationInfo = '';
        if (isCancelled && item.cancelled_quantity > 0) {
            const cancellationReason = getCancellationReason(item.cancellation_reason);
            const cancelledBy = item.cancelled_by || 'System';
            const cancellationTime = item.cancellation_time ? new Date(item.cancellation_time).toLocaleString() : 'Unknown time';
            
            cancellationInfo = `
                <div class="cancellation-details">
                    <div class="cancellation-info">
                        <span class="cancelled-quantity">Cancelled: ${item.cancelled_quantity} ${item.cancelled_quantity === 1 ? 'item' : 'items'}</span>
                        <span class="cancellation-reason">Reason: ${cancellationReason}</span>
                    </div>
                    <div class="cancellation-meta">
                        <span class="cancelled-by">Cancelled by: ${cancelledBy}</span>
                        <span class="cancellation-time">Time: ${cancellationTime}</span>
                    </div>
                </div>
            `;
        }
        
        itemDiv.innerHTML = `
            <div class="item-info">
                <div class="item-header">
                    <div class="item-name">${item.title || item.name || `Item ${index + 1}`}</div>
                    <div class="item-status status-${statusClass}">
                        <span class="status-indicator"></span>
                        <span class="status-text">${status}</span>
                    </div>
                </div>
                <div class="item-details">
                    <span class="item-id">ID: ${item.item_id}</span>
                    <span class="item-quantity">Qty: ${item.quantity}</span>
                    ${isCancelled && item.cancelled_quantity < item.quantity ? `<span class="remaining-quantity">Remaining: ${item.quantity - item.cancelled_quantity}</span>` : ''}
                </div>
                ${cancellationInfo}
            </div>
            <div class="item-price">
                ₹${item.amount || item.price || '0.00'}
            </div>
        `;
        
        itemsListDiv.appendChild(itemDiv);
    });
}

function getCancellationReason(reasonCode) {
    const reasonMap = {
        '001': 'Customer Request',
        '002': 'Seller Request', 
        '003': 'Out of Stock',
        '004': 'Quality Issue',
        '005': 'Delivery Issue',
        '006': 'Price Discrepancy',
        '007': 'Product Defect',
        '008': 'Wrong Product',
        '009': 'Late Delivery',
        '010': 'Customer Not Available',
        '011': 'Address Issue',
        '012': 'Payment Issue',
        '013': 'Technical Issue',
        '014': 'Weather Conditions',
        '015': 'Force Majeure',
        '016': 'Other'
    };
    
    return reasonMap[reasonCode] || `Reason Code: ${reasonCode}`;
}

function displayQuoteBreakdown() {
    if (!quoteBreakdownDiv || !orderConfirmationData.quote_breakup) return;
    
    quoteBreakdownDiv.innerHTML = '';
    
    orderConfirmationData.quote_breakup.forEach(item => {
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
    if (!fulfillmentDetailsDiv || !orderConfirmationData.fulfillments) return;
    
    fulfillmentDetailsDiv.innerHTML = '';
    
    orderConfirmationData.fulfillments.forEach(fulfillment => {
        const fulfillmentDiv = document.createElement('div');
        fulfillmentDiv.className = 'info-item';
        fulfillmentDiv.innerHTML = `
            <span class="info-label">Delivery Type</span>
            <span class="info-value">${fulfillment.type || 'Standard'}</span>
        `;
        fulfillmentDetailsDiv.appendChild(fulfillmentDiv);
        
        if (fulfillment.provider_name) {
            const providerDiv = document.createElement('div');
            providerDiv.className = 'info-item';
            providerDiv.innerHTML = `
                <span class="info-label">Provider</span>
                <span class="info-value">${fulfillment.provider_name}</span>
            `;
            fulfillmentDetailsDiv.appendChild(providerDiv);
        }
        
        if (fulfillment.category) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'info-item';
            categoryDiv.innerHTML = `
                <span class="info-label">Category</span>
                <span class="info-value">${fulfillment.category}</span>
            `;
            fulfillmentDetailsDiv.appendChild(categoryDiv);
        }
        
        if (fulfillment.tat) {
            const tatDiv = document.createElement('div');
            tatDiv.className = 'info-item';
            tatDiv.innerHTML = `
                <span class="info-label">Estimated Delivery</span>
                <span class="info-value">${fulfillment.tat}</span>
            `;
            fulfillmentDetailsDiv.appendChild(tatDiv);
        }
        
        if (fulfillment.state_code) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'info-item';
            statusDiv.innerHTML = `
                <span class="info-label">Status</span>
                <span class="info-value">${fulfillment.state_code}</span>
            `;
            fulfillmentDetailsDiv.appendChild(statusDiv);
        }
    });
}

function displayOrderStatus() {
    // Update order status elements
    const orderStatusElement = document.getElementById('orderStatus');
    const paymentStatusElement = document.getElementById('paymentStatus');
    const orderStatusBadge = document.getElementById('orderStatusBadge');
    
    if (orderStatusElement) {
        const status = orderConfirmationData.order_status || 'Processing';
        orderStatusElement.textContent = status;
        orderStatusElement.className = `status-value status-${status.toLowerCase().replace(' ', '-')}`;
    }
    
    if (paymentStatusElement) {
        const paymentStatus = orderConfirmationData.payment_status || 'Paid';
        paymentStatusElement.textContent = paymentStatus;
        paymentStatusElement.className = `payment-status status-${paymentStatus.toLowerCase()}`;
    }
    
    // Update order status badge
    if (orderStatusBadge) {
        const status = orderConfirmationData.order_status || 'Processing';
        const statusSpan = orderStatusBadge.querySelector('span:last-child');
        if (statusSpan) {
            statusSpan.textContent = status;
        }
    }
    
    // Update timeline based on current status
    updateStatusTimeline();
    
    // Show/hide cancel button based on order status
    updateCancelButtonVisibility();
    
    // Show/hide return button based on order status
    updateReturnButtonVisibility();
}

function updateCancelButtonVisibility() {
    if (!cancelOrderBtn) return;
    
    const status = orderConfirmationData?.order_status?.toLowerCase() || 'processing';
    
    // Show cancel button for "order-placed", "order-confirmed", and "accepted"
    // Hide it for "processing", "completed", "cancelled"
    const cancellableStatuses = ['order-placed', 'order-confirmed', 'accept', 'accepted'];
    const isCancellable = cancellableStatuses.includes(status);
    
    if (isCancellable) {
        cancelOrderBtn.style.display = 'inline-flex';
    } else {
        cancelOrderBtn.style.display = 'none';
    }
    
    console.log(`Order status: ${status}, Cancel button visible: ${isCancellable}`);
}

function updateReturnButtonVisibility() {
    const returnOrderBtn = document.getElementById('returnOrderBtn');
    if (!returnOrderBtn) return;
    
    const status = orderConfirmationData?.order_status?.toLowerCase() || 'processing';
    
    // Show return button for "completed" orders only
    // Also check if there are any completed items that can be returned
    const isReturnable = status === 'completed' && hasReturnableItems();
    
    if (isReturnable) {
        returnOrderBtn.style.display = 'inline-flex';
    } else {
        returnOrderBtn.style.display = 'none';
    }
    
    console.log(`Order status: ${status}, Return button visible: ${isReturnable}`);
}

function hasReturnableItems() {
    if (!orderConfirmationData) return false;
    
    const itemsToCheck = orderConfirmationData.order_details || orderConfirmationData.items || [];
    
    // Check if there are any completed items (filter out cancelled items)
    return itemsToCheck.some(item => {
        const status = item.status || 'Unknown';
        return status.toLowerCase() === 'completed';
    });
}

function updateStatusTimeline() {
    let currentStatus = orderConfirmationData?.order_status?.toLowerCase() || 'processing';
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Normalize status names to match our timeline
    const statusMapping = {
        'order-placed': 'order-placed',
        'order-confirmed': 'order-confirmed', 
        'accept': 'accept',
        'accepted': 'accept',  // Map 'accepted' to 'accept'
        'processing': 'processing',
        'completed': 'completed'
    };
    
    currentStatus = statusMapping[currentStatus] || currentStatus;
    
    // Define status order
    const statusOrder = ['order-placed', 'order-confirmed', 'accept', 'processing', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    console.log(`Current status: ${orderConfirmationData?.order_status}, normalized to: ${currentStatus}, index: ${currentIndex}`);
    
    timelineItems.forEach((item) => {
        const itemStatus = item.getAttribute('data-status');
        const itemIndex = statusOrder.indexOf(itemStatus);
        
        // Remove all classes
        item.classList.remove('completed', 'active');
        
        if (itemIndex < currentIndex) {
            // Previous statuses are completed
            item.classList.add('completed');
        } else if (itemIndex === currentIndex) {
            // Current status is active
            item.classList.add('active');
        }
        // Future statuses remain unmarked (pending)
    });
    
    console.log(`Updated timeline for status: ${currentStatus}, current index: ${currentIndex}`);
}

function updateTransactionIdDisplay() {
    if (transactionIdSpan) {
        const storedTransactionId = localStorage.getItem('currentTransactionId');
        if (storedTransactionId) {
            transactionIdSpan.textContent = storedTransactionId;
        } else {
            transactionIdSpan.textContent = 'Not available';
        }
    }
    
    // Set default payment method if no data is available yet
    if (paymentMethodElement && !orderConfirmationData) {
        paymentMethodElement.textContent = 'Loading...';
    }
}

// Test function to demonstrate different status scenarios
function testStatusScenarios() {
    const testStatuses = ['Order Placed', 'Order Confirmed', 'Accepted', 'Processing', 'Completed'];
    
    testStatuses.forEach((status, index) => {
        setTimeout(() => {
            console.log(`Testing status: ${status}`);
            orderConfirmationData.order_status = status;
            updateStatusTimeline();
        }, index * 2000);
    });
}

// Debug function to test "Accepted" status specifically
function testAcceptedStatus() {
    console.log('Testing Accepted status...');
    orderConfirmationData.order_status = 'Accepted';
    updateStatusTimeline();
}

function displayProviderDetails() {
    if (!providerDetailsDiv) return;
    
    providerDetailsDiv.innerHTML = `
        <div class="info-item">
            <span class="info-label">Provider ID</span>
            <span class="info-value">${orderConfirmationData.provider_id || 'Not available'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Location</span>
            <span class="info-value">${orderConfirmationData.provider_location_id || 'Not available'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Currency</span>
            <span class="info-value">${orderConfirmationData.currency || 'INR'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Valid Until</span>
            <span class="info-value">${orderConfirmationData.ttl || 'Not specified'}</span>
        </div>
    `;
}

function copyTransactionIdConfirmation() {
    if (transactionIdSpan && orderConfirmationData && orderConfirmationData.transaction_id) {
        navigator.clipboard.writeText(orderConfirmationData.transaction_id).then(() => {
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
        itemsListDiv.innerHTML = '<div class="error-message">No order confirmation data available</div>';
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

async function sendONDCStatusEvent(transactionId) {
    try {
        const messageId = generateUUID();
        const timestamp = new Date().toISOString();
        
        const statusPayload = {
            "context": {
                "domain": "ONDC:RET10",
                "action": "status",
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
                "order_id": orderConfirmationData?.ondc_order_id || "O1"
            }
        };
        
        console.log('Sending ONDC Status event:', statusPayload);
        
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(statusPayload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const statusResponse = await response.json();
        console.log('ONDC Status event response:', statusResponse);
        
        return statusResponse;
        
    } catch (error) {
        console.error('Error sending ONDC status event:', error);
        throw error;
    }
}

async function sendONDCTrackEvent(transactionId) {
    try {
        const messageId = generateUUID();
        const timestamp = new Date().toISOString();
        
        const trackPayload = {
            "context": {
                "domain": "ONDC:RET10",
                "action": "track",
                "country": "IND",
                "city": "std:011",
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
                "order_id": orderConfirmationData?.ondc_order_id || "O1"
            }
        };
        
        console.log('Sending ONDC Track event:', trackPayload);
        
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(trackPayload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const trackResponse = await response.json();
        console.log('ONDC Track event response:', trackResponse);
        
        return trackResponse;
        
    } catch (error) {
        console.error('Error sending ONDC track event:', error);
        throw error;
    }
}

async function sendONDCCancelEvent(transactionId) {
    try {
        const messageId = generateUUID();
        const timestamp = new Date().toISOString();
        
        const cancelPayload = {
            "context": {
                "domain": "ONDC:RET10",
                "country": "IND",
                "city": "std:01Q1",
                "action": "cancel",
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
                "order_id": orderConfirmationData?.ondc_order_id || "order-8ff26833-0001",
                "cancellation_reason_id": "006",
                "descriptor": {
                    "name": "fulfillment",
                    "short_desc": "f1166011-2ef3-4392-a5c8-9362ebe59c5b",
                    "tags": [
                        {
                            "code": "params",
                            "list": [
                                {
                                    "code": "force",
                                    "value": "no"
                                },
                                {
                                    "code": "ttl_response",
                                    "value": "PT1H"
                                }
                            ]
                        }
                    ]
                }
            }
        };
        
        console.log('Sending ONDC Cancel event:', cancelPayload);
        
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(cancelPayload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const cancelResponse = await response.json();
        console.log('ONDC Cancel event response:', cancelResponse);
        
        return cancelResponse;
        
    } catch (error) {
        console.error('Error sending ONDC cancel event:', error);
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
    const refreshBtn = document.getElementById('checkStatusBtn');
    
    if (!transactionId) {
        showNotification('No transaction ID found', 'error');
        return;
    }
    
    // Disable button and show loading state
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    }
    
    try {
        showNotification('Checking order status...', 'info');
        
        let ondcStatusResponse = null;
        let orderData = null;
        
        // First send ONDC status event
        try {
            ondcStatusResponse = await sendONDCStatusEvent(transactionId);
            console.log('ONDC Status event sent successfully');
        } catch (ondcError) {
            console.warn('ONDC Status event failed, continuing with API fetch:', ondcError);
            // Continue with API fetch even if ONDC status fails
        }
        
        // Then fetch updated order data from API
        try {
            orderData = await fetchOrderConfirmation(transactionId);
        } catch (apiError) {
            console.error('API fetch failed:', apiError);
            throw new Error('Failed to fetch order data from server');
        }
        
        if (orderData) {
            // Update the display with fresh data
            orderConfirmationData = orderData;
            displayOrderConfirmation();
            
            // Show status-specific notification
            const status = orderData.order_status || 'Unknown';
            const paymentStatus = orderData.payment_status || 'Unknown';
            
            let notificationMessage = `Order Status: ${status} | Payment: ${paymentStatus}`;
            if (ondcStatusResponse) {
                notificationMessage += ' | ONDC Status: Updated';
            }
            
            showNotification(notificationMessage, 'success');
        } else {
            throw new Error('No order data received');
        }
        
    } catch (error) {
        console.error('Error checking order status:', error);
        showNotification(`Failed to check order status: ${error.message}`, 'error');
    } finally {
        // Re-enable button and restore original text
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Status';
        }
    }
}

async function trackOrder() {
    const transactionId = localStorage.getItem('currentTransactionId');
    const trackBtn = document.getElementById('trackOrderBtn');
    
    if (!transactionId) {
        showNotification('No transaction ID found', 'error');
        return;
    }
    
    // Disable button and show loading state
    if (trackBtn) {
        trackBtn.disabled = true;
        trackBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tracking...';
    }
    
    try {
        showNotification('Tracking order...', 'info');
        
        // Send ONDC track event
        const trackResponse = await sendONDCTrackEvent(transactionId);
        
        if (trackResponse) {
            console.log('ONDC Track event sent successfully');
            showNotification('Order tracking initiated successfully!', 'success');
            
            // You can add additional logic here to handle the track response
            // For example, display tracking information or update the UI
            console.log('Track response:', trackResponse);
        }
        
    } catch (error) {
        console.error('Error tracking order:', error);
        showNotification(`Failed to track order: ${error.message}`, 'error');
    } finally {
        // Re-enable button and restore original text
        if (trackBtn) {
            trackBtn.disabled = false;
            trackBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Track Order';
        }
    }
}

async function cancelOrder() {
    const transactionId = localStorage.getItem('currentTransactionId');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    
    if (!transactionId) {
        showNotification('No transaction ID found', 'error');
        return;
    }
    
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to cancel this order? This action cannot be undone.');
    if (!confirmed) {
        return;
    }
    
    // Disable button and show loading state
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
    }
    
    try {
        showNotification('Cancelling order...', 'info');
        
        // Send ONDC cancel event
        const cancelResponse = await sendONDCCancelEvent(transactionId);
        
        if (cancelResponse) {
            console.log('ONDC Cancel event sent successfully');
            showNotification('Order cancellation request sent successfully!', 'success');
            
            // Hide the cancel button after successful cancellation
            if (cancelBtn) {
                cancelBtn.style.display = 'none';
            }
            
            // Update order status to reflect cancellation
            if (orderConfirmationData) {
                orderConfirmationData.order_status = 'Cancelled';
                displayOrderStatus();
            }
            
            console.log('Cancel response:', cancelResponse);
        }
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification(`Failed to cancel order: ${error.message}`, 'error');
    } finally {
        // Re-enable button and restore original text
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel Order';
        }
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

function initiateReturn() {
    const transactionId = orderConfirmationData?.transaction_id || localStorage.getItem('currentTransactionId');
    
    if (!transactionId) {
        showNotification('No transaction ID found', 'error');
        return;
    }
    
    // Check if order has completed items that can be returned
    if (!hasReturnableItems()) {
        showNotification('No completed items available for return', 'error');
        return;
    }
    
    // Redirect to return page with transaction ID
    window.location.href = `return.html?transactionId=${transactionId}`;
}
