/**
 * commit-client.js
 * 
 * Client-side helper for sending log text to the commit server.
 * 
 * Usage:
 *   CommitClient.send("Your log text here")
 *     .then(result => console.log("Logged:", result))
 *     .catch(err => console.error("Error:", err));
 * 
 * Configuration:
 *   Set window.COMMIT_SECRET in your HTML before loading this script,
 *   or the secret can be passed in the send() method options.
 *   
 *   Set window.COMMIT_SERVER_URL to override the default endpoint
 *   (defaults to http://localhost:3000/commit)
 */

(function(window) {
  'use strict';

  const CommitClient = {
    /**
     * Send text to commit server
     * @param {string} text - The text to log
     * @param {object} options - Optional configuration
     * @param {string} options.secret - Override COMMIT_SECRET
     * @param {string} options.serverUrl - Override server URL
     * @param {function} options.onSuccess - Callback on success
     * @param {function} options.onError - Callback on error
     * @returns {Promise} - Resolves with server response
     */
    send: async function(text, options = {}) {
      const secret = options.secret || window.COMMIT_SECRET;
      const serverUrl = options.serverUrl || window.COMMIT_SERVER_URL || 'http://localhost:3000/commit';

      if (!text || typeof text !== 'string') {
        const error = new Error('Text parameter is required and must be a string');
        if (options.onError) options.onError(error);
        throw error;
      }

      if (!secret) {
        const error = new Error('COMMIT_SECRET is not configured. Set window.COMMIT_SECRET or pass options.secret');
        if (options.onError) options.onError(error);
        throw error;
      }

      try {
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Commit-Secret': secret
          },
          body: JSON.stringify({ text: text })
        });

        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.error || `Server error: ${response.status}`);
          error.status = response.status;
          error.data = data;
          if (options.onError) options.onError(error);
          throw error;
        }

        if (options.onSuccess) options.onSuccess(data);
        return data;

      } catch (error) {
        // Network error or exception
        if (!error.status) {
          error.message = `Network error: ${error.message}`;
        }
        if (options.onError) options.onError(error);
        throw error;
      }
    },

    /**
     * Check if commit server is available
     * @param {string} serverUrl - Optional server URL override
     * @returns {Promise<boolean>} - True if server is healthy
     */
    checkHealth: async function(serverUrl) {
      const healthUrl = (serverUrl || window.COMMIT_SERVER_URL || 'http://localhost:3000').replace('/commit', '') + '/health';
      
      try {
        const response = await fetch(healthUrl);
        const data = await response.json();
        return response.ok && data.status === 'ok';
      } catch (error) {
        return false;
      }
    }
  };

  // Export to window
  window.CommitClient = CommitClient;

})(window);
