# PewPi-Shared Integration Guide

## Overview

The pewpi-shared library provides unified authentication, wallet management, and token tracking services for the pewpi-infinity ecosystem. This guide explains how to integrate and use the library in your application.

## Quick Start

### 1. Include the Scripts

Add the following scripts to your HTML file in order:

```html
<!-- Core Services -->
<script src="src/pewpi-shared/authService.js"></script>
<script src="src/pewpi-shared/tokenService.js"></script>
<script src="src/pewpi-shared/walletService.js"></script>

<!-- Adapters (Optional) -->
<script src="src/pewpi-shared/machineAdapter.js"></script>
<script src="src/pewpi-shared/integrationAdapter.js"></script>

<!-- Components (Optional) -->
<script src="src/pewpi-shared/components.js"></script>

<!-- Main Entry Point -->
<script src="src/pewpi-shared/index.js"></script>
```

### 2. Initialize Services

Add the following initialization snippet after the scripts:

```html
<script>
  // Defensive initialization - safe to call on every page load
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const result = await pewpiShared.safeInit({
        autoTrack: true,        // Enable token auto-tracking
        restoreSession: true,   // Restore previous login session
        initMachine: true,      // Enable cross-tab sync
        initIntegration: true,  // Enable system integrations
        debugMode: false        // Enable debug logging
      });
      
      if (result.success) {
        console.log('✓ PewPi-Shared initialized successfully');
      } else {
        console.warn('⚠ PewPi-Shared initialization had issues:', result.errors);
      }
    } catch (error) {
      console.error('✗ PewPi-Shared initialization failed:', error);
    }
  });
</script>
```

## Core Services

### Authentication Service

Handles user login, session management, and authentication state.

**Basic Usage:**

```javascript
// Login
const loginResult = await authService.login('username');
if (loginResult.success) {
  console.log('Logged in:', loginResult.user);
}

// Check if authenticated
if (authService.isAuthenticated()) {
  console.log('User is logged in');
}

// Get current user
const user = authService.getCurrentUser();

// Logout
await authService.logout();

// Listen for auth changes
authService.onAuthChange((event) => {
  console.log('Auth event:', event.type, event.user);
});
```

**Features:**
- Session persistence across page reloads
- Automatic login gate management
- Auth state change callbacks
- Session validation

### Token Service

Manages token balances and transaction history using IndexedDB (Dexie).

**Basic Usage:**

```javascript
// Get balance
const balance = await tokenService.getBalance();
console.log('Balance:', balance);

// Update balance
const result = await tokenService.updateBalance(50, 'Token grant');
console.log('New balance:', result.balance);

// Get transaction history
const transactions = await tokenService.getTransactions(10);
console.log('Recent transactions:', transactions);

// Enable auto-tracking
tokenService.initAutoTracking();
```

**Auto-Tracking:**
The token service can automatically track user interactions. Add `data-token-grant` attribute to elements:

```html
<button data-token-grant="10">Grant 10 Tokens</button>
```

**Features:**
- IndexedDB storage with in-memory fallback
- Transaction history
- Auto-tracking support
- Cross-tab synchronization

### Wallet Service

Manages wallet addresses with optional encryption support.

**Basic Usage:**

```javascript
// Set wallet (plain)
const setResult = await walletService.setWallet('0x1234567890abcdef...');
if (setResult.success) {
  console.log('Wallet saved:', setResult.type);
}

// Set wallet (encrypted)
const setEncrypted = await walletService.setWallet('0x1234...', {
  encrypt: true,
  passphrase: 'my-secret-passphrase'
});

// Get wallet (plain)
const getResult = await walletService.getWallet();
if (getResult.success) {
  console.log('Wallet:', getResult.address);
}

// Get wallet (encrypted)
const getEncrypted = await walletService.getWallet({
  passphrase: 'my-secret-passphrase'
});

// Check if wallet exists
const hasWallet = await walletService.hasWallet();

// Shorten address for display
const short = walletService.shortenAddress('0x1234567890abcdef...', 6, 4);
// Returns: "0x1234...cdef"
```

**Features:**
- Multiple wallet address format validation (Ethereum, Bitcoin, generic)
- Optional AES encryption with CryptoJS
- User-specific storage
- Address shortening utility

## Adapters

### Machine Adapter

Handles device-level state management and cross-tab communication.

**Basic Usage:**

```javascript
// Initialize
await machineAdapter.init();

// Get device info
const deviceInfo = machineAdapter.getDeviceInfo();
console.log('Device:', deviceInfo);

// Listen for state changes
machineAdapter.onStateChange((event) => {
  console.log('State changed:', event);
});

// Broadcast state to other tabs
machineAdapter.broadcastState('myKey', { data: 'value' });

// Store device-specific data
machineAdapter.storeLocal('preference', 'dark-mode');
const pref = machineAdapter.retrieveLocal('preference');
```

**Features:**
- Unique device ID generation
- Cross-tab state synchronization
- Network status monitoring
- Tab visibility tracking

### Integration Adapter

Provides compatibility layer with existing pewpi-infinity systems.

**Basic Usage:**

```javascript
// Initialize
await integrationAdapter.init({
  autoCommit: true,
  autoSync: true,
  debugMode: false
});

// Get integration status
const status = integrationAdapter.getStatus();
console.log('Integration status:', status);

// Terminal storage integration
const storage = integrationAdapter.terminalStorage();
await storage.store('key', 'value');
const value = await storage.retrieve('key');

// Hub integration
const hub = integrationAdapter.hub();
if (hub.isAvailable()) {
  await hub.initialize('github-token');
  await hub.sendCommand('z', 'status', {});
}

// Commit integration
const commit = integrationAdapter.commit();
if (commit.isAvailable()) {
  await commit.commit('Update data', { key: 'value' });
}
```

**Features:**
- Compatible with TerminalStorage triple-redundancy system
- Hub.js integration for multi-repo communication
- CommitClient/TerminalCommits integration
- Automatic service synchronization

## UI Components

Ready-to-use UI components for common tasks.

**Status Badge:**

```javascript
const badge = pewpiComponents.createStatusBadge({
  text: 'Active',
  type: 'success', // info, success, warning, error
  className: 'my-badge'
});
document.body.appendChild(badge);
```

**Wallet Display:**

```javascript
const walletDisplay = pewpiComponents.createWalletDisplay({
  address: '0x1234567890abcdef...',
  showFull: false, // Show full address or shortened
  className: 'my-wallet'
});
document.body.appendChild(walletDisplay);
```

**Token Balance:**

```javascript
const tokenBalance = pewpiComponents.createTokenBalance({
  balance: 100,
  emoji: '🧱',
  className: 'my-balance'
});
document.body.appendChild(tokenBalance);
```

**User Profile Card:**

```javascript
const profile = pewpiComponents.createUserProfile({
  username: 'john_doe',
  balance: 100,
  wallet: '0x1234...',
  className: 'my-profile'
});
document.body.appendChild(profile);
```

**Login Form:**

```javascript
const loginForm = pewpiComponents.createLoginForm({
  placeholder: 'Enter handle',
  buttonText: 'Login',
  onLogin: (result) => {
    console.log('User logged in:', result.user);
  }
});
document.body.appendChild(loginForm);
```

**Toast Notifications:**

```javascript
// Show toast notification
pewpiComponents.showToast('Operation successful!', 'success', 3000);
pewpiComponents.showToast('Warning message', 'warning');
pewpiComponents.showToast('Error occurred', 'error');
```

## Dependencies

### Required Dependencies

The library has optional dependencies that enhance functionality:

- **Dexie.js** - For IndexedDB storage in tokenService (optional, falls back to memory)
- **CryptoJS** - For wallet encryption in walletService (optional, disables encryption if not available)

### Installing Dependencies

If your project uses npm/package.json, add:

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "crypto-js": "^4.2.0"
  }
}
```

Or include via CDN in your HTML:

```html
<!-- Dexie.js -->
<script src="https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js"></script>

<!-- CryptoJS -->
<script src="https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js"></script>
```

## Advanced Usage

### Custom Initialization

You can initialize services individually for more control:

```javascript
// Initialize only specific services
await authService.init();
await tokenService.init();
tokenService.initAutoTracking();

// Or use the unified initializer with custom options
await pewpiShared.init({
  autoTrack: false,      // Disable auto-tracking
  restoreSession: true,
  initMachine: false,    // Skip machine adapter
  initIntegration: true
});
```

### Error Handling

All services provide detailed error information:

```javascript
const result = await walletService.setWallet('invalid');
if (!result.success) {
  console.error('Error:', result.error);
  // Handle error appropriately
}
```

### Service Status

Check service status at any time:

```javascript
const status = pewpiShared.getStatus();
console.log('Services:', status);
// Returns object with loaded/initialized status for each service
```

## Troubleshooting

### Common Issues

**1. Services not initializing**
- Ensure scripts are loaded in the correct order
- Check browser console for errors
- Verify dependencies (Dexie, CryptoJS) are loaded if used

**2. Session not restoring**
- Check localStorage is enabled in browser
- Verify 'pewpi_user' key exists in localStorage
- Call `authService.restoreSession()` explicitly if needed

**3. Token balance not persisting**
- Install Dexie.js for persistent storage
- Check IndexedDB is enabled in browser
- Verify no quota errors in console

**4. Wallet encryption failing**
- Install CryptoJS library
- Ensure passphrase is provided
- Check for console errors

## Migration from Existing Code

### From Inline Auth Code

**Before:**
```javascript
function pewpiUnlock() {
  localStorage.setItem("pewpi_user", document.getElementById("pewpi_user").value);
  // ... rest of code
}
```

**After:**
```javascript
// Use authService
const result = await authService.login(username);
```

### From Direct localStorage

**Before:**
```javascript
localStorage.setItem('wallet', address);
```

**After:**
```javascript
await walletService.setWallet(address);
```

## Best Practices

1. **Always use safeInit()** - It handles errors gracefully
2. **Check service availability** - Use `pewpiShared.getStatus()` before using services
3. **Handle errors** - All async methods return result objects with success/error
4. **Use components** - Pre-built UI components ensure consistency
5. **Enable auto-tracking** - Let tokenService handle token operations automatically

## TODO for Maintainers

- [ ] Configure token auto-tracking logic in `tokenService.js` (line ~186)
- [ ] Add custom passphrase generation if needed in `walletService.js`
- [ ] Customize integration adapters for your specific systems
- [ ] Add project-specific UI components to `components.js`
- [ ] Set up proper session token generation in production (authService.js line ~91)
- [ ] Configure auto-commit and auto-sync behavior in integrationAdapter
- [ ] Add unit tests for all services
- [ ] Document any custom modifications in this file

## Support

For issues or questions:
- Check browser console for detailed error messages
- Review this integration guide
- Check service status with `pewpiShared.getStatus()`
- Consult individual service files for implementation details

---

**Version:** 1.0.0  
**License:** MIT  
**Author:** pewpi-infinity
