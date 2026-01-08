/**
 * WalletDisplay - Lightweight wallet display component
 * Shows current balance and recent transactions
 */

class WalletDisplay {
  constructor(walletUnified, container) {
    this.walletUnified = walletUnified;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.element = null;
    this.updateInterval = null;
  }

  /**
   * Render the wallet display
   */
  render() {
    if (!this.container) {
      console.error('[WalletDisplay] Container not found');
      return;
    }

    this.element = this._createElement();
    this.container.innerHTML = '';
    this.container.appendChild(this.element);

    // Listen for wallet events
    this._setupEventListeners();

    // Auto-refresh every 5 seconds
    this.updateInterval = setInterval(() => {
      this.update();
    }, 5000);
  }

  /**
   * Update the wallet display
   */
  update() {
    if (!this.element) return;

    const balances = this.walletUnified.getAllBalances();
    const transactions = this.walletUnified.getTransactionHistory(5);

    // Update balance
    const balanceEl = this.element.querySelector('.pewpi-wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = balances.current.toFixed(2);
    }

    // Update stats
    const earnedEl = this.element.querySelector('.pewpi-wallet-earned');
    const spentEl = this.element.querySelector('.pewpi-wallet-spent');
    if (earnedEl) earnedEl.textContent = balances.totalEarned.toFixed(2);
    if (spentEl) spentEl.textContent = balances.totalSpent.toFixed(2);

    // Update transactions
    const transactionsEl = this.element.querySelector('.pewpi-wallet-transactions');
    if (transactionsEl) {
      transactionsEl.innerHTML = transactions.length > 0
        ? transactions.map(t => this._renderTransaction(t)).join('')
        : '<div style="text-align: center; color: #999; padding: 1rem;">No transactions yet</div>';
    }
  }

  /**
   * Destroy the wallet display
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Create wallet display element
   */
  _createElement() {
    const balances = this.walletUnified.getAllBalances();
    const transactions = this.walletUnified.getTransactionHistory(5);

    const div = document.createElement('div');
    div.className = 'pewpi-wallet-display';
    div.style.cssText = `
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    div.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem; font-size: 1.25rem; color: #333;">Pewpi Wallet</h3>
        <div style="font-size: 2rem; font-weight: bold; color: #1976d2;">
          <span class="pewpi-wallet-balance">${balances.current.toFixed(2)}</span>
          <span style="font-size: 1rem; color: #666; margin-left: 0.5rem;">tokens</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: white; padding: 1rem; border-radius: 6px;">
          <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">Total Earned</div>
          <div style="font-size: 1.25rem; font-weight: 600; color: #4caf50;">
            +<span class="pewpi-wallet-earned">${balances.totalEarned.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="background: white; padding: 1rem; border-radius: 6px;">
          <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">Total Spent</div>
          <div style="font-size: 1.25rem; font-weight: 600; color: #f44336;">
            -<span class="pewpi-wallet-spent">${balances.totalSpent.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 style="margin: 0 0 0.75rem; font-size: 1rem; color: #333;">Recent Transactions</h4>
        <div class="pewpi-wallet-transactions" style="background: white; border-radius: 6px; padding: 0.5rem; max-height: 200px; overflow-y: auto;">
          ${transactions.length > 0
            ? transactions.map(t => this._renderTransaction(t)).join('')
            : '<div style="text-align: center; color: #999; padding: 1rem;">No transactions yet</div>'
          }
        </div>
      </div>
    `;

    return div;
  }

  /**
   * Render a single transaction
   */
  _renderTransaction(transaction) {
    const isEarn = transaction.type === 'earn';
    const color = isEarn ? '#4caf50' : '#f44336';
    const sign = isEarn ? '+' : '-';
    const label = isEarn ? transaction.source : transaction.purpose;

    return `
      <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #f0f0f0;">
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #333;">${label}</div>
          <div style="font-size: 0.75rem; color: #999;">${this._formatDate(transaction.timestamp)}</div>
        </div>
        <div style="font-weight: 600; color: ${color};">
          ${sign}${transaction.amount.toFixed(2)}
        </div>
      </div>
    `;
  }

  /**
   * Format date to relative time
   */
  _formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  /**
   * Setup event listeners for real-time updates
   */
  _setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Listen for wallet events
    window.addEventListener('pewpi.wallet.earned', () => this.update());
    window.addEventListener('pewpi.wallet.spent', () => this.update());
    window.addEventListener('pewpi.wallet.reset', () => this.update());
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WalletDisplay };
}

if (typeof window !== 'undefined') {
  window.WalletDisplay = WalletDisplay;
}
