/**
 * IntegrationListener - Utility to subscribe to cross-repo events and forward them
 * Listens for pewpi.token.created, pewpi.token.updated, pewpi.login.changed and other events
 */

class IntegrationListener {
  constructor() {
    this.listeners = new Map();
    this.storageListeners = new Map();
  }

  /**
   * Subscribe to a custom event
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
      
      // Add window event listener
      if (typeof window !== 'undefined') {
        window.addEventListener(eventType, (e) => {
          this._handleEvent(eventType, e.detail);
        });
      }
    }

    this.listeners.get(eventType).push(callback);

    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to token created events
   */
  onTokenCreated(callback) {
    return this.on('pewpi.token.created', callback);
  }

  /**
   * Subscribe to token updated events
   */
  onTokenUpdated(callback) {
    return this.on('pewpi.token.updated', callback);
  }

  /**
   * Subscribe to token deleted events
   */
  onTokenDeleted(callback) {
    return this.on('pewpi.token.deleted', callback);
  }

  /**
   * Subscribe to login changed events
   */
  onLoginChanged(callback) {
    return this.on('pewpi.login.changed', callback);
  }

  /**
   * Subscribe to wallet earned events
   */
  onWalletEarned(callback) {
    return this.on('pewpi.wallet.earned', callback);
  }

  /**
   * Subscribe to wallet spent events
   */
  onWalletSpent(callback) {
    return this.on('pewpi.wallet.spent', callback);
  }

  /**
   * Subscribe to localStorage broadcast events for cross-tab sync
   */
  listenToStorage(eventPattern) {
    if (typeof window === 'undefined') return;

    const handler = (e) => {
      if (e.key && e.key.startsWith('pewpi_broadcast_')) {
        const eventType = e.key.replace('pewpi_broadcast_', '');
        
        if (!eventPattern || eventType.includes(eventPattern)) {
          try {
            const data = JSON.parse(e.newValue || '{}');
            this._handleEvent(eventType, data);
          } catch (error) {
            console.error('[IntegrationListener] Error parsing storage event', error);
          }
        }
      }
    };

    window.addEventListener('storage', handler);
    this.storageListeners.set(eventPattern || 'default', handler);

    return () => {
      window.removeEventListener('storage', handler);
      this.storageListeners.delete(eventPattern || 'default');
    };
  }

  /**
   * Forward event to another window/iframe
   */
  forwardToWindow(targetWindow, eventType, data) {
    if (!targetWindow) {
      console.warn('[IntegrationListener] Target window not available');
      return;
    }

    targetWindow.postMessage({
      type: 'pewpi-event',
      eventType,
      data
    }, '*');
  }

  /**
   * Listen for forwarded events from other windows/iframes
   */
  listenForForwardedEvents() {
    if (typeof window === 'undefined') return;

    const handler = (e) => {
      if (e.data && e.data.type === 'pewpi-event') {
        this._handleEvent(e.data.eventType, e.data.data);
      }
    };

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };
  }

  /**
   * Handle event and call callbacks
   */
  _handleEvent(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[IntegrationListener] Error in callback', error);
        }
      });
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.clear();
    
    // Clean up storage listeners
    if (typeof window !== 'undefined') {
      this.storageListeners.forEach((handler) => {
        window.removeEventListener('storage', handler);
      });
      this.storageListeners.clear();
    }
  }
}

// Export singleton instance
const integrationListener = new IntegrationListener();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { integrationListener, IntegrationListener };
}

if (typeof window !== 'undefined') {
  window.integrationListener = integrationListener;
}
