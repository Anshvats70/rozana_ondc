/**
 * ONDC Select Event Handler
 * Handles product selection events for ONDC buyer app
 * Ensures select events are sent only once per item per session
 */

class ONDCSelectHandler {
    constructor(config = {}) {
        // Configuration
        this.bapId = config.bapId || 'neo-server.rozana.in';
        this.bapUri = config.bapUri || 'https://neo-server.rozana.in/bapl';
        this.buyerId = config.buyerId || 'buyer_001';
        this.domain = config.domain || 'ONDC:RET10';
        this.country = config.country || 'IND';
        this.city = config.city || 'std:011';
        this.coreVersion = config.coreVersion || '1.2.0';
        
        // Track selected items to prevent duplicate select events
        this.selectedItems = new Set();
        
        // Current transaction ID (should be same as search)
        this.currentTransactionId = null;
        
        // API endpoint for select event
        this.selectApiUrl = config.selectApiUrl || 'https://pramaan.ondc.org/beta/preprod/mock/seller/select';
        
        console.log('ONDC Select Handler initialized');
    }

    /**
     * Set the current transaction ID (should match the search transaction)
     * @param {string} transactionId - The transaction ID from search event
     */
    setTransactionId(transactionId) {
        this.currentTransactionId = transactionId;
        console.log('Transaction ID set:', transactionId);
    }

    /**
     * Generate a unique message ID for each select event
     * @returns {string} - Unique message ID
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate current timestamp in ISO format
     * @returns {string} - ISO timestamp
     */
    generateTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Create the ONDC select event payload
     * @param {Object} product - Product object with id, name, price, etc.
     * @param {number} quantity - Quantity to select (default: 1)
     * @param {Object} options - Additional options like seller info
     * @returns {Object} - Complete ONDC select payload
     */
    createSelectPayload(product, quantity = 1, options = {}) {
        if (!this.currentTransactionId) {
            throw new Error('Transaction ID not set. Call setTransactionId() first.');
        }

        const messageId = this.generateMessageId();
        const timestamp = this.generateTimestamp();

        const payload = {
            context: {
                domain: this.domain,
                country: this.country,
                city: this.city,
                action: "select",
                core_version: this.coreVersion,
                bap_id: this.bapId,
                bap_uri: this.bapUri,
                transaction_id: this.currentTransactionId,
                message_id: messageId,
                timestamp: timestamp,
                ttl: "PT30S"
            },
            message: {
                order: {
                    items: [
                        {
                            id: product.id,
                            quantity: {
                                count: quantity
                            },
                            descriptor: {
                                name: product.name,
                                code: product.code || product.id
                            },
                            price: {
                                currency: product.currency || "INR",
                                value: product.price
                            }
                        }
                    ]
                }
            }
        };

        // Add seller information if available
        if (options.seller) {
            payload.message.order.provider = {
                id: options.seller.id,
                descriptor: {
                    name: options.seller.name
                }
            };
        }

        // Add fulfillment information if available
        if (options.fulfillment) {
            payload.message.order.fulfillment = options.fulfillment;
        }

        console.log('Created select payload:', payload);
        return payload;
    }

    /**
     * Send select event to seller API
     * @param {Object} payload - The select event payload
     * @returns {Promise<Object>} - API response
     */
    async sendSelectEvent(payload) {
        try {
            console.log('Sending select event to:', this.selectApiUrl);
            console.log('Select payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(this.selectApiUrl, {
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

    /**
     * Handle product selection - main entry point
     * @param {Object} product - Product object
     * @param {number} quantity - Quantity to select
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - Success status
     */
    async handleProductSelect(product, quantity = 1, options = {}) {
        try {
            // Create unique key for this item selection
            const itemKey = `${product.id}_${quantity}_${JSON.stringify(options)}`;
            
            // Check if we've already sent select for this exact item configuration
            if (this.selectedItems.has(itemKey)) {
                console.log('Select event already sent for this item configuration:', itemKey);
                return false;
            }

            // Validate required fields
            if (!product.id || !product.name) {
                throw new Error('Product must have id and name');
            }

            if (!this.currentTransactionId) {
                throw new Error('Transaction ID not set. Make sure to call setTransactionId() after search.');
            }

            // Create and send select payload
            const payload = this.createSelectPayload(product, quantity, options);
            const response = await this.sendSelectEvent(payload);

            // Mark this item as selected to prevent duplicate events
            this.selectedItems.add(itemKey);
            console.log('Item marked as selected:', itemKey);

            // Trigger custom event for UI updates
            this.triggerSelectEvent(product, response);

            return true;

        } catch (error) {
            console.error('Error handling product select:', error);
            this.triggerSelectError(product, error);
            return false;
        }
    }

    /**
     * Trigger custom select event for UI updates
     * @param {Object} product - Selected product
     * @param {Object} response - API response
     */
    triggerSelectEvent(product, response) {
        const event = new CustomEvent('ondcSelectSuccess', {
            detail: {
                product: product,
                response: response,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Trigger custom select error event
     * @param {Object} product - Product that failed to select
     * @param {Error} error - Error object
     */
    triggerSelectError(product, error) {
        const event = new CustomEvent('ondcSelectError', {
            detail: {
                product: product,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Clear selected items (useful for new search sessions)
     */
    clearSelectedItems() {
        this.selectedItems.clear();
        console.log('Selected items cleared');
    }

    /**
     * Get list of selected items
     * @returns {Array} - Array of selected item keys
     */
    getSelectedItems() {
        return Array.from(this.selectedItems);
    }

    /**
     * Check if an item has been selected
     * @param {string} productId - Product ID to check
     * @param {number} quantity - Quantity to check
     * @param {Object} options - Options to check
     * @returns {boolean} - Whether item has been selected
     */
    isItemSelected(productId, quantity = 1, options = {}) {
        const itemKey = `${productId}_${quantity}_${JSON.stringify(options)}`;
        return this.selectedItems.has(itemKey);
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ONDCSelectHandler;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.ONDCSelectHandler = ONDCSelectHandler;
}
