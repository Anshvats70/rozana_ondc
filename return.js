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
    
    // Display order ID (using the actual order ID from GET API call)
    if (orderIdDisplay) {
        orderIdDisplay.textContent = orderData.transaction_id || 'Not available';
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
    
    // Filter only items with Order-delivered status for return
    const returnableItems = allItems.filter(item => {
        const status = item.status || 'Unknown';
        const isOrderDelivered = status === 'Order-delivered';
        console.log(`Item: ${item.title || item.name}, Status: ${status}, Can Return: ${isOrderDelivered}`);
        return isOrderDelivered;
    });
    
    console.log('Returnable items (Order-delivered only):', returnableItems);
    
    if (returnableItems.length === 0) {
        returnItemsList.innerHTML = '<div class="no-items">No Order-delivered items available for return</div>';
        return;
    }
    
    returnableItems.forEach((item, index) => {
        const status = item.status || 'Order-delivered';
        
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
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to submit return request. Please try again.';
        
        if (error.message.includes('404')) {
            errorMessage = 'API endpoint not found. Please contact support.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Access denied. Please check your permissions.';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'Cross-origin request blocked. Please contact support.';
        } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
        
        // Also try to store locally as backup
        try {
            const returnRequestData = createReturnRequestData(returnPayload);
            const returnRequest = {
                return_request_id: returnRequestData.return_request_id,
                order_id: returnRequestData.order_id,
                transaction_id: returnRequestData.transaction_id,
                return_reason: returnRequestData.return_reason,
                status: 'Failed - Stored Locally',
                created_at: returnRequestData.created_at,
                error: error.message
            };
            
            const existingReturns = JSON.parse(localStorage.getItem('returnRequests') || '[]');
            existingReturns.push(returnRequest);
            localStorage.setItem('returnRequests', JSON.stringify(existingReturns));
            
            console.log('Return request stored locally as backup');
        } catch (backupError) {
            console.error('Failed to store return request locally:', backupError);
        }
        
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
        // Calculate total for all Order-delivered items
        const orderDetails = orderData.order_details || [];
        totalReturnAmount = orderDetails
            .filter(item => item.status === 'Order-delivered')
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
                "id": orderData.ondc_order_id || orderData.transaction_id, // Use ondc_order_id for ONDC payload
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
    
    // Validate ONDC payload structure
    const validationErrors = validateONDCPayload(payload);
    if (validationErrors.length > 0) {
        console.error('ONDC Payload Validation Errors:', validationErrors);
        throw new Error(`ONDC payload validation failed: ${validationErrors.join(', ')}`);
    }
    
    console.log('=== ONDC PAYLOAD DEBUG ===');
    console.log('ONDC order ID being used:', payload.message.order.id);
    console.log('Available order IDs in orderData:', {
        ondc_order_id: orderData.ondc_order_id,
        transaction_id: orderData.transaction_id,
        order_id: orderData.order_id,
        id: orderData.id
    });
    console.log('Return payload for /update endpoint:', payload);
    console.log('Total return amount:', totalReturnAmount.toFixed(2));
    console.log('=== END ONDC PAYLOAD DEBUG ===');
    
    return payload;
}

function validateONDCPayload(payload) {
    const errors = [];
    
    // Validate context
    if (!payload.context) {
        errors.push('Missing context object');
    } else {
        const requiredContextFields = ['domain', 'action', 'core_version', 'bap_id', 'bap_uri', 'bpp_id', 'bpp_uri', 'transaction_id', 'message_id', 'timestamp'];
        requiredContextFields.forEach(field => {
            if (!payload.context[field]) {
                errors.push(`Missing context.${field}`);
            }
        });
        
        // Validate domain
        if (payload.context.domain !== 'ONDC:RET10') {
            errors.push('Invalid domain - should be ONDC:RET10');
        }
        
        // Validate action
        if (payload.context.action !== 'update') {
            errors.push('Invalid action - should be update');
        }
    }
    
    // Validate message
    if (!payload.message) {
        errors.push('Missing message object');
    } else {
        if (!payload.message.update_target) {
            errors.push('Missing message.update_target');
        }
        
        if (!payload.message.order) {
            errors.push('Missing message.order object');
        } else {
            if (!payload.message.order.id) {
                errors.push('Missing message.order.id');
            }
            
            if (!payload.message.order.fulfillments || !Array.isArray(payload.message.order.fulfillments)) {
                errors.push('Missing or invalid message.order.fulfillments array');
            }
            
            if (!payload.message.order.payment) {
                errors.push('Missing message.order.payment object');
            } else {
                if (!payload.message.order.payment['@ondc/org/settlement_details'] || !Array.isArray(payload.message.order.payment['@ondc/org/settlement_details'])) {
                    errors.push('Missing or invalid settlement_details array');
                }
            }
        }
    }
    
    return errors;
}

function validateONDCResponse(response) {
    const errors = [];
    
    if (!response) {
        return { isValid: false, errors: ['No response received'] };
    }
    
    // Check for common ONDC response patterns
    if (response.error) {
        errors.push(`ONDC Error: ${response.error}`);
    }
    
    if (response.message && response.message.ack && response.message.ack.status === 'NACK') {
        errors.push(`ONDC NACK: ${response.message.ack.reason || 'Unknown reason'}`);
    }
    
    // Check for successful response indicators
    const hasSuccessIndicator = response.message?.ack?.status === 'ACK' || 
                                response.status === 'success' || 
                                response.success === true ||
                                (response.message && !response.message.error);
    
    if (!hasSuccessIndicator && errors.length === 0) {
        errors.push('No clear success indicator in response');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function createReturnRequestData(payload) {
    const returnType = document.querySelector('input[name="returnType"]:checked').value;
    const returnReason = document.getElementById('returnReason').value;
    const returnDescription = document.getElementById('returnDescription').value;
    const returnMethod = document.querySelector('input[name="returnMethod"]:checked').value;
    
    // Get return reason text from the selected option
    const reasonSelect = document.getElementById('returnReason');
    const reasonText = reasonSelect.options[reasonSelect.selectedIndex].text;
    
    // Create items array based on return type
    let items = [];
    
    if (returnType === 'full') {
        // Include all Order-delivered items for full return
        const orderDetails = orderData.order_details || [];
        items = orderDetails
            .filter(item => item.status === 'Order-delivered')
            .map(item => ({
                item_id: item.item_id,
                name: item.title || item.name,
                price: parseFloat(item.amount || item.price || 0),
                quantity: item.quantity,
                return_quantity: item.quantity,
                status: item.status
            }));
    } else {
        // Include only selected items for partial return
        items = returnSelectedItems.map(item => ({
            item_id: item.item_id,
            name: item.name,
            price: item.price,
            quantity: item.max_quantity,
            return_quantity: item.return_quantity,
            status: 'Order-delivered'
        }));
    }
    
    // Calculate total return amount
    const totalReturnAmount = items.reduce((sum, item) => sum + (item.price * item.return_quantity), 0);
    
    // Look for integer order ID in the response data
    console.log('=== ORDER ID DEBUG ===');
    console.log('orderData.transaction_id:', orderData.transaction_id);
    console.log('Type of transaction_id:', typeof orderData.transaction_id);
    console.log('Raw orderData:', orderData);
    
    // Try to find an integer order ID field
    let orderIdInt = null;
    
    // Check common integer order ID field names
    if (orderData.order_id && !isNaN(parseInt(orderData.order_id))) {
        orderIdInt = parseInt(orderData.order_id);
        console.log('Found integer order_id:', orderIdInt);
    } else if (orderData.id && !isNaN(parseInt(orderData.id))) {
        orderIdInt = parseInt(orderData.id);
        console.log('Found integer id:', orderIdInt);
    } else if (orderData.order_number && !isNaN(parseInt(orderData.order_number))) {
        orderIdInt = parseInt(orderData.order_number);
        console.log('Found integer order_number:', orderIdInt);
    } else {
        // If no integer order ID found, we need to handle this differently
        console.error('No integer order ID found in orderData');
        console.log('Available fields:', Object.keys(orderData));
        
        // For now, let's use a hash of the UUID as a temporary solution
        // This creates a consistent integer from the UUID
        const hash = orderData.transaction_id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        orderIdInt = Math.abs(hash);
        console.log('Using hash of UUID as order_id:', orderIdInt);
    }
    
    if (!orderIdInt || isNaN(orderIdInt)) {
        console.error('ERROR: Could not determine valid integer order ID');
        throw new Error(`Unable to determine valid integer order ID from data: ${JSON.stringify(orderData)}`);
    }
    
    const returnRequestData = {
        return_request_id: generateUUID(),
        order_id: orderIdInt, // Integer as required by API
        transaction_id: orderData.transaction_id,
        return_type: returnType,
        return_reason: returnReason,
        return_reason_text: reasonText,
        return_description: returnDescription || '',
        return_method: returnMethod,
        total_return_amount: totalReturnAmount.toFixed(2),
        items: items,
        order_data: {
            order_date: orderData.order_details && orderData.order_details.length > 0 
                ? orderData.order_details[0].created_at 
                : new Date().toISOString(),
            original_total: orderData.total_value || '0.00',
            payment_status: orderData.payment_status || 'Unknown',
            order_status: orderData.order_status || 'Unknown'
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    console.log('=== FINAL PAYLOAD DEBUG ===');
    console.log('Created return request data structure:', returnRequestData);
    console.log('order_id type:', typeof returnRequestData.order_id);
    console.log('order_id value:', returnRequestData.order_id);
    console.log('Items to return:', items);
    console.log('Total return amount:', totalReturnAmount.toFixed(2));
    console.log('=== END PAYLOAD DEBUG ===');
    
    return returnRequestData;
}

async function submitReturnRequest(payload) {
    try {
        console.log('=== RETURN REQUEST SUBMISSION ===');
        
        // Create the return request data structure for neo-server.rozana.in API
        const returnRequestData = createReturnRequestData(payload);
        
        console.log('Return request data for database:', returnRequestData);
        
        // Step 1: Submit to database API (neo-server.rozana.in)
        let databaseResult = null;
        try {
            console.log('📊 Step 1: Submitting to database API...');
            const dbResponse = await fetch('https://neo-server.rozana.in/api/return-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(returnRequestData)
            });

            console.log('Database API response status:', dbResponse.status);

            if (!dbResponse.ok) {
                let errorMessage = `Database API error! status: ${dbResponse.status}`;
                try {
                    const errorText = await dbResponse.text();
                    console.log('Database API error response:', errorText);
                    errorMessage += ` - ${errorText}`;
                } catch (e) {
                    console.log('Could not read database API error response');
                }
                throw new Error(errorMessage);
            }

            databaseResult = await dbResponse.json();
            console.log('✅ Database API success:', databaseResult);
            
        } catch (dbError) {
            console.error('❌ Database API failed:', dbError);
            throw new Error(`Database submission failed: ${dbError.message}`);
        }

        // Step 2: Submit to ONDC on_update endpoint with retry mechanism
        let ondcResult = null;
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries && !ondcResult) {
        try {
                console.log(`🌐 Step 2: Submitting to ONDC on_update... (Attempt ${retryCount + 1}/${maxRetries})`);
                console.log('ONDC Payload being sent:', JSON.stringify(payload, null, 2));
                
            const ondcResponse = await fetch('https://pramaan.ondc.org/beta/preprod/mock/seller/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'ONDC-Return-Client/1.0'
                },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    credentials: 'omit'
            });

            console.log('ONDC API response status:', ondcResponse.status);
                console.log('ONDC API response headers:', Object.fromEntries(ondcResponse.headers.entries()));

            if (!ondcResponse.ok) {
                let errorMessage = `ONDC API error! status: ${ondcResponse.status}`;
                    let errorDetails = '';
                try {
                    const errorText = await ondcResponse.text();
                    console.log('ONDC API error response:', errorText);
                    errorMessage += ` - ${errorText}`;
                        errorDetails = errorText;
                } catch (e) {
                    console.log('Could not read ONDC API error response');
                        errorDetails = 'Unable to read error response';
                    }
                    
                    // Log detailed error information
                    console.error('ONDC Update Error Details:', {
                        status: ondcResponse.status,
                        statusText: ondcResponse.statusText,
                        url: ondcResponse.url,
                        headers: Object.fromEntries(ondcResponse.headers.entries()),
                        errorDetails: errorDetails,
                        attempt: retryCount + 1
                    });
                    
                    // If this is the last attempt, don't retry
                    if (retryCount >= maxRetries - 1) {
                        console.warn('⚠️ ONDC submission failed after all retries, but database was successful:', errorMessage);
                        break;
            } else {
                        console.log(`⏳ Retrying ONDC submission in 2 seconds... (${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                        retryCount++;
                        continue;
                    }
                } else {
                    try {
                ondcResult = await ondcResponse.json();
                console.log('✅ ONDC API success:', ondcResult);
                        break; // Success, exit retry loop
                    } catch (parseError) {
                        console.warn('⚠️ ONDC response received but could not parse JSON:', parseError);
                        ondcResult = { success: true, message: 'Response received but not JSON' };
                        break; // Exit retry loop
                    }
            }
            
        } catch (ondcError) {
                console.error('ONDC Update Network Error:', {
                    name: ondcError.name,
                    message: ondcError.message,
                    stack: ondcError.stack,
                    attempt: retryCount + 1
                });
                
                // If this is the last attempt, don't retry
                if (retryCount >= maxRetries - 1) {
                    console.warn('⚠️ ONDC submission failed after all retries, but database was successful:', ondcError.message);
                    break;
                } else {
                    console.log(`⏳ Retrying ONDC submission in 2 seconds... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                    retryCount++;
                }
            }
        }

        // Step 3: Store locally for backup
        const returnRequest = {
            return_request_id: returnRequestData.return_request_id,
            order_id: returnRequestData.order_id,
            transaction_id: returnRequestData.transaction_id,
            return_reason: returnRequestData.return_reason,
            status: 'Submitted',
            created_at: returnRequestData.created_at,
            database_response: databaseResult,
            ondc_response: ondcResult
        };
        
        // Store in localStorage
        const existingReturns = JSON.parse(localStorage.getItem('returnRequests') || '[]');
        existingReturns.push(returnRequest);
        localStorage.setItem('returnRequests', JSON.stringify(existingReturns));
        
        console.log('✅ Return request submitted successfully to database');
        
        // Validate ONDC response if available
        let ondcStatus = 'failed';
        let ondcMessage = 'ONDC submission failed';
        
        if (ondcResult) {
            const ondcValidation = validateONDCResponse(ondcResult);
            if (ondcValidation.isValid) {
                ondcStatus = 'success';
                ondcMessage = 'ONDC on_update successful';
                console.log('✅ ONDC on_update successful:', ondcResult);
            } else {
                ondcStatus = 'partial';
                ondcMessage = `ONDC response received but validation failed: ${ondcValidation.errors.join(', ')}`;
                console.warn('⚠️ ONDC response validation failed:', ondcValidation.errors);
            }
        } else {
            console.log('⚠️ ONDC on_update failed, but database submission succeeded');
        }
        
        return {
            success: true,
            database_result: databaseResult,
            ondc_result: ondcResult,
            ondc_status: ondcStatus,
            message: ondcStatus === 'success' 
                ? 'Return request submitted to both database and ONDC network' 
                : `Return request submitted to database (ONDC: ${ondcMessage})`
        };

    } catch (error) {
        console.error('=== RETURN REQUEST ERROR ===');
        console.error('Error submitting return request:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('Network error detected - check internet connection and API endpoints');
        }
        
        throw error;
    }
}

function showReturnConfirmation() {
    if (returnRequestIdSpan && returnRequestId) {
        returnRequestIdSpan.textContent = returnRequestId;
    }
    
    if (returnConfirmationModal) {
        returnConfirmationModal.classList.add('show');
        
        // Add countdown message to the modal
        const countdownElement = document.createElement('div');
        countdownElement.id = 'redirectCountdown';
        countdownElement.style.cssText = `
            margin-top: 1rem;
            padding: 0.75rem;
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 0.5rem;
            text-align: center;
            color: #0369a1;
            font-weight: 500;
        `;
        countdownElement.innerHTML = `
            <div>Redirecting to returns list in <span id="countdown">3</span> seconds...</div>
            <button onclick="window.location.href='returns-list.html'" 
                    style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #0ea5e9; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;">
                Go to Returns List Now
            </button>
        `;
        
        // Add countdown to modal if it doesn't exist
        if (!document.getElementById('redirectCountdown')) {
            returnConfirmationModal.querySelector('.modal-content').appendChild(countdownElement);
        }
        
        // Start countdown
        let countdown = 3;
        const countdownSpan = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownSpan) {
                countdownSpan.textContent = countdown;
            }
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = 'returns-list.html';
            }
        }, 1000);
    }
    
    showNotification('Return request submitted successfully! Redirecting to returns list...', 'success');
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
