/**
 * WalletUnified - Unified wallet helpers for earning, spending, and balance tracking
 * Works with TokenService for transaction history
 */

class WalletUnified {
  constructor(tokenService) {
    this.tokenService = tokenService;
    this.walletKey = 'pewpi_wallet';
    this.transactionHistoryKey = 'pewpi_transactions';
  }

  /**
   * Earn tokens - add balance to wallet
   */
  async earnTokens(amount, source = 'default', metadata = {}) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    const wallet = this._getWallet();
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.lastUpdated = new Date().toISOString();

    this._saveWallet(wallet);
    
    // Record transaction
    this._recordTransaction({
      type: 'earn',
      amount,
      source,
      balance: wallet.balance,
      metadata,
      timestamp: wallet.lastUpdated
    });

    // Emit event
    this._emitEvent('pewpi.wallet.earned', {
      amount,
      balance: wallet.balance,
      source,
      metadata
    });

    return wallet;
  }

  /**
   * Spend tokens - deduct balance from wallet
   */
  async spendTokens(amount, purpose = 'default', metadata = {}) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    const wallet = this._getWallet();
    
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.totalSpent += amount;
    wallet.lastUpdated = new Date().toISOString();

    this._saveWallet(wallet);
    
    // Record transaction
    this._recordTransaction({
      type: 'spend',
      amount,
      purpose,
      balance: wallet.balance,
      metadata,
      timestamp: wallet.lastUpdated
    });

    // Emit event
    this._emitEvent('pewpi.wallet.spent', {
      amount,
      balance: wallet.balance,
      purpose,
      metadata
    });

    return wallet;
  }

  /**
   * Get current wallet balance
   */
  getBalance() {
    const wallet = this._getWallet();
    return wallet.balance;
  }

  /**
   * Get all wallet balances (for multi-wallet support)
   */
  getAllBalances() {
    const wallet = this._getWallet();
    return {
      current: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      net: wallet.balance
    };
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(limit = 50) {
    try {
      const history = localStorage.getItem(this.transactionHistoryKey);
      if (!history) return [];
      
      const transactions = JSON.parse(history);
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('[WalletUnified] Error reading transaction history', error);
      return [];
    }
  }

  /**
   * Clear transaction history
   */
  clearTransactionHistory() {
    localStorage.removeItem(this.transactionHistoryKey);
    
    this._emitEvent('pewpi.wallet.history.cleared', {});
  }

  /**
   * Reset wallet (clear balance and history)
   */
  resetWallet() {
    localStorage.removeItem(this.walletKey);
    localStorage.removeItem(this.transactionHistoryKey);
    
    this._emitEvent('pewpi.wallet.reset', {});
  }

  /**
   * Get or initialize wallet
   */
  _getWallet() {
    try {
      const wallet = localStorage.getItem(this.walletKey);
      if (wallet) {
        return JSON.parse(wallet);
      }
    } catch (error) {
      console.error('[WalletUnified] Error reading wallet', error);
    }

    // Initialize new wallet
    return {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save wallet to localStorage
   */
  _saveWallet(wallet) {
    try {
      localStorage.setItem(this.walletKey, JSON.stringify(wallet));
    } catch (error) {
      console.error('[WalletUnified] Error saving wallet', error);
    }
  }

  /**
   * Record transaction in history
   */
  _recordTransaction(transaction) {
    try {
      let history = [];
      const existingHistory = localStorage.getItem(this.transactionHistoryKey);
      if (existingHistory) {
        history = JSON.parse(existingHistory);
      }

      // Add new transaction to beginning
      history.unshift(transaction);

      // Keep only last 100 transactions
      if (history.length > 100) {
        history = history.slice(0, 100);
      }

      localStorage.setItem(this.transactionHistoryKey, JSON.stringify(history));
    } catch (error) {
      console.error('[WalletUnified] Error recording transaction', error);
    }
  }

  /**
   * Emit wallet event (with cross-tab localStorage broadcast)
   */
  _emitEvent(eventType, data) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
      
      // Broadcast via localStorage for cross-tab sync
      try {
        const broadcastKey = `pewpi_broadcast_${eventType}`;
        localStorage.setItem(broadcastKey, JSON.stringify({ ...data, timestamp: Date.now() }));
        setTimeout(() => localStorage.removeItem(broadcastKey), 1000);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }
}

// Create singleton instance
let walletUnified = null;

function getWalletUnified(tokenService) {
  if (!walletUnified) {
    // Use global tokenService if available
    const ts = tokenService || (typeof window !== 'undefined' && window.tokenService);
    walletUnified = new WalletUnified(ts);
  }
  return walletUnified;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WalletUnified, getWalletUnified };
}

if (typeof window !== 'undefined') {
  window.WalletUnified = WalletUnified;
  window.getWalletUnified = getWalletUnified;
}
