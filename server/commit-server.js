#!/usr/bin/env node
/**
 * commit-server.js
 * 
 * Express server with POST /commit endpoint that:
 * 1. Validates COMMIT_SECRET via X-Commit-Secret header
 * 2. Reads logs/txt.log from GitHub
 * 3. Appends `timestamp | text\n` to the content
 * 4. Commits updated content back to GitHub with correct SHA
 * 
 * Security: Uses GITHUB_TOKEN from environment, validates COMMIT_SECRET
 */

require('dotenv').config();
const express = require('express');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const COMMIT_SECRET = process.env.COMMIT_SECRET;
const OWNER = 'pewpi-infinity';
const REPO = 'i';
const PATH = 'logs/txt.log';

if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

if (!COMMIT_SECRET) {
  console.error('ERROR: COMMIT_SECRET environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Commit-Secret');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/commit', async (req, res) => {
  try {
    // Validate COMMIT_SECRET from header or body
    const secretFromHeader = req.headers['x-commit-secret'];
    const secretFromBody = req.body.secret;
    const providedSecret = secretFromHeader || secretFromBody;

    if (!providedSecret || providedSecret !== COMMIT_SECRET) {
      console.log('Unauthorized commit attempt');
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing COMMIT_SECRET' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Bad Request: text field is required' });
    }

    console.log(`Committing text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Step 1: Get current file content and SHA
    let currentContent = '';
    let sha = null;
    
    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: PATH,
      });
      
      sha = data.sha;
      currentContent = Buffer.from(data.content, 'base64').toString('utf-8');
      console.log(`Retrieved file with SHA: ${sha}, size: ${currentContent.length} bytes`);
    } catch (error) {
      if (error.status === 404) {
        console.log('File not found, will create new file');
        currentContent = '';
        sha = null;
      } else {
        throw error;
      }
    }

    // Step 2: Append new entry with timestamp
    const timestamp = new Date().toISOString();
    const newEntry = `${timestamp} | ${text}\n`;
    const updatedContent = currentContent + newEntry;

    // Step 3: Encode and commit
    const contentEncoded = Buffer.from(updatedContent, 'utf-8').toString('base64');
    
    const commitData = {
      owner: OWNER,
      repo: REPO,
      path: PATH,
      message: `Log entry: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      content: contentEncoded,
    };
    
    if (sha) {
      commitData.sha = sha;
    }

    const result = await octokit.repos.createOrUpdateFileContents(commitData);
    
    console.log(`Commit successful! SHA: ${result.data.commit.sha}`);
    
    res.json({
      success: true,
      message: 'Text logged and committed successfully',
      commit: result.data.commit.sha,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('Error in /commit endpoint:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Commit server listening on port ${PORT}`);
  console.log(`POST to http://localhost:${PORT}/commit with { "text": "your message" }`);
  console.log(`Include X-Commit-Secret header with value from COMMIT_SECRET env var`);
});
