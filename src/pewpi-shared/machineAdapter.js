/**
 * machineAdapter.js
 * Machine and device-level adapter for state management
 * Handles cross-tab communication, device fingerprinting, and state synchronization
 * 
 * @module machineAdapter
 */

const machineAdapter = (() => {
  let isInitialized = false;
  let deviceId = null;
  let stateListeners = [];
  let syncEnabled = false;

  /**
   * Initialize the machine adapter
   * @returns {Promise<boolean>} Success status
   */
  async function init() {
    if (isInitialized) {
      console.log('[MachineAdapter] Already initialized');
      return true;
    }

    try {
      // Generate or retrieve device ID
      deviceId = getOrCreateDeviceId();
      
      // Set up cross-tab communication
      setupCrossTabSync();

      console.log('[MachineAdapter] Initialized with device ID:', deviceId);
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('[MachineAdapter] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate or retrieve device ID
   * Creates a unique identifier for this device/browser
   * @returns {string} Device ID
   */
  function getOrCreateDeviceId() {
    const storageKey = 'pewpi_device_id';
    let storedId = localStorage.getItem(storageKey);

    if (!storedId) {
      // Create new device ID
      storedId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, storedId);
      console.log('[MachineAdapter] Created new device ID:', storedId);
    }

    return storedId;
  }

  /**
   * Get device information
   * @returns {Object} Device info
   */
  function getDeviceInfo() {
    return {
      deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine
    };
  }

  /**
   * Setup cross-tab synchronization
   * Listens for storage events to sync state across tabs
   */
  function setupCrossTabSync() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (event) => {
      if (!syncEnabled) return;

      // Handle state changes from other tabs
      if (event.key && event.key.startsWith('pewpi_')) {
        console.log('[MachineAdapter] State change detected from another tab:', event.key);
        
        // Notify listeners
        notifyStateChange({
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue,
          source: 'cross-tab'
        });
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[MachineAdapter] Device is online');
      notifyStateChange({
        key: 'network_status',
        newValue: 'online',
        source: 'network'
      });
    });

    window.addEventListener('offline', () => {
      console.log('[MachineAdapter] Device is offline');
      notifyStateChange({
        key: 'network_status',
        newValue: 'offline',
        source: 'network'
      });
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      const isVisible = !document.hidden;
      console.log('[MachineAdapter] Tab visibility changed:', isVisible);
      notifyStateChange({
        key: 'tab_visibility',
        newValue: isVisible ? 'visible' : 'hidden',
        source: 'visibility'
      });
    });

    syncEnabled = true;
    console.log('[MachineAdapter] Cross-tab sync enabled');
  }

  /**
   * Enable cross-tab synchronization
   */
  function enableSync() {
    syncEnabled = true;
    console.log('[MachineAdapter] Sync enabled');
  }

  /**
   * Disable cross-tab synchronization
   */
  function disableSync() {
    syncEnabled = false;
    console.log('[MachineAdapter] Sync disabled');
  }

  /**
   * Register state change listener
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  function onStateChange(callback) {
    if (typeof callback !== 'function') {
      console.error('[MachineAdapter] Invalid callback');
      return () => {};
    }

    stateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = stateListeners.indexOf(callback);
      if (index > -1) {
        stateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state change
   * @param {Object} event - State change event
   */
  function notifyStateChange(event) {
    stateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[MachineAdapter] Listener error:', error);
      }
    });
  }

  /**
   * Broadcast state to other tabs
   * @param {string} key - State key
   * @param {*} value - State value
   */
  function broadcastState(key, value) {
    if (!syncEnabled) {
      console.warn('[MachineAdapter] Sync is disabled, broadcast skipped');
      return;
    }

    try {
      // Store in localStorage to trigger storage event in other tabs
      const storageKey = `pewpi_sync_${key}`;
      const payload = JSON.stringify({
        value,
        deviceId,
        timestamp: Date.now()
      });
      localStorage.setItem(storageKey, payload);
      console.log('[MachineAdapter] State broadcasted:', key);
    } catch (error) {
      console.error('[MachineAdapter] Broadcast failed:', error);
    }
  }

  /**
   * Get machine state
   * @returns {Object} Machine state
   */
  function getMachineState() {
    return {
      deviceId,
      isInitialized,
      syncEnabled,
      deviceInfo: getDeviceInfo(),
      listenerCount: stateListeners.length
    };
  }

  /**
   * Check if device is online
   * @returns {boolean} Online status
   */
  function isOnline() {
    return navigator.onLine;
  }

  /**
   * Check if tab is visible
   * @returns {boolean} Visibility status
   */
  function isVisible() {
    return !document.hidden;
  }

  /**
   * Store machine-specific data
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  function storeLocal(key, value) {
    try {
      const storageKey = `pewpi_machine_${deviceId}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[MachineAdapter] Store failed:', error);
      return false;
    }
  }

  /**
   * Retrieve machine-specific data
   * @param {string} key - Storage key
   * @returns {*} Retrieved value or null
   */
  function retrieveLocal(key) {
    try {
      const storageKey = `pewpi_machine_${deviceId}_${key}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[MachineAdapter] Retrieve failed:', error);
      return null;
    }
  }

  /**
   * Clear machine-specific data
   * @param {string} key - Storage key (optional, clears all if not provided)
   * @returns {boolean} Success status
   */
  function clearLocal(key) {
    try {
      if (key) {
        const storageKey = `pewpi_machine_${deviceId}_${key}`;
        localStorage.removeItem(storageKey);
      } else {
        // Clear all machine-specific data
        const prefix = `pewpi_machine_${deviceId}_`;
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(prefix)) {
            localStorage.removeItem(k);
          }
        });
      }
      return true;
    } catch (error) {
      console.error('[MachineAdapter] Clear failed:', error);
      return false;
    }
  }

  // Public API
  return {
    init,
    getDeviceId: () => deviceId,
    getDeviceInfo,
    getMachineState,
    enableSync,
    disableSync,
    onStateChange,
    broadcastState,
    isOnline,
    isVisible,
    storeLocal,
    retrieveLocal,
    clearLocal,
    get isInitialized() {
      return isInitialized;
    },
    get syncEnabled() {
      return syncEnabled;
    }
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = machineAdapter;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.machineAdapter = machineAdapter;
}
