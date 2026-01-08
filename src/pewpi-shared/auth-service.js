/**
 * AuthService - Unified auth with magic-link dev-mode flow and optional GitHub OAuth
 * Emits CustomEvent: pewpi.login.changed
 * Broadcasts via localStorage for cross-tab sync
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = new Map();
    this.sessionKey = 'pewpi_session';
    this.userKey = 'pewpi_user';
    
    // Listen for storage events from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.sessionKey || e.key === this.userKey) {
          this.restoreSession();
        }
      });
    }
  }

  /**
   * Initialize auth service - restore session if exists
   */
  async init() {
    await this.restoreSession();
    console.log('[AuthService] Initialized');
  }

  /**
   * Restore session from localStorage
   */
  async restoreSession() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      const user = localStorage.getItem(this.userKey);
      
      if (session && user) {
        const sessionData = JSON.parse(session);
        const userData = JSON.parse(user);
        
        // Check if session is expired (24 hours)
        const expiresAt = new Date(sessionData.expiresAt);
        if (expiresAt > new Date()) {
          this.currentUser = userData;
          this._emitLoginChanged(userData);
          return userData;
        } else {
          // Session expired, clear it
          this.logout();
        }
      }
    } catch (error) {
      console.error('[AuthService] Error restoring session', error);
    }
    return null;
  }

  /**
   * Magic-link login (dev mode - just email)
   */
  async login(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const userData = {
      id: 'user_' + Math.random().toString(36).substring(2),
      email,
      loginMethod: 'magic-link',
      createdAt: new Date().toISOString()
    };

    // Create session (expires in 24 hours)
    const session = {
      userId: userData.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    localStorage.setItem(this.userKey, JSON.stringify(userData));

    this.currentUser = userData;
    this._emitLoginChanged(userData);

    return userData;
  }

  /**
   * Register new user (same as login in dev mode)
   */
  async register(email, additionalData = {}) {
    return this.login(email);
  }

  /**
   * GitHub OAuth helper (client-side stub)
   * Note: Server-side GitHub OAuth exchanges should be handled separately
   */
  async loginWithGitHub() {
    // This is a client-side helper stub
    // In production, redirect to your OAuth endpoint
    console.warn('[AuthService] GitHub OAuth requires server-side implementation');
    
    // For dev/demo: simulate GitHub login
    const mockEmail = 'github_user_' + Math.random().toString(36).substring(2) + '@github.com';
    return this.login(mockEmail);
  }

  /**
   * Logout current user
   */
  logout() {
    const prevUser = this.currentUser;
    
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.userKey);
    
    this.currentUser = null;
    this._emitLoginChanged(null, prevUser);
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Subscribe to login changes
   */
  subscribe(callback) {
    const id = Math.random().toString(36).substring(2);
    this.listeners.set(id, callback);
    
    return () => {
      this.listeners.delete(id);
    };
  }

  /**
   * Emit login changed event
   */
  _emitLoginChanged(newUser, prevUser = null) {
    const event = {
      user: newUser,
      prevUser: prevUser,
      timestamp: new Date().toISOString()
    };

    // Notify local subscribers
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[AuthService] Error in event callback', error);
      }
    });

    // Emit to window for cross-component communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pewpi.login.changed', { detail: event }));
      
      // Broadcast via localStorage for cross-tab sync
      try {
        const broadcastKey = 'pewpi_broadcast_login_changed';
        localStorage.setItem(broadcastKey, JSON.stringify({ ...event, timestamp: Date.now() }));
        setTimeout(() => localStorage.removeItem(broadcastKey), 1000);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }
}

// Export singleton instance
const authService = new AuthService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { authService, AuthService };
}

if (typeof window !== 'undefined') {
  window.authService = authService;
}
