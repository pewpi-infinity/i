# i - Infinity Brain

**pewpi-infinity/i** - A comprehensive encryption, logging, and integration system with terminal interface for the pewpi-infinity ecosystem.

---

## 🔌 Pewpi Shared Library

This repository now includes the canonical **pewpi-shared** library for unified authentication, wallet, and token management across the pewpi-infinity ecosystem.

**Location:** `src/pewpi-shared/`

**Key features:**
- 🪙 **Token Service** - IndexedDB-backed token persistence with localStorage fallback
- 🔐 **Auth Service** - Passwordless login with magic-link + GitHub OAuth  
- 💼 **Wallet Component** - Token balance, list, and live feed UI
- 📡 **Integration Listener** - Cross-repo event synchronization

**Quick links:**
- 📖 [Integration Guide](src/pewpi-shared/INTEGRATION.md) - Complete usage documentation
- 🔧 [Token Service](src/pewpi-shared/token-service.js) - Token management API
- 👤 [Login Component](src/pewpi-shared/auth/login-component.js) - Authentication
- 💰 [Wallet Component](src/pewpi-shared/wallet/wallet-component.js) - Wallet UI

**Getting started:**
See `src/pewpi-shared/INTEGRATION.md` for dependencies and initialization instructions.

---

## Features

### 1. Octave Logger & Pewpi Secret Encoder
- **Encrypted logging** with PBKDF2 + AES-GCM encryption
- **AI conversation mode** with context distillation
- **Part-of-Speech (POS) coloring** for enhanced readability
- **Local storage** with optional server-side commit
- **Passphrase generation** and retrieval

### 2. Integration Terminal
- **Retro CRT aesthetic** with green phosphor display and scan lines
- **Multi-repo connections** to pewpi-infinity/z and pewpi-infinity/mongoose.os
- **Real-time command execution** with async message queue
- **Command history** navigation (up/down arrows)
- **Status monitoring** for connected repositories
- **Responsive design** for desktop and mobile

---

## Getting Started

### Main Interface
Open `index.html` in your browser to access:
- Message input and encryption
- AI conversation mode
- Encrypted log storage and retrieval
- POS-colored output

### Terminal Interface
Click "⚡ Open Integration Terminal" or navigate to `terminal.html` to access:
- Repository connection management
- Cross-repo queries and commands
- Real-time status monitoring

---

## Terminal Usage

### Available Commands

#### Connection Management
```
connect <repo>      Connect to a repository (z or mongoose)
disconnect <repo>   Disconnect from a repository
status [repo]       Show system or specific repo status
```

#### Queries
```
query <repo> status       Get repository status
query <repo> info         Get repository information
query <repo> contents     List repository contents
query <repo> commits      Show recent commits
```

#### Utilities
```
help        Show available commands
clear       Clear terminal output
history     Show command history
queue       Show message queue status
exit        Return to main interface
```

### Examples

Connect to repositories:
```
> connect z
✓ Connected to z
  Description: ...
  Stars: 0
  
> connect mongoose
✓ Connected to mongoose
```

Query repository information:
```
> query z status
Status for z:
{
  "name": "z",
  "stars": 0,
  "language": "JavaScript",
  ...
}

> query mongoose commits
COMMITS result:
{
  "count": 5,
  "commits": [...]
}
```

Check system status:
```
> status
System Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
z: connected ✓
mongoose: connected ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## File Structure

```
/
├── index.html              Main interface
├── terminal.html           Terminal interface
├── css/
│   └── terminal.css        Terminal styling
├── js/
│   ├── hub.js             Integration hub module
│   └── terminal.js        Terminal logic
├── static/
│   └── js/
│       └── commit-client.js   Commit helper
├── server/
│   ├── commit-server.js   Backend server
│   └── package.json       Server dependencies
└── README.md              This file
```

---

## API Documentation

### Hub.js API

The `hub.js` module provides connection management for cross-repo communication:

#### `initialize(token)`
Initialize the hub with optional GitHub token for authentication.

#### `connectToRepo(repoName)`
Connect to a repository. Returns a promise with connection status.
- `repoName`: 'z' or 'mongoose'

#### `disconnect(repoName)`
Disconnect from a repository.

#### `sendCommand(repo, command, params)`
Send a command to a connected repository.
- `repo`: Repository name
- `command`: Command to execute (status, info, contents, commits)
- `params`: Optional parameters object

#### `getRepoStatus(repoName)`
Get connection status for a repository.

#### `getAllConnections()`
Get status of all active connections.

#### `getQueueStatus()`
Get message queue status and recent messages.

---

## Development

### Server Setup
```bash
cd server
npm install
cp .env.example .env  # Add your GitHub token
npm start
```

### Environment Variables (server/.env)
```
GITHUB_TOKEN=your_github_pat
COMMIT_SECRET=random_secret_key
PORT=4000
```

---

## Security

- All sensitive logs are encrypted with AES-GCM
- Passphrases are never stored
- GitHub tokens are server-side only
- COMMIT_SECRET protects server endpoints
- Rate limiting considerations for GitHub API

---

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- High contrast terminal interface
- Responsive design for all devices

🧱 **Pewpi Infinity - Octave OS & Terminal Interface**

A secure logging and token management system with command-line terminal interface.

---

## 🧱 Terminal Interface

### Overview
The terminal interface (`terminal.html`) provides a command-line interface for secure wallet management, token operations, and commit logging. All sensitive data is encrypted and stored with triple-redundancy.

### Access
From `index.html`, click the **🧱 Open Terminal** button in the top-right corner of the terminal section.

### Color Scheme
The terminal uses the exact color scheme from index.html:
- **Background**: `#0b3b4a` (terminal-bg)
- **Text**: `#7be6ff` (terminal-text-blue) - NOT green phosphor
- **Success**: `#2fb86a` (green)
- **Warning**: `#ff9a3c` (orange)
- **Error**: `#e14b4b` (red)
- **Info**: `#4fb8e0` (blue)
- **Highlight**: `#f2d024` (yellow)

### Available Commands

#### `help [command]`
Show all available commands or detailed help for a specific command.

```bash
pewpi@octave:~$ help
pewpi@octave:~$ help wallet
```

#### `status`
Display current system status including user, wallet, tokens, and commits.

```bash
pewpi@octave:~$ status
```

#### `wallet [address]`
Set or view wallet address. Addresses are encrypted before storage.

```bash
pewpi@octave:~$ wallet                    # View current wallet
pewpi@octave:~$ wallet 0x1234...5678      # Set wallet address
```

**Security**: Wallet addresses are encrypted using AES-GCM with PBKDF2 key derivation.

#### `token balance`
View current token balance for the logged-in user.

```bash
pewpi@octave:~$ token balance
```

#### `token grant <amount>`
Grant tokens to the current user. Creates a transaction record and commit.

```bash
pewpi@octave:~$ token grant 50
```

#### `commit <message>`
Create a manual commit with the specified message. All commits are chained with SHA-256 hashes.

```bash
pewpi@octave:~$ commit "Added new feature"
```

#### `logs [limit]`
View commit history. Default shows last 10 commits.

```bash
pewpi@octave:~$ logs
pewpi@octave:~$ logs 20
```

#### `export`
Export all user data (wallet, tokens, commits, logs) as a JSON file.

```bash
pewpi@octave:~$ export
```

#### `clear`
Clear the terminal output.

```bash
pewpi@octave:~$ clear
```

### Features

#### Triple-Redundancy Storage
All data is stored in three locations for maximum safety:
1. **localStorage** - Fast access for browser sessions
2. **repo_data** - Embedded in HTML `<script>` tag
3. **GitHub commits** - Permanent storage via commit queue

#### Encryption
Sensitive data (wallet addresses) is encrypted using:
- **Algorithm**: AES-GCM (256-bit)
- **Key Derivation**: PBKDF2 with 200,000 iterations
- **Passphrase**: User-provided or auto-generated

#### Commit Chain Integrity
Every commit includes:
- **Hash**: SHA-256 of (timestamp + user + message + previous hash)
- **Previous Hash**: Links to parent commit
- **Timestamp**: ISO 8601 format
- **User**: Pewpi username

#### Command History
- Press **↑** (Up Arrow) to navigate to previous commands
- Press **↓** (Down Arrow) to navigate to next commands
- Press **Tab** for command autocomplete

### Security Best Practices

✅ **Never store private keys** - Only wallet addresses are stored
✅ **Encrypt wallet data** - All wallet information is encrypted
✅ **Validate addresses** - Format validation before storage
✅ **Multiple backups** - Triple-redundancy storage
✅ **Transaction logging** - All token operations are logged
✅ **Commit verification** - Hash chain ensures data integrity

### Status Bar

The bottom status bar shows real-time information:
- **User**: Current pewpi username
- **Tokens**: Token balance with emoji 🧱🍄⭐
- **Commits**: Total number of commits
- **Wallet**: Shortened wallet address or "Not set"

### File Structure

```
/
├── index.html              # Main page with logger
├── terminal.html           # Terminal interface
├── css/
│   └── terminal.css        # Terminal styling (exact colors)
├── js/
│   ├── terminal-core.js    # Command processor
│   ├── terminal-storage.js # Triple-redundancy storage
│   └── terminal-commits.js # Commit chain system
└── README.md               # This file
```

### Integration with Index.html

The terminal integrates seamlessly with the existing index.html:
- Uses the same `pewpi_user` authentication
- Shares the same `repo_data` structure
- Compatible with existing encryption system
- Can access passphrase from main page

---

## 🧱 Research Notes (code)
**Timestamp:** 2025-12-23T11:05:58Z

### 🟨 Extracted Data
- Repo files: 30+
- Code present: 13+

### 🩷 Investigative
What is missing, blocked, or undefined.

### 🟩 Engineering / Tools
What advances this repo fastest.

### 🟥 Routes Worth More
Two next build paths with reasoning.

### 🟧 Decisions
Immediate next step and why.

---

## Contact

- Repository: pewpi-infinity/i
- Operator: Kris Watson
- Contact: marvaseater@gmail.com
- Phone: 808-342-9974

---

## License

Token-based licensing system. See inline documentation for details.
