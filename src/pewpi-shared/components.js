/**
 * components.js
 * Reusable UI components for pewpi-shared services
 * Provides ready-to-use widgets and displays
 * 
 * @module components
 */

const components = (() => {
  /**
   * Create a status badge component
   * @param {Object} options - Badge options
   * @returns {HTMLElement} Badge element
   */
  function createStatusBadge(options = {}) {
    const {
      text = 'Status',
      type = 'info', // info, success, warning, error
      className = ''
    } = options;

    const badge = document.createElement('span');
    badge.className = `pewpi-badge pewpi-badge-${type} ${className}`.trim();
    badge.textContent = text;

    // Apply inline styles for standalone use
    Object.assign(badge.style, {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: getTypeColor(type),
      color: '#ffffff'
    });

    return badge;
  }

  /**
   * Create a wallet display component
   * @param {Object} options - Display options
   * @returns {HTMLElement} Wallet display element
   */
  function createWalletDisplay(options = {}) {
    const {
      address = null,
      showFull = false,
      className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `pewpi-wallet-display ${className}`.trim();

    if (address) {
      const displayAddress = showFull 
        ? address 
        : walletService.shortenAddress(address);
      
      container.innerHTML = `
        <span class="pewpi-wallet-icon">💼</span>
        <span class="pewpi-wallet-address">${displayAddress}</span>
      `;

      // Add copy functionality
      container.style.cursor = 'pointer';
      container.title = 'Click to copy address';
      container.addEventListener('click', () => {
        copyToClipboard(address);
        showToast('Address copied!', 'success');
      });
    } else {
      container.innerHTML = `
        <span class="pewpi-wallet-icon">💼</span>
        <span class="pewpi-wallet-address">Not set</span>
      `;
    }

    // Apply inline styles
    Object.assign(container.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '6px',
      backgroundColor: '#f8fbfc',
      border: '1px solid #e6eef0',
      fontSize: '13px',
      fontFamily: 'monospace'
    });

    return container;
  }

  /**
   * Create a token balance display component
   * @param {Object} options - Display options
   * @returns {HTMLElement} Token balance element
   */
  function createTokenBalance(options = {}) {
    const {
      balance = 0,
      emoji = '🧱',
      className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `pewpi-token-balance ${className}`.trim();
    
    container.innerHTML = `
      <span class="pewpi-token-emoji">${emoji}</span>
      <span class="pewpi-token-amount">${balance}</span>
    `;

    // Apply inline styles
    Object.assign(container.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '6px',
      backgroundColor: '#f2d024',
      color: '#000000',
      fontSize: '16px',
      fontWeight: '700'
    });

    return container;
  }

  /**
   * Create a user profile card component
   * @param {Object} options - Profile options
   * @returns {HTMLElement} Profile card element
   */
  function createUserProfile(options = {}) {
    const {
      username = 'Guest',
      balance = 0,
      wallet = null,
      className = ''
    } = options;

    const card = document.createElement('div');
    card.className = `pewpi-user-profile ${className}`.trim();

    const walletDisplay = wallet ? walletService.shortenAddress(wallet) : 'Not set';

    card.innerHTML = `
      <div class="pewpi-profile-header">
        <span class="pewpi-profile-icon">🐶</span>
        <span class="pewpi-profile-username">${username}</span>
      </div>
      <div class="pewpi-profile-stats">
        <div class="pewpi-profile-stat">
          <span class="pewpi-profile-stat-label">Tokens:</span>
          <span class="pewpi-profile-stat-value">🧱 ${balance}</span>
        </div>
        <div class="pewpi-profile-stat">
          <span class="pewpi-profile-stat-label">Wallet:</span>
          <span class="pewpi-profile-stat-value">💼 ${walletDisplay}</span>
        </div>
      </div>
    `;

    // Apply inline styles
    Object.assign(card.style, {
      padding: '16px',
      borderRadius: '10px',
      backgroundColor: '#ffffff',
      border: '1px solid #e6eef0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    });

    return card;
  }

  /**
   * Create a login form component
   * @param {Object} options - Form options
   * @returns {HTMLElement} Login form element
   */
  function createLoginForm(options = {}) {
    const {
      onLogin = null,
      placeholder = 'Enter handle',
      buttonText = 'Login',
      className = ''
    } = options;

    const form = document.createElement('form');
    form.className = `pewpi-login-form ${className}`.trim();

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.required = true;

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = buttonText;

    form.appendChild(input);
    form.appendChild(button);

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = input.value.trim();
      
      if (username) {
        try {
          const result = await authService.login(username);
          if (result.success) {
            showToast(`Welcome, ${username}!`, 'success');
            if (onLogin) onLogin(result);
          } else {
            showToast(result.error || 'Login failed', 'error');
          }
        } catch (error) {
          showToast('Login error: ' + error.message, 'error');
        }
      }
    });

    // Apply inline styles
    Object.assign(form.style, {
      display: 'flex',
      gap: '8px',
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#f8fbfc'
    });

    Object.assign(input.style, {
      flex: '1',
      padding: '8px 12px',
      border: '1px solid #d6e2e6',
      borderRadius: '6px',
      fontSize: '14px'
    });

    Object.assign(button.style, {
      padding: '8px 16px',
      border: '1px solid #2fb86a',
      borderRadius: '6px',
      backgroundColor: '#2fb86a',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer'
    });

    return form;
  }

  /**
   * Create a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (info, success, warning, error)
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `pewpi-toast pewpi-toast-${type}`;
    toast.textContent = message;

    // Apply inline styles
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '6px',
      backgroundColor: getTypeColor(type),
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '10000',
      animation: 'pewpi-toast-slide-in 0.3s ease-out'
    });

    document.body.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.animation = 'pewpi-toast-slide-out 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Get color for badge/toast type
   * @param {string} type - Type name
   * @returns {string} Color value
   */
  function getTypeColor(type) {
    const colors = {
      info: '#4fb8e0',
      success: '#2fb86a',
      warning: '#ff9a3c',
      error: '#e14b4b'
    };
    return colors[type] || colors.info;
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (error) {
      console.error('[Components] Copy failed:', error);
      return false;
    }
  }

  /**
   * Inject CSS animations for toasts
   */
  function injectStyles() {
    if (document.getElementById('pewpi-components-styles')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'pewpi-components-styles';
    style.textContent = `
      @keyframes pewpi-toast-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes pewpi-toast-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Inject styles on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
      injectStyles();
    }
  }

  // Public API
  return {
    createStatusBadge,
    createWalletDisplay,
    createTokenBalance,
    createUserProfile,
    createLoginForm,
    showToast,
    copyToClipboard
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = components;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.pewpiComponents = components;
}
