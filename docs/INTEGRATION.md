# Pewpi Shared Library Integration Guide

This directory contains the canonical shared authentication, wallet, and token management modules for the pewpi-infinity ecosystem.

## 📦 Contents

- **token-service.js** - Token persistence with IndexedDB (Dexie) and localStorage fallback
- **auth/login-component.js** - Passwordless login with magic-link and GitHub OAuth
- **wallet/wallet-component.js** - Wallet UI with token list and live feed
- **integration-listener.js** - Event listener for cross-repo synchronization

## 🚀 Quick Start

### 1. Dependencies

This library requires the following runtime dependencies:

```
- dexie (^3.2.4) - IndexedDB wrapper for token persistence
- crypto-js (^4.2.0) - Encryption utilities for wallet security
```

**For HTML-based projects (no build system):**
Add these CDN links to your HTML:

```html
<!-- Add before closing </head> tag -->
<script src="https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.js"></script>
```

**For npm-based projects:**
```bash
npm install dexie crypto-js
```

### 2. Basic Initialization

Add this initialization code to your main entry point (index.html, main.js, etc.):

```javascript
// Import the shared services (if using ES modules)
import { tokenService } from './src/pewpi-shared/token-service.js';
import { IntegrationListener } from './src/pewpi-shared/integration-listener.js';

// Initialize token auto-tracking
try {
  tokenService.initAutoTracking();
  console.log('✅ Token service initialized');
} catch (error) {
  console.error('Failed to initialize token service:', error);
}

// Set up integration listener for events
const listener = new IntegrationListener({
  onTokenCreated: (token) => {
    console.log('✨ Token created:', token);
    // Update your app UI/state
  },
  onLoginChanged: (data) => {
    console.log('👤 Login changed:', data.loggedIn ? data.user : 'logged out');
    // Update your app UI/state
  },
  debug: true
});

listener.start();
```

**For non-module scripts (plain HTML):**
```html
<script type="module">
  // Use import maps or dynamic imports
  import('./src/pewpi-shared/token-service.js').then(module => {
    const tokenService = module.tokenService;
    tokenService.initAutoTracking();
  });
</script>
```

### 3. Listening to Events

The library emits the following custom events on the `window` object:

| Event Name | Description | Event Detail |
|------------|-------------|--------------|
| `pewpi.token.created` | New token created | `{ tokenId, type, value, userId, ... }` |
| `pewpi.token.updated` | Token updated | `{ tokenId, ... }` |
| `pewpi.tokens.cleared` | All tokens cleared | `{}` |
| `pewpi.login.changed` | Login state changed | `{ user: {...}, loggedIn: boolean }` |
| `pewpi.p2p.message` | P2P sync message | `{ type, data }` |

**Example event listener:**
```javascript
window.addEventListener('pewpi.token.created', (e) => {
  console.log('Token created:', e.detail);
  updateTokenDisplay(e.detail);
});

window.addEventListener('pewpi.login.changed', (e) => {
  if (e.detail.loggedIn) {
    console.log('User logged in:', e.detail.user);
    showWallet();
  } else {
    console.log('User logged out');
    hideWallet();
  }
});
```

## 🔌 Component Usage

### Token Service

```javascript
import { tokenService } from './src/pewpi-shared/token-service.js';

// Create a token
const token = await tokenService.createToken({
  type: 'gold',
  value: 10,
  userId: 'user_123',
  metadata: { source: 'achievement' }
});

// Get user's token balance
const balance = await tokenService.getBalance('user_123');

// Get all tokens for a user
const tokens = await tokenService.getByUserId('user_123');

// Subscribe to token events
const unsubscribe = tokenService.subscribe('tokenCreated', (token) => {
  console.log('Token created:', token);
});

// Later: unsubscribe();
```

### Login Component

```javascript
import { LoginComponent } from './src/pewpi-shared/auth/login-component.js';

const login = new LoginComponent({
  devMode: true, // Set to false in production
  githubClientId: 'your_github_client_id', // Optional
  onLoginSuccess: (user) => {
    console.log('Login successful:', user);
    initializeApp(user);
  },
  onLoginError: (error) => {
    console.error('Login failed:', error);
  }
});

// Render login UI
login.render('login-container'); // Container ID

// Check if user is logged in
if (login.isLoggedIn()) {
  const user = login.getCurrentUser();
  console.log('Current user:', user);
}
```

### Wallet Component

```javascript
import { WalletComponent } from './src/pewpi-shared/wallet/wallet-component.js';

const wallet = new WalletComponent({
  userId: 'user_123', // Optional, defaults to current user
  onTokenClick: (token) => {
    console.log('Token clicked:', token);
  }
});

// Render wallet UI
await wallet.render('wallet-container'); // Container ID

// Manually refresh wallet data
await wallet.refresh();
```

### Integration Listener

```javascript
import { IntegrationListener, setupIntegration } from './src/pewpi-shared/integration-listener.js';

// Quick setup
const listener = setupIntegration({
  onTokenCreated: (token) => {
    updateLocalCache(token);
    showNotification(`New ${token.type} token!`);
  },
  onLoginChanged: (data) => {
    if (data.loggedIn) {
      loadUserData(data.user.userId);
    } else {
      clearUserData();
    }
  },
  debug: true
});

// Or manual setup
const listener = new IntegrationListener({
  onTokenCreated: handleTokenCreated,
  onTokensCleared: handleTokensCleared,
  onLoginChanged: handleLoginChanged,
  onP2PMessage: handleP2PMessage,
  debug: false
});

listener.start();

// Stop listening when needed
listener.stop();
```

## 🔧 Configuration Options

### TokenService Options

```javascript
tokenService.initAutoTracking({
  // Options here (currently empty, reserved for future use)
});
```

### LoginComponent Options

```javascript
const login = new LoginComponent({
  devMode: true,              // Enable dev mode (instant login without email)
  githubClientId: 'xxx',      // GitHub OAuth client ID (optional)
  onLoginSuccess: (user) => {}, // Success callback
  onLoginError: (error) => {}   // Error callback
});
```

### WalletComponent Options

```javascript
const wallet = new WalletComponent({
  userId: 'user_123',         // User ID (optional, auto-detected)
  onTokenClick: (token) => {} // Token click callback
});
```

### IntegrationListener Options

```javascript
const listener = new IntegrationListener({
  onTokenCreated: (token) => {},     // Token created callback
  onTokensCleared: () => {},         // Tokens cleared callback
  onLoginChanged: (data) => {},      // Login changed callback
  onP2PMessage: (data) => {},        // P2P message callback
  debug: true                        // Enable debug logging
});
```

## 📝 Migration from Existing Code

If your repository already has auth or wallet implementations:

1. **Keep existing code** - Don't remove it yet
2. **Add shared library** - Copy this directory to your repo
3. **Initialize alongside** - Add initialization code wrapped in try/catch
4. **Test both systems** - Ensure no conflicts
5. **Migrate gradually** - Move to shared library over time

**Example migration-safe initialization:**

```javascript
try {
  // Try to initialize pewpi-shared
  if (typeof tokenService !== 'undefined') {
    tokenService.initAutoTracking();
    console.log('Using pewpi-shared token service');
  }
} catch (error) {
  console.warn('pewpi-shared not available, using legacy system:', error);
  // Fall back to existing implementation
}
```

## 🐛 Troubleshooting

### "IndexedDB not available"
- The library will automatically fall back to localStorage
- This is expected in some browsers (private mode, etc.)
- No action needed - everything still works

### "Module not found: dexie"
- **HTML projects:** Add CDN script tags (see Dependencies section)
- **npm projects:** Run `npm install dexie crypto-js`

### Events not firing
- Ensure `tokenService.initAutoTracking()` is called
- Ensure `IntegrationListener.start()` is called
- Check browser console for errors
- Enable debug mode: `new IntegrationListener({ debug: true })`

### Login not working
- Check devMode is enabled for local testing
- Check githubClientId if using GitHub OAuth
- Check localStorage is enabled in browser

## 📚 Source of Truth

This library is maintained at:
**pewpi-infinity/GPT-Vector-Design** → `src/shared/`

For updates or bug reports, please refer to the source repository.

## 🔐 Security Notes

- Wallet addresses are encrypted with AES-GCM before storage
- Passphrases are never stored
- Token data is stored locally (IndexedDB or localStorage)
- Magic links expire after 15 minutes
- Dev mode bypasses email verification (for development only)

## 📄 License

Part of the pewpi-infinity ecosystem. See repository root for license details.

## 💬 Support

For questions or issues:
- Check this INTEGRATION.md first
- Review the example code in each module
- Check the console for error messages
- Contact: marvaseater@gmail.com
