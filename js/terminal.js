/**
 * terminal.js - Terminal Interface Logic
 * 
 * Handles terminal UI interactions, command processing, and output display
 * with typing animation effects and command history
 * 
 * @module Terminal
 */

import * as Hub from './hub.js';

// Terminal state (use const for array to avoid redeclaration issues)
const terminalState = {
  history: [],
  historyIndex: -1,
  currentInput: '',
  isProcessing: false
};

// DOM elements (will be initialized on load)
let terminalOutput = null;
let terminalInput = null;
let statusIndicators = {};

/**
 * Initialize the terminal
 */
export function initialize() {
  // Initialize Hub
  Hub.initialize();

  // Get DOM elements
  terminalOutput = document.getElementById('terminal-output');
  terminalInput = document.getElementById('terminal-input');
  
  // Get status indicators
  statusIndicators = {
    z: document.getElementById('status-z'),
    mongoose: document.getElementById('status-mongoose')
  };

  // Setup event listeners
  setupEventListeners();

  // Display welcome message
  displayWelcome();

  console.log('[Terminal] Initialized');
}

/**
 * Setup event listeners for terminal interaction
 */
function setupEventListeners() {
  if (!terminalInput) return;

  // Handle input submission
  terminalInput.addEventListener('keydown', handleKeyDown);

  // Prevent default behavior on arrow keys when not in input
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (document.activeElement !== terminalInput) {
        e.preventDefault();
      }
    }
  });
}

/**
 * Handle keyboard input
 */
function handleKeyDown(event) {
  if (terminalState.isProcessing) {
    event.preventDefault();
    return;
  }

  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      handleCommand();
      break;

    case 'ArrowUp':
      event.preventDefault();
      navigateHistory('up');
      break;

    case 'ArrowDown':
      event.preventDefault();
      navigateHistory('down');
      break;

    case 'Tab':
      event.preventDefault();
      handleAutocomplete();
      break;
  }
}

/**
 * Navigate command history
 */
function navigateHistory(direction) {
  if (terminalState.history.length === 0) return;

  if (terminalState.historyIndex === -1) {
    terminalState.currentInput = terminalInput.value;
  }

  if (direction === 'up') {
    if (terminalState.historyIndex < terminalState.history.length - 1) {
      terminalState.historyIndex++;
      terminalInput.value = terminalState.history[terminalState.history.length - 1 - terminalState.historyIndex];
    }
  } else if (direction === 'down') {
    if (terminalState.historyIndex > 0) {
      terminalState.historyIndex--;
      terminalInput.value = terminalState.history[terminalState.history.length - 1 - terminalState.historyIndex];
    } else if (terminalState.historyIndex === 0) {
      terminalState.historyIndex = -1;
      terminalInput.value = terminalState.currentInput;
    }
  }

  // Move cursor to end
  terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
}

/**
 * Handle command autocomplete
 */
function handleAutocomplete() {
  const input = terminalInput.value.trim().toLowerCase();
  const commands = ['help', 'status', 'connect', 'query', 'clear', 'exit'];
  
  const matches = commands.filter(cmd => cmd.startsWith(input));
  
  if (matches.length === 1) {
    terminalInput.value = matches[0] + ' ';
  } else if (matches.length > 1) {
    appendOutput(`\nAvailable: ${matches.join(', ')}`, 'system');
  }
}

/**
 * Handle command execution
 */
async function handleCommand() {
  const input = terminalInput.value.trim();
  
  if (!input) return;

  // Add to history
  terminalState.history.push(input);
  terminalState.historyIndex = -1;
  terminalState.currentInput = '';

  // Display command
  appendOutput(`> ${input}`, 'command');

  // Clear input
  terminalInput.value = '';
  terminalState.isProcessing = true;

  // Parse and execute command
  const parts = input.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  try {
    await executeCommand(command, args);
  } catch (error) {
    appendOutput(`Error: ${error.message}`, 'error');
  }

  terminalState.isProcessing = false;
  terminalInput.focus();
}

/**
 * Execute a parsed command
 */
async function executeCommand(command, args) {
  switch (command) {
    case 'help':
      commandHelp();
      break;

    case 'status':
      await commandStatus(args);
      break;

    case 'connect':
      await commandConnect(args);
      break;

    case 'disconnect':
      await commandDisconnect(args);
      break;

    case 'query':
      await commandQuery(args);
      break;

    case 'clear':
      commandClear();
      break;

    case 'exit':
      commandExit();
      break;

    case 'history':
      showCommandHistory();
      break;

    case 'queue':
      commandQueue();
      break;

    default:
      appendOutput(`Unknown command: ${command}. Type 'help' for available commands.`, 'error');
  }
}

/**
 * Display help information
 */
function commandHelp() {
  const helpText = `
Available Commands:
------------------
help              Show this help message
status [repo]     Show system status or specific repo status
connect <repo>    Connect to a repository (z or mongoose)
disconnect <repo> Disconnect from a repository
query <repo> <cmd> [params]
                  Send a query to a connected repo
                  Commands: status, info, contents, commits
clear             Clear terminal output
exit              Return to main interface
history           Show command history
queue             Show message queue status

Examples:
---------
connect z
status z
query z status
query mongoose commits
disconnect z

Repositories:
------------
z         - pewpi-infinity/z
mongoose  - pewpi-infinity/mongoose.os
`;
  
  appendOutput(helpText, 'response', true);
}

/**
 * Show system or repo status
 */
async function commandStatus(args) {
  if (args.length === 0) {
    // Show overall system status
    const connections = Hub.getAllConnections();
    
    appendOutput('\nSystem Status:', 'system');
    appendOutput('━'.repeat(50), 'system');
    
    if (connections.length === 0) {
      appendOutput('No active connections', 'response');
    } else {
      for (const conn of connections) {
        const status = `${conn.repo}: ${conn.state} ${conn.connected ? '✓' : '✗'}`;
        appendOutput(status, conn.connected ? 'response' : 'error');
      }
    }
    
    appendOutput('━'.repeat(50), 'system');
  } else {
    // Show specific repo status
    const repoName = args[0];
    const status = Hub.getRepoStatus(repoName);
    
    appendOutput(`\nStatus for ${repoName}:`, 'system');
    appendOutput(JSON.stringify(status, null, 2), 'response');
  }
}

/**
 * Connect to a repository
 */
async function commandConnect(args) {
  if (args.length === 0) {
    appendOutput('Usage: connect <repo>\nAvailable repos: z, mongoose', 'error');
    return;
  }

  const repoName = args[0];
  appendOutput(`Connecting to ${repoName}...`, 'system');

  try {
    const result = await Hub.connectToRepo(repoName);
    
    if (result.success) {
      await typeOutput(`✓ Connected to ${repoName}`, 'response', 30);
      if (result.data) {
        appendOutput(`  Description: ${result.data.description || 'N/A'}`, 'response');
        appendOutput(`  Stars: ${result.data.stars || 0}`, 'response');
        appendOutput(`  Last updated: ${result.data.updated || 'Unknown'}`, 'response');
      }
      updateStatusIndicator(repoName, true);
    } else {
      appendOutput(`✗ Connection failed: ${result.error}`, 'error');
      updateStatusIndicator(repoName, false);
    }
  } catch (error) {
    appendOutput(`✗ Connection error: ${error.message}`, 'error');
    updateStatusIndicator(repoName, false);
  }
}

/**
 * Disconnect from a repository
 */
async function commandDisconnect(args) {
  if (args.length === 0) {
    appendOutput('Usage: disconnect <repo>', 'error');
    return;
  }

  const repoName = args[0];
  const result = Hub.disconnect(repoName);

  if (result.success) {
    appendOutput(`✓ Disconnected from ${repoName}`, 'response');
    updateStatusIndicator(repoName, false);
  } else {
    appendOutput(`✗ ${result.error}`, 'error');
  }
}

/**
 * Send query to a repository
 */
async function commandQuery(args) {
  if (args.length < 2) {
    appendOutput('Usage: query <repo> <command> [params]', 'error');
    return;
  }

  const repoName = args[0];
  const command = args[1];
  const params = {};

  // Parse additional parameters
  if (args.length > 2) {
    params.path = args.slice(2).join(' ');
  }

  appendOutput(`Querying ${repoName}...`, 'system');

  try {
    const result = await Hub.sendCommand(repoName, command, params);
    
    if (result.success) {
      appendOutput(`\n${command.toUpperCase()} result:`, 'system');
      appendOutput(JSON.stringify(result.result, null, 2), 'response');
    } else {
      appendOutput(`Query failed: ${result.error}`, 'error');
    }
  } catch (error) {
    appendOutput(`Query error: ${error.message}`, 'error');
  }
}

/**
 * Clear terminal output
 */
function commandClear() {
  if (terminalOutput) {
    terminalOutput.innerHTML = '';
  }
}

/**
 * Exit terminal and return to main interface
 */
function commandExit() {
  if (confirm('Return to main interface?')) {
    window.location.href = 'index.html';
  }
}

/**
 * Show command history
 */
function showCommandHistory() {
  if (terminalState.history.length === 0) {
    appendOutput('No command history', 'response');
    return;
  }

  appendOutput('\nCommand History:', 'system');
  terminalState.history.forEach((cmd, index) => {
    appendOutput(`${index + 1}. ${cmd}`, 'response');
  });
}

/**
 * Show message queue status
 */
function commandQueue() {
  const queueStatus = Hub.getQueueStatus();
  
  appendOutput('\nMessage Queue Status:', 'system');
  appendOutput(`Total: ${queueStatus.total}`, 'response');
  appendOutput(`Queued: ${queueStatus.queued}`, 'response');
  appendOutput(`Completed: ${queueStatus.completed}`, 'response');
  appendOutput(`Failed: ${queueStatus.failed}`, 'response');
  
  if (queueStatus.messages.length > 0) {
    appendOutput('\nRecent Messages:', 'system');
    queueStatus.messages.forEach(msg => {
      appendOutput(`[${msg.status}] ${msg.command} → ${msg.repo}`, 'response');
    });
  }
}

/**
 * Display welcome message
 */
function displayWelcome() {
  const welcome = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ∞  INFINITY TERMINAL v1.0  ∞                         ║
║     Integration Hub for pewpi-infinity ecosystem          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Type 'help' for available commands.
Type 'connect z' or 'connect mongoose' to establish connections.
`;

  appendOutput(welcome, 'system', true);
}

/**
 * Append output to terminal
 */
function appendOutput(text, type = 'response', immediate = false) {
  if (!terminalOutput) return;

  const line = document.createElement('div');
  line.className = `output-line ${type}`;
  line.textContent = text;
  
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

/**
 * Type output with animation effect
 */
async function typeOutput(text, type = 'response', delay = 20) {
  if (!terminalOutput) return;

  const line = document.createElement('div');
  line.className = `output-line ${type}`;
  terminalOutput.appendChild(line);

  for (let i = 0; i < text.length; i++) {
    line.textContent += text[i];
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    await sleep(delay);
  }
}

/**
 * Update status indicator for a repo
 */
function updateStatusIndicator(repoName, connected) {
  const normalizedName = repoName.toLowerCase().replace('.os', '');
  const indicator = statusIndicators[normalizedName];
  
  if (indicator) {
    const dot = indicator.querySelector('.status-dot');
    if (dot) {
      if (connected) {
        dot.classList.remove('disconnected');
      } else {
        dot.classList.add('disconnected');
      }
    }
  }
}

/**
 * Sleep utility for animations
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for debugging
if (typeof window !== 'undefined') {
  window.Terminal = {
    initialize,
    executeCommand,
    getHistory: () => terminalState.history,
    clearHistory: () => { terminalState.history = []; }
  };
}
