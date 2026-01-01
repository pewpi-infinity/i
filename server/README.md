# Commit Server

Secure server-side endpoint for committing log entries to GitHub without exposing Personal Access Tokens in client-side code.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:

- **GITHUB_TOKEN**: Your GitHub Personal Access Token
  - Create at: https://github.com/settings/tokens
  - Required scope: `repo` (full control of private repositories)
  
- **COMMIT_SECRET**: A random secret key for authenticating commit requests
  - Generate with: `openssl rand -hex 32`
  - This secret must be configured in the client as well

- **PORT**: Port number for the server (default: 3000)

### 3. Start the Server

```bash
npm start
```

The server will start on the configured port (default: http://localhost:3000)

## API Endpoints

### POST /commit

Commits a log entry to `logs/txt.log` in the GitHub repository.

**Request:**
```bash
curl -X POST http://localhost:3000/commit \
  -H "Content-Type: application/json" \
  -H "X-Commit-Secret: your-secret-here" \
  -d '{"text": "Your log message"}'
```

**Request Body:**
```json
{
  "text": "The message to log"
}
```

**Headers:**
- `X-Commit-Secret`: Your commit secret (can also be passed in request body as `secret` field)
- `Content-Type`: `application/json`
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
  "ok": true,
  "commit": "abc123...",
  "message": "Log entry committed successfully"
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
  "ok": false,
  "error": "Error description"
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
  "service": "commit-server"
}
```

## Security Notes

### ✅ DO:
- Store GITHUB_TOKEN and COMMIT_SECRET in `.env` file (never commit this file)
- Use environment variables for all sensitive configuration
- Keep the `.env` file secure and never share it
- Use HTTPS in production
- Configure CORS appropriately for your domain

### ❌ DON'T:
- Commit `.env` file to git (it's in `.gitignore`)
- Expose GitHub tokens in client-side code
- Share your COMMIT_SECRET publicly
- Use weak or predictable secrets

## Deployment

### Local Development
The server runs on localhost by default. Update `commit-client.js` to point to `http://localhost:3000`.

### Production Deployment
1. Deploy server to a hosting platform (Heroku, AWS, DigitalOcean, etc.)
2. Set environment variables in your hosting platform
3. Update `commit-client.js` with your production server URL
4. Configure CORS to only allow requests from your domain
5. Use HTTPS for all communications

## How It Works

1. **Client Side**: User types text in the web UI
2. **Client Side**: JavaScript calls `CommitClient.send(text)` with the text
3. **Client Side**: Request sent to server with text and secret
4. **Server Side**: Server validates the secret
5. **Server Side**: Server fetches current `logs/txt.log` from GitHub (if exists)
6. **Server Side**: Server appends new line with timestamp and text
7. **Server Side**: Server commits updated file to GitHub using stored token
8. **Server Side**: Server responds with success/failure
9. **Client Side**: UI displays result to user

This architecture keeps the GitHub token secure on the server side and prevents token exposure in browser code.

## Troubleshooting

### "GITHUB_TOKEN not set in .env file"
- Make sure you've created a `.env` file in the `server/` directory
- Copy from `.env.example` and fill in your token

### "Invalid or missing commit secret"
- Check that COMMIT_SECRET in `.env` matches the secret configured in the client
- Ensure the secret is being sent in the `X-Commit-Secret` header or request body

### "Failed to commit to GitHub"
- Verify your GitHub token has `repo` scope
- Check that the repository name and owner are correct
- Ensure the token hasn't expired

### Connection refused / Network error
- Make sure the server is running (`npm start`)
- Check that the port in `.env` matches the port in `commit-client.js`
- Verify no firewall is blocking the port
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
