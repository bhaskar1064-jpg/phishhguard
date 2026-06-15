const API_BASE = 'http://localhost:5000/api';

// Listen for messages from content.js or popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background worker received message:', request);

  if (request.action === 'check-url') {
    fetch(`${API_BASE}/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: request.url })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('Error checking reputation API:', err);
        // Fallback: If backend is offline, perform basic local checks
        const mockResponse = fallbackCheck(request.url);
        sendResponse({ success: true, data: mockResponse, offline: true });
      });

    return true; // Keeps the messaging pipeline open for async sendResponse
  }

  if (request.action === 'explain-threat') {
    fetch(`${API_BASE}/explain-threat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.threatData)
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        sendResponse({ success: true, data: data.explanation });
      })
      .catch(err => {
        console.error('Error obtaining threat explanations:', err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});

/**
 * Basic fallback URL analyzer in case the backend server is offline.
 * Ensures the extension is still functional.
 */
function fallbackCheck(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    
    // Simple lookalike check for demonstration
    if (host.includes('micros0ft') || host.includes('paypaI') || host.includes('arnazon')) {
      return {
        status: 'malicious',
        reason: 'Offline Heuristic: Lookalike Domain detected',
        details: [`The link host "${host}" appears to impersonate a reputable online service.`]
      };
    }
  } catch (err) {}
  
  return {
    status: 'safe',
    reason: 'Offline Heuristic: No indicators detected (server offline)',
    details: ['Verification details are limited because the PhishGuard backend is currently offline.']
  };
}
