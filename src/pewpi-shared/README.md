# PewPi-Shared Library

A unified authentication, wallet management, and token tracking library for the pewpi-infinity ecosystem.

## Features

### 🔐 Authentication Service
- User login/logout with session persistence
- Session restoration across page reloads
- Authentication state callbacks
- Automatic login gate management

### 🪙 Token Service  
- Token balance tracking with IndexedDB (Dexie)
- Transaction history management
- Auto-tracking for user interactions
- In-memory fallback when IndexedDB unavailable

### 💼 Wallet Service
- Multi-format wallet address validation (Ethereum, Bitcoin, generic)
- Optional AES encryption with CryptoJS
- User-specific wallet storage
- Address shortening utilities

### 🔧 Integration Adapter
- Compatible with TerminalStorage triple-redundancy system
- Hub.js integration for multi-repo communication
- CommitClient/TerminalCommits support
- Automatic service synchronization

### 💻 Machine Adapter
- Unique device ID generation
- Cross-tab state synchronization
- Network status monitoring
- Tab visibility tracking

### 🎨 UI Components
- Pre-built status badges
- Wallet display widgets
- Token balance displays
- User profile cards
- Login forms
- Toast notifications

## Installation

### 1. Include Scripts

Add to your HTML file in order:

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

### 2. Optional Dependencies

For enhanced functionality, include:

```html
<!-- Dexie.js for IndexedDB storage -->
<script src="https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js"></script>

<!-- CryptoJS for wallet encryption -->
<script src="https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js"></script>
```

Or via npm:

```bash
npm install dexie crypto-js
```

### 3. Initialize

Add initialization script:

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const result = await pewpiShared.safeInit({
      autoTrack: true,        // Enable token auto-tracking
      restoreSession: true,   // Restore login session
      initMachine: true,      // Enable cross-tab sync
      initIntegration: true   // Enable integrations
    });
    
    if (result.success) {
      console.log('✓ PewPi-Shared ready');
    }
  });
</script>
```

## Quick Start

### Authentication

```javascript
// Login
await authService.login('username');

// Check auth status
if (authService.isAuthenticated()) {
  const user = authService.getCurrentUser();
  console.log('Logged in as:', user);
}

// Logout
await authService.logout();
```

### Token Management

```javascript
// Get balance
const balance = await tokenService.getBalance();

// Grant tokens
await tokenService.updateBalance(50, 'Daily reward');

// Get transaction history
const txns = await tokenService.getTransactions(10);
```

### Wallet Management

```javascript
// Set wallet
await walletService.setWallet('0x1234567890abcdef...');

// Set encrypted wallet
await walletService.setWallet('0x1234...', {
  encrypt: true,
  passphrase: 'secret'
});

// Get wallet
const result = await walletService.getWallet();
if (result.success) {
  console.log('Wallet:', result.address);
}
```

### UI Components

```javascript
// Show toast notification
pewpiComponents.showToast('Welcome!', 'success');

// Create token balance display
const balance = pewpiComponents.createTokenBalance({
  balance: 100,
  emoji: '🧱'
});
document.body.appendChild(balance);

// Create wallet display
const wallet = pewpiComponents.createWalletDisplay({
  address: '0x1234567890abcdef...'
});
document.body.appendChild(wallet);
```

## Architecture

```
pewpi-shared/
├── index.js                 # Main entry point and initialization
├── authService.js          # Authentication and session management
├── tokenService.js         # Token balance and transactions
├── walletService.js        # Wallet address management
├── integrationAdapter.js   # System integration helpers
├── machineAdapter.js       # Device and cross-tab management
├── components.js           # UI components
├── INTEGRATION.md          # Detailed integration guide
└── README.md              # This file
```

## API Reference

### pewpiShared

Main library object with initialization methods.

```javascript
// Initialize all services
await pewpiShared.init(options);

// Safe initialization (recommended)
await pewpiShared.safeInit(options);

// Get service status
const status = pewpiShared.getStatus();

// Access services
pewpiShared.authService
pewpiShared.tokenService
pewpiShared.walletService
pewpiShared.machineAdapter
pewpiShared.integrationAdapter
pewpiShared.components
```

### authService

```javascript
await authService.init()
await authService.login(username, options)
await authService.logout()
await authService.restoreSession()
authService.getCurrentUser()
authService.isAuthenticated()
authService.getSessionInfo()
authService.onAuthChange(callback)
```

### tokenService

```javascript
await tokenService.init()
tokenService.initAutoTracking()
await tokenService.getBalance()
await tokenService.updateBalance(amount, description)
await tokenService.getTransactions(limit)
await tokenService.reset()
```

### walletService

```javascript
await walletService.init()
await walletService.setWallet(address, options)
await walletService.getWallet(options)
await walletService.hasWallet()
await walletService.removeWallet()
walletService.validateAddress(address)
walletService.shortenAddress(address, prefixLen, suffixLen)
```

### machineAdapter

```javascript
await machineAdapter.init()
machineAdapter.getDeviceId()
machineAdapter.getDeviceInfo()
machineAdapter.getMachineState()
machineAdapter.enableSync()
machineAdapter.disableSync()
machineAdapter.onStateChange(callback)
machineAdapter.broadcastState(key, value)
machineAdapter.storeLocal(key, value)
machineAdapter.retrieveLocal(key)
```

### integrationAdapter

```javascript
await integrationAdapter.init(options)
await integrationAdapter.syncAll()
integrationAdapter.getStatus()
integrationAdapter.terminalStorage()
integrationAdapter.hub()
integrationAdapter.commit()
```

### components

```javascript
pewpiComponents.createStatusBadge(options)
pewpiComponents.createWalletDisplay(options)
pewpiComponents.createTokenBalance(options)
pewpiComponents.createUserProfile(options)
pewpiComponents.createLoginForm(options)
pewpiComponents.showToast(message, type, duration)
pewpiComponents.copyToClipboard(text)
```

## Dependencies

### Optional
- **Dexie.js** (^3.2.4) - IndexedDB wrapper for token storage
- **CryptoJS** (^4.2.0) - Encryption library for wallet security

### Built-in Integrations
- TerminalStorage - Triple-redundancy storage system
- Hub.js - Multi-repo communication
- CommitClient - GitHub commit integration
- TerminalCommits - Commit queue system

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

Requires:
- ES6 support
- localStorage
- IndexedDB (optional, has fallback)
- Web Crypto API (optional, for encryption)

## Security

- Passphrases never stored, only used for encryption/decryption
- Wallet addresses encrypted with AES-GCM when enabled
- Session tokens generated with crypto-random values
- No sensitive data transmitted without user consent
- All storage is client-side by default

## License

MIT License - see repository for details

## Contributing

This is part of the pewpi-infinity/i repository. Contributions welcome!

## TODO for Maintainers

See `INTEGRATION.md` for detailed TODO list including:
- Token auto-tracking logic customization
- Passphrase generation configuration
- Integration adapter customization
- UI component additions
- Test coverage
- Production hardening

## Documentation

For detailed integration instructions, see [INTEGRATION.md](./INTEGRATION.md)

## Support

- Repository: pewpi-infinity/i
- Issues: Check browser console for detailed error messages
- Status: Use `pewpiShared.getStatus()` to diagnose issues

---

**Version:** 1.0.0  
**Created:** 2026-01-08  
**Author:** pewpi-infinity
