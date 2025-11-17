# Commit Server

Server-side commit endpoint that securely appends typed text to `logs/txt.log` in the GitHub repository without exposing Personal Access Tokens in the browser.

## Features

- ✅ Secure server-side GitHub API calls
- ✅ Authentication via COMMIT_SECRET
- ✅ Automatic file SHA handling
- ✅ Timestamped log entries
- ✅ No PAT exposure in browser

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `GITHUB_TOKEN`: Fine-grained Personal Access Token with Contents read & write permission for repository `pewpi-infinity/i`
   - `COMMIT_SECRET`: A random secret string (generate with `openssl rand -hex 32`)
   - `PORT`: (optional) Server port, defaults to 3000

3. **Generate a GitHub token:**
   - Go to https://github.com/settings/tokens?type=beta
   - Click "Generate new token"
   - Set repository access to "Only select repositories" → pewpi-infinity/i
   - Under "Repository permissions", set "Contents" to "Read and write"
   - Generate and copy the token

4. **Generate a commit secret:**
   ```bash
   openssl rand -hex 32
   ```

## Running the Server

```bash
cd server
npm start
```

The server will start on port 3000 (or your configured PORT).

## API

### POST /commit

Appends text to `logs/txt.log` with a timestamp.

**Request:**
```bash
curl -X POST http://localhost:3000/commit \
  -H "Content-Type: application/json" \
  -H "X-Commit-Secret: your_commit_secret_here" \
  -d '{"text": "Hello world"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Text logged and committed successfully",
  "commit": "abc123...",
  "timestamp": "2025-11-17T00:56:57.342Z"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T00:56:57.342Z"
}
```

## Security

- Never commit `.env` file to repository
- Keep GITHUB_TOKEN and COMMIT_SECRET secret
- The COMMIT_SECRET should be shared with the frontend via secure configuration (e.g., window.COMMIT_SECRET set server-side)
- Consider additional security measures for production (rate limiting, IP whitelist, etc.)

## Testing

1. Start the server:
   ```bash
   npm start
   ```

2. Test with curl:
   ```bash
   curl -X POST http://localhost:3000/commit \
     -H "Content-Type: application/json" \
     -H "X-Commit-Secret: your_commit_secret_here" \
     -d '{"text": "Test message"}'
   ```

3. Verify in GitHub:
   - Go to https://github.com/pewpi-infinity/i/blob/main/logs/txt.log
   - Check that your message was appended with timestamp

## Troubleshooting

- **Error: GITHUB_TOKEN environment variable is required**
  - Make sure you created `.env` file and set GITHUB_TOKEN

- **Error: 401 Unauthorized**
  - Check that your COMMIT_SECRET matches between server and client

- **Error: 404 or file access issues**
  - Verify your GitHub token has Contents read & write permission
  - Verify repository name is correct (pewpi-infinity/i)

## Log Format

Each entry in `logs/txt.log` follows this format:
```
2025-11-17T00:56:57.342Z | Your typed text here
```
