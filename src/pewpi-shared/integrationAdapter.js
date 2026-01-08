/**
 * integrationAdapter.js
 * Adapter for integrating pewpi-shared services with existing systems
 * Provides compatibility layer and helper functions
 * 
 * @module integrationAdapter
 */

const integrationAdapter = (() => {
  let isInitialized = false;
  let config = {
    autoCommit: true,
    autoSync: true,
    debugMode: false
  };

  /**
   * Initialize the integration adapter
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async function init(options = {}) {
    if (isInitialized) {
      console.log('[IntegrationAdapter] Already initialized');
      return true;
    }

    try {
      // Merge config
      config = { ...config, ...options };

      if (config.debugMode) {
        console.log('[IntegrationAdapter] Debug mode enabled');
      }

      console.log('[IntegrationAdapter] Initialized with config:', config);
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('[IntegrationAdapter] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Integrate with existing terminal storage system
   * Provides compatibility with triple-redundancy storage
   * @returns {Object} Terminal storage integration
   */
  function terminalStorageIntegration() {
    return {
      /**
       * Store data using terminal's triple-redundancy system
       * @param {string} key - Storage key
       * @param {*} value - Value to store
       */
      async store(key, value) {
        // Check if TerminalStorage is available
        if (typeof TerminalStorage !== 'undefined' && TerminalStorage.safeStore) {
          try {
            await TerminalStorage.safeStore(key, value);
            if (config.debugMode) {
              console.log('[IntegrationAdapter] Stored via TerminalStorage:', key);
            }
            return true;
          } catch (error) {
            console.error('[IntegrationAdapter] TerminalStorage.safeStore failed:', error);
          }
        }

        // Fallback to localStorage
        try {
          localStorage.setItem(`pewpi_shared_${key}`, JSON.stringify(value));
          if (config.debugMode) {
            console.log('[IntegrationAdapter] Stored via localStorage:', key);
          }
          return true;
        } catch (error) {
          console.error('[IntegrationAdapter] localStorage fallback failed:', error);
          return false;
        }
      },

      /**
       * Retrieve data using terminal storage or fallback
       * @param {string} key - Storage key
       * @returns {*} Retrieved value or null
       */
      async retrieve(key) {
        // Try TerminalStorage first
        if (typeof TerminalStorage !== 'undefined' && TerminalStorage.safeRetrieve) {
          try {
            const value = await TerminalStorage.safeRetrieve(key);
            if (value !== null && value !== undefined) {
              return value;
            }
          } catch (error) {
            console.error('[IntegrationAdapter] TerminalStorage.safeRetrieve failed:', error);
          }
        }

        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(`pewpi_shared_${key}`);
          return stored ? JSON.parse(stored) : null;
        } catch (error) {
          console.error('[IntegrationAdapter] localStorage retrieval failed:', error);
          return null;
        }
      }
    };
  }

  /**
   * Integrate with existing Hub system
   * @returns {Object} Hub integration helpers
   */
  function hubIntegration() {
    return {
      /**
       * Check if Hub is available
       * @returns {boolean} Hub availability
       */
      isAvailable() {
        return typeof Hub !== 'undefined';
      },

      /**
       * Initialize Hub with token if available
       * @param {string} token - GitHub token
       */
      async initialize(token) {
        if (typeof Hub !== 'undefined' && Hub.initialize) {
          try {
            await Hub.initialize(token);
            if (config.debugMode) {
              console.log('[IntegrationAdapter] Hub initialized');
            }
            return true;
          } catch (error) {
            console.error('[IntegrationAdapter] Hub initialization failed:', error);
            return false;
          }
        }
        return false;
      },

      /**
       * Send message through Hub if available
       * @param {string} repo - Repository name
       * @param {string} command - Command to send
       * @param {Object} params - Command parameters
       */
      async sendCommand(repo, command, params) {
        if (typeof Hub !== 'undefined' && Hub.sendCommand) {
          try {
            return await Hub.sendCommand(repo, command, params);
          } catch (error) {
            console.error('[IntegrationAdapter] Hub command failed:', error);
            return null;
          }
        }
        return null;
      }
    };
  }

  /**
   * Integrate with commit system
   * @returns {Object} Commit integration helpers
   */
  function commitIntegration() {
    return {
      /**
       * Check if commit system is available
       * @returns {boolean} Commit system availability
       */
      isAvailable() {
        return typeof CommitClient !== 'undefined' || typeof TerminalCommits !== 'undefined';
      },

      /**
       * Commit data to GitHub
       * @param {string} message - Commit message
       * @param {Object} data - Data to commit
       */
      async commit(message, data) {
        // Try CommitClient first
        if (typeof CommitClient !== 'undefined' && CommitClient.send) {
          try {
            const text = typeof data === 'string' ? data : JSON.stringify(data);
            await CommitClient.send(`${message}\n${text}`);
            if (config.debugMode) {
              console.log('[IntegrationAdapter] Committed via CommitClient');
            }
            return true;
          } catch (error) {
            console.error('[IntegrationAdapter] CommitClient failed:', error);
          }
        }

        // Try TerminalCommits as fallback
        if (typeof TerminalCommits !== 'undefined' && TerminalCommits.queueCommit) {
          try {
            await TerminalCommits.queueCommit({
              action: message,
              data: data,
              timestamp: new Date().toISOString()
            });
            if (config.debugMode) {
              console.log('[IntegrationAdapter] Committed via TerminalCommits');
            }
            return true;
          } catch (error) {
            console.error('[IntegrationAdapter] TerminalCommits failed:', error);
          }
        }

        console.warn('[IntegrationAdapter] No commit system available');
        return false;
      }
    };
  }

  /**
   * Sync services with existing systems
   * @returns {Promise<Object>} Sync results
   */
  async function syncAll() {
    if (!config.autoSync) {
      return { success: false, error: 'Auto-sync disabled' };
    }

    const results = {
      auth: false,
      token: false,
      wallet: false
    };

    try {
      // Sync auth state
      if (typeof authService !== 'undefined') {
        await authService.restoreSession();
        results.auth = true;
      }

      // Sync token balance
      if (typeof tokenService !== 'undefined') {
        await tokenService.init();
        results.token = true;
      }

      // Sync wallet
      if (typeof walletService !== 'undefined') {
        await walletService.init();
        results.wallet = true;
      }

      if (config.debugMode) {
        console.log('[IntegrationAdapter] Sync completed:', results);
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('[IntegrationAdapter] Sync failed:', error);
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }

  /**
   * Get integration status
   * @returns {Object} Status information
   */
  function getStatus() {
    return {
      initialized: isInitialized,
      config: { ...config },
      services: {
        auth: typeof authService !== 'undefined' && authService.isInitialized,
        token: typeof tokenService !== 'undefined' && tokenService.isInitialized,
        wallet: typeof walletService !== 'undefined' && walletService.isInitialized
      },
      integrations: {
        hub: typeof Hub !== 'undefined',
        terminalStorage: typeof TerminalStorage !== 'undefined',
        commitClient: typeof CommitClient !== 'undefined',
        terminalCommits: typeof TerminalCommits !== 'undefined'
      }
    };
  }

  /**
   * Create a safe initialization wrapper
   * Handles errors gracefully and provides fallbacks
   * @param {Function} fn - Function to wrap
   * @param {string} name - Function name for logging
   * @returns {Function} Wrapped function
   */
  function safeInit(fn, name) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error(`[IntegrationAdapter] ${name} failed:`, error);
        return { success: false, error: error.message };
      }
    };
  }

  // Public API
  return {
    init,
    syncAll,
    getStatus,
    terminalStorage: terminalStorageIntegration,
    hub: hubIntegration,
    commit: commitIntegration,
    safeInit,
    get isInitialized() {
      return isInitialized;
    },
    get config() {
      return { ...config };
    }
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = integrationAdapter;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.integrationAdapter = integrationAdapter;
}
