# i - Infinity Brain

**pewpi-infinity/i** - A comprehensive encryption, logging, and integration system with terminal interface for the pewpi-infinity ecosystem.

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
