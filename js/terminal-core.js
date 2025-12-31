/**
 * terminal-core.js
 * Core terminal command processor with history and autocomplete
 */

const TerminalCore = (function() {
  // Command history
  let commandHistory = [];
  let historyIndex = -1;
  
  // Available commands
  const COMMANDS = {
    help: {
      description: 'Show available commands',
      usage: 'help [command]',
      execute: executeHelp
    },
    status: {
      description: 'Show wallet, tokens, and commit status',
      usage: 'status',
      execute: executeStatus
    },
    wallet: {
      description: 'Set or view wallet address',
      usage: 'wallet [address]',
      execute: executeWallet
    },
    token: {
      description: 'Token operations (balance, grant)',
      usage: 'token <balance|grant> [amount]',
      execute: executeToken
    },
    commit: {
      description: 'Commit current state to repo file',
      usage: 'commit <message>',
      execute: executeCommit
    },
    logs: {
      description: 'View commit history',
      usage: 'logs [limit]',
      execute: executeLogs
    },
    export: {
      description: 'Export all user data',
      usage: 'export',
      execute: executeExport
    },
    clear: {
      description: 'Clear terminal output',
      usage: 'clear',
      execute: executeClear
    }
  };

  /**
   * Parse command string into command and arguments
   */
  function parseCommand(input) {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    return { command, args, raw: trimmed };
  }

  /**
   * Execute a command
   */
  async function executeCommand(input, terminal) {
    const { command, args, raw } = parseCommand(input);
    
    // Add to history
    if (raw && commandHistory[commandHistory.length - 1] !== raw) {
      commandHistory.push(raw);
      // Keep history limited to 100 commands
      if (commandHistory.length > 100) {
        commandHistory.shift();
      }
      saveHistory();
    }
    historyIndex = -1;

    // Empty command
    if (!command) {
      return;
    }

    // Execute command
    if (COMMANDS[command]) {
      try {
        await COMMANDS[command].execute(args, terminal);
      } catch (error) {
        terminal.error(`Error executing ${command}: ${error.message}`);
      }
    } else {
      terminal.error(`Unknown command: ${command}. Type 'help' for available commands.`);
    }
  }

  /**
   * Get command suggestions for autocomplete
   */
  function getSuggestions(input) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return [];
    
    const matches = Object.keys(COMMANDS).filter(cmd => 
      cmd.startsWith(trimmed)
    );
    return matches;
  }

  /**
   * Navigate command history
   */
  function navigateHistory(direction) {
    if (commandHistory.length === 0) return null;
    
    if (direction === 'up') {
      if (historyIndex === -1) {
        historyIndex = commandHistory.length - 1;
      } else if (historyIndex > 0) {
        historyIndex--;
      }
    } else if (direction === 'down') {
      if (historyIndex === -1) return '';
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
      } else {
        historyIndex = -1;
        return '';
      }
    }
    
    return historyIndex >= 0 ? commandHistory[historyIndex] : '';
  }

  /**
   * Save history to localStorage
   */
  function saveHistory() {
    try {
      localStorage.setItem('terminal_history', JSON.stringify(commandHistory));
    } catch (e) {
      console.warn('Failed to save command history', e);
    }
  }

  /**
   * Load history from localStorage
   */
  function loadHistory() {
    try {
      const stored = localStorage.getItem('terminal_history');
      if (stored) {
        commandHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load command history', e);
      commandHistory = [];
    }
  }

  // Command implementations

  async function executeHelp(args, terminal) {
    if (args.length > 0) {
      const cmd = args[0].toLowerCase();
      if (COMMANDS[cmd]) {
        terminal.info(`Command: ${cmd}`);
        terminal.log(`Description: ${COMMANDS[cmd].description}`);
        terminal.log(`Usage: ${COMMANDS[cmd].usage}`);
      } else {
        terminal.error(`Unknown command: ${cmd}`);
      }
    } else {
      terminal.info('Available commands:');
      terminal.log('');
      Object.keys(COMMANDS).forEach(cmd => {
        terminal.log(`  ${cmd.padEnd(12)} - ${COMMANDS[cmd].description}`);
      });
      terminal.log('');
      terminal.info('Type "help <command>" for detailed usage');
    }
  }

  async function executeStatus(args, terminal) {
    const storage = window.TerminalStorage;
    if (!storage) {
      terminal.error('Storage system not initialized');
      return;
    }

    terminal.info('=== System Status ===');
    terminal.log('');
    
    // User info
    const user = storage.getCurrentUser();
    terminal.log(`User: ${user || 'not set'}`);
    
    // Wallet info
    const wallet = await storage.getWallet(user);
    if (wallet) {
      terminal.success(`Wallet: ${wallet.address}`);
      terminal.log(`  Created: ${new Date(wallet.created_at).toLocaleString()}`);
      terminal.log(`  Balance: ${wallet.balance || 0}`);
    } else {
      terminal.warning('Wallet: not set');
    }
    
    // Token info
    const tokens = await storage.getTokenBalance(user);
    terminal.log(`Tokens: ${tokens} 🧱🍄⭐`);
    
    // Commit info
    const commits = await storage.getCommits();
    terminal.log(`Total commits: ${commits.length}`);
    
    if (commits.length > 0) {
      const latest = commits[commits.length - 1];
      terminal.log(`  Latest: ${latest.hash.slice(0, 7)} - ${latest.message || '(no message)'}`);
      terminal.log(`  Time: ${new Date(latest.timestamp).toLocaleString()}`);
    }
    
    terminal.log('');
    terminal.success('Status check complete');
  }

  async function executeWallet(args, terminal) {
    const storage = window.TerminalStorage;
    if (!storage) {
      terminal.error('Storage system not initialized');
      return;
    }

    const user = storage.getCurrentUser();
    if (!user) {
      terminal.error('No user set. Please set pewpi_user first.');
      return;
    }

    if (args.length === 0) {
      // View wallet
      const wallet = await storage.getWallet(user);
      if (wallet) {
        terminal.success(`Wallet address: ${wallet.address}`);
        terminal.log(`Created: ${new Date(wallet.created_at).toLocaleString()}`);
        terminal.log(`Balance: ${wallet.balance || 0}`);
      } else {
        terminal.warning('No wallet set for this user');
      }
    } else {
      // Set wallet
      const address = args[0];
      
      // Basic validation
      if (!address.startsWith('0x') || address.length < 42) {
        terminal.error('Invalid wallet address format. Expected format: 0x...');
        return;
      }
      
      // Confirm with user
      terminal.warning(`Setting wallet address: ${address}`);
      terminal.warning('This will be encrypted and stored. Continue? (yes/no)');
      
      // For now, auto-confirm (in real implementation, would wait for confirmation)
      terminal.log('');
      
      try {
        await storage.setWallet(user, address);
        terminal.success(`Wallet set: ${address.slice(0, 10)}...${address.slice(-8)}`);
        terminal.success('Address encrypted and stored safely');
        
        // Create commit
        await window.TerminalCommits.createCommit(
          `wallet_set`, 
          `Set wallet address for ${user}`,
          user
        );
        
      } catch (error) {
        terminal.error(`Failed to set wallet: ${error.message}`);
      }
    }
  }

  async function executeToken(args, terminal) {
    const storage = window.TerminalStorage;
    if (!storage) {
      terminal.error('Storage system not initialized');
      return;
    }

    const user = storage.getCurrentUser();
    if (!user) {
      terminal.error('No user set. Please set pewpi_user first.');
      return;
    }

    if (args.length === 0) {
      terminal.error('Usage: token <balance|grant> [amount]');
      return;
    }

    const action = args[0].toLowerCase();

    if (action === 'balance') {
      const balance = await storage.getTokenBalance(user);
      terminal.success(`Token balance: ${balance} 🧱🍄⭐`);
    } else if (action === 'grant') {
      if (args.length < 2) {
        terminal.error('Usage: token grant <amount>');
        return;
      }
      
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) {
        terminal.error('Invalid amount. Must be a positive number.');
        return;
      }
      
      try {
        const newBalance = await storage.grantTokens(user, amount);
        terminal.success(`Granted ${amount} tokens`);
        terminal.success(`New balance: ${newBalance} 🧱🍄⭐`);
        
        // Create commit
        await window.TerminalCommits.createCommit(
          `token_grant`,
          `Granted ${amount} tokens to ${user}`,
          user
        );
      } catch (error) {
        terminal.error(`Failed to grant tokens: ${error.message}`);
      }
    } else {
      terminal.error(`Unknown token action: ${action}`);
      terminal.log('Available actions: balance, grant');
    }
  }

  async function executeCommit(args, terminal) {
    if (args.length === 0) {
      terminal.error('Usage: commit <message>');
      return;
    }

    const message = args.join(' ');
    const user = window.TerminalStorage?.getCurrentUser() || 'anonymous';

    try {
      const commitHash = await window.TerminalCommits.createCommit(
        'manual_commit',
        message,
        user
      );
      
      terminal.success(`Commit created: ${commitHash.slice(0, 7)}`);
      terminal.log(`Message: ${message}`);
      terminal.log(`User: ${user}`);
      terminal.log(`Time: ${new Date().toLocaleString()}`);
    } catch (error) {
      terminal.error(`Failed to create commit: ${error.message}`);
    }
  }

  async function executeLogs(args, terminal) {
    const storage = window.TerminalStorage;
    if (!storage) {
      terminal.error('Storage system not initialized');
      return;
    }

    const limit = args.length > 0 ? parseInt(args[0]) : 10;
    if (isNaN(limit) || limit <= 0) {
      terminal.error('Invalid limit. Must be a positive number.');
      return;
    }

    const commits = await storage.getCommits();
    const toShow = commits.slice(-limit).reverse();

    if (toShow.length === 0) {
      terminal.warning('No commits found');
      return;
    }

    terminal.info(`=== Last ${toShow.length} Commits ===`);
    terminal.log('');
    
    toShow.forEach(commit => {
      const date = new Date(commit.timestamp).toLocaleString();
      terminal.highlight(`[${commit.hash.slice(0, 7)}] ${commit.user}`);
      terminal.log(`  ${commit.message || '(no message)'}`);
      terminal.log(`  ${date}`);
      terminal.log('');
    });
  }

  async function executeExport(args, terminal) {
    const storage = window.TerminalStorage;
    if (!storage) {
      terminal.error('Storage system not initialized');
      return;
    }

    terminal.info('Exporting all user data...');

    try {
      const data = await storage.exportAllData();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `pewpi-export-${dateStr}.json`;
      
      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      const entriesCount = Array.isArray(data.entries) ? data.entries.length : Object.keys(data.entries || {}).length;
      terminal.success(`Exported ${entriesCount} records`);
      terminal.success(`Downloaded as: ${filename}`);
    } catch (error) {
      terminal.error(`Export failed: ${error.message}`);
    }
  }

  async function executeClear(args, terminal) {
    terminal.clear();
    terminal.info('Terminal cleared');
    terminal.log('Type "help" for available commands');
  }

  // Initialize
  loadHistory();

  return {
    executeCommand,
    getSuggestions,
    navigateHistory,
    getCommands: () => Object.keys(COMMANDS)
  };
})();

window.TerminalCore = TerminalCore;
