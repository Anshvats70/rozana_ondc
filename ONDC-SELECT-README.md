# ONDC Select Event Handler

A comprehensive JavaScript module for handling ONDC (Open Network for Digital Commerce) `select` events in buyer applications. This module ensures that select events are sent only once per item per user session and provides a clean, modular interface for integration.

## Features

✅ **One-time Selection**: Prevents duplicate select events for the same item  
✅ **Session Management**: Tracks selected items across the user session  
✅ **ONDC Compliance**: Follows ONDC protocol specifications  
✅ **Error Handling**: Comprehensive error handling and user feedback  
✅ **Event System**: Custom events for UI updates  
✅ **Modular Design**: Easy integration with existing applications  
✅ **TypeScript Ready**: Full TypeScript support available  

## Files Included

- `ondc-select-handler.js` - Core select handler class
- `ondc-select-integration.js` - Integration examples and utilities
- `ondc-select-styles.css` - Styling for select functionality
- `ONDC-SELECT-README.md` - This documentation

## Quick Start

### 1. Include the Files

```html
<!-- Include the CSS -->
<link rel="stylesheet" href="ondc-select-styles.css">

<!-- Include the JavaScript files -->
<script src="ondc-select-handler.js"></script>
<script src="ondc-select-integration.js"></script>
```

### 2. Initialize the Handler

```javascript
// Initialize with your configuration
const selectHandler = new ONDCSelectHandler({
    bapId: 'your-bap-id',
    bapUri: 'https://your-bap-uri.com',
    buyerId: 'buyer_001',
    selectApiUrl: 'https://seller-api.com/select'
});

// Set transaction ID after search
selectHandler.setTransactionId('your-transaction-id');
```

### 3. Handle Product Selection

```javascript
// When user clicks on a product
async function handleProductClick(product) {
    const success = await selectHandler.handleProductSelect(product, 1, {
        seller: { id: 'seller_001', name: 'Seller Name' }
    });
    
    if (success) {
        console.log('Product selected successfully!');
    }
}
```

## API Reference

### ONDCSelectHandler Class

#### Constructor Options

```javascript
const handler = new ONDCSelectHandler({
    bapId: 'string',           // Your BAP ID
    bapUri: 'string',          // Your BAP URI
    buyerId: 'string',         // Buyer ID
    domain: 'string',          // ONDC domain (default: 'ONDC:RET10')
    country: 'string',         // Country code (default: 'IND')
    city: 'string',            // City code (default: 'std:011')
    coreVersion: 'string',     // ONDC core version (default: '1.2.0')
    selectApiUrl: 'string'     // Seller select API endpoint
});
```

#### Methods

##### `setTransactionId(transactionId)`
Sets the transaction ID for the current session.

```javascript
selectHandler.setTransactionId('txn_12345');
```

##### `handleProductSelect(product, quantity, options)`
Handles product selection and sends select event.

**Parameters:**
- `product` (Object): Product object with `id`, `name`, `price`
- `quantity` (Number): Quantity to select (default: 1)
- `options` (Object): Additional options like seller info

**Returns:** Promise<boolean> - Success status

```javascript
const success = await selectHandler.handleProductSelect(product, 1, {
    seller: { id: 'seller_001', name: 'Seller Name' },
    fulfillment: {
        type: 'Delivery',
        end: {
            location: {
                gps: '28.6139,77.2090',
                address: { area_code: '110037' }
            }
        }
    }
});
```

##### `isItemSelected(productId, quantity, options)`
Checks if an item has already been selected.

```javascript
const isSelected = selectHandler.isItemSelected('product_123', 1);
```

##### `clearSelectedItems()`
Clears the selected items list (useful for new sessions).

```javascript
selectHandler.clearSelectedItems();
```

##### `getSelectedItems()`
Returns array of selected item keys.

```javascript
const selectedItems = selectHandler.getSelectedItems();
```

## Integration Examples

### Basic Integration

```javascript
// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const selectHandler = new ONDCSelectHandler({
        bapId: 'neo-server.rozana.in',
        bapUri: 'https://neo-server.rozana.in/bapl',
        buyerId: 'buyer_001'
    });
    
    // Set transaction ID after search
    selectHandler.setTransactionId(getCurrentTransactionId());
});
```

### Product Card Integration

```javascript
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>₹${product.price}</p>
            <button class="select-btn" data-product-id="${product.id}">
                Select Product
            </button>
        </div>
    `;
    
    // Add click handler
    const selectBtn = card.querySelector('.select-btn');
    selectBtn.addEventListener('click', async function() {
        await handleProductSelect(product);
    });
    
    return card;
}
```

### Custom Event Handling

```javascript
// Listen for select success events
document.addEventListener('ondcSelectSuccess', function(event) {
    const { product, response } = event.detail;
    console.log('Product selected:', product.name);
    
    // Update UI, show notifications, etc.
    showSuccessNotification(`${product.name} selected!`);
});

// Listen for select errors
document.addEventListener('ondcSelectError', function(event) {
    const { product, error } = event.detail;
    console.error('Selection failed:', error);
    
    // Show error message, retry options, etc.
    showErrorNotification('Selection failed. Please try again.');
});
```

## ONDC Payload Structure

The handler creates compliant ONDC select payloads:

```json
{
    "context": {
        "domain": "ONDC:RET10",
        "country": "IND",
        "city": "std:011",
        "action": "select",
        "core_version": "1.2.0",
        "bap_id": "your-bap-id",
        "bap_uri": "https://your-bap-uri.com",
        "transaction_id": "unique-transaction-id",
        "message_id": "unique-message-id",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "ttl": "PT30S"
    },
    "message": {
        "order": {
            "items": [
                {
                    "id": "product-id",
                    "quantity": {
                        "count": 1
                    },
                    "descriptor": {
                        "name": "Product Name",
                        "code": "product-code"
                    },
                    "price": {
                        "currency": "INR",
                        "value": "100.00"
                    }
                }
            ],
            "provider": {
                "id": "seller-id",
                "descriptor": {
                    "name": "Seller Name"
                }
            },
            "fulfillment": {
                "type": "Delivery",
                "end": {
                    "location": {
                        "gps": "28.6139,77.2090",
                        "address": {
                            "area_code": "110037"
                        }
                    }
                }
            }
        }
    }
}
```

## Error Handling

The handler includes comprehensive error handling:

```javascript
try {
    const success = await selectHandler.handleProductSelect(product);
    if (!success) {
        // Handle case where item was already selected
        showInfoMessage('Item already selected');
    }
} catch (error) {
    if (error.message.includes('Transaction ID not set')) {
        // Handle missing transaction ID
        console.error('Please perform a search first');
    } else if (error.message.includes('HTTP error')) {
        // Handle API errors
        console.error('Server error. Please try again.');
    } else {
        // Handle other errors
        console.error('Unexpected error:', error.message);
    }
}
```

## Best Practices

### 1. Transaction ID Management
- Always set the transaction ID after a successful search
- Use the same transaction ID for the entire order flow (search → select → init → confirm)

### 2. Error Handling
- Implement proper error handling for network failures
- Provide user feedback for all error states
- Consider retry mechanisms for transient failures

### 3. UI/UX
- Show loading states during select operations
- Provide clear feedback for successful selections
- Disable buttons for already selected items

### 4. Session Management
- Clear selected items when starting a new search
- Persist selection state if needed across page reloads
- Handle browser back/forward navigation appropriately

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## TypeScript Support

For TypeScript projects, you can create type definitions:

```typescript
interface Product {
    id: string;
    name: string;
    price: string | number;
    description?: string;
    image?: string;
    currency?: string;
    code?: string;
}

interface Seller {
    id: string;
    name: string;
}

interface SelectOptions {
    seller?: Seller;
    fulfillment?: any;
}

interface ONDCSelectHandlerConfig {
    bapId: string;
    bapUri: string;
    buyerId: string;
    domain?: string;
    country?: string;
    city?: string;
    coreVersion?: string;
    selectApiUrl?: string;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use in your projects.

## Support

For issues and questions:
- Create an issue in the repository
- Check the ONDC documentation for protocol details
- Review the integration examples for common use cases
