# ONDC Buyer App

A beautiful, modern buyer application for the Open Network for Digital Commerce (ONDC) built with HTML, CSS, and JavaScript.

## Features

### 🎨 Modern UI/UX
- Responsive design that works on all devices
- Beautiful gradient backgrounds and smooth animations
- Clean, intuitive interface with modern design principles
- Accessibility-friendly with proper contrast and focus states

### 🔍 Advanced Search
- Real-time search suggestions
- Category-based filtering
- Search history tracking
- Quick filter chips for popular categories

### 📍 Location Services
- Current location display
- Location change functionality
- Recent locations tracking
- Modal-based location selection

### 🛒 Shopping Features
- Add products to cart
- Cart count display
- Product ratings and reviews
- Seller information and ratings

### 🏪 Local Sellers
- Featured local sellers
- Seller ratings and categories
- Direct store access
- Location-based seller discovery

## File Structure

```
ondc/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Getting Started

1. **Clone or download** the project files
2. **Open `index.html`** in your web browser
3. **Start exploring** the ONDC buyer experience!

## Key Components

### Header
- Logo and branding
- Navigation menu
- Cart and location buttons
- Sticky header for easy access

### Hero Section
- Eye-catching title and subtitle
- Main search functionality
- Quick filter chips
- Gradient background

### Search Features
- **Search Input**: Type to search with real-time suggestions
- **Filter Chips**: Click on popular categories
- **Category Cards**: Browse by category
- **Search History**: Automatically saved searches

### Product Display
- Featured products grid
- Product cards with images, prices, and ratings
- Add to cart functionality
- Seller information

### Local Sellers
- Seller cards with ratings
- Category information
- Direct store access
- Location-based discovery

## ONDC Integration

This app is fully integrated with the ONDC network:

### ✅ Implemented Features

1. **Search API**: Real-time search using ONDC search endpoint
   - API: `https://pramaan.ondc.org/beta/preprod/mock/seller/search`
   - Full ONDC protocol compliance
   - Dynamic search term integration

2. **ONDC Request Format**: 
   - Proper context structure with domain, country, city
   - BAP ID and URI configuration
   - Transaction and message ID generation
   - Timestamp and TTL handling

3. **Search Results Display**: 
   - Dynamic product cards from ONDC response
   - Seller information integration
   - Price and rating display
   - Add to cart functionality

### 🔧 Configuration

The app uses the following ONDC configuration:
- **BAP ID**: `neo-server.rozana.in`
- **BAP URI**: `https://neo-server.rozana.in/bapl`
- **Domain**: `ONDC:RET10`
- **Country**: `IND`
- **City**: `std:011`

### 📡 API Integration Details

**Transaction ID Management:**
- **Transaction ID**: Generated once at the start of an order flow and reused for all subsequent API calls (search → select → init → confirm)
- **Message ID**: Generated fresh for each API call
- **Timestamp**: Updated for each API call

**Order Flow:**
1. **Search**: Generates new transaction ID, message ID, and timestamp
2. **Select**: Reuses transaction ID, generates new message ID and timestamp
3. **Init**: Reuses transaction ID, generates new message ID and timestamp  
4. **Confirm**: Reuses transaction ID, generates new message ID and timestamp

**Example Flow:**
```
Search:  transaction_id: "2d3e4f4f-4551-47b0-9da9-d6a9c069fcab", message_id: "40f44b8d-abd6-42e5-bc62-f801986065fd"
Select:  transaction_id: "2d3e4f4f-4551-47b0-9da9-d6a9c069fcab", message_id: "new-uuid-here"
Init:    transaction_id: "2d3e4f4f-4551-47b0-9da9-d6a9c069fcab", message_id: "another-new-uuid"
Confirm: transaction_id: "2d3e4f4f-4551-47b0-9da9-d6a9c069fcab", message_id: "yet-another-new-uuid"
```

**Available Functions:**
- `callONDCSearchAPI(searchTerm)` - Search for products
- `callONDCSelectAPI(selectedItems)` - Select items for order
- `callONDCInitAPI(orderDetails)` - Initialize order
- `callONDCConfirmAPI(confirmDetails)` - Confirm order
- `startNewTransaction()` - Start a new transaction flow
- `getCurrentTransactionId()` - Get current transaction ID

## Customization

### Colors
The app uses a blue color scheme that can be easily customized in `styles.css`:
- Primary: `#2563eb`
- Secondary: `#3b82f6`
- Background: `#f8fafc`

### Content
- Update `sampleProducts` array in `script.js` for different products
- Modify `sampleSellers` array for different sellers
- Change search suggestions in `searchSuggestionsData`

### Branding
- Update logo and company name in the header
- Modify footer content
- Change color scheme to match your brand

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- **Lazy Loading**: Images and content load as needed
- **Local Storage**: Cart and preferences saved locally
- **Smooth Animations**: CSS transitions and transforms
- **Responsive Images**: Optimized for different screen sizes

## Future Enhancements

- [ ] User authentication
- [ ] Order tracking
- [ ] Payment integration
- [ ] Push notifications
- [ ] Offline support
- [ ] Multi-language support
- [ ] Advanced filtering
- [ ] Wishlist functionality
- [ ] Product reviews
- [ ] Seller chat

## Technical Details

### CSS Features
- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming
- Media queries for responsive design
- CSS animations and transitions

### JavaScript Features
- ES6+ syntax
- Local Storage API
- Intersection Observer for animations
- Event delegation
- Modular code structure

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast ratios
- Focus management

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the ONDC ecosystem**
