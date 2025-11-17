/**
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
