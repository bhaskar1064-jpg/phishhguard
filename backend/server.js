const http = require('http');
const fs = require('fs');
const path = require('path');

const db = require('./database');
const { checkUrlReputation } = require('./utils/reputation');
const { analyzeEmail } = require('./utils/emailAnalyzer');
const { explainThreat } = require('./utils/aiService');

const PORT = process.env.PORT || 5000;

// Mapping of file extensions to Content-Type headers
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Helper to write JSON API responses with CORS headers.
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(data));
}

/**
 * Helper to handle CORS Options Preflight.
 */
function handleCorsPreflight(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  });
  res.end();
}

/**
 * Helper to parse JSON request bodies.
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format in request body'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Handles static file serving for the React dashboard.
 */
function serveStaticFile(req, res) {
  let reqUrl = req.url.split('?')[0]; // Strip query parameters
  if (reqUrl === '/') {
    reqUrl = '/index.html';
  }

  // Files are located in the sibling dashboard folder
  const filePath = path.join(__dirname, '..', 'dashboard', reqUrl);
  
  // Security check: ensure path is within the dashboard directory
  const dashboardDir = path.resolve(path.join(__dirname, '..', 'dashboard'));
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(dashboardDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client-side routing
      const indexFallback = path.join(dashboardDir, 'index.html');
      fs.readFile(indexFallback, (fallbackErr, indexContent) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
          res.end(indexContent);
        }
      });
      return;
    }

    const ext = path.extname(resolvedPath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(resolvedPath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toLocaleTimeString()}] ${method} ${pathname}`);

  // Handle CORS options preflight
  if (method === 'OPTIONS') {
    handleCorsPreflight(req, res);
    return;
  }

  // API ROUTING
  if (pathname.startsWith('/api/')) {
    try {
      // 1. GET /api/stats
      if (pathname === '/api/stats' && method === 'GET') {
        const stats = db.getStats();
        sendJson(res, 200, stats);
        return;
      }

      // 2. GET /api/logs
      if (pathname === '/api/logs' && method === 'GET') {
        const logs = db.getLogs();
        sendJson(res, 200, logs);
        return;
      }

      // 3. GET /api/settings
      if (pathname === '/api/settings' && method === 'GET') {
        const settings = db.getSettings();
        // Hide API keys in response for basic security (return placeholder if set)
        const maskedSettings = {
          ...settings,
          openaiApiKey: settings.openaiApiKey ? '••••••••••••••••' : '',
          geminiApiKey: settings.geminiApiKey ? '••••••••••••••••' : ''
        };
        sendJson(res, 200, maskedSettings);
        return;
      }

      // 4. POST /api/settings
      if (pathname === '/api/settings' && method === 'POST') {
        const body = await parseJsonBody(req);
        const current = db.getSettings();
        
        // Only update key if it isn't masked/placeholder
        const updated = {
          openaiApiKey: body.openaiApiKey === '••••••••••••••••' ? current.openaiApiKey : body.openaiApiKey,
          geminiApiKey: body.geminiApiKey === '••••••••••••••••' ? current.geminiApiKey : body.geminiApiKey,
          realtimeProtection: body.realtimeProtection !== undefined ? body.realtimeProtection : current.realtimeProtection,
          strictMode: body.strictMode !== undefined ? body.strictMode : current.strictMode,
          sensitivityLevel: body.sensitivityLevel || current.sensitivityLevel
        };
        
        db.saveSettings(updated);
        sendJson(res, 200, { success: true, message: 'Settings saved successfully' });
        return;
      }

      // 5. POST /api/check-url
      if (pathname === '/api/check-url' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.url) {
          sendJson(res, 400, { error: 'URL is required' });
          return;
        }
        
        const reputation = checkUrlReputation(body.url);
        
        // Log to database
        db.addLog({
          url: body.url,
          type: 'url',
          status: reputation.status,
          details: reputation.reason + (reputation.details.length > 0 ? ': ' + reputation.details[0] : '')
        });

        sendJson(res, 200, reputation);
        return;
      }

      // 6. POST /api/analyze-email
      if (pathname === '/api/analyze-email' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.text) {
          sendJson(res, 400, { error: 'Email text is required' });
          return;
        }

        const analysis = analyzeEmail(body.text);
        
        // Log to database
        db.addLog({
          url: 'N/A (Email Text)',
          type: 'email',
          status: analysis.status,
          details: analysis.summary
        });

        sendJson(res, 200, analysis);
        return;
      }

      // 7. POST /api/explain-threat
      if (pathname === '/api/explain-threat' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.type || !body.input) {
          sendJson(res, 400, { error: 'Threat type and input are required' });
          return;
        }

        const explanation = await explainThreat(body);
        sendJson(res, 200, { explanation });
        return;
      }

      // 8. POST /api/add-blacklist
      if (pathname === '/api/add-blacklist' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.domain) {
          sendJson(res, 400, { error: 'Domain is required' });
          return;
        }
        db.addBlacklist(body.domain);
        sendJson(res, 200, { success: true, message: `Domain "${body.domain}" blacklisted.` });
        return;
      }

      // Default API 404
      sendJson(res, 404, { error: 'API endpoint not found' });
    } catch (err) {
      console.error('API Error:', err);
      sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  } else {
    // STATIC FILE SERVING FOR DASHBOARD
    serveStaticFile(req, res);
  }
});

// Start listening
server.listen(PORT, () => {
  console.log(`\nPhishGuard backend running on port ${PORT}...`);
});
