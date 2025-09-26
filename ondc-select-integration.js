/**
 * ONDC Select Integration Example
 * Shows how to integrate the select handler with your existing buyer app
 */

// Initialize the select handler
const selectHandler = new ONDCSelectHandler({
    bapId: 'neo-server.rozana.in',
    bapUri: 'https://neo-server.rozana.in/bapl',
    buyerId: 'buyer_001',
    selectApiUrl: 'https://pramaan.ondc.org/beta/preprod/mock/seller/select'
});

/**
 * Integrate select handler with existing search functionality
 * Call this after a successful search to set the transaction ID
 */
function integrateSelectWithSearch() {
    // Get the current transaction ID from your search function
    const transactionId = getCurrentTransactionId(); // Your existing function
    
    if (transactionId) {
        selectHandler.setTransactionId(transactionId);
        console.log('Select handler integrated with search transaction:', transactionId);
    } else {
        console.warn('No transaction ID found from search');
    }
}

/**
 * Enhanced product card creation with select functionality
 * Replace your existing createProductCard functions with this
 */
function createProductCardWithSelect(product, sellerInfo = null) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Create the basic product card HTML
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <div class="product-price">₹${product.price}</div>
            <div class="product-actions">
                <button class="btn btn-primary select-product-btn" data-product-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i> Select Product
                </button>
                <button class="btn btn-secondary add-to-cart-btn" data-product-id="${product.id}">
                    <i class="fas fa-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const selectBtn = card.querySelector('.select-product-btn');
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    
    // Handle select button click
    selectBtn.addEventListener('click', async function() {
        await handleProductSelect(product, sellerInfo);
    });
    
    // Handle add to cart button click (your existing functionality)
    addToCartBtn.addEventListener('click', function() {
        addToCart(product.id); // Your existing addToCart function
    });
    
    return card;
}

/**
 * Handle product selection with ONDC select event
 * @param {Object} product - Product object
 * @param {Object} sellerInfo - Seller information
 */
async function handleProductSelect(product, sellerInfo = null) {
    try {
        // Show loading state
        const selectBtn = document.querySelector(`[data-product-id="${product.id}"]`);
        const originalText = selectBtn.innerHTML;
        selectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Selecting...';
        selectBtn.disabled = true;
        
        // Prepare options for select event
        const options = {
            seller: sellerInfo,
            fulfillment: {
                type: "Delivery",
                end: {
                    location: {
                        gps: "28.6139,77.2090", // Your current location
                        address: {
                            area_code: "110037"
                        }
                    }
                }
            }
        };
        
        // Send select event
        const success = await selectHandler.handleProductSelect(product, 1, options);
        
        if (success) {
            // Update UI to show selected state
            selectBtn.innerHTML = '<i class="fas fa-check"></i> Selected';
            selectBtn.classList.remove('btn-primary');
            selectBtn.classList.add('btn-success');
            
            // Show success notification
            showNotification(`${product.name} selected successfully!`, 'success');
            
            // You can add additional UI updates here
            // For example, highlight the product card, update a selection counter, etc.
            
        } else {
            // Reset button state
            selectBtn.innerHTML = originalText;
            selectBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error selecting product:', error);
        
        // Reset button state
        const selectBtn = document.querySelector(`[data-product-id="${product.id}"]`);
        selectBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Select Product';
        selectBtn.disabled = false;
        
        // Show error notification
        showNotification('Failed to select product. Please try again.', 'error');
    }
}

/**
 * Enhanced search results display with select functionality
 * Modify your existing displaySearchResults function to use this
 */
function displaySearchResultsWithSelect(results, searchTerm) {
    // Your existing results display logic...
    
    // After creating the results grid, add select functionality
    const resultsGrid = document.getElementById('resultsGrid');
    if (!resultsGrid) return;
    
    // Clear existing results
    resultsGrid.innerHTML = '';
    
    // Process different result formats and create product cards with select functionality
    if (results && Array.isArray(results)) {
        results.forEach(item => {
            const productCard = createProductCardWithSelect(item);
            resultsGrid.appendChild(productCard);
        });
    } else if (results && results.results && Array.isArray(results.results)) {
        results.results.forEach(result => {
            if (result.items && Array.isArray(result.items)) {
                result.items.forEach(item => {
                    const productCard = createProductCardWithSelect(item, result.seller);
                    resultsGrid.appendChild(productCard);
                });
            }
        });
    }
    
    // Set up event listeners for select events
    setupSelectEventListeners();
}

/**
 * Set up event listeners for select success/error events
 */
function setupSelectEventListeners() {
    // Listen for successful select events
    document.addEventListener('ondcSelectSuccess', function(event) {
        const { product, response } = event.detail;
        console.log('Product selected successfully:', product.name);
        
        // You can add additional UI updates here
        // For example, update a selection counter, show selected items list, etc.
        
        // Optional: Auto-add to cart after successful select
        // addToCart(product.id);
    });
    
    // Listen for select errors
    document.addEventListener('ondcSelectError', function(event) {
        const { product, error } = event.detail;
        console.error('Product selection failed:', product.name, error);
        
        // You can add additional error handling here
        // For example, show retry options, log to analytics, etc.
    });
}

/**
 * Utility function to show notifications
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

/**
 * Initialize select functionality
 * Call this when your app starts
 */
function initializeSelectFunctionality() {
    console.log('Initializing ONDC Select functionality...');
    
    // Set up event listeners
    setupSelectEventListeners();
    
    // Integrate with existing search functionality
    // This should be called after each successful search
    // integrateSelectWithSearch();
    
    console.log('ONDC Select functionality initialized');
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeSelectFunctionality();
});

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectHandler,
        createProductCardWithSelect,
        handleProductSelect,
        displaySearchResultsWithSelect,
        integrateSelectWithSearch,
        initializeSelectFunctionality
    };
}
