const https = require('https');
const db = require('../database');

/**
 * Performs a native HTTPS POST request.
 * Keeps backend zero-dependency and fast.
 */
function makePostRequest(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Fallback rule-based threat generator.
 * Creates clean, detailed explanations based on threat details.
 */
function getTemplateExplanation(threatData) {
  const { type, input, reason, details } = threatData;
  const target = input && input.length > 50 ? input.substring(0, 50) + '...' : input;

  if (type === 'url') {
    const isLookalike = details.some(d => d.includes('Levenshtein') || d.includes('spoofing') || d.includes('mimic') || d.includes('Hijacking'));
    if (isLookalike) {
      return {
        why: [
          `Lookalike domain detected: The address "${target}" closely matches a reputable brand but has spelling variations.`,
          `Impersonation risk: The structure is typical of phishing kits hosted on cheap or free registrar domains.`,
          `No valid ownership records connecting this specific domain to the official brand.`
        ],
        how: `This is a "typo-squatting" or visual homoglyph attack. Attackers register domains that look almost identical to popular brands (like replacing 'l' with 'I' or 'o' with '0'). When you load this link, it presents a cloned version of the brand's actual login page. Because the page looks identical, you are tricked into entering your username, password, or security codes directly into the attacker's database.`,
        what: [
          `Credential Theft: Immediate loss of control over your account.`,
          `Identity Hijacking: Attackers can lock you out, change recovery details, and impersonate you.`,
          `Financial Risk: If the brand is a bank, payment portal, or store, your linked cards and funds could be stolen.`
        ]
      };
    } else {
      // General blacklist match
      return {
        why: [
          `Blacklist match: This URL appears directly in the cyber intelligence blacklist database.`,
          `Known malicious node: The domain is reported as active in deploying malicious payloads or fake forms.`
        ],
        how: `This domain has been reported and verified by cybersecurity groups as a threat vector. Once visited, it either attempts to load credential harvesting forms or triggers automated drive-by scripts that download malicious payloads or adware in the background of your web browser.`,
        what: [
          `Malware Installation: Ransomware or spyware could be stealthily downloaded to your device.`,
          `Browser Hijacking: Exploits could compromise cookies, active sessions, and browser credentials.`,
          `Data Exfiltration: Personal files or system diagnostics could be sent to remote attacker nodes.`
        ]
      };
    }
  } else {
    // Email Threat explanation
    const urgencyKeywords = details.filter(d => d.type === 'Urgency').map(d => d.phrase);
    const keywordStr = urgencyKeywords.length > 0 ? `"${urgencyKeywords.join('", "')}"` : 'urgent urgency markers';
    return {
      why: [
        `Urgency/Coercive language: The email contains pressure tactics like ${keywordStr} forcing quick actions.`,
        `Generic greetings: Uses generic salutations rather than addressing you by your registered name.`,
        `Embedded risk links: Scanned links mismatch official server endpoints or contain suspicious characters.`
      ],
      how: `Phishing emails rely on psychological manipulation. By creating a false sense of urgency (e.g., claiming your account is about to be suspended or you have an unpaid bill), they trigger panic. This panic bypasses critical thinking, making you click embedded links to "verify" or "resolve" the issue. The links lead to cloned landing pages designed to capture your login details.`,
      what: [
        `Credential Harvesting: Snatching account passwords and multi-factor auth tokens.`,
        `Financial Scam: Prompts you to authorize fake invoice payments or send currency to accounts controlled by scammers.`,
        `Corporate Network Entry: If accessed from a company machine, attackers can leverage the credentials to enter and lateral-spread across the internal network.`
      ]
    };
  }
}

/**
 * Main function that coordinates LLM checks or Template Fallbacks.
 */
async function explainThreat(threatData) {
  const settings = db.getSettings();
  const { type, input, reason, details } = threatData;
  const isMalicious = threatData.status === 'malicious';

  // Define system prompts
  const systemPrompt = `You are PhishGuard AI, an expert cybersecurity analysis engine. 
Analyze the following threat report and generate a clear, human-readable explanation in JSON format.
Your output JSON must contain exactly these three fields:
1. "why": An array of strings (bullet points) explaining why this was flagged as unsafe (e.g. lookalike domain, urgent pressure language, etc.).
2. "how": A single paragraph explaining in plain language how this threat works to deceive users.
3. "what": An array of strings (bullet points) detailing the exact issues/consequences if the user proceeds (e.g. credential theft, financial fraud, malware install, etc.).

Do not include any markdown styling or wrapper text (like \`\`\`json) outside the raw JSON object. Return clean JSON.`;

  const userPrompt = `Input Threat details to analyze:
Type: ${type}
Target Checked: ${input}
Heuristics Flags: ${JSON.stringify(details)}
Flag Reason: ${reason}
Severity: ${isMalicious ? 'Malicious' : 'Suspicious'}`;

  // 1. Try Gemini API
  if (settings.geminiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };
      
      const responseText = await makePostRequest(url, {}, payload);
      const resData = JSON.parse(responseText);
      const content = resData.candidates[0].content.parts[0].text;
      return JSON.parse(content);
    } catch (err) {
      console.error('Gemini API execution error, falling back:', err.message);
    }
  }

  // 2. Try OpenAI API
  if (settings.openaiApiKey) {
    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${settings.openaiApiKey}`
      };
      const payload = {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1
      };

      const responseText = await makePostRequest(url, headers, payload);
      const resData = JSON.parse(responseText);
      const content = resData.choices[0].message.content;
      return JSON.parse(content);
    } catch (err) {
      console.error('OpenAI API execution error, falling back:', err.message);
    }
  }

  // 3. Fallback to rule-based templates if no keys are available or requests fail
  return getTemplateExplanation(threatData);
}

module.exports = {
  explainThreat
};
