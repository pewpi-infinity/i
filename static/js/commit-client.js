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
 * Client-side script for committing text to GitHub via secure server endpoint
 * 
 * This replaces the direct GitHub API calls from the browser with a secure
 * server-side endpoint that keeps the GitHub token safe.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Server endpoint URL - change this to your deployed server
    serverUrl: 'http://localhost:3000',
    
    // Commit secret - must match COMMIT_SECRET in server .env
    // In production, this should be retrieved from a secure source
    // or entered by the user (not hardcoded)
    commitSecret: localStorage.getItem('COMMIT_SECRET') || '',
    
    // Timeout for commit requests (ms)
    timeout: 30000
  };

  /**
   * Send text to the server for committing to GitHub
   * @param {string} text - The text to commit
   * @param {string} username - Optional username for the log entry
   * @returns {Promise<Object>} - The server response
   */
  async function commitToGitHub(text, username = 'user') {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (!CONFIG.commitSecret) {
      throw new Error('Commit secret not configured. Please set COMMIT_SECRET in localStorage.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
      const response = await fetch(`${CONFIG.serverUrl}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Commit-Secret': CONFIG.commitSecret
        },
        body: JSON.stringify({
          text: text,
          username: username
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Server may be down or slow.');
      }
      
      throw error;
    }
  }

  /**
   * Check if the server is available
   * @returns {Promise<boolean>}
   */
  async function checkServerHealth() {
    try {
      const response = await fetch(`${CONFIG.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set the commit secret
   * @param {string} secret - The commit secret
   */
  function setCommitSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      throw new Error('Secret must be a non-empty string');
    }
    CONFIG.commitSecret = secret;
    localStorage.setItem('COMMIT_SECRET', secret);
  }

  /**
   * Get the current commit secret
   * @returns {string}
   */
  function getCommitSecret() {
    return CONFIG.commitSecret;
  }

  /**
   * Clear the commit secret
   */
  function clearCommitSecret() {
    CONFIG.commitSecret = '';
    localStorage.removeItem('COMMIT_SECRET');
  }

  /**
   * Set the server URL
   * @param {string} url - The server URL
   */
  function setServerUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL must be a non-empty string');
    }
    CONFIG.serverUrl = url;
    localStorage.setItem('SERVER_URL', url);
  }

  // Try to load server URL from localStorage
  const savedServerUrl = localStorage.getItem('SERVER_URL');
  if (savedServerUrl) {
    CONFIG.serverUrl = savedServerUrl;
  }

  // Export API
  window.CommitClient = {
    commit: commitToGitHub,
    checkHealth: checkServerHealth,
    setSecret: setCommitSecret,
    getSecret: getCommitSecret,
    clearSecret: clearCommitSecret,
    setServerUrl: setServerUrl,
    getServerUrl: () => CONFIG.serverUrl
  };

  // Log initialization
  console.log('CommitClient initialized');
  console.log('Server URL:', CONFIG.serverUrl);
  console.log('Secret configured:', !!CONFIG.commitSecret);

})();
 * static/js/commit-client.js
 *
 * Small client helper to POST typed text to the server commit endpoint.
 * Usage:
 *   CommitClient.send("your text")
 *     .then(resp => console.log('committed', resp))
 *     .catch(err => console.error(err));
 *
 * IMPORTANT:
 * - Do NOT store GitHub tokens in client code.
 * - For simple setups you can set window.COMMIT_SECRET from server-rendered HTML to provide the secret.
 */

const CommitClient = (function () {
  const ENDPOINT = '/commit';
  const SECRET = window.COMMIT_SECRET || null;

  async function send(text) {
    if (!text || !text.trim()) throw new Error('text required');

    const payload = { text: text };
    const headers = { 'Content-Type': 'application/json' };
    if (SECRET) headers['X-Commit-Secret'] = SECRET;

    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body && body.error ? body.error : `HTTP ${resp.status}`);
    }
    return resp.json();
  }

  return { send };
})();

window.CommitClient = CommitClient;
