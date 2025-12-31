/**
 * terminal-storage.js
 * Triple-redundancy safe storage: localStorage + repo_data + GitHub commits
 */

const TerminalStorage = (function() {
  const STORAGE_PREFIX = 'terminal_';
  
  /**
   * Get current pewpi user
   */
  function getCurrentUser() {
    return localStorage.getItem('pewpi_user') || '';
  }

  /**
   * Get repo_data from embedded script tag
   */
  function getRepoData() {
    try {
      const repoScript = document.getElementById('repo_data');
      if (!repoScript) return null;
      return JSON.parse(repoScript.textContent);
    } catch (e) {
      console.error('Failed to parse repo_data', e);
      return null;
    }
  }

  /**
   * Update repo_data in embedded script tag
   */
  function updateRepoData(data) {
    try {
      const repoScript = document.getElementById('repo_data');
      if (!repoScript) {
        console.warn('repo_data script tag not found');
        return false;
      }
      repoScript.textContent = '\n' + JSON.stringify(data, null, 2) + '\n  ';
      return true;
    } catch (e) {
      console.error('Failed to update repo_data', e);
      return false;
    }
  }

  /**
   * Triple-redundancy store
   */
  async function safeStore(key, value, encrypt = false) {
    const fullKey = STORAGE_PREFIX + key;
    
    try {
      // 1. Store to localStorage
      const storeValue = encrypt ? await encryptValue(value) : JSON.stringify(value);
      localStorage.setItem(fullKey, storeValue);
      
      // 2. Store to repo_data
      const repo = getRepoData() || initRepoData();
      setNestedValue(repo, key, value);
      updateRepoData(repo);
      
      // 3. Queue for GitHub commit (handled by commit system)
      if (window.TerminalCommits) {
        await window.TerminalCommits.queueCommit({
          action: 'store',
          key,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('safeStore failed', error);
      throw error;
    }
  }

  /**
   * Triple-redundancy retrieve
   */
  async function safeRetrieve(key, encrypted = false) {
    const fullKey = STORAGE_PREFIX + key;
    
    try {
      // Try localStorage first (fastest)
      let value = localStorage.getItem(fullKey);
      if (value) {
        return encrypted ? await decryptValue(value) : JSON.parse(value);
      }
      
      // Fallback to repo_data
      const repo = getRepoData();
      if (repo) {
        value = getNestedValue(repo, key);
        if (value !== undefined) {
          // Restore to localStorage
          localStorage.setItem(fullKey, encrypted ? value : JSON.stringify(value));
          return encrypted ? await decryptValue(value) : value;
        }
      }
      
      return null;
    } catch (error) {
      console.error('safeRetrieve failed', error);
      return null;
    }
  }

  /**
   * Initialize repo_data structure
   */
  function initRepoData() {
    return {
      meta: {
        created_by: 'terminal_interface',
        created_at: new Date().toISOString(),
        current_user: getCurrentUser(),
        commit_chain: ''
      },
      wallets: {},
      tokens: {},
      entries: [],
      commits: []
    };
  }

  /**
   * Set nested value in object using dot notation
   */
  function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Get nested value from object using dot notation
   */
  function getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Encrypt value using existing system
   */
  async function encryptValue(value) {
    const passphrase = getPassphrase();
    if (!passphrase) {
      throw new Error('No passphrase available for encryption');
    }
    
    const plaintext = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Use existing encryptText from index.html if available
    if (typeof window.encryptText === 'function') {
      return await window.encryptText(plaintext, passphrase);
    }
    
    // Fallback: simple base64 (NOT SECURE - should use proper encryption)
    console.warn('Using fallback encryption - not secure!');
    return btoa(plaintext);
  }

  /**
   * Decrypt value using existing system
   */
  async function decryptValue(encrypted) {
    const passphrase = getPassphrase();
    if (!passphrase) {
      throw new Error('No passphrase available for decryption');
    }
    
    // Use existing decryptText from index.html if available
    if (typeof window.decryptText === 'function') {
      const decrypted = await window.decryptText(encrypted, passphrase);
      try {
        return JSON.parse(decrypted);
      } catch (e) {
        return decrypted;
      }
    }
    
    // Fallback: simple base64 decode
    console.warn('Using fallback decryption - not secure!');
    const plaintext = atob(encrypted);
    try {
      return JSON.parse(plaintext);
    } catch (e) {
      return plaintext;
    }
  }

  /**
   * Get passphrase from various sources
   */
  function getPassphrase() {
    // Try to get from index.html passphrase field
    const passphraseInput = document.getElementById('passphrase');
    if (passphraseInput && passphraseInput.value) {
      return passphraseInput.value;
    }
    
    // Try localStorage
    const stored = localStorage.getItem('terminal_passphrase');
    if (stored) {
      return stored;
    }
    
    // Generate temporary one
    const temp = Math.random().toString(36).slice(2, 12);
    localStorage.setItem('terminal_passphrase', temp);
    return temp;
  }

  // Wallet operations

  async function setWallet(user, address) {
    if (!user) throw new Error('User required');
    if (!address) throw new Error('Address required');
    
    const wallet = {
      address: address,
      created_at: new Date().toISOString(),
      balance: 0
    };
    
    // Store encrypted
    await safeStore(`wallets.${user}`, wallet, true);
    
    return wallet;
  }

  async function getWallet(user) {
    if (!user) return null;
    
    try {
      return await safeRetrieve(`wallets.${user}`, true);
    } catch (e) {
      console.error('Failed to retrieve wallet', e);
      return null;
    }
  }

  // Token operations

  async function getTokenBalance(user) {
    if (!user) return 0;
    
    try {
      const tokens = await safeRetrieve(`tokens.${user}`, false);
      return tokens?.balance || 0;
    } catch (e) {
      console.error('Failed to get token balance', e);
      return 0;
    }
  }

  async function grantTokens(user, amount) {
    if (!user) throw new Error('User required');
    if (amount <= 0) throw new Error('Amount must be positive');
    
    // Get current balance
    let tokens = await safeRetrieve(`tokens.${user}`, false);
    if (!tokens) {
      tokens = {
        balance: 0,
        transactions: []
      };
    }
    
    // Create transaction
    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'grant',
      amount: amount,
      timestamp: new Date().toISOString(),
      user: user
    };
    
    // Update balance
    tokens.balance = (tokens.balance || 0) + amount;
    tokens.transactions = tokens.transactions || [];
    tokens.transactions.push(transaction);
    
    // Store
    await safeStore(`tokens.${user}`, tokens, false);
    
    return tokens.balance;
  }

  // Commit operations

  async function getCommits() {
    try {
      const commits = await safeRetrieve('commits', false);
      return Array.isArray(commits) ? commits : [];
    } catch (e) {
      console.error('Failed to get commits', e);
      return [];
    }
  }

  async function addCommit(commit) {
    const commits = await getCommits();
    commits.push(commit);
    await safeStore('commits', commits, false);
    return commits;
  }

  // Export all data

  async function exportAllData() {
    const user = getCurrentUser();
    const repo = getRepoData();
    
    const exportData = {
      exported_at: new Date().toISOString(),
      user: user,
      repo_data: repo,
      localStorage_data: {}
    };
    
    // Export all localStorage items with terminal prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          exportData.localStorage_data[key] = value;
        } catch (e) {
          console.warn(`Failed to export ${key}`, e);
        }
      }
    }
    
    return exportData;
  }

  return {
    getCurrentUser,
    getRepoData,
    updateRepoData,
    safeStore,
    safeRetrieve,
    setWallet,
    getWallet,
    getTokenBalance,
    grantTokens,
    getCommits,
    addCommit,
    exportAllData
  };
})();

window.TerminalStorage = TerminalStorage;
