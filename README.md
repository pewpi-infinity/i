# i

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
- Repo files: 30
- Code present: 13

### 🩷 Investigative
What is missing, blocked, or undefined.

### 🟩 Engineering / Tools
What advances this repo fastest.

### 🟥 Routes Worth More
Two next build paths with reasoning.

### 🟧 Decisions
Immediate next step and why.

---

## 🧱 Research Notes (mixed)
**Timestamp:** 2025-12-23T19:25:47Z

### 🟨 Extracted Data
- Repo files: 32
- Code present: 13

### 🩷 Investigative
What is missing, blocked, or undefined.

### 🟩 Engineering / Tools
What advances this repo fastest.

### 🟥 Routes Worth More
Two next build paths with reasoning.

### 🟧 Decisions
Immediate next step and why.
