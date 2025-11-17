/**
 * commit-client.js
 * 
 * Client-side helper for securely committing log entries to GitHub
 * via the server-side /commit endpoint.
 * 
 * Usage:
 *   <script src="static/js/commit-client.js"></script>
 *   <script>
 *     CommitClient.send('My log message').then(result => {
 *       if (result.ok) console.log('Logged!');
 *     });
 *   </script>
 */

(function(window) {
  'use strict';

  const CommitClient = {
    /**
     * Server endpoint URL
     * Default assumes server is running on localhost:3000
     * Update this to your production server URL
     */
    serverUrl: 'http://localhost:3000',

    /**
     * Commit secret - should be set by the page
     * In production, this could be fetched from a secure endpoint
     * or configured per-deployment
     */
    secret: null,

    /**
     * Configure the client
     * @param {Object} config - Configuration object
     * @param {string} config.serverUrl - Server endpoint URL
     * @param {string} config.secret - Commit authentication secret
     */
    configure: function(config) {
      if (config.serverUrl) {
        this.serverUrl = config.serverUrl;
      }
      if (config.secret) {
        this.secret = config.secret;
      }
    },

    /**
     * Send a log entry to the server for committing
     * @param {string} text - The text to log
     * @returns {Promise<Object>} Response from server
     */
    send: async function(text) {
      if (!text || typeof text !== 'string') {
        return {
          ok: false,
          error: 'Invalid text parameter'
        };
      }

      if (!this.secret) {
        return {
          ok: false,
          error: 'Commit secret not configured. Call CommitClient.configure() first.'
        };
      }

      try {
        const response = await fetch(`${this.serverUrl}/commit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Commit-Secret': this.secret
          },
          body: JSON.stringify({ text: text })
        });

        const data = await response.json();
        
        if (!response.ok) {
          return {
            ok: false,
            error: data.error || `HTTP ${response.status}`,
            status: response.status
          };
        }

        return data;
      } catch (error) {
        return {
          ok: false,
          error: error.message || 'Network error',
          networkError: true
        };
      }
    }
  };

  // Expose to global scope
  window.CommitClient = CommitClient;

})(window);
