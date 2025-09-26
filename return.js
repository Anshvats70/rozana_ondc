// Return Request Page JavaScript

// Generate UUID function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Global variables
let orderData = null;
let returnSelectedItems = []; // Renamed to avoid conflict with script.js
let returnRequestId = null;

// DOM Elements
const orderIdDisplay = document.getElementById('orderIdDisplay');
const transactionIdDisplay = document.getElementById('transactionIdDisplay');
const orderDateDisplay = document.getElementById('orderDateDisplay');
const itemSelectionCard = document.getElementById('itemSelectionCard');
const returnItemsList = document.getElementById('returnItemsList');
const returnSummary = document.getElementById('returnSummary');
const submitReturnBtn = document.getElementById('submitReturnBtn');
const returnConfirmationModal = document.getElementById('returnConfirmationModal');
const loadingModal = document.getElementById('loadingModal');
const returnRequestIdSpan = document.getElementById('returnRequestId');

// Initialize return page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== RETURN PAGE INITIALIZATION ===');
    
    // Check if we're on the return page
    if (!document.getElementById('orderIdDisplay')) {
        console.log('Not on return page, skipping initialization');
        return;
    }
    
    console.log('Return page detected, initializing...');
    
    loadOrderData();
    setupEventListeners();
    
    console.log('=== RETURN PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Return type selection
    const returnTypeRadios = document.querySelectorAll('input[name="returnType"]');
    returnTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleReturnTypeChange);
    });
    
    // Return method selection
    const returnMethodRadios = document.querySelectorAll('input[name="returnMethod"]');
    returnMethodRadios.forEach(radio => {
        radio.addEventListener('change', handleReturnMethodChange);
    });
    
    // Form validation
    const returnReason = document.getElementById('returnReason');
    const returnDescription = document.getElementById('returnDescription');
    
    if (returnReason) {
        returnReason.addEventListener('change', validateForm);
    }
    
    if (returnDescription) {
        returnDescription.addEventListener('input', validateForm);
    }
    
    // Submit button
    if (submitReturnBtn) {
        submitReturnBtn.addEventListener('click', handleReturnSubmission);
    }
}

async function loadOrderData() {
    // Try to get order data from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transactionId') || localStorage.getItem('currentTransactionId');
    
    if (!transactionId) {
        showErrorState('No transaction ID found');
        return;
    }
    
    try {
        // Fetch order data from API
        orderData = await fetchOrderData(transactionId);
        if (orderData) {
            displayOrderInfo();
            displayReturnItems();
            updateReturnSummary();
        }
    } catch (error) {
        console.error('Error loading order data:', error);
        showErrorState('Failed to load order data');
    }
}

async function fetchOrderData(transactionId) {
    try {
        // Use the specific API endpoint provided
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

        const data = await response.json();
        console.log('Order data fetched from neo-server.rozana.in:', data);
        
        // Log the structure for debugging
        console.log('Order structure:', {
            transaction_id: data.transaction_id,
            order_status: data.order_status,
            payment_status: data.payment_status,
            order_details_count: data.order_details ? data.order_details.length : 0,
            items_count: data.items ? data.items.length : 0
        });
        
        return data;

    } catch (error) {
        console.error('Error fetching order data from neo-server.rozana.in:', error);
        throw error;
    }
}

function displayOrderInfo() {
    if (!orderData) return;
    
    // Display order ID
    if (orderIdDisplay) {
        orderIdDisplay.textContent = orderData.ondc_order_id || orderData.transaction_id || 'Not available';
    }
    
    // Display transaction ID
    if (transactionIdDisplay) {
        transactionIdDisplay.textContent = orderData.transaction_id || 'Not available';
    }
    
    // Display order date
    if (orderDateDisplay) {
        // Try to get date from order_details or use current date as fallback
        const orderDate = orderData.order_details && orderData.order_details.length > 0 
            ? orderData.order_details[0].created_at 
            : new Date().toISOString();
        
        const formattedDate = new Date(orderDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        orderDateDisplay.textContent = formattedDate;
    }
}

function displayReturnItems() {
    if (!returnItemsList || !orderData) return;
    
    returnItemsList.innerHTML = '';
    
    // Use order_details from neo-server.rozana.in API response
    const allItems = orderData.order_details || orderData.items || [];
    
    console.log('All items from API:', allItems);
    
    // Filter only completed items for return
    const returnableItems = allItems.filter(item => {
        const status = item.status || 'Unknown';
        const isCompleted = status.toLowerCase() === 'completed';
        console.log(`Item: ${item.title || item.name}, Status: ${status}, Can Return: ${isCompleted}`);
        return isCompleted;
    });
    
    console.log('Returnable items (completed only):', returnableItems);
    
    if (returnableItems.length === 0) {
        returnItemsList.innerHTML = '<div class="no-items">No completed items available for return</div>';
        return;
    }
    
    returnableItems.forEach((item, index) => {
        const status = item.status || 'Completed';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'return-item';
        itemDiv.innerHTML = `
            <div class="item-checkbox">
                <input type="checkbox" id="item_${index}" value="${item.item_id}" 
                       data-name="${item.title || item.name}" 
                       data-price="${item.amount || item.price}"
                       data-quantity="${item.quantity}"
                       onchange="handleItemSelection(this)">
            </div>
            <div class="item-info">
                <div class="item-name">${item.title || item.name || `Item ${index + 1}`}</div>
                <div class="item-details">
                    <span class="item-id">ID: ${item.item_id}</span>
                    <span class="item-quantity">Qty: ${item.quantity}</span>
                    <span class="item-status status-completed">${status}</span>
                </div>
            </div>
            <div class="item-price">
                ₹${item.amount || item.price || '0.00'}
            </div>
            <div class="quantity-selector" style="display: none;">
                <label>Return Quantity:</label>
                <select class="quantity-select" onchange="updateItemQuantity('${item.item_id}', this.value)">
                    ${generateQuantityOptions(item.quantity)}
                </select>
            </div>
        `;
        returnItemsList.appendChild(itemDiv);
    });
}

function generateQuantityOptions(maxQuantity) {
    let options = '';
    for (let i = 1; i <= maxQuantity; i++) {
        options += `<option value="${i}">${i}</option>`;
    }
    return options;
}

function handleReturnTypeChange(event) {
    const returnType = event.target.value;
    
    if (returnType === 'full') {
        itemSelectionCard.style.display = 'none';
        // Select all items for full return
        selectAllItems(true);
    } else if (returnType === 'partial') {
        itemSelectionCard.style.display = 'block';
        // Clear selection for partial return
        selectAllItems(false);
    }
    
    updateReturnSummary();
}

function selectAllItems(select) {
    const checkboxes = document.querySelectorAll('#returnItemsList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = select;
        if (select) {
            handleItemSelection(checkbox);
        }
    });
}

function handleItemSelection(checkbox) {
    const itemId = checkbox.value;
    const itemName = checkbox.dataset.name;
    const itemPrice = parseFloat(checkbox.dataset.price);
    const maxQuantity = parseInt(checkbox.dataset.quantity);
    
    if (checkbox.checked) {
        // Add item to selected items
        const existingItem = returnSelectedItems.find(item => item.item_id === itemId);
        if (!existingItem) {
            returnSelectedItems.push({
                item_id: itemId,
                name: itemName,
                price: itemPrice,
                max_quantity: maxQuantity,
                return_quantity: 1
            });
        }
        
        // Show quantity selector
        const itemDiv = checkbox.closest('.return-item');
        const quantitySelector = itemDiv.querySelector('.quantity-selector');
        if (quantitySelector) {
            quantitySelector.style.display = 'block';
        }
    } else {
        // Remove item from selected items
        returnSelectedItems = returnSelectedItems.filter(item => item.item_id !== itemId);
        
        // Hide quantity selector
        const itemDiv = checkbox.closest('.return-item');
        const quantitySelector = itemDiv.querySelector('.quantity-selector');
        if (quantitySelector) {
            quantitySelector.style.display = 'none';
        }
    }
    
    updateReturnSummary();
}

function updateItemQuantity(itemId, quantity) {
    const item = returnSelectedItems.find(item => item.item_id === itemId);
    if (item) {
        item.return_quantity = parseInt(quantity);
        updateReturnSummary();
    }
}

function updateReturnSummary() {
    if (!returnSummary) return;
    
    const returnType = document.querySelector('input[name="returnType"]:checked').value;
    const returnMethod = document.querySelector('input[name="returnMethod"]:checked').value;
    
    let summaryHTML = '';
    
    if (returnType === 'full') {
        const totalItems = orderData.order_details ? orderData.order_details.length : orderData.items.length;
        const totalAmount = orderData.total_value || '0.00';
        
        summaryHTML = `
            <div class="summary-item">
                <span class="summary-label">Return Type:</span>
                <span class="summary-value">Full Order Return</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Items to Return:</span>
                <span class="summary-value">${totalItems} item(s)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Amount:</span>
                <span class="summary-value">₹${totalAmount}</span>
            </div>
        `;
    } else {
        const selectedCount = returnSelectedItems.length;
        const totalAmount = returnSelectedItems.reduce((sum, item) => sum + (item.price * item.return_quantity), 0);
        
        summaryHTML = `
            <div class="summary-item">
                <span class="summary-label">Return Type:</span>
                <span class="summary-value">Partial Return</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Items Selected:</span>
                <span class="summary-value">${selectedCount} item(s)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Return Amount:</span>
                <span class="summary-value">₹${totalAmount.toFixed(2)}</span>
            </div>
        `;
        
        // Show selected items details
        if (returnSelectedItems.length > 0) {
            summaryHTML += '<div class="selected-items">';
            returnSelectedItems.forEach(item => {
                summaryHTML += `
                    <div class="selected-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">Qty: ${item.return_quantity}</span>
                        <span class="item-amount">₹${(item.price * item.return_quantity).toFixed(2)}</span>
                    </div>
                `;
            });
            summaryHTML += '</div>';
        }
    }
    
    summaryHTML += `
        <div class="summary-item">
            <span class="summary-label">Return Method:</span>
            <span class="summary-value">${returnMethod === 'pickup' ? 'Pickup Service' : 'Drop at Store'}</span>
        </div>
    `;
    
    returnSummary.innerHTML = summaryHTML;
}

function handleReturnMethodChange(event) {
    updateReturnSummary();
}

function validateForm() {
    const returnReason = document.getElementById('returnReason');
    const returnType = document.querySelector('input[name="returnType"]:checked').value;
    
    let isValid = true;
    
    // Check if reason is selected
    if (!returnReason.value) {
        isValid = false;
    }
    
    // For partial returns, check if at least one item is selected
    if (returnType === 'partial' && returnSelectedItems.length === 0) {
        isValid = false;
    }
    
    // Enable/disable submit button
    if (submitReturnBtn) {
        submitReturnBtn.disabled = !isValid;
        submitReturnBtn.style.opacity = isValid ? '1' : '0.5';
    }
    
    return isValid;
}

async function handleReturnSubmission() {
    if (!validateForm()) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading modal
    showLoadingModal();
    
    try {
        const returnType = document.querySelector('input[name="returnType"]:checked').value;
        const returnReason = document.getElementById('returnReason').value;
        const returnDescription = document.getElementById('returnDescription').value;
        const returnMethod = document.querySelector('input[name="returnMethod"]:checked').value;
        
        // Create return request payload
        const returnPayload = createReturnPayload(returnType, returnReason, returnDescription, returnMethod);
        
        // Submit return request
        const response = await submitReturnRequest(returnPayload);
        
        if (response) {
            returnRequestId = response.return_request_id || generateUUID();
            showReturnConfirmation();
        }
        
    } catch (error) {
        console.error('Error submitting return request:', error);
        showNotification('Failed to submit return request. Please try again.', 'error');
    } finally {
        hideLoadingModal();
    }
}

function createReturnPayload(returnType, returnReason, returnDescription, returnMethod) {
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    
    // Calculate total return amount
    let totalReturnAmount = 0;
    
    if (returnType === 'full') {
        // Calculate total for all completed items
        const orderDetails = orderData.order_details || [];
        totalReturnAmount = orderDetails
            .filter(item => item.status === 'Completed')
            .reduce((sum, item) => sum + parseFloat(item.amount || item.price || 0), 0);
    } else {
        // Calculate total for selected items
        totalReturnAmount = returnSelectedItems.reduce((sum, item) => sum + (item.price * item.return_quantity), 0);
    }
    
    const payload = {
        "context": {
            "domain": "ONDC:RET10",
            "action": "update",
            "core_version": "1.2.0",
            "bap_id": "neo-server.rozana.in",
            "bap_uri": "https://neo-server.rozana.in/bapl",
            "bpp_id": "pramaan.ondc.org/beta/preprod/mock/seller",
            "bpp_uri": "https://pramaan.ondc.org/beta/preprod/mock/seller",
            "transaction_id": orderData.transaction_id,
            "message_id": messageId,
            "timestamp": timestamp,
            "city": "std:01Q1",
            "country": "IND",
            "ttl": "PT30S"
        },
        "message": {
            "update_target": "payment",
            "order": {
                "id": orderData.ondc_order_id || `order-${generateUUID()}`,
                "fulfillments": [
                    {
                        "id": generateUUID(),
                        "type": "Return",
                        "tags": [
                            {
                                "code": "return_request",
                                "list": [
                                    {
                                        "code": "reason_code",
                                        "value": returnReason
                                    },
                                    {
                                        "code": "ttl_approval",
                                        "value": "PT24H"
                                    },
                                    {
                                        "code": "return_type",
                                        "value": returnType
                                    },
                                    {
                                        "code": "return_method",
                                        "value": returnMethod
                                    },
                                    {
                                        "code": "return_description",
                                        "value": returnDescription || ""
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "payment": {
                    "@ondc/org/settlement_details": [
                        {
                            "settlement_counterparty": "buyer",
                            "settlement_phase": "refund",
                            "settlement_type": "upi",
                            "settlement_amount": totalReturnAmount.toFixed(2),
                            "settlement_timestamp": timestamp
                        }
                    ]
                }
            }
        }
    };
    
    console.log('Return payload for /update endpoint:', payload);
    console.log('Total return amount:', totalReturnAmount.toFixed(2));
    
    return payload;
}

async function submitReturnRequest(payload) {
    try {
        const response = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/update', {
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
        console.log('Return request response from /update endpoint:', result);
        
        // Also store locally for backup
        const returnRequest = {
            return_request_id: payload.message.return_request_id || generateUUID(),
            order_id: payload.message.order?.id,
            transaction_id: payload.context.transaction_id,
            return_reason: payload.message.order?.fulfillments?.[0]?.tags?.[0]?.list?.[0]?.value,
            status: 'Submitted',
            created_at: payload.context.timestamp,
            response: result
        };
        
        // Store in localStorage
        const existingReturns = JSON.parse(localStorage.getItem('returnRequests') || '[]');
        existingReturns.push(returnRequest);
        localStorage.setItem('returnRequests', JSON.stringify(existingReturns));
        
        return result;

    } catch (error) {
        console.error('Error submitting return request to /update endpoint:', error);
        throw error;
    }
}

function showReturnConfirmation() {
    if (returnRequestIdSpan && returnRequestId) {
        returnRequestIdSpan.textContent = returnRequestId;
    }
    
    if (returnConfirmationModal) {
        returnConfirmationModal.classList.add('show');
    }
    
    showNotification('Return request submitted successfully!', 'success');
}

function closeReturnConfirmation() {
    if (returnConfirmationModal) {
        returnConfirmationModal.classList.remove('show');
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

function showErrorState(message) {
    if (orderIdDisplay) orderIdDisplay.textContent = 'Error';
    if (transactionIdDisplay) transactionIdDisplay.textContent = 'Error';
    if (orderDateDisplay) orderDateDisplay.textContent = 'Error';
    
    showNotification(message, 'error');
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

// Make functions globally available
window.handleReturnTypeChange = handleReturnTypeChange;
window.handleReturnMethodChange = handleReturnMethodChange;
window.handleItemSelection = handleItemSelection;
window.updateItemQuantity = updateItemQuantity;
window.closeReturnConfirmation = closeReturnConfirmation;
