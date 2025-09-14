# 42Web.io - Enhanced Tech Solutions Platform

A modern, high-performance web application featuring advanced website embedding capabilities, optimized user experience, and comprehensive performance enhancements.

## 🚀 Key Features

### 🌐 Advanced Website Embedder
- **Smart Proxy Technology**: Bypass iframe limitations with secure content filtering
- **Navigation History**: Full back/forward browsing with state management  
- **Performance Optimization**: Intelligent caching and resource optimization
- **Security Features**: Advanced filtering, HTTPS enforcement, and XSS protection
- **Mobile Responsive**: Optimized display across all devices
- **Fullscreen Mode**: Immersive viewing experience
- **Error Handling**: Comprehensive error reporting with troubleshooting tips

### 🤖 **NEW: Inbuilt Automation Engine**
- **Action Recording**: Record user interactions for playback automation
- **Auto-Fill Forms**: Intelligent form filling with predefined data
- **Auto-Scroll**: Configurable automatic scrolling with speed controls
- **Content Extraction**: Extract structured data from embedded websites (JSON export)
- **Custom Scripts**: Execute custom JavaScript automation scripts with helper functions
- **Automation Templates**: Pre-built templates for form-filling, content monitoring, page navigation, and data scraping
- **Schedule Tasks**: Set up recurring automation with configurable intervals
- **Real-time Status**: Live automation monitoring with action count and runtime tracking
- **Ultra Controls**: Advanced automation features for power users and developers

### ⚡ Performance Optimizations
- **Memory Caching**: In-memory cache for frequently accessed content
- **Compression**: Gzip compression for faster loading
- **Rate Limiting**: Protection against abuse and DDoS
- **Resource Optimization**: Preloading, lazy loading, and efficient bundling
- **CDN Integration**: Fast delivery of static assets
- **Service Worker**: Offline support and background caching

### 🎨 Enhanced User Experience
- **Dark/Light Theme**: System-aware theme switching with persistence
- **Real-time Validation**: Instant form feedback and validation
- **Smooth Animations**: Hardware-accelerated transitions and effects
- **Progressive Web App**: Installable with offline capabilities
- **Keyboard Shortcuts**: Power user navigation and controls
- **Accessibility**: WCAG-compliant design and screen reader support

### 🔒 Security & Reliability
- **Security Headers**: Comprehensive HTTP security headers
- **Input Validation**: Server and client-side validation
- **CSRF Protection**: Cross-site request forgery prevention
- **Content Filtering**: Remove tracking scripts and malicious content
- **Network Security**: Block access to internal networks
- **Error Boundaries**: Graceful error handling and recovery

## 📋 Technical Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap 5, Vanilla JavaScript
- **Caching**: In-memory cache with TTL
- **Security**: Helmet.js, rate limiting, input validation
- **Performance**: Compression, lazy loading, service workers
- **PWA**: Web app manifest, service worker, offline support

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd Experimental

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables
```bash
NODE_ENV=production          # Environment mode
PORT=3000                   # Server port
```

## 📊 Performance Features

### Caching Strategy
- **Static Assets**: Aggressive caching (30 days) for images, fonts
- **CSS/JS**: Medium caching (1 day) with versioning
- **HTML Pages**: Short caching (10 minutes) for dynamic content
- **API Responses**: Memory cache (5 minutes) for proxy requests

### Rate Limiting
- **Proxy Endpoint**: 100 requests per 15 minutes per IP
- **Contact Form**: 5 submissions per 15 minutes per IP
- **General API**: Standard rate limiting with burst protection

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [Comprehensive CSP]
```

## 🌐 API Endpoints

### Website Embedder
```
GET /proxy?url=<encoded-url>
```
**Parameters:**
- `url`: The website URL to embed (required)

**Features:**
- Smart content filtering
- Relative URL resolution
- Security validation
- Performance optimization

**Response:**
- Enhanced HTML content with embedded features
- Cache headers for performance
- Error handling with detailed messages

### Contact Form
```
POST /contact
```
**Body:**
```json
{
  "name": "string (2-100 chars)",
  "email": "valid email address", 
  "message": "string (10-5000 chars)"
}
```

**Features:**
- Server-side validation
- Rate limiting protection
- Sanitized input processing

## 🎯 Advanced Features

### Website Embedder Capabilities

#### Smart URL Processing
- Auto-protocol detection (HTTP/HTTPS)
- Relative URL conversion to absolute
- External link indicators
- Invalid URL validation

#### Content Enhancement
- Remove tracking scripts (Google Analytics, Facebook Pixel)
- Fix broken images with lazy loading
- Add smooth scrolling behavior
- Enhanced form handling

#### Navigation Features
- Browser-like back/forward buttons
- URL bar with copy functionality
- Refresh and new tab options
- Fullscreen mode toggle
- Keyboard shortcuts (Ctrl+R, Ctrl+W, F11, Esc)

#### Performance Monitoring
- Real-time load time tracking
- Cache hit/miss indicators
- Security score display
- Mobile readiness status

### Theme System
- Automatic dark/light mode detection
- Manual theme switching
- Persistent user preferences
- Smooth transitions between themes

### Progressive Web App
- Installable on desktop and mobile
- Offline functionality with service worker
- Background sync for form submissions
- Push notification support (ready)

## 🔧 Configuration Options

### Cache Settings
```javascript
// Memory cache TTL (milliseconds)
const pageCache = new MemoryCache(600000);    // 10 minutes
const proxyCache = new MemoryCache(300000);   // 5 minutes
```

### Security Configuration
```javascript
// Rate limiting
const proxyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                    // requests per window
});
```

### Performance Optimization
```javascript
// Compression settings
app.use(compression({
    level: 6,                   // Compression level
    threshold: 1024,            // Minimum size to compress
    filter: compressionFilter   // Custom filter function
}));
```

## 📱 Mobile Optimization

- **Responsive Design**: Bootstrap 5 grid system
- **Touch Friendly**: Large touch targets and gestures
- **Fast Loading**: Optimized images and lazy loading
- **Offline Support**: Service worker caching
- **PWA Features**: Add to home screen, splash screen

## 🧪 Testing & Development

### Development Mode
```bash
npm run dev  # Starts with nodemon for auto-restart
```

### Performance Testing
- Built-in performance monitoring
- Service worker analytics
- Cache hit rate tracking
- Load time measurements

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Enable HTTPS with valid certificates
- [ ] Set up monitoring and logging
- [ ] Configure domain and DNS
- [ ] Test PWA installation

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance Metrics

### Lighthouse Scores (Target)
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100
- **PWA**: 100

### Core Web Vitals
- **LCP**: < 2.5s (Large Contentful Paint)
- **FID**: < 100ms (First Input Delay)  
- **CLS**: < 0.1 (Cumulative Layout Shift)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🎉 What's New in This Version

### Enhanced Website Embedder
- ✅ Advanced security filtering
- ✅ Performance optimization with caching
- ✅ Mobile-responsive design
- ✅ Navigation history and controls
- ✅ Error handling and recovery
- ✅ Fullscreen mode
- ✅ Keyboard shortcuts

### Performance Improvements
- ✅ Memory caching system
- ✅ Rate limiting protection
- ✅ Compression optimization
- ✅ Service worker offline support
- ✅ Resource preloading
- ✅ Image lazy loading

### User Experience
- ✅ Dark/light theme switching
- ✅ Real-time form validation
- ✅ Smooth animations
- ✅ Progressive Web App features
- ✅ Enhanced accessibility
- ✅ Mobile optimization

### Developer Experience
- ✅ Comprehensive error handling
- ✅ Performance monitoring
- ✅ Structured middleware
- ✅ Detailed logging
- ✅ Modern JavaScript features
- ✅ Responsive design system

---

**42Web.io** - Building the future of web technology with performance, security, and user experience in mind.
