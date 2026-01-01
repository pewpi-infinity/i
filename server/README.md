# pewpi-infinity Commit Server

A secure Node.js server that handles committing conversation text to the `logs/txt.log` file in the pewpi-infinity/i GitHub repository.

## Why This Server?

The previous implementation stored GitHub Personal Access Tokens (PATs) in browser localStorage and made commits directly from the client. This approach had several issues:

1. **Security Risk**: PATs exposed in client-side code can be stolen
2. **Failed Commits**: Race conditions and improper SHA handling caused commits to fail
3. **Missing Text**: The typed conversation text wasn't reliably recorded

This server solves these issues by:
- Keeping the GitHub PAT secure on the server
- Properly handling file SHA and concurrent access
- Ensuring typed text is appended correctly with timestamps

## Setup

### Prerequisites

- Node.js 18+ installed
- A GitHub Personal Access Token with `repo` scope
  - Generate at: https://github.com/settings/tokens

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and set your values:
   ```bash
   # Required
   GITHUB_TOKEN=ghp_your_actual_token_here
   COMMIT_SECRET=your_random_secret_here
   
   # Optional (defaults shown)
   PORT=3000
   GITHUB_OWNER=pewpi-infinity
   GITHUB_REPO=i
   GITHUB_LOG_PATH=logs/txt.log
   ```

   **Important**: 
   - Generate a strong `COMMIT_SECRET` (e.g., `openssl rand -hex 32`)
   - Never commit your `.env` file to the repository
   - The same `COMMIT_SECRET` must be used in the frontend

### Running the Server

Start the server:
```bash
npm start
```

Or for development:
```bash
node commit-server.js
```

You should see:
```
═══════════════════════════════════════════════════════
  pewpi-infinity commit server running on port 3000
  Repository: pewpi-infinity/i
  Log path: logs/txt.log
═══════════════════════════════════════════════════════
```

## API

### POST /commit

Appends text to `logs/txt.log` and commits it to GitHub.

**Request:**
```json
{
  "text": "Your conversation text here",
  "secret": "your_commit_secret",
  "username": "optional_username"
}
```

Alternatively, you can pass the secret via header:
```
X-Commit-Secret: your_commit_secret
```

**Response (Success):**
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

**Response (Error):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid commit secret"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "pewpi-infinity-commit-server",
  "repo": "pewpi-infinity/i",
  "path": "logs/txt.log"
}
```

## Deployment

### Local Development

Run locally on `http://localhost:3000`:
```bash
npm start
```

### Production Deployment

For production, you should:

1. **Use HTTPS**: Deploy behind a reverse proxy (nginx, Caddy) with SSL
2. **Add Authentication**: Consider adding IP whitelisting or basic auth
3. **Environment Variables**: Set via your hosting platform (not .env file)
4. **Process Manager**: Use PM2, systemd, or similar to keep the server running

#### Example: Deploy with PM2

```bash
npm install -g pm2
pm2 start commit-server.js --name pewpi-commit-server
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

#### Example: Deploy on Heroku

```bash
heroku create pewpi-commit-server
heroku config:set GITHUB_TOKEN=ghp_your_token
heroku config:set COMMIT_SECRET=your_secret
git push heroku main
```

#### Example: Deploy on Railway/Render

1. Connect your GitHub repo
2. Set environment variables in the dashboard
3. Deploy automatically on push

### Security Recommendations

1. **Never commit secrets**: Ensure `.env` is in `.gitignore`
2. **Use a strong secret**: Generate with `openssl rand -hex 32` or similar
3. **Rotate tokens**: Periodically regenerate your GitHub PAT
4. **Limit PAT scope**: Only grant `repo` scope, not full access
5. **Monitor access**: Check GitHub audit logs for suspicious activity
6. **IP whitelist**: If possible, restrict access to known IPs
7. **Rate limiting**: Consider adding rate limiting to prevent abuse

## Frontend Integration

The frontend should use `static/js/commit-client.js` which sends requests to this server:

```javascript
// In your frontend code
const response = await fetch('http://localhost:3000/commit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Commit-Secret': 'your_commit_secret'
  },
  body: JSON.stringify({ text: userInput })
});
```

See `static/js/commit-client.js` for the complete implementation.

## Troubleshooting

### "GITHUB_TOKEN environment variable is required"
- Make sure you created `.env` file in the server directory
- Verify the file has `GITHUB_TOKEN=ghp_...` with your actual token

### "Authentication failed: invalid secret"
- Check that COMMIT_SECRET in server `.env` matches the secret in frontend
- Secret is case-sensitive

### "404 Not Found" errors
- Verify the repository and path are correct in `.env`
- Check that the GitHub token has access to the repository

### Commits failing with 409 Conflict
- The server handles SHA properly, but if you're running multiple instances, ensure only one is active
- Check for other processes making commits to the same file

## License

MIT
