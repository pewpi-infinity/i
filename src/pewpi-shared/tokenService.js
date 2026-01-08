/**
 * tokenService.js
 * Token balance tracking and transaction management with Dexie (IndexedDB)
 * 
 * @module tokenService
 */

// TODO: Maintainer - Import Dexie when available: import Dexie from 'dexie';
// For now, check if Dexie is available globally

const tokenService = (() => {
  let db = null;
  let isInitialized = false;
  let autoTrackingEnabled = false;
  
  // In-memory fallback if Dexie not available
  let memoryStore = {
    balance: 0,
    transactions: []
  };

  /**
   * Initialize the token service and database
   * @returns {Promise<boolean>} Success status
   */
  async function init() {
    if (isInitialized) {
      console.log('[TokenService] Already initialized');
      return true;
    }

    try {
      // Check if Dexie is available
      if (typeof Dexie !== 'undefined') {
        db = new Dexie('PewpiTokenDB');
        db.version(1).stores({
          tokens: '++id, user, balance, timestamp',
          transactions: '++id, user, amount, type, timestamp, description'
        });
        await db.open();
        console.log('[TokenService] Initialized with Dexie');
      } else {
        console.warn('[TokenService] Dexie not available, using memory store');
      }
      
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('[TokenService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current user from localStorage
   * @returns {string} Current user handle
   */
  function getCurrentUser() {
    return localStorage.getItem('pewpi_user') || 'anonymous';
  }

  /**
   * Get token balance for current user
   * @returns {Promise<number>} Token balance
   */
  async function getBalance() {
    const user = getCurrentUser();
    
    if (db) {
      try {
        const record = await db.tokens
          .where('user')
          .equals(user)
          .last();
        return record ? record.balance : 0;
      } catch (error) {
        console.error('[TokenService] Error getting balance:', error);
        return 0;
      }
    }
    
    // Fallback to memory store
    return memoryStore.balance;
  }

  /**
   * Update token balance
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @param {string} description - Transaction description
   * @returns {Promise<Object>} Transaction result
   */
  async function updateBalance(amount, description = '') {
    if (!isInitialized) {
      await init();
    }

    const user = getCurrentUser();
    const currentBalance = await getBalance();
    const newBalance = currentBalance + amount;
    const timestamp = new Date().toISOString();

    if (db) {
      try {
        // Add transaction record
        await db.transactions.add({
          user,
          amount,
          type: amount > 0 ? 'grant' : 'spend',
          timestamp,
          description
        });

        // Update balance
        await db.tokens.add({
          user,
          balance: newBalance,
          timestamp
        });

        console.log(`[TokenService] Balance updated: ${currentBalance} -> ${newBalance}`);
        return { success: true, balance: newBalance, amount };
      } catch (error) {
        console.error('[TokenService] Error updating balance:', error);
        return { success: false, error: error.message };
      }
    }
    
    // Fallback to memory store
    memoryStore.balance = newBalance;
    memoryStore.transactions.push({
      user,
      amount,
      type: amount > 0 ? 'grant' : 'spend',
      timestamp,
      description
    });
    
    return { success: true, balance: newBalance, amount };
  }

  /**
   * Get transaction history
   * @param {number} limit - Maximum number of transactions to return
   * @returns {Promise<Array>} Transaction history
   */
  async function getTransactions(limit = 10) {
    const user = getCurrentUser();
    
    if (db) {
      try {
        const transactions = await db.transactions
          .where('user')
          .equals(user)
          .reverse()
          .limit(limit)
          .toArray();
        return transactions;
      } catch (error) {
        console.error('[TokenService] Error getting transactions:', error);
        return [];
      }
    }
    
    // Fallback to memory store
    return memoryStore.transactions
      .filter(t => t.user === user)
      .slice(-limit)
      .reverse();
  }

  /**
   * Initialize auto-tracking for token operations
   * This tracks user interactions and updates token balance automatically
   * TODO: Maintainer - Customize auto-tracking logic based on your use case
   */
  function initAutoTracking() {
    if (autoTrackingEnabled) {
      console.log('[TokenService] Auto-tracking already enabled');
      return;
    }

    console.log('[TokenService] Auto-tracking enabled');
    autoTrackingEnabled = true;

    // Example: Track button clicks for token grants
    // TODO: Maintainer - Add your custom tracking logic here
    document.addEventListener('click', async (e) => {
      if (e.target.dataset.tokenGrant) {
        const amount = parseInt(e.target.dataset.tokenGrant, 10);
        if (!isNaN(amount)) {
          await updateBalance(amount, 'Auto-tracked token grant');
        }
      }
    });

    // Track storage events for cross-tab synchronization
    window.addEventListener('storage', async (e) => {
      if (e.key === 'pewpi_user' && e.newValue) {
        console.log('[TokenService] User changed, refreshing balance');
        const balance = await getBalance();
        console.log(`[TokenService] Current balance: ${balance}`);
      }
    });
  }

  /**
   * Reset token data for current user
   * WARNING: This will delete all token data
   * @returns {Promise<boolean>} Success status
   */
  async function reset() {
    const user = getCurrentUser();
    
    if (db) {
      try {
        await db.tokens.where('user').equals(user).delete();
        await db.transactions.where('user').equals(user).delete();
        console.log('[TokenService] Data reset for user:', user);
        return true;
      } catch (error) {
        console.error('[TokenService] Error resetting data:', error);
        return false;
      }
    }
    
    // Fallback to memory store
    memoryStore.balance = 0;
    memoryStore.transactions = memoryStore.transactions.filter(t => t.user !== user);
    return true;
  }

  // Public API
  return {
    init,
    initAutoTracking,
    getBalance,
    updateBalance,
    getTransactions,
    reset,
    get isInitialized() {
      return isInitialized;
    }
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tokenService;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.tokenService = tokenService;
}
