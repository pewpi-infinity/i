/**
 * terminal-commits.js
 * Commit logging with hash chain verification
 */

const TerminalCommits = (function() {
  let commitQueue = [];
  let processingQueue = false;

  /**
   * Create SHA-256 hash
   */
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get the latest commit hash
   */
  async function getLatestCommitHash() {
    const commits = await window.TerminalStorage.getCommits();
    if (commits.length === 0) return '0000000000000000000000000000000000000000';
    return commits[commits.length - 1].hash;
  }

  /**
   * Create a commit with hash chain
   */
  async function createCommit(type, message, user) {
    if (!user) {
      user = window.TerminalStorage?.getCurrentUser() || 'anonymous';
    }

    const timestamp = new Date().toISOString();
    const prevHash = await getLatestCommitHash();
    
    // Create hash: sha256(timestamp + user + message + prevHash)
    const hashInput = timestamp + user + message + prevHash;
    const hash = await sha256(hashInput);
    
    const commit = {
      hash: hash,
      type: type,
      message: message,
      user: user,
      timestamp: timestamp,
      prev: prevHash
    };
    
    // Store commit
    await window.TerminalStorage.addCommit(commit);
    
    // Also append to repo_data.entries for integration
    await appendToRepoEntries(commit);
    
    return hash;
  }

  /**
   * Append commit to repo_data.entries array
   */
  async function appendToRepoEntries(commit) {
    try {
      const repo = window.TerminalStorage.getRepoData();
      if (!repo) return;
      
      if (!repo.entries) {
        repo.entries = [];
      }
      
      const entry = {
        id: `terminal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'terminal_cmd',
        command: commit.type,
        result: commit.message,
        timestamp: commit.timestamp,
        user: commit.user,
        hash: commit.hash
      };
      
      repo.entries.push(entry);
      window.TerminalStorage.updateRepoData(repo);
      
      // If window.appendEntryObj exists (from index.html), use it too
      if (window.appendEntryObj && typeof window.appendEntryObj === 'function') {
        try {
          window.appendEntryObj(entry);
        } catch (e) {
          console.warn('appendEntryObj failed', e);
        }
      }
    } catch (e) {
      console.error('Failed to append to repo entries', e);
    }
  }

  /**
   * Verify commit chain integrity
   */
  async function verifyCommitChain() {
    const commits = await window.TerminalStorage.getCommits();
    if (commits.length === 0) return { valid: true, message: 'No commits to verify' };
    
    let prevHash = '0000000000000000000000000000000000000000';
    
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      
      // Check prev hash matches
      if (commit.prev !== prevHash) {
        return {
          valid: false,
          message: `Commit chain broken at index ${i}`,
          commit: commit
        };
      }
      
      // Verify hash
      const hashInput = commit.timestamp + commit.user + commit.message + commit.prev;
      const expectedHash = await sha256(hashInput);
      
      if (commit.hash !== expectedHash) {
        return {
          valid: false,
          message: `Invalid hash at index ${i}`,
          commit: commit
        };
      }
      
      prevHash = commit.hash;
    }
    
    return { valid: true, message: 'Commit chain valid' };
  }

  /**
   * Queue a commit for later processing
   */
  async function queueCommit(data) {
    commitQueue.push({
      ...data,
      queued_at: new Date().toISOString()
    });
    
    // Save queue to localStorage
    try {
      localStorage.setItem('terminal_commit_queue', JSON.stringify(commitQueue));
    } catch (e) {
      console.warn('Failed to save commit queue', e);
    }
    
    // Process queue if not already processing
    if (!processingQueue) {
      processQueue();
    }
  }

  /**
   * Process queued commits
   */
  async function processQueue() {
    if (processingQueue || commitQueue.length === 0) return;
    
    processingQueue = true;
    
    try {
      while (commitQueue.length > 0) {
        const item = commitQueue.shift();
        
        // Create a commit for this queued item
        try {
          await createCommit(
            item.action || 'queued_action',
            item.message || JSON.stringify(item),
            item.user || window.TerminalStorage?.getCurrentUser() || 'system'
          );
        } catch (e) {
          console.error('Failed to process queued commit', e);
          // Don't re-queue failed items, just log
        }
      }
      
      // Clear localStorage queue
      localStorage.removeItem('terminal_commit_queue');
    } finally {
      processingQueue = false;
    }
  }

  /**
   * Load queue from localStorage on init
   */
  function loadQueue() {
    try {
      const stored = localStorage.getItem('terminal_commit_queue');
      if (stored) {
        commitQueue = JSON.parse(stored);
        // Process any pending commits
        processQueue();
      }
    } catch (e) {
      console.warn('Failed to load commit queue', e);
      commitQueue = [];
    }
  }

  /**
   * Get commit statistics
   */
  async function getCommitStats() {
    const commits = await window.TerminalStorage.getCommits();
    
    const stats = {
      total: commits.length,
      byType: {},
      byUser: {},
      firstCommit: commits[0]?.timestamp || null,
      lastCommit: commits[commits.length - 1]?.timestamp || null
    };
    
    commits.forEach(commit => {
      // Count by type
      stats.byType[commit.type] = (stats.byType[commit.type] || 0) + 1;
      
      // Count by user
      stats.byUser[commit.user] = (stats.byUser[commit.user] || 0) + 1;
    });
    
    return stats;
  }

  // Initialize
  loadQueue();

  return {
    createCommit,
    queueCommit,
    verifyCommitChain,
    getCommitStats,
    processQueue
  };
})();

window.TerminalCommits = TerminalCommits;
