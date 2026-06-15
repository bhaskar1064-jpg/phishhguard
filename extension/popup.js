// Active Elements
const activeTabUrlEl = document.getElementById('active-tab-url');
const activeTabVerdictEl = document.getElementById('active-tab-verdict');
const activeTabSpinnerEl = document.getElementById('active-tab-spinner');

const scanForm = document.getElementById('scan-form');
const scanInput = document.getElementById('scan-input');
const scanBtn = document.getElementById('scan-btn');

const resultBox = document.getElementById('result-box');
const resultBadge = document.getElementById('result-badge');
const resultReason = document.getElementById('result-reason');

const indicatorsBox = document.getElementById('indicators-box');
const indicatorsList = document.getElementById('indicators-list');

const aiExplainBox = document.getElementById('ai-explain-box');
const aiLoader = document.getElementById('ai-loader');
const aiBody = document.getElementById('ai-body');
const aiWhy = document.getElementById('ai-why');
const aiHow = document.getElementById('ai-how');
const aiWhat = document.getElementById('ai-what');

const dashboardBtn = document.getElementById('dashboard-btn');

// 1. Diagnose Active Tab on Load
document.addEventListener('DOMContentLoaded', () => {
  // Query for current active window tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      activeTabUrlEl.textContent = 'No active tab found';
      activeTabVerdictEl.textContent = 'Verification unavailable';
      activeTabVerdictEl.className = 'tab-verdict-banner suspicious';
      return;
    }
    
    const activeTab = tabs[0];
    const url = activeTab.url;
    
    activeTabUrlEl.textContent = url;
    activeTabUrlEl.title = url;

    // Ignore browser internal pages
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      activeTabVerdictEl.textContent = 'System Page (Verified Safe)';
      activeTabVerdictEl.className = 'tab-verdict-banner safe';
      if (activeTabSpinnerEl) activeTabSpinnerEl.remove();
      return;
    }

    // Call background reputation scan
    chrome.runtime.sendMessage({ action: 'check-url', url }, (response) => {
      if (activeTabSpinnerEl) activeTabSpinnerEl.remove();
      
      if (response && response.success) {
        const reputation = response.data;
        activeTabVerdictEl.textContent = `${reputation.status.toUpperCase()}: ${reputation.reason}`;
        activeTabVerdictEl.className = `tab-verdict-banner ${reputation.status}`;
        
        // Auto-show threat card if dangerous active tab
        if (reputation.status !== 'safe') {
          showManualScanResult(url, reputation);
        }
      } else {
        activeTabVerdictEl.textContent = 'Scan Error: Backend unreachable';
        activeTabVerdictEl.className = 'tab-verdict-banner suspicious';
      }
    });
  });
});

// 2. Manual URL Check
scanForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = scanInput.value.trim();
  if (!url) return;

  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';
  
  resultBox.classList.add('hidden');
  indicatorsBox.classList.add('hidden');
  aiExplainBox.classList.add('hidden');

  chrome.runtime.sendMessage({ action: 'check-url', url }, (response) => {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan';

    if (response && response.success) {
      showManualScanResult(url, response.data);
    } else {
      alert('Scanning failed. Make sure the local PhishGuard backend is running.');
    }
  });
});

function showManualScanResult(url, reputation) {
  resultBox.classList.remove('hidden');
  
  // Badge
  resultBadge.textContent = reputation.status;
  resultBadge.className = `badge ${reputation.status}`;
  resultReason.textContent = reputation.reason;

  // Indicators list
  if (reputation.details && reputation.details.length > 0) {
    indicatorsBox.classList.remove('hidden');
    indicatorsList.innerHTML = '';
    reputation.details.forEach(detail => {
      const li = document.createElement('li');
      li.textContent = detail;
      indicatorsList.appendChild(li);
    });
  } else {
    indicatorsBox.classList.add('hidden');
  }

  // AI advisory
  if (reputation.status !== 'safe') {
    aiExplainBox.classList.remove('hidden');
    aiLoader.classList.remove('hidden');
    aiBody.classList.add('hidden');

    chrome.runtime.sendMessage({
      action: 'explain-threat',
      threatData: {
        type: 'url',
        input: url,
        status: reputation.status,
        reason: reputation.reason,
        details: reputation.details
      }
    }, (explainResponse) => {
      aiLoader.classList.add('hidden');
      
      if (explainResponse && explainResponse.success) {
        const explain = explainResponse.data;
        aiBody.classList.remove('hidden');
        
        // Populate bullet points
        aiWhy.innerHTML = '';
        explain.why.forEach(w => {
          const li = document.createElement('li');
          li.textContent = w;
          aiWhy.appendChild(li);
        });

        aiHow.textContent = explain.how;

        aiWhat.innerHTML = '';
        explain.what.forEach(w => {
          const li = document.createElement('li');
          li.textContent = w;
          aiWhat.appendChild(li);
        });
      } else {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'Explanation unavailable. Please verify API key settings.';
        errorMsg.style.color = 'var(--color-warning)';
        errorMsg.style.fontSize = '0.75rem';
        aiExplainBox.appendChild(errorMsg);
      }
    });
  } else {
    aiExplainBox.classList.add('hidden');
  }
}

// 3. Open dashboard console link
dashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5000/' });
});
