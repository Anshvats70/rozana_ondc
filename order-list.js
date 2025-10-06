/**
 * Order List Manager
 * Fetches and displays orders from the ONDC API
 * Auto-refreshes on page load
 */

// Immediate global function definition - available right away
window.getOrderStatus = function(orderId) {
    console.log('🌍 Global getOrderStatus triggered for order:', orderId);
    if (window.orderListManager && typeof window.orderListManager.getOrderStatus === 'function') {
        return window.orderListManager.getOrderStatus(orderId);
    } else {
        console.error('❌ OrderListManager or getOrderStatus method not available');
        alert('Order status functionality is not available. Please refresh the page.');
    }
};

console.log('🔧 Global getOrderStatus function defined:', typeof window.getOrderStatus);

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
        console.log('🚀 OrderListManager initialized with AGGRESSIVE CACHE-BUSTING');
        console.log('📡 API Endpoint:', this.apiUrl);
        
        // Clear all caches on initialization
        this.clearAllCaches();
        
        this.setupEventListeners();
        this.loadOrders(true); // Force refresh on initialization
        
        // Start aggressive auto-refresh
        this.startAutoRefresh();
        
        // Add visibility change listener to refresh when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page became visible - triggering force refresh');
                this.refreshOrders(true);
            }
        });
        
        // Add focus listener to refresh when window gets focus
        window.addEventListener('focus', () => {
            console.log('🎯 Window focused - triggering force refresh');
            this.refreshOrders(true);
        });
    }

    setupEventListeners() {
        // Refresh button with force refresh
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            console.log('🔄 Manual refresh button clicked');
            this.refreshOrders(true); // Always force refresh on manual click
        });

        // Retry button with force refresh
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            console.log('🔄 Retry button clicked');
            this.refreshOrders(true); // Force refresh on retry
        });

        // Force refresh button
        document.getElementById('forceRefreshBtn')?.addEventListener('click', () => {
            console.log('🔴 FORCE REFRESH button clicked - nuclear cache clearing');
            this.clearAllCaches();
            this.refreshOrders(true);
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

    async loadOrders(forceRefresh = false) {
        console.log('📥 Loading orders from API...', forceRefresh ? '(FORCE REFRESH)' : '');
        this.showLoading();
        
        // Clear any cached data first
        this.orders = [];
        this.filteredOrders = [];
        
        try {
            // AGGRESSIVE cache-busting with multiple parameters
            const timestamp = new Date().getTime();
            const randomId = Math.random().toString(36).substring(7);
            const sessionId = Date.now().toString(36);
            const cacheBustingParams = `?_t=${timestamp}&_r=${randomId}&_s=${sessionId}&_force=${forceRefresh ? '1' : '0'}&_v=${Math.floor(Math.random() * 10000)}`;
            
            console.log('🚫 Cache-busting URL:', this.apiUrl + cacheBustingParams);
            
            let response;
            let data;
            let successMethod = null;
            
            // Approach 1: Direct API call with aggressive cache-busting
            try {
                console.log('🔄 Attempting direct API request with aggressive cache-busting...');
                response = await fetch(this.apiUrl + cacheBustingParams, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                        'If-None-Match': '*'
                    },
                    cache: 'no-store'
                });
                
                if (response.ok) {
                    data = await response.json();
                    successMethod = 'Direct API';
                    console.log('✅ Direct API request successful');
                    console.log('🔍 Direct API data sample:', data.data ? data.data.slice(0, 3).map(o => ({id: o.order_id, status: o.order_status, issue_status: o.issue_details_status, issue_actions: o.issue_actions})) : 'No data');
                } else {
                    console.log('⚠️ Direct API response not OK:', response.status, response.statusText);
                }
            } catch (directError) {
                console.log('⚠️ Direct API request failed:', directError.message);
            }
            
            // Approach 2: Try PHP proxy with cache-busting if direct failed
            if (!data) {
                try {
                    console.log('🔄 Attempting PHP proxy request...');
                    response = await fetch(this.proxyUrl + cacheBustingParams, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        },
                        cache: 'no-store'
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        successMethod = 'PHP Proxy';
                        console.log('✅ PHP proxy request successful');
                        console.log('🔍 PHP proxy data sample:', data.data ? data.data.slice(0, 3).map(o => ({id: o.order_id, status: o.order_status, issue_status: o.issue_details_status, issue_actions: o.issue_actions})) : 'No data');
                    } else {
                        console.log('⚠️ PHP proxy response not OK:', response.status, response.statusText);
                    }
                } catch (proxyError) {
                    console.log('⚠️ PHP proxy request failed:', proxyError.message);
                }
            }
            
            // Approach 3: Try CORS request if proxy failed
            if (!data) {
                try {
                    console.log('🔄 Attempting CORS request...');
                    response = await fetch(this.apiUrl + cacheBustingParams, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        },
                        mode: 'cors',
                        cache: 'no-store'
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        successMethod = 'CORS';
                        console.log('✅ CORS request successful');
                        console.log('🔍 CORS data sample:', data.data ? data.data.slice(0, 3).map(o => ({id: o.order_id, status: o.order_status, issue_status: o.issue_details_status, issue_actions: o.issue_actions})) : 'No data');
                    } else {
                        console.log('⚠️ CORS response not OK:', response.status, response.statusText);
                    }
                } catch (corsError) {
                    console.log('⚠️ CORS request failed:', corsError.message);
                }
            }
            
            // If all approaches fail, show error
            if (!data) {
                console.error('❌ All API approaches failed');
                this.showError('Unable to load orders. Please check your internet connection and try again.');
                return;
            }

            console.log(`📡 Final data received via ${successMethod}:`, {
                success: data.success,
                dataCount: data.data ? data.data.length : 0,
                timestamp: new Date().toISOString()
            });

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
        const issueStatus = order.issue_details_status; // This is the actual field from API
        const issueId = order.issue_id;
        const issueActions = order.issue_actions; // This is a string, not an array
        
        // Handle issue actions - it's a string in the API response
        let latestActionStatus = null;
        if (issueActions && typeof issueActions === 'string') {
            latestActionStatus = issueActions; // Use the string directly
        }
        
        const hasIssue = order.issue_raised === 1;
        
        // Debug logging for issue data
        if (hasIssue) {
            console.log(`🔍 Order #${order.order_id} Issue Data:`, {
                issue_raised: order.issue_raised,
                issue_details_status: issueStatus,
                issue_id: issueId,
                issue_actions: latestActionStatus,
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
                             ${issueStatus ? issueStatus : 'ISSUE RAISED'}
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
                        <div class="issue-status-value ${(issueStatus ? issueStatus : 'OPEN').toLowerCase()}">
                            <i class="fas fa-circle"></i>
                            ${issueStatus ? issueStatus : 'OPEN'}
                        </div>
                    </div>
                    ${latestActionStatus ? `
                        <div class="action-status-info">
                            <div class="action-status-label">Latest Action:</div>
                            <div class="action-status-value ${latestActionStatus.toLowerCase().replace('_', '-')}">
                                <i class="fas fa-arrow-right"></i>
                                ${latestActionStatus}
                            </div>
                        </div>
                    ` : ''}
                    <div class="issue-meta-info">
                        <span class="issue-id">ID: ${issueId ? issueId : `ISSUE-${order.order_id}`}</span>
                        <span class="issue-date">Updated: ${this.formatDate(order.updated_at)}</span>
                    </div>
                    ${latestActionStatus ? `
                        <div class="action-meta-info">
                            <span class="action-by">Latest Action: ${latestActionStatus}</span>
                            <span class="action-date">${this.formatDate(order.updated_at)}</span>
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
                     `<button class="order-action-btn issue-details-btn" onclick="event.stopPropagation(); window.orderListManager.showDetailedIssueModal('${order.transaction_id}', '${issueId ? issueId : `ISSUE-${order.order_id}`}')">
                         <i class="fas fa-eye"></i>
                         View Issue Details
                     </button>
                     ${latestActionStatus === 'INFO_REQUESTED' ? 
                         `<button class="order-action-btn info-provide-btn" onclick="event.stopPropagation(); window.orderListManager.showInfoProvideModal('${order.order_id}', '${issueId}')">
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

    async showDetailedIssueModal(transactionId, issueId) {
        console.log('🔍 Fetching detailed issue data for:', { transactionId, issueId });
        
        // Show loading modal first
        this.showLoadingModal('Loading Issue Details...');
        
        try {
            // Fetch detailed issue data from the API
            const apiUrl = `https://neo-server.rozana.in/issues/${transactionId}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const issueData = await response.json();
            console.log('✅ Detailed issue data loaded:', issueData);

            // Close loading modal
            this.closeLoadingModal();

            // Show the detailed issue modal
            this.displayDetailedIssueModal(issueData, transactionId, issueId);

        } catch (error) {
            console.error('❌ Failed to fetch issue details:', error);
            
            // Close loading modal
            this.closeLoadingModal();
            
            // Show error modal
            this.showErrorModal('Failed to Load Issue Details', `
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">Loading Failed</h3>
                    <p style="margin-bottom: 1rem;">Unable to fetch detailed issue information.</p>
                    <div style="background: #fef2f2; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                        <div><strong>Transaction ID:</strong> ${transactionId}</div>
                        <div><strong>Issue ID:</strong> ${issueId}</div>
                        <div><strong>Error:</strong> ${error.message}</div>
                    </div>
                    <p style="font-size: 0.9rem; color: #6b7280;">
                        Please try again or contact support if the issue persists.
                    </p>
                </div>
            `);
        }
    }

    showLoadingModal(message = 'Loading...') {
        // Remove existing loading modal if any
        this.closeLoadingModal();
        
        const loadingModal = document.createElement('div');
        loadingModal.id = 'loadingModal';
        loadingModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        loadingModal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 10px; text-align: center; min-width: 300px;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="margin: 0; color: #333; font-size: 1.1rem;">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loadingModal);
    }

    closeLoadingModal() {
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            loadingModal.remove();
        }
    }

    displayDetailedIssueModal(issueData, transactionId, issueId) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'detailedIssueModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 1rem;
        `;

        const issueDetails = issueData.success && issueData.data && issueData.data.length > 0 ? issueData.data[0] : null;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
                    <h2 style="margin: 0; color: #333; font-size: 1.5rem;">
                        <i class="fas fa-exclamation-circle" style="color: #dc2626; margin-right: 0.5rem;"></i>
                        Issue Details
                    </h2>
                    <button onclick="this.closest('#detailedIssueModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.5rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 1.5rem;">
                    ${issueDetails ? this.generateIssueDetailsHTML(issueDetails) : this.generateNoIssueDataHTML(transactionId, issueId)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    generateIssueDetailsHTML(issueDetails) {
        const actions = issueDetails.actions || [];
        const actors = issueDetails.actors || [];
        const refs = issueDetails.refs || [];
        
        return `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Issue Overview -->
                <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #dc2626;">
                    <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-info-circle"></i>
                        Issue Overview
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <strong>Issue ID:</strong><br>
                            <span style="color: #dc2626; font-family: monospace;">${issueDetails.issue_id}</span>
                        </div>
                        <div>
                            <strong>Status:</strong><br>
                            <span class="status-badge" style="background: ${this.getStatusColor(issueDetails.status)}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${issueDetails.status}</span>
                        </div>
                        <div>
                            <strong>Order ID:</strong><br>
                            <span style="font-family: monospace;">${issueDetails.order_id}</span>
                        </div>
                        <div>
                            <strong>Transaction ID:</strong><br>
                            <span style="font-family: monospace; font-size: 0.9rem;">${issueDetails.transaction_id}</span>
                        </div>
                    </div>
                    ${issueDetails.descriptor ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                            <strong>Description:</strong><br>
                            <div style="margin-top: 0.5rem;">
                                <div><strong>Code:</strong> ${issueDetails.descriptor.code}</div>
                                <div><strong>Short Description:</strong> ${issueDetails.descriptor.short_desc}</div>
                                ${issueDetails.descriptor.long_desc ? `<div><strong>Long Description:</strong> ${issueDetails.descriptor.long_desc}</div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Actions Timeline -->
                <div>
                    <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-history"></i>
                        Actions Timeline (${actions.length} actions)
                    </h3>
                    <div style="position: relative;">
                        ${actions.map((action, index) => `
                            <div style="position: relative; padding-left: 2rem; padding-bottom: ${index === actions.length - 1 ? '0' : '1.5rem'};">
                                ${index !== actions.length - 1 ? '<div style="position: absolute; left: 0.75rem; top: 2rem; bottom: -1.5rem; width: 2px; background: #e5e7eb;"></div>' : ''}
                                <div style="position: absolute; left: 0.5rem; top: 0.5rem; width: 1rem; height: 1rem; background: ${this.getActionStatusColor(action.action_status)}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px ${this.getActionStatusColor(action.action_status)};"></div>
                                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;">
                                    <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 0.5rem;">
                                        <div>
                                            <strong style="color: #333;">${action.descriptor?.code || action.action_status}</strong>
                                            <span style="background: ${this.getActionStatusColor(action.action_status)}; color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">${action.action_status}</span>
                                        </div>
                                        <small style="color: #6b7280;">${this.formatDate(action.action_updated_at)}</small>
                                    </div>
                                    ${action.descriptor?.short_desc ? `<p style="margin: 0.5rem 0; color: #6b7280;">${action.descriptor.short_desc}</p>` : ''}
                                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #6b7280;">
                                        <span><strong>By:</strong> ${action.action_by}</span>
                                        ${action.actor_details?.name ? `<span><strong>Actor:</strong> ${action.actor_details.name}</span>` : ''}
                                    </div>
                                    ${action.tags && action.tags.length > 0 ? `
                                        <div style="margin-top: 0.5rem;">
                                            <strong style="font-size: 0.9rem;">Evidence:</strong>
                                            ${action.tags.map(tag => `
                                                <div style="margin-top: 0.25rem; font-size: 0.9rem;">
                                                    <strong>${tag.descriptor.code}:</strong>
                                                    ${tag.list ? tag.list.map(item => `
                                                        <div style="margin-left: 1rem; color: #6b7280;">
                                                            ${item.descriptor.code}: ${item.value}
                                                        </div>
                                                    `).join('') : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Actors Information -->
                ${actors.length > 0 ? `
                    <div>
                        <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-users"></i>
                            Involved Parties (${actors.length})
                        </h3>
                        <div style="display: grid; gap: 1rem;">
                            ${actors.map(actor => `
                                <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; border-left: 3px solid #667eea;">
                                    <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 0.5rem;">
                                        <strong style="color: #333;">${actor.info?.person?.name || actor.info?.org?.name || actor.id}</strong>
                                        <span style="background: #667eea; color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${actor.type}</span>
                                    </div>
                                    ${actor.info?.contact ? `
                                        <div style="font-size: 0.9rem; color: #6b7280;">
                                            ${actor.info.contact.email ? `<div>📧 ${actor.info.contact.email}</div>` : ''}
                                            ${actor.info.contact.phone ? `<div>📞 ${actor.info.contact.phone}</div>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- References -->
                ${refs.length > 0 ? `
                    <div>
                        <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-link"></i>
                            References (${refs.length})
                        </h3>
                        <div style="display: grid; gap: 0.5rem;">
                            ${refs.map(ref => `
                                <div style="background: #f3f4f6; padding: 0.75rem; border-radius: 6px; display: flex; justify-content: between; align-items: center;">
                                    <div>
                                        <strong>${ref.ref_type}:</strong>
                                        <span style="font-family: monospace; margin-left: 0.5rem;">${ref.ref_id}</span>
                                    </div>
                                    ${ref.tags ? `<small style="color: #6b7280;">Has additional data</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Timestamps -->
                <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; font-size: 0.9rem; color: #6b7280;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Created:</strong> ${this.formatDate(issueDetails.created_at)}</div>
                        <div><strong>Last Updated:</strong> ${this.formatDate(issueDetails.updated_at)}</div>
                        ${issueDetails.expected_response_time ? `<div><strong>Expected Response:</strong> ${issueDetails.expected_response_time}</div>` : ''}
                        ${issueDetails.expected_resolution_time ? `<div><strong>Expected Resolution:</strong> ${issueDetails.expected_resolution_time}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    generateNoIssueDataHTML(transactionId, issueId) {
        return `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: #6b7280; margin-bottom: 1rem;"></i>
                <h3 style="color: #6b7280; margin-bottom: 1rem;">No Detailed Issue Data Found</h3>
                <p style="margin-bottom: 1rem; color: #6b7280;">
                    Unable to retrieve detailed information for this issue from the API.
                </p>
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <div><strong>Transaction ID:</strong> ${transactionId}</div>
                    <div><strong>Issue ID:</strong> ${issueId}</div>
                    <div><strong>API Endpoint:</strong> https://neo-server.rozana.in/issues/${transactionId}</div>
                </div>
                <p style="font-size: 0.9rem; color: #6b7280;">
                    The issue may not exist in the system or there might be a connectivity issue.
                </p>
            </div>
        `;
    }

    getStatusColor(status) {
        const colors = {
            'OPEN': '#dc2626',
            'PROCESSING': '#f59e0b',
            'RESOLVED': '#10b981',
            'CLOSED': '#6b7280',
            'CANCELLED': '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    getActionStatusColor(status) {
        const colors = {
            'OPEN': '#dc2626',
            'PROCESSING': '#f59e0b',
            'INFO_REQUESTED': '#3b82f6',
            'INFO_PROVIDED': '#8b5cf6',
            'RESOLUTION_PROPOSED': '#f59e0b',
            'RESOLUTION_ACCEPTED': '#10b981',
            'CLOSED': '#6b7280'
        };
        return colors[status] || '#6b7280';
    }

    // Force refresh methods for cache-busting
    async refreshOrders(forceRefresh = true) {
        console.log('🔄 Refreshing orders...', forceRefresh ? '(FORCE)' : '');
        
        // Clear all cached data
        this.clearAllCaches();
        
        // Force reload with cache-busting
        await this.loadOrders(forceRefresh);
        
        // Show refresh notification
        this.showRefreshNotification('Orders refreshed successfully!');
    }
    
    clearAllCaches() {
        console.log('🗑️ Clearing all caches...');
        
        // Clear in-memory data
        this.orders = [];
        this.filteredOrders = [];
        this.orderIssues = {};
        
        // Clear any browser caches for this domain
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('neo-server.rozana.in') || name.includes('orders')) {
                        caches.delete(name);
                        console.log('🗑️ Deleted cache:', name);
                    }
                });
            });
        }
        
        // Clear localStorage related to orders
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('order') || key.includes('issue') || key.includes('cache'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ Removed localStorage:', key);
        });
    }
    
    // Auto-refresh with force refresh capability
    startAutoRefresh() {
        console.log('⏰ Starting auto-refresh (every 15 seconds with force refresh)...');
        
        // Clear any existing interval
        this.stopAutoRefresh();
        
        // Set up aggressive auto-refresh every 15 seconds
        this.autoRefreshInterval = setInterval(() => {
            console.log('⏰ Auto-refresh triggered (FORCE)');
            this.refreshOrders(true); // Always force refresh
        }, 15000); // 15 seconds for more frequent updates
    }
    
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('⏰ Auto-refresh stopped');
        }
    }
    
    // Method to trigger refresh after status changes
    async triggerStatusChangeRefresh() {
        console.log('🔄 Status change detected - triggering force refresh...');
        
        // Wait a moment for backend to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force refresh
        await this.refreshOrders(true);
    }
    
    // Method to show refresh notifications
    showRefreshNotification(message) {
        console.log('📢 Refresh notification:', message);
        
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 0.9rem;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-sync-alt"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Get order status function - works like refresh status in order-confirmation page
    async getOrderStatus(orderId) {
        console.log('🔄 Getting status for order:', orderId);
        
        try {
            // Show loading state
            this.showLoadingModal('Checking order status...');
            
            // Find the order in our current orders list
            const order = this.orders.find(o => o.order_id == orderId);
            if (!order) {
                throw new Error('Order not found in current orders list');
            }
            
            const transactionId = order.transaction_id || order.ondc_order_id;
            if (!transactionId) {
                throw new Error('No transaction ID found for this order');
            }
            
            let ondcStatusResponse = null;
            let orderData = null;
            
            // First send ONDC status event (like in order-confirmation page)
            try {
                ondcStatusResponse = await this.sendONDCStatusEvent(transactionId, order);
                console.log('ONDC Status event sent successfully');
            } catch (ondcError) {
                console.warn('ONDC Status event failed, continuing with API fetch:', ondcError);
                // Continue with API fetch even if ONDC status fails
            }
            
            // Then fetch updated order data from API
            try {
                orderData = await this.fetchOrderStatus(transactionId);
            } catch (apiError) {
                console.error('API fetch failed:', apiError);
                throw new Error('Failed to fetch order data from server');
            }
            
            // Close loading modal
            this.closeLoadingModal();
            
            if (orderData) {
                // Update the order in our local list
                const orderIndex = this.orders.findIndex(o => o.order_id == orderId);
                if (orderIndex !== -1) {
                    this.orders[orderIndex] = { ...this.orders[orderIndex], ...orderData };
                    // Re-render the orders to show updated status
                    this.renderOrders();
                }
                
                // Show status-specific notification
                const status = orderData.order_status || 'Unknown';
                const paymentStatus = orderData.payment_status || 'Unknown';
                
                let notificationMessage = `Order Status: ${status} | Payment: ${paymentStatus}`;
                if (ondcStatusResponse) {
                    notificationMessage += ' | ONDC Status: Updated';
                }
                
                this.showRefreshNotification(notificationMessage);
                
                // Show detailed status in a modal
                this.showOrderStatusModal(orderId, orderData);
            } else {
                throw new Error('No order data received');
            }
            
        } catch (error) {
            console.error('❌ Failed to get order status:', error);
            
            // Close loading modal
            this.closeLoadingModal();
            
            // Show error notification
            this.showErrorModal('Failed to Get Order Status', `
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">Status Check Failed</h3>
                    <p style="margin-bottom: 1rem;">Unable to fetch status for order #${orderId}.</p>
                    <div style="background: #fef2f2; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                        <div><strong>Order ID:</strong> ${orderId}</div>
                        <div><strong>Error:</strong> ${error.message}</div>
                    </div>
                    <p style="font-size: 0.9rem; color: #6b7280;">
                        Please try again or contact support if the issue persists.
                    </p>
                </div>
            `);
        }
    }
    
    // Send ONDC status event (similar to order-confirmation page)
    async sendONDCStatusEvent(transactionId, order) {
        const messageId = this.generateUUID();
        const timestamp = new Date().toISOString();
        
        const statusPayload = {
            "context": {
                "domain": "ONDC:RET10",
                "action": "status",
                "core_version": "1.2.0",
                "bap_id": "neo-server.rozana.in",
                "bap_uri": "https://neo-server.rozana.in/bapl",
                "bpp_id": "pramaan.ondc.org",
                "bpp_uri": "https://pramaan.ondc.org",
                "transaction_id": transactionId,
                "message_id": messageId,
                "timestamp": timestamp,
                "city": "std:011",
                "country": "IND",
                "ttl": "PT30S"
            },
            "message": {
                "order_id": order.ondc_order_id || order.order_id
            }
        };
        
        console.log('Sending ONDC Status event:', statusPayload);
        
        return fetch('https://pramaan.ondc.org/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(statusPayload)
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    }
    
    // Fetch order status from API
    async fetchOrderStatus(transactionId) {
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
        console.log('Order status API response:', orderData);
        
        return orderData;
    }
    
    // Generate UUID function
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    showOrderStatusModal(orderId, statusData) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'orderStatusModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 1rem;
        `;

        const status = statusData.success && statusData.data ? statusData.data : statusData;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1;">
                    <h2 style="margin: 0; color: #333; font-size: 1.5rem;">
                        <i class="fas fa-sync-alt" style="color: #10b981; margin-right: 0.5rem;"></i>
                        Order Status
                    </h2>
                    <button onclick="this.closest('#orderStatusModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.5rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 1.5rem;">
                    ${this.generateOrderStatusHTML(orderId, status)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    generateOrderStatusHTML(orderId, statusData) {
        if (!statusData) {
            return `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                    <h3 style="color: #f59e0b; margin-bottom: 1rem;">No Status Data</h3>
                    <p style="color: #6b7280;">Unable to retrieve status information for order #${orderId}.</p>
                </div>
            `;
        }
        
        return `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Order Overview -->
                <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #10b981;">
                    <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-info-circle"></i>
                        Order Overview
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <strong>Order ID:</strong><br>
                            <span style="color: #333; font-family: monospace;">${orderId}</span>
                        </div>
                        <div>
                            <strong>Current Status:</strong><br>
                            <span class="status-badge" style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${statusData.order_status || 'Unknown'}</span>
                        </div>
                        <div>
                            <strong>Payment Status:</strong><br>
                            <span style="color: #333;">${statusData.payment_status || 'Unknown'}</span>
                        </div>
                        <div>
                            <strong>Last Updated:</strong><br>
                            <span style="color: #6b7280;">${this.formatDate(statusData.updated_at)}</span>
                        </div>
                    </div>
                </div>

                <!-- Status Details -->
                ${statusData.status_details ? `
                    <div>
                        <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-list"></i>
                            Status Details
                        </h3>
                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 6px;">
                            <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 0.9rem;">${JSON.stringify(statusData.status_details, null, 2)}</pre>
                        </div>
                    </div>
                ` : ''}

                <!-- Additional Information -->
                ${statusData.additional_info ? `
                    <div>
                        <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-info"></i>
                            Additional Information
                        </h3>
                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 6px;">
                            <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 0.9rem;">${JSON.stringify(statusData.additional_info, null, 2)}</pre>
                        </div>
                    </div>
                ` : ''}

                <!-- Timestamps -->
                <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; font-size: 0.9rem; color: #6b7280;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Created:</strong> ${this.formatDate(statusData.created_at)}</div>
                        <div><strong>Last Updated:</strong> ${this.formatDate(statusData.updated_at)}</div>
                        ${statusData.expected_delivery ? `<div><strong>Expected Delivery:</strong> ${this.formatDate(statusData.expected_delivery)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    showErrorModal(title, content) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'errorModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 1rem;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; max-width: 500px; width: 100%;">
                <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #dc2626; font-size: 1.5rem;">${title}</h2>
                    <button onclick="this.closest('#errorModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.5rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 1.5rem;">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Additional utility methods will be added here as needed
}

// Initialize the OrderListManager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded - initializing OrderListManager');
    try {
        window.orderListManager = new OrderListManager();
        console.log('✅ OrderListManager initialized successfully');
        console.log('🔍 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.orderListManager)));
        console.log('🔍 getOrderStatus method exists:', typeof window.orderListManager.getOrderStatus);
    } catch (error) {
        console.error('❌ Failed to initialize OrderListManager:', error);
    }
    
    // Global function to trigger refresh from anywhere
    window.forceRefreshOrders = function() {
        console.log('🌍 Global force refresh triggered');
        if (window.orderListManager) {
            window.orderListManager.refreshOrders(true);
        }
    };
    
    // Global function to trigger refresh after status changes
    window.triggerStatusChangeRefresh = function() {
        console.log('🌍 Global status change refresh triggered');
        if (window.orderListManager) {
            window.orderListManager.triggerStatusChangeRefresh();
        }
    };
    
});


// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (window.orderListManager) {
        window.orderListManager.stopAutoRefresh();
    }
});

// End of file
