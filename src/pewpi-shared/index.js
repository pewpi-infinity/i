/**
 * index.js
 * Main entry point for pewpi-shared library
 * Provides unified initialization and exports all services
 * 
 * @module pewpi-shared
 */

(function() {
  'use strict';

  /**
   * Initialize all pewpi-shared services
   * This is the main initialization function that should be called on page load
   * 
   * @param {Object} options - Initialization options
   * @param {boolean} options.autoTrack - Enable token auto-tracking (default: true)
   * @param {boolean} options.restoreSession - Restore auth session (default: true)
   * @param {boolean} options.initMachine - Initialize machine adapter (default: true)
   * @param {boolean} options.initIntegration - Initialize integration adapter (default: true)
   * @param {boolean} options.debugMode - Enable debug logging (default: false)
   * @returns {Promise<Object>} Initialization results
   */
  async function initPewpiShared(options = {}) {
    const {
      autoTrack = true,
      restoreSession = true,
      initMachine = true,
      initIntegration = true,
      debugMode = false
    } = options;

    const results = {
      success: false,
      services: {},
      errors: []
    };

    console.log('[PewpiShared] Initializing services...');

    try {
      // 1. Initialize auth service
      if (typeof authService !== 'undefined') {
        try {
          await authService.init();
          results.services.auth = { initialized: true };
          
          // Restore session if requested
          if (restoreSession) {
            const sessionResult = await authService.restoreSession();
            results.services.auth.sessionRestored = sessionResult.success;
            if (debugMode) {
              console.log('[PewpiShared] Auth session restore:', sessionResult);
            }
          }
        } catch (error) {
          console.error('[PewpiShared] Auth initialization failed:', error);
          results.errors.push({ service: 'auth', error: error.message });
          results.services.auth = { initialized: false, error: error.message };
        }
      } else {
        console.warn('[PewpiShared] authService not loaded');
        results.services.auth = { initialized: false, error: 'Service not loaded' };
      }

      // 2. Initialize token service
      if (typeof tokenService !== 'undefined') {
        try {
          await tokenService.init();
          results.services.token = { initialized: true };
          
          // Initialize auto-tracking if requested
          if (autoTrack) {
            tokenService.initAutoTracking();
            results.services.token.autoTrackingEnabled = true;
            if (debugMode) {
              console.log('[PewpiShared] Token auto-tracking enabled');
            }
          }
        } catch (error) {
          console.error('[PewpiShared] Token initialization failed:', error);
          results.errors.push({ service: 'token', error: error.message });
          results.services.token = { initialized: false, error: error.message };
        }
      } else {
        console.warn('[PewpiShared] tokenService not loaded');
        results.services.token = { initialized: false, error: 'Service not loaded' };
      }

      // 3. Initialize wallet service
      if (typeof walletService !== 'undefined') {
        try {
          await walletService.init();
          results.services.wallet = { initialized: true };
        } catch (error) {
          console.error('[PewpiShared] Wallet initialization failed:', error);
          results.errors.push({ service: 'wallet', error: error.message });
          results.services.wallet = { initialized: false, error: error.message };
        }
      } else {
        console.warn('[PewpiShared] walletService not loaded');
        results.services.wallet = { initialized: false, error: 'Service not loaded' };
      }

      // 4. Initialize machine adapter
      if (initMachine && typeof machineAdapter !== 'undefined') {
        try {
          await machineAdapter.init();
          machineAdapter.enableSync();
          results.services.machine = { 
            initialized: true,
            deviceId: machineAdapter.getDeviceId()
          };
        } catch (error) {
          console.error('[PewpiShared] Machine adapter initialization failed:', error);
          results.errors.push({ service: 'machine', error: error.message });
          results.services.machine = { initialized: false, error: error.message };
        }
      } else if (!initMachine) {
        results.services.machine = { initialized: false, skipped: true };
      } else {
        console.warn('[PewpiShared] machineAdapter not loaded');
        results.services.machine = { initialized: false, error: 'Service not loaded' };
      }

      // 5. Initialize integration adapter
      if (initIntegration && typeof integrationAdapter !== 'undefined') {
        try {
          await integrationAdapter.init({ 
            autoCommit: true, 
            autoSync: true,
            debugMode 
          });
          results.services.integration = { initialized: true };
          
          // Sync all services
          const syncResult = await integrationAdapter.syncAll();
          results.services.integration.synced = syncResult.success;
          if (debugMode) {
            console.log('[PewpiShared] Integration sync:', syncResult);
          }
        } catch (error) {
          console.error('[PewpiShared] Integration adapter initialization failed:', error);
          results.errors.push({ service: 'integration', error: error.message });
          results.services.integration = { initialized: false, error: error.message };
        }
      } else if (!initIntegration) {
        results.services.integration = { initialized: false, skipped: true };
      } else {
        console.warn('[PewpiShared] integrationAdapter not loaded');
        results.services.integration = { initialized: false, error: 'Service not loaded' };
      }

      // Mark as successful if at least one core service initialized
      results.success = 
        results.services.auth?.initialized || 
        results.services.token?.initialized || 
        results.services.wallet?.initialized;

      console.log('[PewpiShared] Initialization complete:', results.success ? '✓' : '✗');
      
      if (debugMode) {
        console.log('[PewpiShared] Full results:', results);
      }

      return results;
    } catch (error) {
      console.error('[PewpiShared] Fatal initialization error:', error);
      results.success = false;
      results.errors.push({ service: 'global', error: error.message });
      return results;
    }
  }

  /**
   * Get status of all services
   * @returns {Object} Service status
   */
  function getStatus() {
    return {
      auth: {
        loaded: typeof authService !== 'undefined',
        initialized: typeof authService !== 'undefined' && authService.isInitialized,
        authenticated: typeof authService !== 'undefined' && authService.isAuthenticated()
      },
      token: {
        loaded: typeof tokenService !== 'undefined',
        initialized: typeof tokenService !== 'undefined' && tokenService.isInitialized
      },
      wallet: {
        loaded: typeof walletService !== 'undefined',
        initialized: typeof walletService !== 'undefined' && walletService.isInitialized
      },
      machine: {
        loaded: typeof machineAdapter !== 'undefined',
        initialized: typeof machineAdapter !== 'undefined' && machineAdapter.isInitialized
      },
      integration: {
        loaded: typeof integrationAdapter !== 'undefined',
        initialized: typeof integrationAdapter !== 'undefined' && integrationAdapter.isInitialized
      },
      components: {
        loaded: typeof pewpiComponents !== 'undefined'
      }
    };
  }

  /**
   * Defensive initialization wrapper
   * Attempts to initialize with error handling and fallbacks
   * Safe to call multiple times
   */
  async function safeInit(options = {}) {
    try {
      // Check if already initialized
      const status = getStatus();
      const alreadyInitialized = Object.values(status)
        .some(s => s.initialized === true);

      if (alreadyInitialized) {
        console.log('[PewpiShared] Already initialized, skipping');
        return { success: true, skipped: true };
      }

      return await initPewpiShared(options);
    } catch (error) {
      console.error('[PewpiShared] Safe init caught error:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: true 
      };
    }
  }

  // Export to global scope
  const pewpiShared = {
    init: initPewpiShared,
    safeInit,
    getStatus,
    version: '1.0.0',
    // Re-export services for convenience
    get authService() { return typeof authService !== 'undefined' ? authService : null; },
    get tokenService() { return typeof tokenService !== 'undefined' ? tokenService : null; },
    get walletService() { return typeof walletService !== 'undefined' ? walletService : null; },
    get machineAdapter() { return typeof machineAdapter !== 'undefined' ? machineAdapter : null; },
    get integrationAdapter() { return typeof integrationAdapter !== 'undefined' ? integrationAdapter : null; },
    get components() { return typeof pewpiComponents !== 'undefined' ? pewpiComponents : null; }
  };

  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = pewpiShared;
  }

  // Export to window
  if (typeof window !== 'undefined') {
    window.pewpiShared = pewpiShared;
  }

  // Log loaded
  console.log('[PewpiShared] Library loaded. Call pewpiShared.init() or pewpiShared.safeInit() to initialize.');

})();
