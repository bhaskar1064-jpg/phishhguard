// Inject PhishGuard isolated CSS styles into the host page
const styleEl = document.createElement('style');
styleEl.textContent = `
  #pg-shield-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: rgba(8, 11, 20, 0.95) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    z-index: 2147483647 !important; /* Always on top */
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    color: #f3f4f6 !important;
    opacity: 0;
    transition: opacity 0.3s ease !important;
    box-sizing: border-box !important;
  }
  
  #pg-shield-overlay * {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.5 !important;
  }
  
  #pg-shield-card {
    background: #0f1526 !important;
    border: 1px solid rgba(255, 0, 85, 0.3) !important;
    border-radius: 16px !important;
    width: 90% !important;
    max-width: 600px !important;
    padding: 2rem !important;
    box-shadow: 0 10px 40px rgba(255, 0, 85, 0.2) !important;
    text-align: left !important;
    transform: translateY(20px) !important;
    transition: transform 0.3s ease !important;
  }
  
  #pg-shield-header {
    display: flex !important;
    align-items: center !important;
    gap: 1rem !important;
    margin-bottom: 1.5rem !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    padding-bottom: 1rem !important;
  }
  
  #pg-shield-icon {
    width: 44px !important;
    height: 44px !important;
    background: rgba(255, 0, 85, 0.15) !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ff0055 !important;
    flex-shrink: 0 !important;
  }
  
  #pg-shield-title {
    font-size: 1.35rem !important;
    font-weight: 700 !important;
    color: #ff0055 !important;
    text-transform: uppercase !important;
    letter-spacing: -0.01em !important;
  }
  
  #pg-shield-url {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding: 0.75rem 1rem !important;
    border-radius: 8px !important;
    font-family: monospace !important;
    font-size: 0.9rem !important;
    color: #ffb700 !important;
    word-break: break-all !important;
    margin-bottom: 1rem !important;
  }
  
  #pg-shield-verdict {
    font-size: 1rem !important;
    font-weight: 600 !important;
    margin-bottom: 1rem !important;
  }
  
  #pg-shield-ai-box {
    margin-top: 1.5rem !important;
    border-left: 3px solid #3b82f6 !important;
    background: rgba(59, 130, 246, 0.03) !important;
    padding: 1rem 1.25rem !important;
    border-radius: 0 8px 8px 0 !important;
    font-size: 0.9rem !important;
  }
  
  #pg-shield-ai-title {
    font-weight: 700 !important;
    color: #3b82f6 !important;
    margin-bottom: 0.5rem !important;
    text-transform: uppercase !important;
    font-size: 0.8rem !important;
    letter-spacing: 0.05em !important;
  }
  
  .pg-shield-bullet-list {
    list-style: none !important;
    margin-top: 0.5rem !important;
  }
  
  .pg-shield-bullet-list li {
    position: relative !important;
    padding-left: 1rem !important;
    margin-bottom: 0.25rem !important;
    color: #9ca3af !important;
  }
  
  .pg-shield-bullet-list li::before {
    content: "•" !important;
    position: absolute !important;
    left: 0 !important;
    color: #3b82f6 !important;
  }
  
  .pg-shield-consequences li::before {
    color: #ff0055 !important;
  }
  
  #pg-shield-btn-group {
    display: flex !important;
    gap: 1rem !important;
    margin-top: 2rem !important;
    justify-content: flex-end !important;
  }
  
  .pg-shield-btn {
    border: none !important;
    border-radius: 8px !important;
    padding: 0.75rem 1.5rem !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
  }
  
  #pg-shield-btn-abort {
    background: #ff0055 !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(255, 0, 85, 0.3) !important;
  }
  
  #pg-shield-btn-abort:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(255, 0, 85, 0.45) !important;
  }
  
  #pg-shield-btn-bypass {
    background: transparent !important;
    color: #9ca3af !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  
  #pg-shield-btn-bypass:hover {
    color: white !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }
  
  /* Top-bar scan loader indicator */
  #pg-scan-loader {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 3px !important;
    background: linear-gradient(to right, #3b82f6, #00f0ff, #3b82f6) !important;
    z-index: 2147483647 !important;
    background-size: 200% auto !important;
    animation: pg-loader-slide 1.5s linear infinite !important;
  }
  
  @keyframes pg-loader-slide {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
`;
document.head.appendChild(styleEl);

// Keep track of bypassed links for the current tab session
const bypassedUrls = new Set();

// Click Interceptor Event Binding
document.addEventListener('click', (event) => {
  // Find nearest anchor tag parent
  let target = event.target;
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }
  
  if (!target || !target.href) return;
  
  const href = target.href;
  
  // Ignore local hashes, javascript, or non-web links
  if (!href.startsWith('http://') && !href.startsWith('https://')) return;
  if (bypassedUrls.has(href)) return; // Allow if user chose to proceed previously

  // Intercept navigation
  event.preventDefault();
  event.stopPropagation();
  
  // Show active scanning indicator
  showScanLoader();
  
  // Send URL check query to background service worker
  chrome.runtime.sendMessage({ action: 'check-url', url: href }, (response) => {
    hideScanLoader();
    
    if (response && response.success) {
      const reputation = response.data;
      if (reputation.status === 'malicious' || reputation.status === 'suspicious') {
        // Trigger Warning Overlay Blocking Modal
        displayWarningOverlay(href, reputation);
      } else {
        // Safe, resume navigation
        resumeNavigation(target);
      }
    } else {
      // Error / Offline, fallback: resume navigation
      resumeNavigation(target);
    }
  });
}, true); // Capture phase to intercept clicks before other listeners

function showScanLoader() {
  if (document.getElementById('pg-scan-loader')) return;
  const loader = document.createElement('div');
  loader.id = 'pg-scan-loader';
  document.body.appendChild(loader);
}

function hideScanLoader() {
  const loader = document.getElementById('pg-scan-loader');
  if (loader) loader.remove();
}

function resumeNavigation(anchor) {
  bypassedUrls.add(anchor.href);
  if (anchor.target === '_blank') {
    window.open(anchor.href, '_blank');
  } else {
    window.location.href = anchor.href;
  }
}

function displayWarningOverlay(targetUrl, reputation) {
  // Prevent duplicate modals
  if (document.getElementById('pg-shield-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'pg-shield-overlay';
  
  overlay.innerHTML = `
    <div id="pg-shield-card">
      <div id="pg-shield-header">
        <div id="pg-shield-icon">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z"/></svg>
        </div>
        <div id="pg-shield-title">Threat Blocked by PhishGuard</div>
      </div>
      
      <div id="pg-shield-url">${escapeHtml(targetUrl)}</div>
      
      <div id="pg-shield-verdict" style="color: ${reputation.status === 'malicious' ? '#ff0055' : '#ffb700'}">
        Verdict: ${reputation.status.toUpperCase()} (${escapeHtml(reputation.reason)})
      </div>
      
      <div id="pg-shield-ai-box">
        <div id="pg-shield-ai-title">AI Explanations Engine</div>
        <div id="pg-shield-ai-content" style="color: #9ca3af; font-size: 0.875rem;">
          <span style="display:inline-block; width:12px; height:12px; border:2px solid #3b82f6; border-top-color:transparent; border-radius:50%; animation:pg-spin 0.8s linear infinite; margin-right:6px;"></span>
          Consulting threat models for explanation advisory...
        </div>
      </div>
      
      <div id="pg-shield-btn-group">
        <button id="pg-shield-btn-bypass" class="pg-shield-btn">Proceed Anyway (Unsafe)</button>
        <button id="pg-shield-btn-abort" class="pg-shield-btn">Get Me Out of Here</button>
      </div>
    </div>
  `;
  
  // Spin keyframes helper style injection (scoped)
  const spinStyle = document.createElement('style');
  spinStyle.textContent = `@keyframes pg-spin { to { transform: rotate(360deg); } }`;
  overlay.appendChild(spinStyle);
  
  document.body.appendChild(overlay);
  
  // Trigger animations
  setTimeout(() => {
    overlay.style.opacity = '1';
    document.getElementById('pg-shield-card').style.transform = 'translateY(0)';
  }, 50);

  // Query AI explanations in the background
  chrome.runtime.sendMessage({
    action: 'explain-threat',
    threatData: {
      type: 'url',
      input: targetUrl,
      status: reputation.status,
      reason: reputation.reason,
      details: reputation.details
    }
  }, (response) => {
    const aiContent = document.getElementById('pg-shield-ai-content');
    if (!aiContent) return;
    
    if (response && response.success && response.data) {
      const explain = response.data;
      
      let whyHtml = '';
      explain.why.forEach(w => { whyHtml += `<li>${escapeHtml(w)}</li>`; });
      
      let whatHtml = '';
      explain.what.forEach(w => { whatHtml += `<li>${escapeHtml(w)}</li>`; });

      aiContent.innerHTML = `
        <div style="margin-bottom: 0.75rem;">
          <div style="font-weight:600; color:#fff; font-size:0.85rem; margin-bottom:0.25rem;">WHY:</div>
          <ul class="pg-shield-bullet-list">${whyHtml}</ul>
        </div>
        <div style="margin-bottom: 0.75rem;">
          <div style="font-weight:600; color:#fff; font-size:0.85rem; margin-bottom:0.25rem;">HOW:</div>
          <div style="color:#9ca3af; line-height:1.4;">${escapeHtml(explain.how)}</div>
        </div>
        <div>
          <div style="font-weight:600; color:#ff0055; font-size:0.85rem; margin-bottom:0.25rem;">CONSEQUENCES:</div>
          <ul class="pg-shield-bullet-list pg-shield-consequences">${whatHtml}</ul>
        </div>
      `;
    } else {
      aiContent.innerHTML = `<span style="color:#ffb700;">Could not load AI explanation. Please check backend status or key logs.</span>`;
    }
  });

  // Bind Buttons
  document.getElementById('pg-shield-btn-abort').addEventListener('click', () => {
    overlay.style.opacity = '0';
    document.getElementById('pg-shield-card').style.transform = 'translateY(20px)';
    setTimeout(() => { overlay.remove(); }, 300);
  });

  document.getElementById('pg-shield-btn-bypass').addEventListener('click', () => {
    bypassedUrls.add(targetUrl);
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      window.location.href = targetUrl;
    }, 300);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
