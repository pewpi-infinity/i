# Testing Guide for Secure Logging Flow

This guide helps you test the new secure server-side GitHub commit endpoint.

## Prerequisites

- Node.js 14+ installed
- GitHub Personal Access Token with `repo` scope
  - Generate at: https://github.com/settings/tokens
  - Required permissions: `repo` (full control of private repositories)

## Setup Steps

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cp .env.example .env
```

Edit `.env` and set your actual values:

```bash
# Your GitHub Personal Access Token
GITHUB_TOKEN=ghp_your_actual_token_here

# A random secret string (generate with: openssl rand -hex 32)
COMMIT_SECRET=your_random_secret_here

# Optional: Change port (default: 3000)
PORT=3000

# Repository details (default values shown)
GITHUB_OWNER=pewpi-infinity
GITHUB_REPO=i
GITHUB_LOG_PATH=logs/txt.log
```

### 3. Start the Server

```bash
npm start
```

You should see:
```
═══════════════════════════════════════════════════════
  pewpi-infinity commit server running on port 3000
  Repository: pewpi-infinity/i
  Log path: logs/txt.log
═══════════════════════════════════════════════════════
```

### 4. Configure Frontend

1. Open `index.html` in a browser (served via any web server, or open the file directly)
2. Select "GitHub (secure server commit) - RECOMMENDED" from the dropdown
3. Enter your `COMMIT_SECRET` (same value from server `.env`) in the token field
4. Click "Save Token"

## Testing the Flow

### Test 1: Basic Commit

1. Type a test message in the input field: `This is a test message`
2. Press Enter
3. You should see:
   ```
   ∞ > This is a test message
   Roger.
   ✔ logged to GitHub via secure server
     Commit: abc1234
   ```

### Test 2: Verify in GitHub

1. Go to https://github.com/pewpi-infinity/i/commits
2. You should see a new commit with message "Frontend log update"
3. Click on the commit to view changes
4. Verify that `logs/txt.log` contains your message with a timestamp:
   ```
   [2025-11-17T00:00:00.000Z] This is a test message
   ```

### Test 3: Multiple Sequential Commits

1. Type and send several messages in quick succession
2. Each should commit successfully without conflicts
3. Check `logs/txt.log` - all messages should be present in order

### Test 4: Server Health Check

Open your browser console and run:
```javascript
CommitClient.checkHealth().then(ok => console.log('Server healthy:', ok));
```

Should return `true` if server is running.

### Test 5: Error Handling - Wrong Secret

1. Click "Save Token" with an incorrect secret
2. Try to send a message
3. You should see: `✘ Server commit error: Invalid commit secret`

### Test 6: Error Handling - Server Offline

1. Stop the server (Ctrl+C)
2. Try to send a message
3. You should see: `✘ Server commit error: Request timed out...`

## Troubleshooting

### Issue: "GITHUB_TOKEN environment variable is required"

**Solution**: Create `.env` file in `server/` directory with your token.

### Issue: "Authentication failed: invalid secret"

**Solution**: 
- Verify `COMMIT_SECRET` in server `.env` matches the secret entered in browser
- Secret is case-sensitive
- Click "Save Token" after entering the secret

### Issue: "Server may be offline"

**Solution**:
- Check server is running: `ps aux | grep commit-server`
- Restart server: `cd server && npm start`
- Check port not in use: `lsof -i :3000`

### Issue: Commits show red X in GitHub

**Solution**: This was the original problem! The new server-side approach should fix this. If still occurring:
- Check server logs for errors
- Verify GITHUB_TOKEN has correct permissions
- Ensure repository exists and token has access

### Issue: Text not appearing in logs/txt.log

**Solution**: This was the original problem! The new implementation:
- Properly fetches existing file content
- Correctly handles SHA to avoid overwrites
- Appends text with timestamp
- If still occurring, check server logs for errors

## API Testing with curl

You can also test the server directly with curl:

```bash
# Health check
curl http://localhost:3000/health

# Commit text (replace YOUR_SECRET)
curl -X POST http://localhost:3000/commit \
  -H "Content-Type: application/json" \
  -H "X-Commit-Secret: YOUR_SECRET" \
  -d '{"text": "Test from curl"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Text logged and committed to GitHub",
  "commit": {
    "sha": "abc123...",
    "url": "https://github.com/pewpi-infinity/i/commit/abc123..."
  }
}
```

## Security Checklist

- [ ] `.env` file is NOT committed to git (check with `git status`)
- [ ] GITHUB_TOKEN is kept secret
- [ ] COMMIT_SECRET is a strong random string (32+ characters)
- [ ] Server is running behind HTTPS in production
- [ ] IP whitelisting or rate limiting is configured for production
- [ ] GitHub token has minimum required permissions (only `repo` scope)

## Success Criteria

✅ Server starts without errors
✅ Frontend can send messages
✅ Messages appear in logs/txt.log with timestamps
✅ Commits appear in GitHub with green checkmarks
✅ No GitHub PAT exposed in browser
✅ Multiple sequential commits work without conflicts

## Performance Notes

- Each commit takes ~1-2 seconds due to GitHub API calls
- Server handles concurrent requests safely using SHA checking
- No local caching to ensure data consistency

## Next Steps

Once testing is complete:
1. Deploy server to production environment
2. Update frontend server URL to production endpoint
3. Configure production secrets securely
4. Monitor GitHub commit activity
5. Set up alerts for failed commits
