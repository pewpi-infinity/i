# Pewpi-Shared Integration Guide

This document explains how to integrate and use the unified pewpi-shared library in your application.

## Overview

The `pewpi-shared` library provides unified auth, wallet, and token management with:
- **Token Service**: IndexedDB-backed token storage with localStorage fallback
- **Auth Service**: Magic-link dev-mode authentication with session management
- **Wallet Unified**: Token earning/spending with transaction history
- **Integration Listener**: Cross-repo event listening and forwarding
- **UI Components**: UnifiedLoginModal and WalletDisplay

## Installation

### 1. Add Dependencies

Add Dexie to your `package.json`:

```bash
npm install dexie
```

Or include via CDN in your HTML:

```html
<script src="https://unpkg.com/dexie@latest/dist/dexie.min.js"></script>
```

### 2. Include the Scripts

Add the pewpi-shared scripts to your HTML:

```html
<!-- Core Services -->
<script src="/src/pewpi-shared/token-service.js"></script>
<script src="/src/pewpi-shared/auth-service.js"></script>
<script src="/src/pewpi-shared/wallet-unified.js"></script>
<script src="/src/pewpi-shared/integration-listener.js"></script>

<!-- UI Components (optional) -->
<script src="/src/pewpi-shared/components/UnifiedLoginModal.js"></script>
<script src="/src/pewpi-shared/components/WalletDisplay.js"></script>
```

Or import as modules (if using a bundler):

```javascript
import { tokenService } from './src/pewpi-shared/token-service.js';
import { authService } from './src/pewpi-shared/auth-service.js';
import { getWalletUnified } from './src/pewpi-shared/wallet-unified.js';
```

## Basic Usage

### Initialize Services

```javascript
// Initialize auth and token services
try {
  await authService.init();
  tokenService.initAutoTracking();
  console.log('Pewpi services initialized');
} catch (error) {
  console.error('Failed to initialize pewpi services', error);
}
```

### Token Management

```javascript
// Create a token
const token = await tokenService.createToken({
  value: 'sample query text',
  balance: 10,
  metadata: { source: 'user_input' }
});

// Get all tokens
const allTokens = await tokenService.getAll();

// Get total balance
const totalBalance = await tokenService.getTotalBalance();

// Update a token
await tokenService.update(token.id, { balance: 20 });

// Delete a token
await tokenService.delete(token.id);

// Listen for token events
tokenService.subscribe('pewpi.token.created', (token) => {
  console.log('New token created:', token);
});
```

### Authentication

```javascript
// Login with magic-link (dev mode)
const user = await authService.login('user@example.com');

// Check login status
if (authService.isLoggedIn()) {
  const currentUser = authService.getCurrentUser();
  console.log('Logged in as:', currentUser.email);
}

// Subscribe to login changes
authService.subscribe((event) => {
  console.log('Login changed:', event.user);
});

// Logout
authService.logout();
```

### Wallet Operations

```javascript
const wallet = getWalletUnified(tokenService);

// Earn tokens
await wallet.earnTokens(50, 'task_completion', { taskId: 123 });

// Spend tokens
await wallet.spendTokens(20, 'feature_unlock', { featureId: 'premium' });

// Get balance
const balance = wallet.getBalance();

// Get all balances
const allBalances = wallet.getAllBalances();
// Returns: { current: 30, totalEarned: 50, totalSpent: 20, net: 30 }

// Get transaction history
const transactions = wallet.getTransactionHistory(10);
```

### Event Listening (Cross-Repo Sync)

```javascript
// Subscribe to specific events
integrationListener.onTokenCreated((token) => {
  console.log('Token created:', token);
});

integrationListener.onLoginChanged((event) => {
  console.log('Login changed:', event.user);
});

integrationListener.onWalletEarned((event) => {
  console.log('Earned:', event.amount);
});

// Listen to cross-tab storage events
integrationListener.listenToStorage();
```

## UI Components

### UnifiedLoginModal

```javascript
// Create and show login modal
const loginModal = new UnifiedLoginModal(authService);
loginModal.show();

// The modal will emit pewpi.login.changed event on successful login
```

### WalletDisplay

```html
<!-- Add container in your HTML -->
<div id="wallet-container"></div>
```

```javascript
// Create and render wallet display
const walletDisplay = new WalletDisplay(
  getWalletUnified(tokenService),
  '#wallet-container'
);
walletDisplay.render();

// The display will auto-update on wallet events
```

## Custom Events

The library emits the following CustomEvents:

- `pewpi.token.created` - When a token is created
- `pewpi.token.updated` - When a token is updated
- `pewpi.token.deleted` - When a token is deleted
- `pewpi.login.changed` - When login state changes
- `pewpi.wallet.earned` - When tokens are earned
- `pewpi.wallet.spent` - When tokens are spent

These events are also broadcast via localStorage for cross-tab synchronization.

## Testing

### Manual Testing Steps

1. **Open your app** in the browser
2. **Open console** and verify initialization:
   ```javascript
   console.log('Auth:', authService.isLoggedIn());
   console.log('Tokens:', await tokenService.getAll());
   console.log('Balance:', getWalletUnified().getBalance());
   ```
3. **Test login**:
   ```javascript
   await authService.login('test@example.com');
   ```
4. **Test token creation**:
   ```javascript
   await tokenService.createToken({ value: 'test', balance: 10 });
   ```
5. **Test wallet**:
   ```javascript
   await getWalletUnified().earnTokens(50, 'test');
   ```
6. **Open in another tab** to verify cross-tab sync

## Rollback Steps

If you need to revert this integration:

1. Remove the `src/pewpi-shared/` folder
2. Remove the initialization code from your main HTML/JS files
3. Remove `dexie` from `package.json` dependencies (if not used elsewhere)
4. Clear browser storage:
   ```javascript
   localStorage.clear();
   indexedDB.deleteDatabase('PewpiTokenDB');
   ```

## Feature Flags

To enable/disable pewpi-shared features:

```javascript
// Set before initialization
window.PEWPI_FEATURES = {
  tokenService: true,
  authService: true,
  walletService: true,
  autoTracking: true
};
```

## Advanced Usage

### Custom Event Forwarding

```javascript
// Forward events to another window/iframe
const targetWindow = document.getElementById('myIframe').contentWindow;
integrationListener.on('pewpi.token.created', (token) => {
  integrationListener.forwardToWindow(targetWindow, 'pewpi.token.created', token);
});

// Listen for forwarded events
integrationListener.listenForForwardedEvents();
```

### Transaction History Export

```javascript
const transactions = getWalletUnified().getTransactionHistory();
const csv = transactions.map(t => 
  `${t.timestamp},${t.type},${t.amount},${t.balance}`
).join('\n');
console.log(csv);
```

## Troubleshooting

### IndexedDB Not Available

If IndexedDB is not available, the library automatically falls back to localStorage. Check console for warnings.

### Storage Quota Exceeded

Clear old data periodically:
```javascript
await tokenService.clearAll();
getWalletUnified().clearTransactionHistory();
```

### Cross-Tab Sync Not Working

Ensure localStorage is enabled and not in private/incognito mode. Cross-tab sync relies on the storage event API.

## Support

For issues or questions, please refer to the main repository README or create an issue on GitHub.
