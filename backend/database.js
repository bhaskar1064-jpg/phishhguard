const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Pre-filled brands for typo-squatting detection
const DEFAULT_REPUTABLE_BRANDS = [
  'microsoft.com',
  'google.com',
  'paypal.com',
  'amazon.com',
  'facebook.com',
  'netflix.com',
  'chase.com',
  'apple.com',
  'github.com',
  'zoom.us',
  'linkedin.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'youtube.com',
  'twitter.com'
];

// Pre-filled blacklisted malicious domains
const DEFAULT_BLACKLIST = [
  'micros0ft.com',
  'paypaI-security.com', // Capital 'I' lookalike
  'amzn-login-alert.net',
  'chase-security-update.net',
  'netflix-billing-support.org',
  'secure-paypal-login.com',
  'google.com', // Typo
  'microsft.com' // Typo
];

// Mock scan history to show nice initial stats on the dashboard
const DEFAULT_LOGS = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    url: 'https://paypal.com/signin',
    type: 'url',
    status: 'safe',
    details: 'Verified reputable domain (paypal.com)'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    url: 'http://micros0ft.com/login.html',
    type: 'url',
    status: 'malicious',
    details: 'Typo-squatting match for reputable brand (microsoft.com)'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    url: 'http://paypaI-security.com/update',
    type: 'url',
    status: 'malicious',
    details: 'Lookalike domain detected (homoglyph bypass)'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    url: 'N/A (Email Text)',
    type: 'email',
    status: 'suspicious',
    details: 'Email contained urgent actions and suspicious links: paypaI-security.com'
  }
];

const DEFAULT_DB = {
  settings: {
    openaiApiKey: '',
    geminiApiKey: '',
    realtimeProtection: true,
    strictMode: false,
    sensitivityLevel: 'medium'
  },
  reputableBrands: DEFAULT_REPUTABLE_BRANDS,
  blacklist: DEFAULT_BLACKLIST,
  logs: DEFAULT_LOGS
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB file:', err);
    return DEFAULT_DB;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

const db = {
  getSettings: () => {
    return readDb().settings || DEFAULT_DB.settings;
  },
  saveSettings: (newSettings) => {
    const current = readDb();
    current.settings = { ...current.settings, ...newSettings };
    writeDb(current);
    return current.settings;
  },
  getReputableBrands: () => {
    return readDb().reputableBrands || DEFAULT_REPUTABLE_BRANDS;
  },
  getBlacklist: () => {
    return readDb().blacklist || DEFAULT_BLACKLIST;
  },
  addBlacklist: (domain) => {
    const current = readDb();
    if (!current.blacklist.includes(domain)) {
      current.blacklist.push(domain);
      writeDb(current);
    }
    return current.blacklist;
  },
  getLogs: () => {
    return readDb().logs || [];
  },
  addLog: (log) => {
    const current = readDb();
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    if (!current.logs) current.logs = [];
    current.logs.unshift(newLog); // Put latest scans on top
    // Cap at 100 logs
    if (current.logs.length > 100) {
      current.logs = current.logs.slice(0, 100);
    }
    writeDb(current);
    return newLog;
  },
  getStats: () => {
    const current = readDb();
    const logs = current.logs || [];
    const totalScanned = logs.length;
    const maliciousCount = logs.filter(l => l.status === 'malicious').length;
    const suspiciousCount = logs.filter(l => l.status === 'suspicious').length;
    const safeCount = logs.filter(l => l.status === 'safe').length;
    
    // Calculate safety rating (0-100)
    let safetyScore = 100;
    if (totalScanned > 0) {
      const negativeWeight = (maliciousCount * 1.0) + (suspiciousCount * 0.4);
      safetyScore = Math.max(0, Math.round(100 - (negativeWeight / totalScanned) * 100));
    }
    
    return {
      totalScanned,
      maliciousCount,
      suspiciousCount,
      safeCount,
      safetyScore
    };
  }
};

module.exports = db;
