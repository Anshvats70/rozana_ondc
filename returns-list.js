// Returns List Page JavaScript

// Global variables
let allReturns = [];
let filteredReturns = [];

// DOM Elements
const returnsList = document.getElementById('returnsList');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const searchBox = document.getElementById('searchBox');

// Initialize returns list page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== RETURNS LIST PAGE INITIALIZATION ===');
    
    // Check if we're on the returns list page
    if (!document.getElementById('returnsList')) {
        console.log('Not on returns list page, skipping initialization');
        return;
    }
    
    console.log('Returns list page detected, initializing...');
    
    loadReturnsData();
    setupEventListeners();
    
    console.log('=== RETURNS LIST PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Filter event listeners
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }
    
    if (searchBox) {
        searchBox.addEventListener('input', applyFilters);
    }
}

async function loadReturnsData() {
    try {
        // Show loading state
        showLoadingState();
        
        console.log('=== LOADING RETURNS DATA ===');
        
        // Always try to fetch from API first (prioritize fresh data)
        try {
            const response = await fetch('https://neo-server.rozana.in/api/returns', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const apiResponse = await response.json();
                console.log('API response:', apiResponse);
                
                // Handle the actual API response structure
                if (apiResponse.success && apiResponse.data) {
                    allReturns = apiResponse.data;
                    console.log('✅ Successfully loaded', allReturns.length, 'returns from API');
                    
                    // Debug the first return request data
                    if (allReturns.length > 0) {
                        console.log('=== FIRST RETURN REQUEST DEBUG ===');
                        console.log('First return request:', allReturns[0]);
                        console.log('total_return_amount:', allReturns[0].total_return_amount);
                        console.log('Type of total_return_amount:', typeof allReturns[0].total_return_amount);
                        console.log('Items:', allReturns[0].items);
                        console.log('=== END FIRST RETURN DEBUG ===');
                    }
                    
                    // Update localStorage with fresh API data
                    localStorage.setItem('returnRequests', JSON.stringify(allReturns));
                    console.log('Updated localStorage with API data');
                    
                } else {
                    console.log('❌ API response format unexpected:', apiResponse);
                    // Fallback to localStorage if API format is wrong
                    loadFromLocalStorage();
                }
            } else {
                console.log('❌ API not available, falling back to localStorage');
                // Fallback to localStorage if API is not available
                loadFromLocalStorage();
            }
        } catch (apiError) {
            console.log('❌ API fetch failed, falling back to localStorage:', apiError);
            // Fallback to localStorage if API fails
            loadFromLocalStorage();
        }
        
        filteredReturns = [...allReturns];
        displayReturns();
        console.log('=== END LOADING RETURNS DATA ===');
        
    } catch (error) {
        console.error('Error loading returns data:', error);
        showErrorState();
    }
}

function loadFromLocalStorage() {
    const localReturns = JSON.parse(localStorage.getItem('returnRequests') || '[]');
    console.log('📦 Loading from localStorage:', localReturns.length, 'returns');
    
    if (localReturns.length > 0) {
        allReturns = localReturns;
        console.log('✅ Using localStorage data');
    } else {
        allReturns = [];
        console.log('❌ No data in localStorage');
    }
}

function displayReturns() {
    if (!returnsList) return;
    
    if (filteredReturns.length === 0) {
        showEmptyState();
        return;
    }
    
    returnsList.innerHTML = '';
    
    // Sort returns by date (newest first)
    const sortedReturns = filteredReturns.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
    });
    
    sortedReturns.forEach(returnRequest => {
        const returnCard = createReturnCard(returnRequest);
        returnsList.appendChild(returnCard);
    });
    
    console.log(`Displayed ${sortedReturns.length} return requests`);
}

function createReturnCard(returnRequest) {
    const card = document.createElement('div');
    card.className = 'return-card';
    
    // Format date
    const formattedDate = new Date(returnRequest.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get status display info
    const statusInfo = getStatusInfo(returnRequest.status);
    
    // Get return type display
    const returnTypeDisplay = returnRequest.return_type === 'full' ? 'Full Return' : 'Partial Return';
    
    // Get return reason display
    const returnReasonDisplay = getReturnReasonText(returnRequest.return_reason);
    
    // Get return method display
    const returnMethodDisplay = returnRequest.return_method === 'pickup' ? 'Pickup Service' : 'Drop at Store';
    
    // Calculate total amount - handle different data types
    console.log('=== AMOUNT DEBUG ===');
    console.log('returnRequest.total_return_amount:', returnRequest.total_return_amount);
    console.log('Type of total_return_amount:', typeof returnRequest.total_return_amount);
    console.log('returnRequest object:', returnRequest);
    
    let totalAmount = '0.00';
    if (returnRequest.total_return_amount !== undefined && returnRequest.total_return_amount !== null && returnRequest.total_return_amount !== '') {
        totalAmount = typeof returnRequest.total_return_amount === 'number' 
            ? returnRequest.total_return_amount.toFixed(2)
            : returnRequest.total_return_amount.toString();
        console.log('Using total_return_amount:', totalAmount);
    } else if (returnRequest.items && returnRequest.items.length > 0) {
        // Calculate from items if total_return_amount is not available
        const calculatedTotal = returnRequest.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.return_quantity));
        }, 0);
        totalAmount = calculatedTotal.toFixed(2);
        console.log('Calculated from items:', totalAmount);
    } else {
        console.log('No amount data found');
    }
    
    console.log('Final totalAmount:', totalAmount);
    console.log('=== END AMOUNT DEBUG ===');
    
    card.innerHTML = `
        <div class="return-header">
            <div class="return-info">
                <div class="return-id">Return #${returnRequest.return_request_id.substring(0, 8)}</div>
                <div class="return-date">${formattedDate}</div>
                <div class="return-amount">₹${totalAmount}</div>
            </div>
            <div class="return-status ${statusInfo.class}">
                ${statusInfo.text}
            </div>
        </div>
        
        <div class="return-body">
            <div class="return-details">
                <div class="detail-item">
                    <div class="detail-label">Order ID</div>
                    <div class="detail-value">${returnRequest.order_id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Transaction ID</div>
                    <div class="detail-value">${returnRequest.transaction_id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Return Type</div>
                    <div class="detail-value">${returnTypeDisplay}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Return Reason</div>
                    <div class="detail-value">${returnReasonDisplay}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Return Method</div>
                    <div class="detail-value">${returnMethodDisplay}</div>
                </div>
                ${returnRequest.return_description ? `
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${returnRequest.return_description}</div>
                </div>
                ` : ''}
            </div>
            
            ${returnRequest.items && returnRequest.items.length > 0 ? `
            <div class="return-items">
                <div class="items-title">
                    <i class="fas fa-box"></i>
                    Items to Return (${returnRequest.items.length})
                </div>
                <div class="item-list">
                    ${returnRequest.items.map(item => `
                        <div class="item-card">
                            <div class="item-info">
                                <div class="item-name">${item.name}</div>
                                <div class="item-details">
                                    <span>ID: ${item.item_id}</span>
                                    <span>Original Qty: ${item.quantity}</span>
                                    <span>Return Qty: ${item.return_quantity}</span>
                                    <span>Status: ${item.status}</span>
                                </div>
                            </div>
                            <div class="item-price">
                                ₹${(item.price * item.return_quantity).toFixed(2)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="return-actions">
            <button class="btn-action btn-secondary" onclick="viewReturnDetails('${returnRequest.return_request_id}')">
                <i class="fas fa-eye"></i>
                View Details
            </button>
            ${returnRequest.status === 'pending' || returnRequest.status === 'submitted' ? `
            <button class="btn-action btn-secondary" onclick="cancelReturn('${returnRequest.return_request_id}')">
                <i class="fas fa-times"></i>
                Cancel
            </button>
            ` : ''}
            ${returnRequest.status === 'approved' ? `
            <button class="btn-action btn-primary" onclick="trackReturn('${returnRequest.return_request_id}')">
                <i class="fas fa-truck"></i>
                Track Return
            </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

function getStatusInfo(status) {
    const statusMap = {
        'pending': { text: 'Pending', class: 'status-pending' },
        'submitted': { text: 'Submitted', class: 'status-submitted' },
        'approved': { text: 'Approved', class: 'status-approved' },
        'rejected': { text: 'Rejected', class: 'status-rejected' },
        'completed': { text: 'Completed', class: 'status-completed' },
        'failed': { text: 'Failed', class: 'status-failed' },
        'Failed - Stored Locally': { text: 'Failed', class: 'status-failed' }
    };
    
    return statusMap[status] || { text: status, class: 'status-pending' };
}

function getReturnReasonText(reasonCode) {
    const reasonMap = {
        '001': 'Defective Product',
        '002': 'Wrong Item Delivered',
        '003': 'Size/Color Mismatch',
        '004': 'Quality Issues',
        '005': 'Damaged in Transit',
        '006': 'Not as Described',
        '007': 'Changed Mind',
        '008': 'Late Delivery',
        '009': 'Missing Items',
        '010': 'Other'
    };
    
    return reasonMap[reasonCode] || reasonCode || 'Not specified';
}

function applyFilters() {
    const statusValue = statusFilter.value;
    const typeValue = typeFilter.value;
    const searchValue = searchBox.value.toLowerCase();
    
    filteredReturns = allReturns.filter(returnRequest => {
        // Status filter
        if (statusValue && returnRequest.status !== statusValue) {
            return false;
        }
        
        // Type filter
        if (typeValue && returnRequest.return_type !== typeValue) {
            return false;
        }
        
        // Search filter
        if (searchValue) {
            const searchText = [
                returnRequest.return_request_id,
                returnRequest.order_id,
                returnRequest.transaction_id,
                returnRequest.return_reason_text || ''
            ].join(' ').toLowerCase();
            
            if (!searchText.includes(searchValue)) {
                return false;
            }
        }
        
        return true;
    });
    
    displayReturns();
}

function showLoadingState() {
    if (returnsList) {
        returnsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <h4>Loading return requests...</h4>
                <p>Please wait while we fetch your return data.</p>
            </div>
        `;
    }
}

function showEmptyState() {
    if (returnsList) {
        returnsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-undo-alt"></i>
                </div>
                <h3 class="empty-title">No Return Requests Found</h3>
                <p class="empty-description">
                    You haven't submitted any return requests yet.<br>
                    When you do, they'll appear here for tracking.
                </p>
                <a href="index.html" class="btn-primary">
                    <i class="fas fa-shopping-bag"></i>
                    Start Shopping
                </a>
            </div>
        `;
    }
}

function showErrorState() {
    if (returnsList) {
        returnsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-title">Unable to Load Returns</h3>
                <p class="empty-description">
                    There was an error loading your return requests.<br>
                    Please try refreshing the page.
                </p>
                <button class="btn-primary" onclick="loadReturnsData()">
                    <i class="fas fa-refresh"></i>
                    Try Again
                </button>
            </div>
        `;
    }
}

// Action functions
function viewReturnDetails(returnId) {
    console.log('View return details:', returnId);
    const returnRequest = allReturns.find(r => r.return_request_id === returnId);
    if (returnRequest) {
        showReturnDetailsModal(returnRequest);
    }
}

function showReturnDetailsModal(returnRequest) {
    const modal = document.getElementById('returnDetailsModal');
    const content = document.getElementById('returnDetailsContent');
    
    if (!modal || !content) return;
    
    // Format dates
    const createdDate = new Date(returnRequest.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const updatedDate = new Date(returnRequest.updated_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const orderDate = returnRequest.order_data?.order_date ? 
        new Date(returnRequest.order_data.order_date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Not available';
    
    // Get status info
    const statusInfo = getStatusInfo(returnRequest.status);
    
    // Calculate total amount properly
    let totalAmount = '0.00';
    if (returnRequest.total_return_amount !== undefined && returnRequest.total_return_amount !== null && returnRequest.total_return_amount !== '') {
        totalAmount = typeof returnRequest.total_return_amount === 'number' 
            ? returnRequest.total_return_amount.toFixed(2)
            : returnRequest.total_return_amount.toString();
        console.log('Modal - Using total_return_amount:', totalAmount);
    } else {
        console.log('Modal - No total_return_amount found, using items calculation');
        // Calculate from items
        const calculatedTotal = returnRequest.items?.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.return_quantity));
        }, 0) || 0;
        totalAmount = calculatedTotal.toFixed(2);
        console.log('Modal - Calculated from items:', totalAmount);
    }
    
    // Calculate item totals
    let itemTotal = 0;
    if (returnRequest.items && returnRequest.items.length > 0) {
        itemTotal = returnRequest.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.return_quantity));
        }, 0);
    }
    
    content.innerHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-receipt"></i> Return Request Information</h4>
            <div class="detail-grid">
                <div class="detail-item-large">
                    <div class="detail-label-large">Return Request ID</div>
                    <div class="detail-value-large">${returnRequest.return_request_id}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Order ID</div>
                    <div class="detail-value-large">${returnRequest.order_id}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Transaction ID</div>
                    <div class="detail-value-large">${returnRequest.transaction_id}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Status</div>
                    <div class="detail-value-large">
                        <span class="return-status ${statusInfo.class}">${statusInfo.text}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> Return Details</h4>
            <div class="detail-grid">
                <div class="detail-item-large">
                    <div class="detail-label-large">Return Type</div>
                    <div class="detail-value-large">${returnRequest.return_type === 'full' ? 'Full Return' : 'Partial Return'}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Return Reason</div>
                    <div class="detail-value-large">${getReturnReasonText(returnRequest.return_reason)}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Return Method</div>
                    <div class="detail-value-large">${returnRequest.return_method === 'pickup' ? 'Pickup Service' : 'Drop at Store'}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Total Return Amount</div>
                    <div class="detail-value-large" style="color: #059669; font-size: 1.2rem;">₹${totalAmount}</div>
                </div>
            </div>
            ${returnRequest.return_description ? `
            <div class="detail-item-large" style="margin-top: 1rem; grid-column: 1 / -1;">
                <div class="detail-label-large">Description</div>
                <div class="detail-value-large">${returnRequest.return_description}</div>
            </div>
            ` : ''}
        </div>
        
        ${returnRequest.items && returnRequest.items.length > 0 ? `
        <div class="detail-section">
            <h4><i class="fas fa-box"></i> Items to Return (${returnRequest.items.length})</h4>
            <div class="item-list">
                ${returnRequest.items.map((item, index) => `
                    <div class="item-card">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-details">
                                <span><strong>ID:</strong> ${item.item_id}</span>
                                <span><strong>Price:</strong> ₹${item.price}</span>
                                <span><strong>Original Qty:</strong> ${item.quantity}</span>
                                <span><strong>Return Qty:</strong> ${item.return_quantity}</span>
                                <span><strong>Status:</strong> ${item.status}</span>
                            </div>
                        </div>
                        <div class="item-price">
                            <strong>₹${(parseFloat(item.price) * parseInt(item.return_quantity)).toFixed(2)}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: right; margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
                <strong>Total Items Amount: ₹${itemTotal.toFixed(2)}</strong>
            </div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h4><i class="fas fa-shopping-cart"></i> Original Order Information</h4>
            <div class="detail-grid">
                <div class="detail-item-large">
                    <div class="detail-label-large">Order Date</div>
                    <div class="detail-value-large">${orderDate}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Original Total</div>
                    <div class="detail-value-large">₹${returnRequest.order_data?.original_total || '0.00'}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Payment Status</div>
                    <div class="detail-value-large">${returnRequest.order_data?.payment_status || 'Unknown'}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Order Status</div>
                    <div class="detail-value-large">${returnRequest.order_data?.order_status || 'Unknown'}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-clock"></i> Timeline</h4>
            <div class="detail-grid">
                <div class="detail-item-large">
                    <div class="detail-label-large">Request Created</div>
                    <div class="detail-value-large">${createdDate}</div>
                </div>
                <div class="detail-item-large">
                    <div class="detail-label-large">Last Updated</div>
                    <div class="detail-value-large">${updatedDate}</div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeReturnDetailsModal() {
    const modal = document.getElementById('returnDetailsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function cancelReturn(returnId) {
    console.log('Cancel return:', returnId);
    if (confirm('Are you sure you want to cancel this return request?')) {
        // Update status in localStorage
        const returnIndex = allReturns.findIndex(r => r.return_request_id === returnId);
        if (returnIndex !== -1) {
            allReturns[returnIndex].status = 'cancelled';
            allReturns[returnIndex].updated_at = new Date().toISOString();
            
            // Update localStorage
            localStorage.setItem('returnRequests', JSON.stringify(allReturns));
            
            // Refresh display
            applyFilters();
            
            showNotification('Return request cancelled successfully', 'success');
        }
    }
}

function trackReturn(returnId) {
    console.log('Track return:', returnId);
    showNotification('Return tracking feature coming soon!', 'info');
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

// Utility function to clear localStorage and reload
function clearLocalStorageAndReload() {
    if (confirm('This will clear all locally stored return requests and reload from API. Continue?')) {
        localStorage.removeItem('returnRequests');
        console.log('🧹 Cleared localStorage');
        loadReturnsData();
        showNotification('Local storage cleared. Reloading from API...', 'info');
    }
}

// Make functions globally available
window.viewReturnDetails = viewReturnDetails;
window.cancelReturn = cancelReturn;
window.trackReturn = trackReturn;
window.closeReturnDetailsModal = closeReturnDetailsModal;
window.clearLocalStorageAndReload = clearLocalStorageAndReload;
