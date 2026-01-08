/**
 * authService.js
 * Authentication and session management service
 * Handles user login, session persistence, and authentication state
 * 
 * @module authService
 */

const authService = (() => {
  let isInitialized = false;
  let currentUser = null;
  let sessionStartTime = null;
  let authCallbacks = [];

  const STORAGE_KEYS = {
    USER: 'pewpi_user',
    SESSION_START: 'pewpi_session_start',
    SESSION_TOKEN: 'pewpi_session_token'
  };

  /**
   * Initialize the auth service
   * @returns {Promise<boolean>} Success status
   */
  async function init() {
    if (isInitialized) {
      console.log('[AuthService] Already initialized');
      return true;
    }

    try {
      console.log('[AuthService] Initializing...');
      isInitialized = true;
      return true;
    } catch (error) {
      console.error('[AuthService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   * @returns {string|null} Current user handle or null
   */
  function getCurrentUser() {
    if (currentUser) {
      return currentUser;
    }
    
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      currentUser = storedUser;
      return currentUser;
    }
    
    return null;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  function isAuthenticated() {
    return !!getCurrentUser();
  }

  /**
   * Login user and create session
   * @param {string} username - User handle
   * @param {Object} options - Login options
   * @returns {Promise<Object>} Login result
   */
  async function login(username, options = {}) {
    if (!username || typeof username !== 'string' || !username.trim()) {
      return {
        success: false,
        error: 'Invalid username'
      };
    }

    try {
      const cleanUsername = username.trim();
      currentUser = cleanUsername;
      sessionStartTime = new Date().toISOString();

      // Store in localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.USER, cleanUsername);
      localStorage.setItem(STORAGE_KEYS.SESSION_START, sessionStartTime);

      // Generate simple session token (TODO: Maintainer - use proper token generation in production)
      const sessionToken = `${cleanUsername}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);

      console.log(`[AuthService] User logged in: ${cleanUsername}`);

      // Notify callbacks
      notifyAuthChange({ type: 'login', user: cleanUsername });

      // Hide login gate if it exists
      const gate = document.getElementById('pewpi-gate');
      if (gate) {
        gate.style.display = 'none';
        document.body.classList.add('pewpi-live');
      }

      return {
        success: true,
        user: cleanUsername,
        sessionToken
      };
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout user and clear session
   * @returns {Promise<Object>} Logout result
   */
  async function logout() {
    try {
      const user = currentUser;
      
      // Clear session data
      currentUser = null;
      sessionStartTime = null;
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION_START);
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);

      console.log(`[AuthService] User logged out: ${user}`);

      // Notify callbacks
      notifyAuthChange({ type: 'logout', user });

      // Show login gate if it exists
      const gate = document.getElementById('pewpi-gate');
      if (gate) {
        gate.style.display = 'flex';
        document.body.classList.remove('pewpi-live');
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore session from localStorage
   * Called on page load to restore user authentication state
   * @returns {Promise<Object>} Restore result
   */
  async function restoreSession() {
    if (!isInitialized) {
      await init();
    }

    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedSessionStart = localStorage.getItem(STORAGE_KEYS.SESSION_START);
      const storedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

      if (storedUser) {
        currentUser = storedUser;
        sessionStartTime = storedSessionStart;

        console.log(`[AuthService] Session restored for user: ${storedUser}`);

        // Hide login gate if it exists
        const gate = document.getElementById('pewpi-gate');
        if (gate) {
          gate.style.display = 'none';
          document.body.classList.add('pewpi-live');
        }

        // Notify callbacks
        notifyAuthChange({ type: 'restore', user: storedUser });

        return {
          success: true,
          user: storedUser,
          sessionStart: storedSessionStart,
          sessionToken: storedToken
        };
      }

      console.log('[AuthService] No session to restore');
      return {
        success: false,
        error: 'No session found'
      };
    } catch (error) {
      console.error('[AuthService] Session restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get session information
   * @returns {Object|null} Session info or null
   */
  function getSessionInfo() {
    if (!isAuthenticated()) {
      return null;
    }

    return {
      user: currentUser,
      sessionStart: sessionStartTime || localStorage.getItem(STORAGE_KEYS.SESSION_START),
      sessionToken: localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN),
      isActive: true
    };
  }

  /**
   * Register callback for authentication state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  function onAuthChange(callback) {
    if (typeof callback !== 'function') {
      console.error('[AuthService] Invalid callback');
      return () => {};
    }

    authCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = authCallbacks.indexOf(callback);
      if (index > -1) {
        authCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks of authentication change
   * @param {Object} event - Auth event object
   */
  function notifyAuthChange(event) {
    authCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[AuthService] Callback error:', error);
      }
    });
  }

  /**
   * Validate session (check if session is still valid)
   * @returns {boolean} Session validity
   */
  function validateSession() {
    const user = getCurrentUser();
    const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    
    // Basic validation - user and token must exist
    return !!(user && token);
  }

  // Public API
  return {
    init,
    login,
    logout,
    restoreSession,
    getCurrentUser,
    isAuthenticated,
    getSessionInfo,
    validateSession,
    onAuthChange,
    get isInitialized() {
      return isInitialized;
    }
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = authService;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
  window.authService = authService;
}
