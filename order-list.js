/**
 * Order List Manager
 * Fetches and displays orders from the ONDC API
 * Auto-refreshes on page load
 */
class OrderListManager {
    constructor() {
        this.apiUrl = 'https://neo-server.rozana.in/orders';
        this.proxyUrl = 'api-proxy.php'; // Local PHP proxy
        this.issueApiUrl = 'issue-proxy.php'; // Proxy for issue data
        this.orders = [];
        this.filteredOrders = [];
        this.orderIssues = {}; // Store issue data by order_id
        this.currentStatusFilter = '';
        this.currentIssueFilter = '';
        this.currentSort = 'newest';
        
        this.init();
    }

    init() {
        console.log('🚀 OrderListManager initialized');
        console.log('📡 API Endpoint:', this.apiUrl);
        
        this.setupEventListeners();
        this.loadOrders(); // Auto-load on page initialization (now includes issue data)
        
        // Set up auto-refresh every 30 seconds (optional - can be disabled)
        this.autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing orders...');
            this.refreshOrders(true); // Silent refresh
        }, 30000); // 30 seconds
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshOrders();
        });

        // Retry button
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.loadOrders();
        });

        // Filter controls
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.currentStatusFilter = e.target.value;
            this.applyFilters();
        });

        document.getElementById('issueFilter')?.addEventListener('change', (e) => {
            this.currentIssueFilter = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });

        // Modal close
        document.getElementById('closeOrderModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on backdrop click
        document.getElementById('orderModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'orderModal') {
                this.closeModal();
            }
        });
    }

    async loadOrders() {
        console.log('📥 Loading orders from API...');
        this.showLoading();
        
        try {
            // Add cache-busting timestamp
            const timestamp = new Date().getTime();
            const cacheBustingParam = `?_t=${timestamp}`;
            
            // Try multiple approaches to handle CORS issues
            let response;
            let data;
            
            // Approach 1: Try PHP proxy first (most reliable)
            try {
                console.log('🔄 Attempting PHP proxy request...');
                response = await fetch(this.proxyUrl + cacheBustingParam, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                
                if (response.ok) {
                    data = await response.json();
                    console.log('✅ PHP proxy request successful');
                    console.log('🔍 PHP proxy data sample:', data.data ? data.data.slice(0, 3).map(o => ({id: o.order_id, status: o.order_status})) : 'No data');
                } else {
                    console.log('⚠️ PHP proxy response not OK:', response.status, response.statusText);
                }
            } catch (proxyError) {
                console.log('⚠️ PHP proxy request failed:', proxyError.message);
            }
            
            // Approach 2: Try direct CORS request if proxy failed
            if (!data) {
                try {
                    console.log('🔄 Attempting direct CORS request...');
                    response = await fetch(this.apiUrl + cacheBustingParam, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        },
                        mode: 'cors'
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log('✅ Direct CORS request successful');
                        console.log('🔍 Direct CORS data sample:', data.data ? data.data.slice(0, 3).map(o => ({id: o.order_id, status: o.order_status})) : 'No data');
                    } else {
                        console.log('⚠️ Direct CORS response not OK:', response.status, response.statusText);
                    }
                } catch (corsError) {
                    console.log('⚠️ Direct CORS request failed:', corsError.message);
                }
            }
            
            // Approach 3: Try without CORS mode if previous attempts failed
            if (!data) {
                try {
                    console.log('🔄 Attempting no-cors request...');
                    response = await fetch(this.apiUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log('✅ No-cors request successful');
                    }
                } catch (noCorsError) {
                    console.log('⚠️ No-cors request failed:', noCorsError.message);
                }
            }
            
            // Approach 4: Use JSONP-like approach with script tag
            if (!data) {
                console.log('🔄 Attempting JSONP approach...');
                data = await this.loadWithJSONP();
            }
            
            // If all approaches fail, show error
            if (!data) {
                console.error('❌ All API approaches failed');
                this.showError('Unable to load orders. Please check your internet connection and try again.');
                return;
            }

            console.log('📡 Final data received:', data);

            if (data && data.success && data.data) {
                this.orders = data.data;
                console.log(`📊 Loaded ${this.orders.length} orders`);
                
                // Debug: Log the order IDs to see what we actually got
                const orderIds = this.orders.map(o => o.order_id).sort((a, b) => b - a);
                console.log('🔍 Order IDs loaded:', orderIds.slice(0, 10)); // Show first 10
                console.log('🔍 Latest order:', this.orders.find(o => o.order_id === Math.max(...orderIds)));
                
                this.updateLastUpdated();
                this.calculateStats();
                this.applyFilters();
                this.showOrders();
            } else if (data && data.data) {
                // Handle case where success field might not be present
                this.orders = Array.isArray(data.data) ? data.data : data;
                console.log(`📊 Loaded ${this.orders.length} orders (alternative format)`);
                
                // Debug: Log the order IDs to see what we actually got
                const orderIds = this.orders.map(o => o.order_id).sort((a, b) => b - a);
                console.log('🔍 Order IDs loaded (alt):', orderIds.slice(0, 10)); // Show first 10
                
                this.updateLastUpdated();
                this.calculateStats();
                this.applyFilters();
                this.showOrders();
            } else {
                throw new Error('No valid data received from any method');
            }

        } catch (error) {
            console.error('❌ All loading methods failed:', error);
            this.showError(`Failed to load orders: ${error.message}. Please check your internet connection and try again.`);
        }
    }

    async loadWithJSONP() {
        return new Promise((resolve) => {
            // Create a unique callback name
            const callbackName = 'orderCallback_' + Date.now();
            
            // Create script element
            const script = document.createElement('script');
            script.src = `${this.apiUrl}?callback=${callbackName}`;
            
            // Set up callback
            window[callbackName] = function(data) {
                resolve(data);
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            // Handle errors
            script.onerror = function() {
                resolve(null);
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            // Add script to head
            document.head.appendChild(script);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (window[callbackName]) {
                    resolve(null);
                    document.head.removeChild(script);
                    delete window[callbackName];
                }
            }, 10000);
        });
    }

    // Removed getFallbackData() method - using only external API now

    async loadIssues() {
        console.log('📥 Loading issues from API...');
        
        try {
            const response = await fetch(this.issueApiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Issues loaded:', data);
                
                if (data.success && data.data) {
                    // Index issues by order_id for quick lookup
                    this.orderIssues = {};
                    data.data.forEach(issue => {
                        this.orderIssues[issue.order_id] = issue;
                    });
                    console.log('📊 Indexed issues:', this.orderIssues);
                    
                    // Re-render orders if they're already loaded
                    if (this.orders.length > 0) {
                        this.renderOrders();
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to load issues:', error);
        }
    }

    calculateStats() {
        const completedOrders = this.orders.filter(order => order.order_status === 'Completed').length;
        const issuesRaised = this.orders.filter(order => order.issue_raised === 1).length;
        const totalValue = this.orders.reduce((sum, order) => sum + parseFloat(order.total_value || 0), 0);
        
        // Update stats in the UI
        document.getElementById('totalOrders').textContent = this.orders.length;
        document.getElementById('completedOrders').textContent = completedOrders;
        document.getElementById('issuesRaised').textContent = issuesRaised;
        document.getElementById('totalValue').textContent = this.formatCurrency(totalValue, 'INR');
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('ordersGrid').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('ordersGrid').style.display = 'none';
        document.getElementById('errorMessage').textContent = message;
    }

    showEmpty() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('ordersGrid').style.display = 'none';
    }

    showOrders() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('ordersGrid').style.display = 'block';
    }

    applyFilters() {
        console.log('🔍 Applying filters:', {
            status: this.currentStatusFilter,
            issue: this.currentIssueFilter,
            sort: this.currentSort
        });

        // Start with all orders
        this.filteredOrders = [...this.orders];

        // Apply status filter
        if (this.currentStatusFilter) {
            this.filteredOrders = this.filteredOrders.filter(order => 
                order.order_status === this.currentStatusFilter
            );
        }

        // Apply issue filter
        if (this.currentIssueFilter !== '') {
            const issueValue = parseInt(this.currentIssueFilter);
            this.filteredOrders = this.filteredOrders.filter(order => 
                order.issue_raised === issueValue
            );
        }

        // Apply sorting
        this.sortOrders();

        console.log(`📋 Filtered to ${this.filteredOrders.length} orders`);
        
        // Debug: Log the filtered order IDs
        const filteredIds = this.filteredOrders.map(o => o.order_id).sort((a, b) => b - a);
        console.log('🔍 Filtered Order IDs:', filteredIds.slice(0, 10)); // Show first 10
        
        if (this.filteredOrders.length === 0) {
            this.showEmpty();
        } else {
            this.renderOrders();
        }
    }

    sortOrders() {
        switch (this.currentSort) {
            case 'newest':
                this.filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                this.filteredOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'amount_high':
                this.filteredOrders.sort((a, b) => parseFloat(b.total_value || 0) - parseFloat(a.total_value || 0));
                break;
            case 'amount_low':
                this.filteredOrders.sort((a, b) => parseFloat(a.total_value || 0) - parseFloat(b.total_value || 0));
                break;
        }
    }

    renderOrders() {
        const ordersGrid = document.getElementById('ordersGrid');
        ordersGrid.innerHTML = '';

        this.filteredOrders.forEach(order => {
            const orderCard = this.createOrderCard(order);
            ordersGrid.appendChild(orderCard);
        });

        console.log(`🎨 Rendered ${this.filteredOrders.length} order cards`);
    }

    createOrderCard(order) {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.addEventListener('click', () => {
            this.showOrderDetails(order);
        });

        const statusClass = `status-${order.order_status.toLowerCase()}`;
        const formattedDate = this.formatDate(order.created_at);
        const formattedAmount = this.formatCurrency(order.total_value, order.currency);
        
         // Get issue data for this order (now comes directly from API)
        const issueData = order.issue_details;
        const issueActionsArray = order.issue_actions;
        
        // Handle both array and single object cases for issue_actions
        let latestAction = null;
        if (issueActionsArray) {
            if (Array.isArray(issueActionsArray)) {
                // If it's an array, get the first element
                latestAction = issueActionsArray.length > 0 ? issueActionsArray[0] : null;
            } else {
                // If it's a single object, use it directly
                latestAction = issueActionsArray;
            }
        }
        const hasIssue = order.issue_raised === 1 || issueData;
        
        // Debug logging for issue data
        if (hasIssue) {
            console.log(`🔍 Order #${order.order_id} Issue Data:`, {
                issue_raised: order.issue_raised,
                issue_status: issueData?.status,
                latest_action_status: latestAction?.action_status,
            });
        }

        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-title">
                    <h3>Order #${order.order_id}</h3>
                    <div class="order-id">${order.ondc_order_id || order.transaction_id}</div>
                </div>
                <div class="order-status-container">
                    <div class="order-status ${statusClass}">
                        ${order.order_status}
                    </div>
                    ${hasIssue ? 
                        `<div class="issue-badge">
                             ${issueData && issueData.status ? issueData.status : 'ISSUE RAISED'}
                         </div>` : ''
                     }
                </div>
            </div>

            <div class="order-details">
                <div class="order-detail">
                    <div class="order-detail-label">Amount</div>
                    <div class="order-detail-value order-amount">${formattedAmount}</div>
                </div>
                <div class="order-detail">
                    <div class="order-detail-label">Items</div>
                    <div class="order-detail-value">${order.total_items || 0} items</div>
                </div>
                <div class="order-detail">
                    <div class="order-detail-label">Payment</div>
                    <div class="order-detail-value">${order.payment_status}</div>
                </div>
                <div class="order-detail">
                    <div class="order-detail-label">Date</div>
                    <div class="order-detail-value">${formattedDate}</div>
                </div>
            </div>

            ${order.order_details && order.order_details.length > 0 ? this.createOrderItemsSection(order.order_details) : ''}

            ${hasIssue ?
                `<div class="issue-status-section">
                    <div class="issue-status-info">
                        <div class="issue-status-label">Issue Status:</div>
                        <div class="issue-status-value ${(issueData && issueData.status ? issueData.status : 'OPEN').toLowerCase()}">
                            <i class="fas fa-circle"></i>
                            ${issueData && issueData.status ? issueData.status : 'OPEN'}
                        </div>
                    </div>
                    ${latestAction ? `
                        <div class="action-status-info">
                            <div class="action-status-label">Latest Action:</div>
                            <div class="action-status-value ${latestAction.action_status.toLowerCase().replace('_', '-')}">
                                <i class="fas fa-arrow-right"></i>
                                ${latestAction.action_status}
                            </div>
                        </div>
                    ` : ''}
                    <div class="issue-meta-info">
                        <span class="issue-id">ID: ${issueData ? issueData.issue_id : `ISSUE-${order.order_id}`}</span>
                        <span class="issue-date">Updated: ${this.formatDate(issueData ? issueData.updated_at : order.updated_at)}</span>
                    </div>
                    ${latestAction ? `
                        <div class="action-meta-info">
                            <span class="action-by">By: ${latestAction.action_by}</span>
                            <span class="action-date">${this.formatDate(latestAction.action_updated_at)}</span>
                        </div>
                    ` : ''}
                </div>` :
                `<div class="no-issue-status">
                    <div class="no-issue-text">
                        <i class="fas fa-check-circle"></i>
                        No Issues Reported
                    </div>
                </div>`
            }

            <div class="order-actions">
                ${hasIssue ? 
                     `<button class="order-action-btn issue-details-btn" onclick="event.stopPropagation(); window.orderListManager.showOrderDetails(${JSON.stringify(order).replace(/"/g, '&quot;')})">
                         <i class="fas fa-eye"></i>
                         View Issue Details
                     </button>
                     ${latestAction && latestAction.action_status === 'INFO_REQUESTED' ? 
                         `<button class="order-action-btn info-provide-btn" onclick="event.stopPropagation(); window.orderListManager.showInfoProvideModal('${order.order_id}', '${issueData.issue_id}')">
                             <i class="fas fa-upload"></i>
                             Info Provide
                         </button>` : ''
                     }` :
                     order.order_status === 'Completed' ?
                     `<button class="order-action-btn raise-issue-btn" onclick="event.stopPropagation(); window.orderListManager.showRaiseIssueModal(${JSON.stringify(order).replace(/"/g, '&quot;')})">
                         <i class="fas fa-exclamation-triangle"></i>
                         Raise Issue
                     </button>` :
                     ''
                 }
            </div>
        `;

        return orderCard;
    }

    createOrderItemsSection(orderDetails) {
        const itemsHtml = orderDetails.map(item => `
            <div class="order-item">
                <div class="item-info">
                    <div class="item-name">${item.title}</div>
                    <div class="item-details">Qty: ${item.quantity} • Status: ${item.status}</div>
                </div>
                <div class="item-amount">${this.formatCurrency(item.amount, item.currency)}</div>
            </div>
        `).join('');

        return `
            <div class="order-items-section">
                <h4>Order Items</h4>
                <div class="order-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    // Removed duplicate loadIssues method - using the one below

    async loadIssues() {
        console.log('📥 Loading issues from API...');
        
        try {
            const response = await fetch(this.issueApiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Issues loaded:', data);
                
                if (data.success && data.data) {
                    // Index issues by order_id for quick lookup
                    this.orderIssues = {};
                    data.data.forEach(issue => {
                        this.orderIssues[issue.order_id] = issue;
                    });
                    console.log('📊 Indexed issues:', this.orderIssues);
                    
                    // Re-render orders if they're already loaded
                    if (this.orders.length > 0) {
                        this.renderOrders();
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to load issues:', error);
        }
    }

    // Rest of the methods continue below...

    showOrderDetails(order) {
        console.log('👁️ Showing details for order:', order.order_id);
        
        const modal = document.getElementById('orderModal');
        const modalTitle = document.getElementById('orderModalTitle');
        const modalBody = document.getElementById('orderModalBody');

        modalTitle.textContent = `Order #${order.order_id} Details`;
        modalBody.innerHTML = '<p>Order details will be displayed here.</p>';
        modal.style.display = 'block';
    }

    showRaiseIssueModal(order) {
        console.log('🚨 Raise Issue for order:', order.order_id);
        alert(`Raise Issue for Order #${order.order_id}\n\nThis would open the issue raising form.\n\nOrder: ${order.ondc_order_id || order.order_id}\nAmount: ${this.formatCurrency(order.total_value, order.currency)}\nStatus: ${order.order_status}`);
    }

    showInfoProvideModal(orderId, issueId) {
        console.log('📤 Info Provide for order:', orderId, 'issue:', issueId);
        
        // Create modal if it doesn't exist
        if (!document.getElementById('infoProvideModal')) {
            this.createInfoProvideModal();
        }
        
        // Set the transaction_id and issue_id
        document.getElementById('infoTransactionId').value = orderId;
        document.getElementById('infoIssueId').value = issueId;
        
        // Clear previous uploads
        this.clearImageUploads();
        
        // Show modal
        document.getElementById('infoProvideModal').style.display = 'block';
    }

    formatCurrency(amount, currency = 'INR') {
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        return formatter.format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Additional utility methods will be added here as needed
}

// Initialize the OrderListManager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded - initializing OrderListManager');
    window.orderListManager = new OrderListManager();
});

// End of file
