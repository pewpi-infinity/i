#!/usr/bin/env node
/**
 * Server-side GitHub commit endpoint for pewpi-infinity/i
 * 
 * This server handles committing conversation text to logs/txt.log
 * in the GitHub repository safely, without exposing tokens to the browser.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const COMMIT_SECRET = process.env.COMMIT_SECRET;
const OWNER = process.env.GITHUB_OWNER || 'pewpi-infinity';
const REPO = process.env.GITHUB_REPO || 'i';
const LOG_PATH = process.env.GITHUB_LOG_PATH || 'logs/txt.log';

// Validate configuration
if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

if (!COMMIT_SECRET) {
  console.error('ERROR: COMMIT_SECRET environment variable is required');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: 'pewpi-infinity-commit-server/1.0.0'
});

/**
 * POST /commit
 * Appends text to logs/txt.log and commits to GitHub
 * 
 * Request body:
 * {
 *   "text": "The conversation text to log",
 *   "secret": "The COMMIT_SECRET for authentication",
 *   "username": "Optional username for the log entry"
 * }
 * 
 * Or use X-Commit-Secret header for the secret
 */
app.post('/commit', async (req, res) => {
  try {
    // Authenticate the request
    const secret = req.body.secret || req.headers['x-commit-secret'];
    if (secret !== COMMIT_SECRET) {
      console.warn('Authentication failed: invalid secret');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid commit secret'
      });
    }

    const text = req.body.text;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Missing or invalid "text" field'
      });
    }

    const username = req.body.username || 'user';

    console.log(`Processing commit request for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Get current file content and sha
    let currentSha = null;
    let currentContent = '';

    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: LOG_PATH,
      });

      if (data && data.type === 'file') {
        currentSha = data.sha;
        // Decode base64 content
        currentContent = Buffer.from(data.content, 'base64').toString('utf-8');
        console.log(`Retrieved existing file (sha: ${currentSha})`);
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('File does not exist yet, will create new file');
      } else {
        throw error;
      }
    }

    // Append new log entry with timestamp
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${text}\n`;
    const newContent = currentContent + (currentContent && !currentContent.endsWith('\n') ? '\n' : '') + logEntry;

    // Encode content to base64
    const contentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');

    // Commit the changes
    const commitMessage = `Frontend log update`;
    const committer = {
      name: 'pewpi-infinity bot',
      email: 'bot@pewpi-infinity.local'
    };

    const commitParams = {
      owner: OWNER,
      repo: REPO,
      path: LOG_PATH,
      message: commitMessage,
      content: contentBase64,
      committer: committer,
    };

    if (currentSha) {
      commitParams.sha = currentSha;
    }

    const result = await octokit.repos.createOrUpdateFileContents(commitParams);

    console.log(`✔ Successfully committed to GitHub (commit: ${result.data.commit.sha.substring(0, 7)})`);

    res.json({
      success: true,
      message: 'Text logged and committed to GitHub',
      commit: {
        sha: result.data.commit.sha,
        url: result.data.commit.html_url
      }
    });

  } catch (error) {
    console.error('Error processing commit:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'pewpi-infinity-commit-server',
    repo: `${OWNER}/${REPO}`,
    path: LOG_PATH
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`═══════════════════════════════════════════════════════`);
  console.log(`  pewpi-infinity commit server running on port ${PORT}`);
  console.log(`  Repository: ${OWNER}/${REPO}`);
  console.log(`  Log path: ${LOG_PATH}`);
  console.log(`═══════════════════════════════════════════════════════`);
  console.log(`  POST /commit - Append text and commit to GitHub`);
  console.log(`  GET  /health - Health check`);
  console.log(`═══════════════════════════════════════════════════════`);
});
/**
 * server/commit-server.js
 *
 * Minimal express server to append frontend-typed text to logs/txt.log using the GitHub Contents API.
 * - Requires environment variables set in server/.env:
 *     GITHUB_TOKEN (fine-grained PAT with Contents: Read & write for pewpi-infinity/i)
 *     COMMIT_SECRET (a random secret to authenticate frontend -> server requests)
 *     PORT (optional, default 4000)
 *
 * Security:
 * - Do NOT commit server/.env to the repository.
 * - Protect the server in production (auth, IP allowlist, rate limiting).
 *
 * Usage:
 *   cd server
 *   npm install
 *   cp .env.example .env    # edit .env locally to add real values
 *   npm start
 */
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(bodyParser.json());

const OWNER = 'pewpi-infinity';
const REPO = 'i';
const PATH = 'logs/txt.log';
const COMMITTER = { name: 'pewpi-infinity bot', email: 'bot@pewpi-infinity.local' };

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const COMMIT_SECRET = process.env.COMMIT_SECRET;

if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN in environment. Create server/.env from .env.example and set a token.');
  process.exit(1);
}
if (!COMMIT_SECRET) {
  console.error('Missing COMMIT_SECRET in environment. Create server/.env from .env.example and set a secret.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getFileContentAndSha() {
  try {
    const r = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: PATH
    });
    if (r && r.data && r.data.type === 'file' && r.data.content) {
      return { content: Buffer.from(r.data.content, 'base64').toString('utf8'), sha: r.data.sha };
    }
    return { content: '', sha: null };
  } catch (err) {
    if (err.status === 404) {
      return { content: '', sha: null };
    }
    throw err;
  }
}

app.post('/commit', async (req, res) => {
  try {
    // Validate secret (header or JSON field)
    const headerSecret = req.get('X-Commit-Secret');
    const bodySecret = req.body && req.body.secret;
    if (!headerSecret && !bodySecret) {
      return res.status(401).json({ error: 'Missing secret' });
    }
    if ((headerSecret || bodySecret) !== COMMIT_SECRET) {
      return res.status(403).json({ error: 'Invalid secret' });
    }

    const text = (req.body && typeof req.body.text === 'string') ? req.body.text : '';
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text required' });
    }

    // Read existing content and sha (handles 404)
    const existing = await getFileContentAndSha();

    // Append with timestamp
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} | ${text.replace(/\r/g, '')}\n`;
    const newContent = (existing.content ? existing.content + entry : entry);
    const encoded = Buffer.from(newContent, 'utf8').toString('base64');

    // Prepare params for createOrUpdateFileContents
    const params = {
      owner: OWNER,
      repo: REPO,
      path: PATH,
      message: `Frontend log update: append entry`,
      content: encoded,
      committer: COMMITTER
    };
    if (existing.sha) params.sha = existing.sha;

    const result = await octokit.repos.createOrUpdateFileContents(params);
    return res.json({ ok: true, commit: result.data.commit.sha });
  } catch (err) {
    console.error('Commit server error', err && err.status, err && err.message);
    const status = (err && err.status) || 500;
    return res.status(status).json({ error: err && err.message ? err.message : 'unknown error' });
  }
});

// Health endpoint
app.get('/healthz', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`commit server listening on ${port}`);
});
