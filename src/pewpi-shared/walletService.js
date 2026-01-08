/**
 * walletService.js
 * Wallet address management with encryption support
 * Integrates with existing encryption system
 * 
 * @module walletService
 */

// TODO: Maintainer - Import CryptoJS when available: import CryptoJS from 'crypto-js';
// For now, check if CryptoJS is available globally

const walletService = (() => {
  let isInitialized = false;
  let currentWallet = null;

  const STORAGE_KEYS = {
    WALLET_ENCRYPTED: 'pewpi_wallet_encrypted',
    WALLET_PLAIN: 'pewpi_wallet',
    HAS_ENCRYPTION: 'pewpi_wallet_has_encryption'
  };

  /**
   * Initialize the wallet service
   * @returns {Promise<boolean>} Success status
   */
  async function init() {
    if (isInitialized) {
      console.log('[WalletService] Already initialized');
      return true;
    }

    try {
      console.log('[WalletService] Initializing...');
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('[WalletService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current user from auth service
   * @returns {string} Current user handle
   */
  function getCurrentUser() {
    // Try to get from authService if available
    if (typeof authService !== 'undefined' && authService.getCurrentUser) {
      return authService.getCurrentUser() || 'anonymous';
    }
    // Fallback to localStorage
    return localStorage.getItem('pewpi_user') || 'anonymous';
  }

  /**
   * Validate wallet address format
   * Basic validation for common wallet formats
   * @param {string} address - Wallet address to validate
   * @returns {Object} Validation result
   */
  function validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return { valid: false, error: 'Address is required' };
    }

    const trimmed = address.trim();
    
    // Check for Ethereum-style addresses (0x + 40 hex chars)
    const ethPattern = /^0x[a-fA-F0-9]{40}$/;
    if (ethPattern.test(trimmed)) {
      return { valid: true, type: 'ethereum' };
    }

    // Check for Bitcoin-style addresses (26-35 alphanumeric chars)
    const btcPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    if (btcPattern.test(trimmed)) {
      return { valid: true, type: 'bitcoin' };
    }

    // Check for generic crypto address (at least 26 chars)
    if (trimmed.length >= 26) {
      return { valid: true, type: 'generic' };
    }

    return { valid: false, error: 'Invalid address format' };
  }

  /**
   * Encrypt wallet address using CryptoJS (if available)
   * @param {string} address - Wallet address to encrypt
   * @param {string} passphrase - Encryption passphrase
   * @returns {string|null} Encrypted address or null
   */
  function encryptAddress(address, passphrase) {
    if (typeof CryptoJS === 'undefined') {
      console.warn('[WalletService] CryptoJS not available, encryption disabled');
      return null;
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(address, passphrase).toString();
      return encrypted;
    } catch (error) {
      console.error('[WalletService] Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt wallet address using CryptoJS (if available)
   * @param {string} encrypted - Encrypted wallet address
   * @param {string} passphrase - Decryption passphrase
   * @returns {string|null} Decrypted address or null
   */
  function decryptAddress(encrypted, passphrase) {
    if (typeof CryptoJS === 'undefined') {
      console.warn('[WalletService] CryptoJS not available, decryption disabled');
      return null;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, passphrase);
      const address = decrypted.toString(CryptoJS.enc.Utf8);
      return address || null;
    } catch (error) {
      console.error('[WalletService] Decryption failed:', error);
      return null;
    }
  }

  /**
   * Set wallet address for current user
   * @param {string} address - Wallet address
   * @param {Object} options - Options
   * @param {string} options.passphrase - Encryption passphrase (optional)
   * @param {boolean} options.encrypt - Whether to encrypt (default: true if CryptoJS available)
   * @returns {Promise<Object>} Result
   */
  async function setWallet(address, options = {}) {
    if (!isInitialized) {
      await init();
    }

    // Validate address
    const validation = validateAddress(address);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const user = getCurrentUser();
    const trimmedAddress = address.trim();
    const shouldEncrypt = options.encrypt !== false && typeof CryptoJS !== 'undefined';

    try {
      // Create storage key unique to user
      const userKey = `${user}_${STORAGE_KEYS.WALLET_PLAIN}`;
      const userKeyEncrypted = `${user}_${STORAGE_KEYS.WALLET_ENCRYPTED}`;

      if (shouldEncrypt && options.passphrase) {
        // Encrypt and store
        const encrypted = encryptAddress(trimmedAddress, options.passphrase);
        if (encrypted) {
          localStorage.setItem(userKeyEncrypted, encrypted);
          localStorage.setItem(`${user}_${STORAGE_KEYS.HAS_ENCRYPTION}`, 'true');
          currentWallet = trimmedAddress;
          console.log(`[WalletService] Wallet stored (encrypted) for user: ${user}`);
          return {
            success: true,
            address: trimmedAddress,
            encrypted: true,
            type: validation.type
          };
        }
      }

      // Store without encryption
      localStorage.setItem(userKey, trimmedAddress);
      localStorage.setItem(`${user}_${STORAGE_KEYS.HAS_ENCRYPTION}`, 'false');
      currentWallet = trimmedAddress;
      console.log(`[WalletService] Wallet stored (plain) for user: ${user}`);
      
      return {
        success: true,
        address: trimmedAddress,
        encrypted: false,
        type: validation.type
      };
    } catch (error) {
      console.error('[WalletService] Error setting wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get wallet address for current user
   * @param {Object} options - Options
   * @param {string} options.passphrase - Decryption passphrase (if encrypted)
   * @returns {Promise<Object>} Result with address
   */
  async function getWallet(options = {}) {
    if (!isInitialized) {
      await init();
    }

    const user = getCurrentUser();
    const userKey = `${user}_${STORAGE_KEYS.WALLET_PLAIN}`;
    const userKeyEncrypted = `${user}_${STORAGE_KEYS.WALLET_ENCRYPTED}`;
    const hasEncryption = localStorage.getItem(`${user}_${STORAGE_KEYS.HAS_ENCRYPTION}`) === 'true';

    try {
      // Try encrypted first if available
      if (hasEncryption) {
        const encrypted = localStorage.getItem(userKeyEncrypted);
        if (encrypted && options.passphrase) {
          const decrypted = decryptAddress(encrypted, options.passphrase);
          if (decrypted) {
            currentWallet = decrypted;
            return {
              success: true,
              address: decrypted,
              encrypted: true
            };
          } else {
            return {
              success: false,
              error: 'Decryption failed - wrong passphrase?'
            };
          }
        } else if (encrypted) {
          return {
            success: false,
            error: 'Wallet is encrypted, passphrase required',
            hasEncrypted: true
          };
        }
      }

      // Try plain storage
      const plain = localStorage.getItem(userKey);
      if (plain) {
        currentWallet = plain;
        return {
          success: true,
          address: plain,
          encrypted: false
        };
      }

      return {
        success: false,
        error: 'No wallet found for user'
      };
    } catch (error) {
      console.error('[WalletService] Error getting wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user has a wallet set
   * @returns {Promise<boolean>} Has wallet
   */
  async function hasWallet() {
    const result = await getWallet();
    return result.success || result.hasEncrypted;
  }

  /**
   * Remove wallet for current user
   * @returns {Promise<Object>} Result
   */
  async function removeWallet() {
    const user = getCurrentUser();
    const userKey = `${user}_${STORAGE_KEYS.WALLET_PLAIN}`;
    const userKeyEncrypted = `${user}_${STORAGE_KEYS.WALLET_ENCRYPTED}`;

    try {
      localStorage.removeItem(userKey);
      localStorage.removeItem(userKeyEncrypted);
      localStorage.removeItem(`${user}_${STORAGE_KEYS.HAS_ENCRYPTION}`);
      currentWallet = null;
      
      console.log(`[WalletService] Wallet removed for user: ${user}`);
      return { success: true };
    } catch (error) {
      console.error('[WalletService] Error removing wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get shortened wallet address for display
   * @param {string} address - Full wallet address
   * @param {number} prefixLen - Length of prefix (default: 6)
   * @param {number} suffixLen - Length of suffix (default: 4)
   * @returns {string} Shortened address
   */
  function shortenAddress(address, prefixLen = 6, suffixLen = 4) {
    if (!address || address.length <= prefixLen + suffixLen) {
      return address;
    }
    return `${address.substring(0, prefixLen)}...${address.substring(address.length - suffixLen)}`;
  }

  // Public API
  return {
    init,
    setWallet,
    getWallet,
    hasWallet,
    removeWallet,
    validateAddress,
    shortenAddress,
    get isInitialized() {
      return isInitialized;
    }
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = walletService;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.walletService = walletService;
}
