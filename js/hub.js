/**
 * hub.js - Integration Hub for Multi-Repo Communication
 * 
 * Manages connections to pewpi-infinity/z and pewpi-infinity/mongoose.os repositories
 * Provides API interface for cross-repo communication with authentication and message queuing
 * 
 * @module Hub
 */

// Connection states
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

// Repository configuration
const REPOS = {
  z: {
    owner: 'pewpi-infinity',
    name: 'z',
    url: 'https://api.github.com/repos/pewpi-infinity/z'
  },
  mongoose: {
    owner: 'pewpi-infinity',
    name: 'mongoose.os',
    url: 'https://api.github.com/repos/pewpi-infinity/mongoose.os'
  }
};

// Active connections store
const connections = new Map();

// Message queue for async operations
const messageQueue = [];

// Session management
let sessionToken = null;

/**
 * Initialize the hub with optional authentication token
 * @param {string} token - GitHub Personal Access Token (optional)
 */
export function initialize(token = null) {
  sessionToken = token;
  console.log('[Hub] Initialized', token ? 'with authentication' : 'without authentication');
}

/**
 * Connect to a repository
 * @param {string} repoName - Name of the repository ('z' or 'mongoose')
 * @returns {Promise<Object>} Connection result with status
 */
export async function connectToRepo(repoName) {
  const normalizedName = repoName.toLowerCase().replace('.os', '');
  
  if (!REPOS[normalizedName]) {
    throw new Error(`Unknown repository: ${repoName}. Available: z, mongoose`);
  }

  const repo = REPOS[normalizedName];
  
  // Set connection state to connecting
  connections.set(normalizedName, {
    state: ConnectionState.CONNECTING,
    repo: repo,
    connectedAt: null,
    lastActivity: null,
    error: null
  });

  try {
    // Check repository accessibility
    const response = await fetch(repo.url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(sessionToken ? { 'Authorization': `token ${sessionToken}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to connect: HTTP ${response.status}`);
    }

    const repoData = await response.json();
    
    // Update connection state
    const now = new Date().toISOString();
    connections.set(normalizedName, {
      state: ConnectionState.CONNECTED,
      repo: repo,
      repoData: repoData,
      connectedAt: now,
      lastActivity: now,
      error: null
    });

    console.log(`[Hub] Connected to ${repo.owner}/${repo.name}`);
    
    return {
      success: true,
      repo: repoName,
      state: ConnectionState.CONNECTED,
      timestamp: now,
      data: {
        name: repoData.name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        updated: repoData.updated_at
      }
    };
  } catch (error) {
    // Update connection state with error
    connections.set(normalizedName, {
      state: ConnectionState.ERROR,
      repo: repo,
      connectedAt: null,
      lastActivity: new Date().toISOString(),
      error: error.message
    });

    console.error(`[Hub] Connection failed for ${repoName}:`, error.message);
    
    return {
      success: false,
      repo: repoName,
      state: ConnectionState.ERROR,
      error: error.message
    };
  }
}

/**
 * Disconnect from a repository
 * @param {string} repoName - Name of the repository to disconnect
 * @returns {Object} Disconnection result
 */
export function disconnect(repoName) {
  const normalizedName = repoName.toLowerCase().replace('.os', '');
  
  if (!connections.has(normalizedName)) {
    return {
      success: false,
      repo: repoName,
      error: 'Not connected to this repository'
    };
  }

  connections.delete(normalizedName);
  console.log(`[Hub] Disconnected from ${repoName}`);
  
  return {
    success: true,
    repo: repoName,
    state: ConnectionState.DISCONNECTED,
    timestamp: new Date().toISOString()
  };
}

/**
 * Send a command to a connected repository
 * @param {string} repoName - Target repository name
 * @param {string} command - Command to execute
 * @param {Object} params - Command parameters
 * @returns {Promise<Object>} Command execution result
 */
export async function sendCommand(repoName, command, params = {}) {
  const normalizedName = repoName.toLowerCase().replace('.os', '');
  const connection = connections.get(normalizedName);

  if (!connection || connection.state !== ConnectionState.CONNECTED) {
    throw new Error(`Not connected to ${repoName}. Connect first using 'connect ${repoName}'`);
  }

  // Update last activity
  connection.lastActivity = new Date().toISOString();

  // Queue the message
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const message = {
    id: messageId,
    repo: repoName,
    command: command,
    params: params,
    timestamp: new Date().toISOString(),
    status: 'queued'
  };
  
  messageQueue.push(message);

  try {
    // Simulate command processing based on command type
    let result;
    
    switch (command.toLowerCase()) {
      case 'status':
        result = await queryRepoStatus(connection);
        break;
      
      case 'info':
        result = await queryRepoInfo(connection);
        break;
      
      case 'contents':
        result = await queryRepoContents(connection, params.path || '');
        break;
      
      case 'commits':
        result = await queryRepoCommits(connection, params.limit || 5);
        break;
      
      default:
        result = {
          message: `Command '${command}' queued for processing`,
          note: 'Custom command execution would be implemented based on repository API'
        };
    }

    // Update message status
    message.status = 'completed';
    message.result = result;

    return {
      success: true,
      messageId: messageId,
      repo: repoName,
      command: command,
      result: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    message.status = 'failed';
    message.error = error.message;

    throw new Error(`Command execution failed: ${error.message}`);
  }
}

/**
 * Get status of a repository connection
 * @param {string} repoName - Repository name
 * @returns {Object} Connection status
 */
export function getRepoStatus(repoName) {
  const normalizedName = repoName.toLowerCase().replace('.os', '');
  const connection = connections.get(normalizedName);

  if (!connection) {
    return {
      repo: repoName,
      state: ConnectionState.DISCONNECTED,
      connected: false
    };
  }

  return {
    repo: repoName,
    state: connection.state,
    connected: connection.state === ConnectionState.CONNECTED,
    connectedAt: connection.connectedAt,
    lastActivity: connection.lastActivity,
    error: connection.error,
    repoInfo: connection.repoData ? {
      name: connection.repoData.name,
      description: connection.repoData.description,
      stars: connection.repoData.stargazers_count
    } : null
  };
}

/**
 * Get all active connections
 * @returns {Array<Object>} List of all connections with their statuses
 */
export function getAllConnections() {
  const result = [];
  
  for (const [name, connection] of connections.entries()) {
    result.push({
      repo: name,
      state: connection.state,
      connected: connection.state === ConnectionState.CONNECTED,
      connectedAt: connection.connectedAt,
      lastActivity: connection.lastActivity,
      error: connection.error
    });
  }

  return result;
}

/**
 * Get message queue status
 * @returns {Object} Queue information
 */
export function getQueueStatus() {
  return {
    total: messageQueue.length,
    queued: messageQueue.filter(m => m.status === 'queued').length,
    completed: messageQueue.filter(m => m.status === 'completed').length,
    failed: messageQueue.filter(m => m.status === 'failed').length,
    messages: messageQueue.slice(-10) // Last 10 messages
  };
}

/**
 * Clear message queue
 */
export function clearQueue() {
  messageQueue.length = 0;
  console.log('[Hub] Message queue cleared');
}

// Internal helper functions

async function queryRepoStatus(connection) {
  const response = await fetch(connection.repo.url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(sessionToken ? { 'Authorization': `token ${sessionToken}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to query status: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  return {
    name: data.name,
    description: data.description,
    language: data.language,
    size: data.size,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.watchers_count,
    openIssues: data.open_issues_count,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at
  };
}

async function queryRepoInfo(connection) {
  return {
    owner: connection.repo.owner,
    name: connection.repo.name,
    fullName: `${connection.repo.owner}/${connection.repo.name}`,
    url: connection.repo.url,
    connected: true,
    connectionTime: connection.connectedAt
  };
}

async function queryRepoContents(connection, path) {
  const url = `${connection.repo.url}/contents/${path}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(sessionToken ? { 'Authorization': `token ${sessionToken}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to query contents: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  if (Array.isArray(data)) {
    return {
      path: path || '/',
      type: 'directory',
      items: data.map(item => ({
        name: item.name,
        type: item.type,
        size: item.size,
        path: item.path
      }))
    };
  } else {
    return {
      path: path,
      type: data.type,
      name: data.name,
      size: data.size,
      sha: data.sha
    };
  }
}

async function queryRepoCommits(connection, limit) {
  const url = `${connection.repo.url}/commits?per_page=${limit}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(sessionToken ? { 'Authorization': `token ${sessionToken}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to query commits: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  return {
    count: data.length,
    commits: data.map(commit => ({
      sha: commit.sha.substr(0, 7),
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author.name,
      date: commit.commit.author.date
    }))
  };
}

// Export for debugging (browser console access)
if (typeof window !== 'undefined') {
  window.Hub = {
    initialize,
    connectToRepo,
    disconnect,
    sendCommand,
    getRepoStatus,
    getAllConnections,
    getQueueStatus,
    clearQueue,
    ConnectionState
  };
}
