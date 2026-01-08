# Pewpi-Shared Library

Unified auth, wallet, and token management library for the pewpi-infinity ecosystem.

## Features

- **Token Service**: IndexedDB-backed token management with localStorage fallback
- **Auth Service**: Magic-link authentication with session management
- **Wallet Unified**: Token earning/spending with transaction history
- **Integration Listener**: Cross-repo event listening and forwarding
- **UI Components**: Login modal and wallet display

## Quick Start

```html
<!-- Include Dexie -->
<script src="https://unpkg.com/dexie@latest/dist/dexie.min.js"></script>

<!-- Include pewpi-shared -->
<script src="/src/pewpi-shared/token-service.js"></script>
<script src="/src/pewpi-shared/auth-service.js"></script>
<script src="/src/pewpi-shared/wallet-unified.js"></script>
```

```javascript
// Initialize
try {
  await authService.init();
  tokenService.initAutoTracking();
} catch (error) {
  console.error('Initialization failed', error);
}
```

## Modules

### token-service.js
Dexie-backed IndexedDB token management with automatic localStorage fallback.

**API:**
- `createToken(tokenData)` - Create a new token
- `getAll()` - Get all tokens
- `getById(id)` - Get token by ID
- `update(id, updates)` - Update token
- `delete(id)` - Delete token
- `getTotalBalance()` - Get total balance
- `initAutoTracking()` - Enable auto-tracking

**Events:**
- `pewpi.token.created`
- `pewpi.token.updated`
- `pewpi.token.deleted`

### auth-service.js
Magic-link authentication with session management and cross-tab sync.

**API:**
- `init()` - Initialize and restore session
- `login(email)` - Magic-link login
- `register(email)` - Register user (same as login in dev mode)
- `logout()` - Logout current user
- `getCurrentUser()` - Get current user
- `isLoggedIn()` - Check login status

**Events:**
- `pewpi.login.changed`

### wallet-unified.js
Wallet operations for earning/spending tokens with transaction history.

**API:**
- `earnTokens(amount, source, metadata)` - Earn tokens
- `spendTokens(amount, purpose, metadata)` - Spend tokens
- `getBalance()` - Get current balance
- `getAllBalances()` - Get all balance info
- `getTransactionHistory(limit)` - Get transaction history

**Events:**
- `pewpi.wallet.earned`
- `pewpi.wallet.spent`

### integration-listener.js
Cross-repo event subscription and forwarding utility.

**API:**
- `on(eventType, callback)` - Subscribe to event
- `onTokenCreated(callback)` - Subscribe to token creation
- `onLoginChanged(callback)` - Subscribe to login changes
- `listenToStorage(pattern)` - Listen to cross-tab storage events
- `forwardToWindow(targetWindow, eventType, data)` - Forward events

### Components

#### UnifiedLoginModal
Lightweight login modal for magic-link authentication.

```javascript
const loginModal = new UnifiedLoginModal(authService);
loginModal.show();
```

#### WalletDisplay
Real-time wallet balance and transaction display.

```javascript
const walletDisplay = new WalletDisplay(
  getWalletUnified(tokenService),
  '#container'
);
walletDisplay.render();
```

## Documentation

See [INTEGRATION.md](docs/INTEGRATION.md) for detailed integration guide, API reference, and testing instructions.

## Architecture

- **Dexie-backed storage**: Primary storage using IndexedDB via Dexie
- **localStorage fallback**: Automatic fallback when IndexedDB unavailable
- **Cross-tab sync**: localStorage broadcast for real-time cross-tab updates
- **Event-driven**: CustomEvent-based architecture for loose coupling
- **Opt-in UI**: Components are optional and can be used independently

## Events & Cross-Repo Communication

All events are emitted as CustomEvents on the window object and broadcast via localStorage for cross-tab synchronization. This enables:

- Real-time updates across multiple tabs
- Cross-component communication within a repo
- Cross-repo integration for the pewpi-infinity ecosystem

## Browser Support

- Modern browsers with ES6+ support
- IndexedDB support (with localStorage fallback)
- localStorage support (required for cross-tab sync)

## License

MIT

## Notes

This library is **additive and non-destructive**. It can be integrated alongside existing auth/wallet implementations. To fully adopt pewpi-shared:

1. Integrate the library (safe - won't break existing code)
2. Test in parallel with existing implementation
3. Gradually migrate to pewpi-shared APIs
4. Remove legacy implementation after validation

## TODOs for Maintainers

- [ ] Add TypeScript type definitions if repo uses TypeScript
- [ ] Configure server-side GitHub OAuth if needed (current implementation is client-side stub)
- [ ] Adjust file paths if repo has non-standard structure
- [ ] Add repo-specific customizations to components
- [ ] Set up feature flags for gradual rollout
