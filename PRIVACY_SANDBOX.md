# Privacy Sandbox & New Browser APIs Integration

This document describes the implementation of Privacy Sandbox and new browser APIs for privacy-preserving embedding in the 42Web.io website.

## Overview

Modern browsers are reducing or blocking third-party cookies for embedded content to improve user privacy. Google's Privacy Sandbox proposes several APIs to address this while still allowing legitimate use cases for embedded content.

Our implementation includes:
- **CHIPS (Cookie Partitioning)** - Partitioned cookies for embedded content
- **Storage Access API** - Request storage access when needed
- **FedCM (Federated Credential Management)** - Privacy-preserving authentication

## Features Implemented

### 1. CHIPS (Cookie Partitioning) Support

The system automatically sets partitioned cookies for embedded content:

```javascript
// Automatically set when accessing /embed
Set-Cookie: embed_session=value; Path=/; Secure; SameSite=None; Partitioned; Max-Age=3600
Set-Cookie: embed_theme=value; Path=/; Secure; SameSite=None; Partitioned; Max-Age=86400
```

**Benefits:**
- Cookies are isolated per embedding site
- Reduces cross-site tracking
- Maintains functionality for legitimate use cases

### 2. Storage Access API Integration

The JavaScript client automatically requests storage access when embedded:

```javascript
// Automatically handled by privacy-sandbox.js
await document.requestStorageAccess();
```

**Implementation:**
- Detects when content is embedded in iframe
- Requests storage access on user interaction
- Falls back to partitioned cookies if access denied
- Stores preferences securely

### 3. FedCM (Federated Credential Management) Ready

Full FedCM configuration for privacy-preserving authentication:

**Endpoints:**
- `/.well-known/web-identity` - Identity provider configuration
- `/fedcm/accounts` - Available accounts
- `/fedcm/client-metadata` - Client metadata
- `/fedcm/assertion` - Identity assertions
- `/fedcm/disconnect` - Account disconnection

### 4. Privacy-Preserving Headers

Proper headers are set for embedded content:

```http
Cross-Origin-Embedder-Policy: credentialless
Permissions-Policy: storage-access=*, identity-credentials-get=*
Cross-Origin-Resource-Policy: cross-origin
Cross-Origin-Opener-Policy: same-origin-allow-popups
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CHIPS | ✅ 100+ | 🚧 Dev | ❌ | ✅ 100+ |
| Storage Access API | ✅ 117+ | ✅ 65+ | ✅ 11.1+ | ✅ 117+ |
| FedCM | ✅ 108+ | 🚧 Dev | ❌ | ✅ 108+ |

## Usage Examples

### Basic Embedding with Privacy Features

```html
<iframe 
  src="http://localhost:3000/embed" 
  width="100%" 
  height="400"
  style="border: none;"
  allow="storage-access; identity-credentials-get">
</iframe>
```

### Requesting Storage Access

```javascript
// Listen for privacy sandbox events
window.addEventListener('storageAccessGranted', function() {
  console.log('Storage access granted - can now use localStorage');
});

// Manual request
async function requestEmbedStorageAccess() {
  try {
    await document.requestStorageAccess();
    console.log('Storage access granted');
  } catch (error) {
    console.log('Storage access denied');
  }
}
```

### Checking Support Status

```javascript
// Get current privacy features support
const status = window.privacySandbox.getSupportStatus();
console.log('Privacy features:', status);
/*
{
  isInFrame: true,
  storageAccess: true,
  chips: true,
  fedCM: true,
  thirdPartyCookies: false
}
*/
```

## Privacy Status Display

In development mode (localhost), embedded content displays privacy status:

```
🔒 Privacy Features Status
✅ Storage Access API: Supported
✅ CHIPS (Cookie Partitioning): Supported
✅ FedCM: Supported
❌ Third-party Cookies: Blocked
```

## Implementation Details

### Partitioned Cookie Management

The system uses a secure cookie strategy:

1. **Session Management**: Short-lived session cookies (1 hour)
2. **Theme Preferences**: Longer-lived theme cookies (1 day)
3. **Form State**: Temporary form state cookies (5 minutes)

### Storage Fallbacks

Graceful degradation ensures functionality:

1. **Primary**: localStorage with storage access
2. **Fallback**: Partitioned cookies
3. **Emergency**: In-memory storage

### Form Privacy Protection

Contact forms in embedded contexts:

- Use partitioned cookies for state management
- Display privacy notices to users
- Handle submissions through privacy-preserving methods

## Testing Privacy Features

### Chrome Testing

Enable experimental features:
```
chrome --enable-features=PartitionedCookies,StorageAccessAPI,FedCm
```

### Firefox Testing

Enable in `about:config`:
```
dom.storage_access.enabled = true
network.cookie.sameSite.laxByDefault = false
```

### Safari Testing

Storage Access API is enabled by default in Safari 11.1+

## Integration Requirements

### Parent Site Requirements

1. **Permissions Policy**: Allow storage access
```html
<iframe allow="storage-access; identity-credentials-get">
```

2. **Content Security Policy**: Allow iframe sources
```http
Content-Security-Policy: frame-src 'self' https://tech.42web.io
```

### Embedded Content Requirements

1. **Secure Context**: HTTPS required for most APIs
2. **User Gesture**: Storage access requires user interaction
3. **Same-Site Cookies**: Use SameSite=None for cross-origin

## Future Enhancements

1. **Trust Tokens**: Anti-fraud protection
2. **Attribution Reporting**: Privacy-preserving analytics
3. **FLEDGE**: Interest-based advertising
4. **Topics API**: Interest cohorts

## Security Considerations

1. **Origin Validation**: Verify embedding origins
2. **Token Validation**: Validate FedCM tokens
3. **Rate Limiting**: Prevent abuse of storage access
4. **Data Minimization**: Store only necessary data

## Monitoring and Analytics

The system logs privacy feature usage:

```javascript
// Example logs
Privacy Sandbox: Initializing for embedded content
Privacy Sandbox: CHIPS supported - using partitioned cookies
Privacy Sandbox: Storage access granted
Privacy Sandbox: FedCM initialized with config
```

This enables monitoring of:
- Privacy feature adoption
- Browser compatibility
- User experience impact
- Performance metrics

## Support and Compatibility

The implementation provides:
- ✅ Progressive enhancement
- ✅ Graceful degradation
- ✅ Browser compatibility checks
- ✅ Fallback mechanisms
- ✅ Development debugging tools

For questions or issues with Privacy Sandbox integration, please contact our support team or refer to the interactive demo at `/demo`.