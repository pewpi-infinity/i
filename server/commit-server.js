#!/usr/bin/env node
/**
 * commit-server.js
 * 
 * Secure server-side endpoint for committing log entries to GitHub.
 * This server handles GitHub API authentication server-side, eliminating
 * the need to expose Personal Access Tokens in client-side code.
 * 
 * Setup:
 * 1. Copy .env.example to .env and fill in your credentials
 * 2. npm install
 * 3. npm start
 * 
 * Security:
 * - GitHub token stored server-side only (never sent to client)
 * - Commit requests authenticated via COMMIT_SECRET
 * - CORS configured for your domain
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');

const app = express();

// Configuration from environment
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const COMMIT_SECRET = process.env.COMMIT_SECRET;
const OWNER = process.env.GITHUB_OWNER || 'pewpi-infinity';
const REPO = process.env.GITHUB_REPO || 'i';
const FILE_PATH = 'logs/txt.log';

// Validate configuration
if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN not set in .env file');
  process.exit(1);
}
if (!COMMIT_SECRET) {
  console.error('ERROR: COMMIT_SECRET not set in .env file');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

// Enable CORS (configure for your domain in production)
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'commit-server' });
});

/**
 * POST /commit
 * 
 * Commits a log entry to logs/txt.log in the GitHub repository.
 * 
 * Request body:
 * {
 *   "text": "The text to log",
 *   "secret": "your-commit-secret"  // Optional, can also use X-Commit-Secret header
 * }
 * 
 * Response:
 * {
 *   "ok": true,
 *   "commit": "sha-of-commit",
 *   "message": "Success message"
 * }
 */
app.post('/commit', async (req, res) => {
  try {
    // Validate secret (check both header and body)
    const providedSecret = req.headers['x-commit-secret'] || req.body.secret;
    
    if (!providedSecret || providedSecret !== COMMIT_SECRET) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid or missing commit secret'
      });
    }

    // Get the text to log
    const text = req.body.text;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid "text" field'
      });
    }

    // Get current file content and SHA
    let existingContent = '';
    let currentSha = null;

    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: FILE_PATH
      });

      if (data.type === 'file' && data.content) {
        // Decode base64 content
        existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
        currentSha = data.sha;
      }
    } catch (error) {
      // File doesn't exist (404) - that's okay, we'll create it
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create new content with timestamp
    const timestamp = new Date().toISOString();
    const newLine = `${timestamp} | ${text}\n`;
    const newContent = existingContent + newLine;

    // Encode to base64
    const contentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');

    // Commit the file
    const commitParams = {
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      message: `Log entry: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      content: contentBase64,
      committer: {
        name: 'pewpi-infinity bot',
        email: 'bot@pewpi-infinity.local'
      }
    };

    // Include SHA if file exists (for update)
    if (currentSha) {
      commitParams.sha = currentSha;
    }

    const { data: commitData } = await octokit.repos.createOrUpdateFileContents(commitParams);

    console.log(`✓ Committed log entry: ${text.substring(0, 60)}...`);

    res.json({
      ok: true,
      commit: commitData.commit.sha,
      message: 'Log entry committed successfully'
    });

  } catch (error) {
    console.error('Error committing to GitHub:', error);
    
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to commit to GitHub',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Commit server listening on port ${PORT}`);
  console.log(`  Repository: ${OWNER}/${REPO}`);
  console.log(`  File path: ${FILE_PATH}`);
  console.log(`  Ready to accept authenticated commit requests`);
});
