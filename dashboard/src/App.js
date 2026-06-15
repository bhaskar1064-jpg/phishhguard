import React, { useState, useEffect } from 'https://esm.sh/react@18';

// SVG Icons as reusable components for clean design
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z"/></svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
);
const EmailIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
);
const BrainIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.09 19.64 10.5 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
);

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [stats, setStats] = useState({ totalScanned: 0, maliciousCount: 0, suspiciousCount: 0, safeCount: 0, safetyScore: 100 });
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({ openaiApiKey: '', geminiApiKey: '', realtimeProtection: true, strictMode: false, sensitivityLevel: 'medium' });

  // Fetch critical details on load or tab change
  const refreshData = async () => {
    try {
      const statsRes = await fetch(`${API_BASE}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const logsRes = await fetch(`${API_BASE}/logs`);
      const logsData = await logsRes.json();
      setLogs(logsData);
      
      const settingsRes = await fetch(`${API_BASE}/settings`);
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
    } catch (err) {
      console.error('Error contacting backend server APIs:', err);
    }
  };

  useEffect(() => {
    refreshData();
    // Set up auto-refresh every 10 seconds for real-time extension logging updates
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">
            <ShieldIcon />
          </div>
          <span className="logo-title">PhishGuard</span>
        </div>
        
        <ul className="sidebar-nav">
          <li className="nav-item">
            <a className={`nav-link ${currentTab === 'overview' ? 'active' : ''}`} onClick={() => { setCurrentTab('overview'); refreshData(); }}>
              <DashboardIcon /> Overview
            </a>
          </li>
          <li className="nav-item">
            <a className={`nav-link ${currentTab === 'url-sandbox' ? 'active' : ''}`} onClick={() => setCurrentTab('url-sandbox')}>
              <SearchIcon /> URL Sandbox
            </a>
          </li>
          <li className="nav-item">
            <a className={`nav-link ${currentTab === 'email-inspector' ? 'active' : ''}`} onClick={() => setCurrentTab('email-inspector')}>
              <EmailIcon /> Email Inspector
            </a>
          </li>
          <li className="nav-item">
            <a className={`nav-link ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}>
              <SettingsIcon /> Settings
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-panel">
        {currentTab === 'overview' && <OverviewTab stats={stats} logs={logs} />}
        {currentTab === 'url-sandbox' && <UrlSandboxTab refreshStats={refreshData} />}
        {currentTab === 'email-inspector' && <EmailInspectorTab refreshStats={refreshData} />}
        {currentTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// OVERVIEW TAB
// -------------------------------------------------------------
function OverviewTab({ stats, logs }) {
  // SVG Circumference helper
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.safetyScore / 100) * circumference;

  // Gauge color helper
  let gaugeColor = 'var(--color-safe)';
  if (stats.safetyScore < 50) gaugeColor = 'var(--color-danger)';
  else if (stats.safetyScore < 85) gaugeColor = 'var(--color-warning)';

  return (
    <div>
      <h1 className="header-title">Security Center</h1>
      <p className="header-subtitle">Real-time anti-phishing protection overview and analysis logs.</p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card stat-card stat-scanned">
          <div className="stat-icon"><SearchIcon /></div>
          <div className="stat-info">
            <span className="stat-label">Total Scanned</span>
            <span className="stat-value">{stats.totalScanned}</span>
          </div>
        </div>
        <div className="card stat-card stat-malicious">
          <div className="stat-icon"><AlertIcon /></div>
          <div className="stat-info">
            <span className="stat-label">Malicious Blocked</span>
            <span className="stat-value">{stats.maliciousCount}</span>
          </div>
        </div>
        <div className="card stat-card stat-suspicious">
          <div className="stat-icon"><AlertIcon /></div>
          <div className="stat-info">
            <span className="stat-label">Suspicious Items</span>
            <span className="stat-value">{stats.suspiciousCount}</span>
          </div>
        </div>
        <div className="card stat-card stat-safe">
          <div className="stat-icon"><ShieldIcon /></div>
          <div className="stat-info">
            <span className="stat-label">Verified Safe</span>
            <span className="stat-value">{stats.safeCount}</span>
          </div>
        </div>
      </div>

      <div className="overview-layout">
        {/* Left Column: Gauge Rating */}
        <div className="card gauge-container">
          <h3 style={{ marginBottom: '1rem' }}>Device Safety Rating</h3>
          <div className="gauge-svg">
            <svg width="180" height="180">
              <circle className="gauge-track" cx="90" cy="90" r={radius} />
              <circle 
                className="gauge-fill" 
                cx="90" 
                cy="90" 
                r={radius} 
                stroke={gaugeColor}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  filter: `drop-shadow(0 0 6px ${gaugeColor}55)`
                }}
              />
            </svg>
            <div className="gauge-value">
              <span className="gauge-number" style={{ color: gaugeColor }}>{stats.safetyScore}%</span>
              <span className="gauge-label">Secure</span>
            </div>
          </div>
          <p className="gauge-desc" style={{ color: gaugeColor }}>
            {stats.safetyScore >= 90 ? 'SYSTEM SHIELD ACTIVE' : stats.safetyScore >= 70 ? 'MEDIUM HAZARD ALERT' : 'CRITICAL THREAT LOAD'}
          </p>
        </div>

        {/* Right Column: Scan History */}
        <div className="card" style={{ flexGrow: 1 }}>
          <h3 className="card-title"><DashboardIcon /> Recent Security Activity</h3>
          <div className="logs-table-wrapper">
            {logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No recent analysis history available.</p>
            ) : (
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>URL / Target</th>
                    <th>Status</th>
                    <th>Analysis Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {log.type === 'url' ? <SearchIcon style={{ width: 14, height: 14 }} /> : <EmailIcon style={{ width: 14, height: 14 }} />}
                          {log.type}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.url}>
                        {log.url}
                      </td>
                      <td>
                        <span className={`badge badge-${log.status}`}>{log.status}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// URL SANDBOX TAB
// -------------------------------------------------------------
function UrlSandboxTab({ refreshStats }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setExplanation(null);

    try {
      // 1. Run Reputation Check
      const checkRes = await fetch(`${API_BASE}/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const checkData = await checkRes.json();
      setResult(checkData);
      refreshStats();

      // 2. If malicious/suspicious, call AI explanation
      if (checkData.status !== 'safe') {
        setAiLoading(true);
        const explainRes = await fetch(`${API_BASE}/explain-threat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'url',
            input: url,
            status: checkData.status,
            reason: checkData.reason,
            details: checkData.details
          })
        });
        const explainData = await explainRes.json();
        setExplanation(explainData.explanation);
        setAiLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="header-title">URL Sandbox</h1>
      <p className="header-subtitle">Analyze links and download pathways for typo-squatting, impersonations, and credential harvesting.</p>

      <div className="card">
        <form onSubmit={handleScan} className="input-container">
          <label className="input-label">Enter Target URL to Inspect</label>
          <div className="url-input-wrapper">
            <input 
              type="text" 
              className="input-text" 
              placeholder="e.g., https://micros0ft.com/login.html" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'Start Scan'}
            </button>
          </div>
        </form>

        {/* Scan Result Details */}
        {result && (
          <div>
            <div className={`result-banner result-banner-${result.status}`}>
              <div className="result-banner-icon">
                {result.status === 'safe' ? <ShieldIcon /> : <AlertIcon />}
              </div>
              <div className="result-banner-info">
                <h3>System Verdict: {result.status.toUpperCase()}</h3>
                <p><strong>Heuristics:</strong> {result.reason}</p>
              </div>
            </div>

            {result.details && result.details.length > 0 && (
              <div style={{ padding: '0 0.5rem 1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Engine Indicators:</h4>
                <ul className="details-list">
                  {result.details.map((detail, idx) => (
                    <li key={idx} className="details-item">{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* AI Explanation Engine Output */}
        {aiLoading && (
          <div className="ai-box" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeftColor: 'var(--text-muted)' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent-primary)' }}></div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>AI explanation engine is generating threat report...</span>
          </div>
        )}

        {explanation && (
          <div className="ai-box">
            <div className="ai-header">
              <BrainIcon /> PhishGuard AI Threat Advisory
            </div>
            
            <div className="ai-section">
              <div className="ai-section-title">Why this is flagged:</div>
              <ul className="ai-bullets">
                {explanation.why.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
            
            <div className="ai-section">
              <div className="ai-section-title">How the exploit works:</div>
              <p className="ai-body-text">{explanation.how}</p>
            </div>
            
            <div className="ai-section">
              <div className="ai-section-title" style={{ color: 'var(--color-danger)' }}>Immediate Consequences:</div>
              <ul className="ai-bullets ai-bullets-danger">
                {explanation.what.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// EMAIL INSPECTOR TAB
// -------------------------------------------------------------
function EmailInspectorTab({ refreshStats }) {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);

  const handleInspect = async (e) => {
    e.preventDefault();
    if (!emailText.trim()) return;

    setLoading(true);
    setResult(null);
    setExplanation(null);

    try {
      // 1. Run Email Analysis
      const inspectRes = await fetch(`${API_BASE}/analyze-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: emailText })
      });
      const inspectData = await inspectRes.json();
      setResult(inspectData);
      refreshStats();

      // 2. If suspicious or malicious, trigger AI explain
      if (inspectData.status !== 'safe') {
        setAiLoading(true);
        const explainRes = await fetch(`${API_BASE}/explain-threat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            input: emailText,
            status: inspectData.status,
            reason: inspectData.summary,
            details: inspectData.indicators
          })
        });
        const explainData = await explainRes.json();
        setExplanation(explainData.explanation);
        setAiLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="header-title">Email Inspector</h1>
      <p className="header-subtitle">Paste incoming email headers and content to scan embedded hyperlink structures and trigger pressure cues.</p>

      <div className="card">
        <form onSubmit={handleInspect} className="input-container">
          <label className="input-label">Email Text Content</label>
          <textarea 
            className="input-text input-textarea" 
            placeholder="Paste raw email message or text here..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            disabled={loading}
          ></textarea>
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }} disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Analyze Email'}
          </button>
        </form>

        {/* Email Inspect Verdict Banner */}
        {result && (
          <div>
            <div className={`result-banner result-banner-${result.status}`}>
              <div className="result-banner-icon">
                {result.status === 'safe' ? <ShieldIcon /> : <AlertIcon />}
              </div>
              <div className="result-banner-info">
                <h3>Email Verdict: {result.status.toUpperCase()}</h3>
                <p>{result.summary}</p>
              </div>
            </div>

            {/* Keyword Threat Indicators List */}
            {result.indicators && result.indicators.length > 0 && (
              <div style={{ margin: '1.5rem 0' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Phishing Threat Markers:</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {result.indicators.map((ind, idx) => (
                    <span key={idx} className="badge badge-suspicious" style={{ textTransform: 'none', padding: '0.4rem 0.8rem' }}>
                      <strong>{ind.type}:</strong> "{ind.phrase}" ({ind.count}x)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Links Panel */}
            {result.links && result.links.length > 0 ? (
              <div style={{ margin: '1.5rem 0' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Embedded Links Scanned:</h4>
                <table className="email-links-table">
                  <thead>
                    <tr>
                      <th>Hyperlink URL</th>
                      <th>Verdict</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.links.map((link, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--accent-primary)', wordBreak: 'break-all' }}>{link.url}</td>
                        <td><span className={`badge badge-${link.status}`}>{link.status}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{link.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : result.links && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: '1rem 0' }}>No hyperlinks detected in email text.</p>
            )}
          </div>
        )}

        {/* AI Explanation Box */}
        {aiLoading && (
          <div className="ai-box" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeftColor: 'var(--text-muted)' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent-primary)' }}></div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>AI explanation engine is generating threat report...</span>
          </div>
        )}

        {explanation && (
          <div className="ai-box">
            <div className="ai-header">
              <BrainIcon /> PhishGuard AI Phishing Analysis
            </div>
            
            <div className="ai-section">
              <div className="ai-section-title">Why this is flagged:</div>
              <ul className="ai-bullets">
                {explanation.why.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
            
            <div className="ai-section">
              <div className="ai-section-title">How the fraud works:</div>
              <p className="ai-body-text">{explanation.how}</p>
            </div>
            
            <div className="ai-section">
              <div className="ai-section-title" style={{ color: 'var(--color-danger)' }}>Expected Consequences:</div>
              <ul className="ai-bullets ai-bullets-danger">
                {explanation.what.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SETTINGS TAB
// -------------------------------------------------------------
function SettingsTab({ settings, setSettings }) {
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [blacklistDomain, setBlacklistDomain] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [blacklistMsg, setBlacklistMsg] = useState('');

  // Update component state if settings props update from API
  useEffect(() => {
    setOpenaiKey(settings.openaiApiKey || '');
    setGeminiKey(settings.geminiApiKey || '');
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiApiKey: openaiKey,
          geminiApiKey: geminiKey,
          realtimeProtection: settings.realtimeProtection,
          strictMode: settings.strictMode,
          sensitivityLevel: settings.sensitivityLevel
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Settings saved and synchronized successfully.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Error saving settings to backend.');
    }
  };

  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    setBlacklistMsg('');
    if (!blacklistDomain.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/add-blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: blacklistDomain })
      });
      const data = await res.json();
      if (data.success) {
        setBlacklistMsg(`Domain "${blacklistDomain}" has been added to threat intelligence database.`);
        setBlacklistDomain('');
        setTimeout(() => setBlacklistMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setBlacklistMsg('Error adding to blacklist.');
    }
  };

  return (
    <div>
      <h1 className="header-title">System Settings</h1>
      <p className="header-subtitle">Configure AI components, active engines, and manually update threat feeds.</p>

      <div className="card">
        <h3 className="card-title"><BrainIcon /> AI Explanations Integration</h3>
        <form onSubmit={handleSaveSettings}>
          <div className="form-group">
            <label>Google Gemini API Key</label>
            <input 
              type="password" 
              className="input-text" 
              placeholder={geminiKey ? "••••••••••••••••" : "Paste your Gemini API Key here"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <p className="form-helper">Requires permission for model <strong>gemini-1.5-flash</strong>. Left blank, the backend uses a local mock threat advisement generator.</p>
          </div>

          <div className="form-group">
            <label>OpenAI API Key</label>
            <input 
              type="password" 
              className="input-text" 
              placeholder={openaiKey ? "••••••••••••••••" : "Paste your OpenAI API Key here"}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <p className="form-helper">Fallback model used: <strong>gpt-4o-mini</strong>.</p>
          </div>

          <h3 className="card-title" style={{ marginTop: '2rem' }}><ShieldIcon /> Active Threat Shields</h3>
          
          <div className="toggle-group">
            <div className="toggle-label-section">
              <span className="toggle-title">Real-Time Extension Warnings</span>
              <span className="toggle-desc">Actively block known lookalike connections in browser extensions.</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.realtimeProtection}
                onChange={(e) => setSettings({ ...settings, realtimeProtection: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="toggle-group" style={{ borderBottom: 'none' }}>
            <div className="toggle-label-section">
              <span className="toggle-title">Strict Heuristic Engine</span>
              <span className="toggle-desc">Increase sensitivity for lookalike spelling distance variances (may increase false-positives).</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.strictMode}
                onChange={(e) => setSettings({ ...settings, strictMode: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" className="btn-primary">Save Configuration</button>
            {statusMsg && <span style={{ color: 'var(--color-safe)', fontSize: '0.9rem', fontWeight: 500 }}>{statusMsg}</span>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title"><AlertIcon /> Threat Intelligence Blacklist Feeds</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Manually populate local threat nodes to simulate active shield blocks and test real-time click redirection.
        </p>

        <form onSubmit={handleAddBlacklist} className="input-container">
          <label className="input-label">Block Malicious Hostname</label>
          <div className="url-input-wrapper">
            <input 
              type="text" 
              className="input-text" 
              placeholder="e.g., evil-login-portal.com" 
              value={blacklistDomain}
              onChange={(e) => setBlacklistDomain(e.target.value)}
            />
            <button type="submit" className="btn-primary">Add Threat Node</button>
          </div>
          {blacklistMsg && <p style={{ color: 'var(--color-warning)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>{blacklistMsg}</p>}
        </form>
      </div>
    </div>
  );
}
