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

**Response (Success):**
```json
{
  "ok": true,
  "commit": "abc123...",
  "message": "Log entry committed successfully"
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Error description"
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
