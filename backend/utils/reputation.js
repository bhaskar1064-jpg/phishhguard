const db = require('../database');

/**
 * Computes the Levenshtein distance between two strings.
 * Used to detect typo-squatting (e.g., microsoft vs micros0ft).
 */
function getLevenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalizes common homoglyphs/lookalike characters to standard English letters.
 * Helps catch phishing domains that swap characters (e.g., paypaI with capital 'I' instead of 'l').
 */
function normalizeHomoglyphs(str) {
  const map = {
    '0': 'o',
    '1': 'i',
    'l': 'i', // map l and i together to catch visual swaps
    'I': 'i',
    'vv': 'w',
    'rn': 'm',
    'cl': 'd'
  };
  
  let normalized = str.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    normalized = normalized.split(key).join(value);
  }
  return normalized;
}

/**
 * Extracts the main domain components (hostname, second-level domain, and TLD).
 */
function parseDomain(urlStr) {
  try {
    // Add protocol if missing for URL parsing
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'http://' + urlStr;
    }
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    
    // Split into parts to extract second-level domain (SLD)
    const parts = hostname.split('.');
    let sld = '';
    let tld = '';
    
    if (parts.length >= 2) {
      // Basic extraction (handles typical domains, e.g. google.com or paypal.co.uk)
      const isMultiPartTld = ['co', 'com', 'org', 'net', 'gov', 'ac'].includes(parts[parts.length - 2]);
      if (isMultiPartTld && parts.length >= 3) {
        sld = parts[parts.length - 3];
        tld = parts.slice(parts.length - 2).join('.');
      } else {
        sld = parts[parts.length - 2];
        tld = parts[parts.length - 1];
      }
    } else {
      sld = hostname;
    }
    
    return { hostname, sld, tld };
  } catch (err) {
    // Fallback regex if URL constructor fails
    const match = urlStr.match(/^(?:https?:\/\/)?([^/?#:]+)/i);
    const hostname = match ? match[1].toLowerCase() : urlStr.toLowerCase();
    const parts = hostname.split('.');
    const sld = parts.length > 1 ? parts[parts.length - 2] : hostname;
    return { hostname, sld, tld: parts.length > 1 ? parts[parts.length - 1] : '' };
  }
}

/**
 * Core function to check a URL against the reputation database and run heuristics.
 */
function checkUrlReputation(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { status: 'safe', reason: 'Invalid URL provided', details: [] };
  }

  const cleanUrl = url.trim();
  const { hostname, sld } = parseDomain(cleanUrl);
  
  const blacklist = db.getBlacklist();
  const reputableBrands = db.getReputableBrands();

  // 1. Direct Blacklist Check
  if (blacklist.includes(hostname) || blacklist.includes(cleanUrl)) {
    return {
      status: 'malicious',
      reason: 'Known Phishing Site',
      details: ['This URL is registered in our threat intelligence blacklist as a verified phishing node.']
    };
  }

  // 2. Exact Reputable Domain Match
  const matchingBrand = reputableBrands.find(brand => {
    const brandParsed = parseDomain(brand);
    // Safe if it is exactly the reputable domain or a subdomain (e.g. login.paypal.com is safe)
    return hostname === brandParsed.hostname || hostname.endsWith('.' + brandParsed.hostname);
  });

  if (matchingBrand) {
    return {
      status: 'safe',
      reason: 'Verified Brand',
      details: [`Verified official domain belonging to ${matchingBrand}`]
    };
  }

  // 3. Typo-Squatting / Lookalike Detection (Heuristics)
  const suspiciousDetails = [];
  let isLookalike = false;
  let targetBrandName = '';

  for (const brand of reputableBrands) {
    const brandParsed = parseDomain(brand);
    const brandSld = brandParsed.sld;

    // A. Check Levenshtein Distance of SLD
    const distance = getLevenshteinDistance(sld, brandSld);
    if (distance > 0 && distance <= 2) {
      isLookalike = true;
      targetBrandName = brand;
      suspiciousDetails.push(
        `Character variance: "${sld}" is highly similar to the reputable brand name "${brandSld}" (Levenshtein distance: ${distance}).`
      );
      break;
    }

    // B. Check Homoglyphs / Visual Lookalikes
    const normalizedInput = normalizeHomoglyphs(sld);
    const normalizedBrand = normalizeHomoglyphs(brandSld);
    if (sld !== brandSld && normalizedInput === normalizedBrand) {
      isLookalike = true;
      targetBrandName = brand;
      suspiciousDetails.push(
        `Visual spoofing (homoglyph) detected: Characters in "${sld}" visually mimic the reputable brand "${brandSld}".`
      );
      break;
    }

    // C. Check for Brand Name hijacking (e.g., paypal-login-alert.com or paypaI-security.com)
    // If brand SLD (or visual lookalike) is inside the input host, and it's not the official domain
    const normalizedHost = normalizeHomoglyphs(hostname);
    const normalizedBrandSld = normalizeHomoglyphs(brandSld);
    if (sld !== brandSld && normalizedHost.includes(normalizedBrandSld)) {
      isLookalike = true;
      targetBrandName = brand;
      suspiciousDetails.push(
        `Brand Hijacking: The reputable brand name "${brandSld}" (or visual lookalike) is embedded in an unauthorized domain name "${hostname}".`
      );
      break;
    }
  }

  if (isLookalike) {
    return {
      status: 'malicious',
      reason: 'Typo-Squatting & Brand Impersonation',
      details: [
        `This domain is designed to mimic ${targetBrandName}.`,
        ...suspiciousDetails
      ]
    };
  }

  // 4. Default Safe (Unrecognized but no malicious patterns found)
  return {
    status: 'safe',
    reason: 'Unverified but clean',
    details: ['This domain is not currently flag-marked, and does not show brand impersonation indicators.']
  };
}

module.exports = {
  checkUrlReputation,
  parseDomain,
  getLevenshteinDistance
};
