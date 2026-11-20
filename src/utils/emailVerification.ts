/**
 * Email Verification & Anti-Fake Mail Engine
 * Multi-layer validation for contact forms:
 * Layer 1: Strict RFC 5322 Syntax & Domain Structure Check
 * Layer 2: Disposable / Burner / Temporary Email Domain Blocklist & Heuristics
 * Layer 3: Reserved, Fake, Test & Private TLD Domain Blocklist (with full subdomain traversal)
 * Layer 4: Suspicious Username, No-Reply & Repetitive Mash Pattern Detection
 * Layer 5: Typo-Squatting Detection & Suggested Fixes for Major Providers
 * Layer 6: Live DNS MX Record Verification via DNS-over-HTTPS (DoH with independent fallback)
 */

export interface EmailVerificationResult {
  isValid: boolean;
  reason?: string;
  category?:
    | 'syntax'
    | 'disposable'
    | 'reserved_test'
    | 'suspicious_pattern'
    | 'typo'
    | 'mx_check'
    | 'valid';
  mxRecordsFound?: boolean;
  suggestedFix?: string;
}

// RFC 5322 simplified but strict syntax regex
// - Local part: alphanumeric and valid special chars (_%+.-), no consecutive dots, cannot start/end with dot
// - Domain part: standard domain labels separated by dots
// - TLD: minimum 2 alpha characters
const EMAIL_SYNTAX_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Exhaustive blocklist of disposable, temporary, burner, and trash email domains
export const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  '20minutemail.it',
  'abcvg.com',
  'anonymousemail.me',
  'armyspy.com',
  'bccto.me',
  'binkmail.com',
  'bobmail.info',
  'burnmail.io',
  'burnermail.io',
  'burnermail.net',
  'chacuo.net',
  'cool.fr.nf',
  'courriel.fr.nf',
  'crazymailing.com',
  'cuvox.de',
  'dayrep.com',
  'deadaddress.com',
  'devnullmail.com',
  'disposablemail.com',
  'dispostable.com',
  'drdrb.com',
  'dropmail.me',
  'einrot.com',
  'emailfake.com',
  'emailondeck.com',
  'fakeinbox.com',
  'fakemail.net',
  'fakemailgenerator.com',
  'filzmail.com',
  'fleckens.hu',
  'generator.email',
  'getairmail.com',
  'getnada.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.block',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'gustr.com',
  'harakirimail.com',
  'inboxbear.com',
  'inboxkitten.com',
  'incognitomail.org',
  'jetable.fr.nf',
  'jetable.org',
  'jourrapide.com',
  'kasmail.com',
  'mailcatch.com',
  'maildecheterie.com',
  'maildrop.cc',
  'maildujour.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailimate.com',
  'mailin8r.com',
  'mailinator.co',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'mailinator2.com',
  'mailmetrash.com',
  'mailmoat.com',
  'mailnesia.com',
  'mailnull.com',
  'mailshell.com',
  'mailtothis.com',
  'mailzilla.org',
  'meltmail.com',
  'minutemail.com',
  'mohmal.com',
  'mohmal.im',
  'mohmal.in',
  'moncourrier.fr.nf',
  'mytrashmail.com',
  'mytemp.email',
  'mytempemail.com',
  'nada.ltd',
  'nobulk.com',
  'noclickemail.com',
  'nomail.xl.cx',
  'nospam.ze.tc',
  'nospam4.us',
  'nospamfor.us',
  'nowmymail.com',
  'objectmail.com',
  'oneoffmail.com',
  'pokemail.net',
  'pookmail.com',
  'quickinbox.com',
  'rhyta.com',
  'safersignup.com',
  'safersignup.de',
  'safersignup.net',
  'safetymail.info',
  'sendspamhere.com',
  'sharklasers.com',
  'shortmail.net',
  'sogetthis.com',
  'soodonims.com',
  'spam.la',
  'spam4.me',
  'spambob.com',
  'spambob.net',
  'spambob.org',
  'spambox.us',
  'spamex.com',
  'spamex.net',
  'spamfree24.org',
  'spamgourmet.com',
  'spamhole.com',
  'spaminator.de',
  'spammotel.com',
  'spamsiphon.com',
  'spamspot.com',
  'speed.1s.fr',
  'superrito.com',
  'superstachel.de',
  'suremail.info',
  'tafmail.com',
  'teewars.org',
  'teleworm.us',
  'temp-mail.com',
  'temp-mail.io',
  'temp-mail.org',
  'temp-mail.ru',
  'temporaryemail.net',
  'temporaryinbox.com',
  'tempail.com',
  'tempm.com',
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'tempmailaddress.com',
  'tempmailo.com',
  'thanksnospam.info',
  'throwawayemailaddress.com',
  'throwawaymail.com',
  'tmail.ws',
  'trash-mail.at',
  'trash-mail.com',
  'trashmail.at',
  'trashmail.com',
  'trashmail.io',
  'trashmail.me',
  'trashmail.net',
  'trashmail.org',
  'trashmailer.com',
  'trashymail.com',
  'twinmail.de',
  'tyldd.com',
  'uggsrock.com',
  'wegwerfadresse.de',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'whyspam.me',
  'willselfdestruct.com',
  'winemaven.in',
  'wronghead.com',
  'wuzup.net',
  'wuzupmail.net',
  'yep.it',
  'yogamaven.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yopmail.org',
  'zetmail.com',
  'zippymail.info',
]);

// Keywords in domain labels that indicate a disposable provider
const DISPOSABLE_DOMAIN_KEYWORDS = [
  'tempmail',
  'disposablemail',
  'throwawaymail',
  'trashmail',
  'fakemail',
  'burnermail',
  'guerrillamail',
  'mailinator',
  '10minutemail',
  'minutemail',
  'yopmail',
  'dropmail',
  'getairmail',
  'fakeinbox',
];

// RFC 2606 / 6761 reserved domains and obvious placeholder / test domains
export const RESERVED_OR_TEST_DOMAINS: ReadonlySet<string> = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'test.com',
  'test.org',
  'test.net',
  'invalid',
  'invalid.com',
  'localhost',
  'local',
  'fake.com',
  'fakemail.com',
  'dummy.com',
  'nowhere.com',
  'nobody.com',
  'none.com',
  'asdf.com',
  'qwerty.com',
  'xyz.com',
  'foo.com',
  'bar.com',
  'foobar.com',
  'user.com',
  'domain.com',
  'noemail.com',
  'sample.com',
  'demo.com',
  'email.test',
  'mail.test',
]);

// Reserved and private TLDs that can never receive mail on the global Internet
const RESERVED_TLDS: ReadonlySet<string> = new Set([
  'test',
  'example',
  'invalid',
  'localhost',
  'local',
  'internal',
  'corp',
  'lan',
  'home',
  'box',
]);

// Known typo-squatting or common misspellings of major email providers
const COMMON_DOMAIN_TYPOS: ReadonlyMap<string, string> = new Map([
  ['gamil.com', 'gmail.com'],
  ['gmial.com', 'gmail.com'],
  ['gmaill.com', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gamil.co', 'gmail.com'],
  ['gnail.com', 'gmail.com'],
  ['hotmial.com', 'hotmail.com'],
  ['hotmai.com', 'hotmail.com'],
  ['hotamail.com', 'hotmail.com'],
  ['yaho.com', 'yahoo.com'],
  ['yahool.com', 'yahoo.com'],
  ['yhoo.com', 'yahoo.com'],
  ['outlok.com', 'outlook.com'],
  ['putlook.com', 'outlook.com'],
  ['outllok.com', 'outlook.com'],
  ['iclud.com', 'icloud.com'],
  ['protnmail.com', 'protonmail.com'],
]);

// In-memory DNS cache to avoid duplicate network lookups
const mxCache = new Map<string, { hasMx: boolean; isNxDomain: boolean }>();

/**
 * Validates basic RFC syntax, length, and presence of local & domain parts.
 */
export function verifyEmailSyntax(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address cannot be empty.' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email exceeds maximum length (254 characters).' };
  }

  if (trimmed.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots.' };
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { isValid: false, error: 'Email must contain exactly one "@" symbol.' };
  }

  const [localPart, domain] = trimmed.split('@');
  if (!localPart || localPart.length > 64) {
    return { isValid: false, error: 'Local username must be between 1 and 64 characters.' };
  }

  if (!domain || domain.length > 253) {
    return { isValid: false, error: 'Domain name must be between 1 and 253 characters.' };
  }

  if (!EMAIL_SYNTAX_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Email syntax violates standard RFC formatting.' };
  }

  return { isValid: true };
}

/**
 * Checks if a domain, its subdomains, or any keyword matches a disposable provider.
 */
export function isDisposableEmail(emailOrDomain: string): boolean {
  const lower = emailOrDomain.trim().toLowerCase();
  const domain = lower.includes('@') ? lower.split('@')[1] : lower;
  if (!domain) return false;

  // Exact match
  if (DISPOSABLE_DOMAINS.has(domain)) return true;

  // Check parent domains (e.g. sub.mailinator.com -> mailinator.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DISPOSABLE_DOMAINS.has(parent)) {
      return true;
    }
  }

  // Keyword heuristic across domain labels
  for (const part of parts) {
    for (const kw of DISPOSABLE_DOMAIN_KEYWORDS) {
      if (part.includes(kw)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if domain is a reserved RFC domain, test domain, uses a reserved TLD,
 * or is a subdomain of a reserved domain.
 */
export function isReservedOrTestDomain(emailOrDomain: string): boolean {
  const lower = emailOrDomain.trim().toLowerCase();
  const domain = lower.includes('@') ? lower.split('@')[1] : lower;
  if (!domain) return false;

  // Exact match
  if (RESERVED_OR_TEST_DOMAINS.has(domain)) return true;

  // Walk parent domain slices (e.g. sub.example.com -> example.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (RESERVED_OR_TEST_DOMAINS.has(parent)) {
      return true;
    }
  }

  // Check reserved TLD
  const tld = parts[parts.length - 1];
  if (RESERVED_TLDS.has(tld)) return true;

  return false;
}

/**
 * Detects common typosquatting or misspellings and suggests the correct provider.
 */
export function checkDomainTypo(email: string): { isTypo: boolean; suggestedDomain?: string; suggestedEmail?: string } {
  const lower = email.trim().toLowerCase();
  const atIdx = lower.lastIndexOf('@');
  if (atIdx === -1) return { isTypo: false };

  const localPart = lower.slice(0, atIdx);
  const domain = lower.slice(atIdx + 1);

  if (COMMON_DOMAIN_TYPOS.has(domain)) {
    const correctDomain = COMMON_DOMAIN_TYPOS.get(domain)!;
    return {
      isTypo: true,
      suggestedDomain: correctDomain,
      suggestedEmail: `${localPart}@${correctDomain}`,
    };
  }

  return { isTypo: false };
}

/**
 * Detects obvious mash, repeating character, no-reply, automated, or placeholder usernames.
 */
export function isSuspiciousPattern(email: string): boolean {
  const lower = email.trim().toLowerCase();
  const localPart = (lower.split('@')[0] || '').trim();

  if (localPart.length <= 1) return true;

  // Single character repeated 3 or more times (e.g. aaaa, 1111)
  if (/^(.)\1{2,}$/.test(localPart)) return true;

  // Alternating pair repeated 3+ times (e.g. ababab, 121212)
  if (/^(.{2})\1{2,}$/.test(localPart)) return true;

  // Pure digits only with 4 or more digits (e.g. 1234567, 987654321)
  if (/^\d{4,}$/.test(localPart)) return true;

  // Normalized local part (strip separators . _ - +)
  const normalized = localPart.replace(/[._\-+]/g, '');

  // Automated or no-reply addresses where the recipient cannot reply
  const automatedPrefixes = [
    'noreply',
    'no-reply',
    'donotreply',
    'do-not-reply',
    'mailerdaemon',
    'postmaster',
    'bounce',
    'devnull',
    'blackhole',
    'spambox',
    'trash',
    'throwaway',
  ];
  if (automatedPrefixes.some((p) => normalized.startsWith(p) || localPart.startsWith(p))) {
    return true;
  }

  // Keyboard sequences / mashes (exact or followed by numbers)
  const keyboardMashes = ['asdf', 'asdfgh', 'asdfghjkl', 'qwerty', 'qwertyuiop', 'zxcv', 'zxcvbnm', '12345', '123456', '1234567'];
  if (keyboardMashes.some((m) => normalized === m || normalized.startsWith(m))) {
    return true;
  }

  // Placeholder stems (fake, test, dummy, nobody, nowhere, anon, sample, etc.)
  const placeholderStems = ['fake', 'test', 'dummy', 'nobody', 'nowhere', 'sample', 'anonymous', 'anon', 'null', 'undefined', 'noemail'];
  if (placeholderStems.some((stem) => normalized === stem || new RegExp(`^${stem}\\d*$`).test(normalized))) {
    return true;
  }

  return false;
}

/**
 * Performs DNS MX record lookup via public DNS-over-HTTPS (Google & Cloudflare DoH).
 * Uses independent timeout controllers for each resolver to prevent premature cancellation.
 */
export async function checkDomainMxRecord(
  domain: string,
  timeoutMs: number = 3500
): Promise<{ hasMx: boolean; isNxDomain: boolean; error?: string }> {
  const cleanDomain = domain.trim().toLowerCase();
  if (mxCache.has(cleanDomain)) {
    return mxCache.get(cleanDomain)!;
  }

  // 1. Primary Resolver: Google Public DNS over HTTPS (type 15 = MX)
  try {
    const googleController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const googleTimer = googleController ? setTimeout(() => googleController.abort(), timeoutMs) : null;

    try {
      const googleUrl = `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=MX`;
      const res = await fetch(googleUrl, {
        signal: googleController?.signal,
        headers: { Accept: 'application/dns-json' },
      });

      if (res.ok) {
        const data = await res.json();
        // Status 3: NXDOMAIN (domain does not exist)
        if (data.Status === 3) {
          const result = { hasMx: false, isNxDomain: true };
          mxCache.set(cleanDomain, result);
          return result;
        }

        const answers = Array.isArray(data.Answer) ? data.Answer : [];
        const hasMx = answers.some((ans: { type?: number }) => ans.type === 15);
        if (hasMx) {
          const result = { hasMx: true, isNxDomain: false };
          mxCache.set(cleanDomain, result);
          return result;
        }

        // Implicit fallback: Check if answer or status confirms active domain without MX
        const hasA = answers.some((ans: { type?: number }) => ans.type === 1 || ans.type === 5);
        const result = { hasMx: hasA, isNxDomain: false };
        mxCache.set(cleanDomain, result);
        return result;
      }
    } finally {
      if (googleTimer) clearTimeout(googleTimer);
    }
  } catch {
    // Google DoH failed or timed out; proceed to Cloudflare DoH fallback
  }

  // 2. Secondary Resolver: Cloudflare DoH with independent AbortController
  try {
    const cfController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const cfTimer = cfController ? setTimeout(() => cfController.abort(), timeoutMs) : null;

    try {
      const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=MX`;
      const cfRes = await fetch(cfUrl, {
        signal: cfController?.signal,
        headers: { Accept: 'application/dns-json' },
      });

      if (cfRes.ok) {
        const cfData = await cfRes.json();
        if (cfData.Status === 3) {
          const result = { hasMx: false, isNxDomain: true };
          mxCache.set(cleanDomain, result);
          return result;
        }

        const answers = Array.isArray(cfData.Answer) ? cfData.Answer : [];
        const hasMx = answers.some((ans: { type?: number }) => ans.type === 15 || ans.type === 1 || ans.type === 5);
        const result = { hasMx, isNxDomain: false };
        mxCache.set(cleanDomain, result);
        return result;
      }
    } finally {
      if (cfTimer) clearTimeout(cfTimer);
    }
  } catch {
    // Network unreachable or offline
  }

  // In offline, mock, or restricted network conditions, return neutral result
  return { hasMx: true, isNxDomain: false, error: 'DNS network check skipped (offline/timeout)' };
}

/**
 * Master multi-layer sender email verification function.
 * Validates syntax, blocks disposable domains, blocks reserved/test domains,
 * catches domain typos with suggested corrections, detects suspicious handle patterns,
 * and performs live MX verification via DoH.
 */
export async function verifySenderEmail(
  email: string,
  options: { checkMx?: boolean } = { checkMx: true }
): Promise<EmailVerificationResult> {
  const trimmed = email.trim();

  // Layer 1: Syntax & basic RFC structure
  const syntaxCheck = verifyEmailSyntax(trimmed);
  if (!syntaxCheck.isValid) {
    return {
      isValid: false,
      reason: syntaxCheck.error || 'Invalid email syntax.',
      category: 'syntax',
    };
  }

  const domain = trimmed.split('@')[1].toLowerCase();

  // Layer 2: Disposable / Burner domain blocklist & heuristics
  if (isDisposableEmail(domain)) {
    return {
      isValid: false,
      reason: 'Disposable and temporary burner email addresses are not permitted.',
      category: 'disposable',
    };
  }

  // Layer 3: Reserved / Test domain blocklist (including subdomains)
  if (isReservedOrTestDomain(domain)) {
    return {
      isValid: false,
      reason: 'Reserved, test, or placeholder domains cannot be used.',
      category: 'reserved_test',
    };
  }

  // Layer 4: Common typo-squatting domains with suggested fix
  const typoCheck = checkDomainTypo(trimmed);
  if (typoCheck.isTypo) {
    return {
      isValid: false,
      reason: `Misspelled email domain detected. Did you mean "${typoCheck.suggestedEmail}"?`,
      category: 'typo',
      suggestedFix: typoCheck.suggestedEmail,
    };
  }

  // Layer 5: Suspicious username patterns
  if (isSuspiciousPattern(trimmed)) {
    return {
      isValid: false,
      reason: 'Username pattern flagged as suspicious, placeholder, or automated no-reply.',
      category: 'suspicious_pattern',
    };
  }

  // Layer 6: Live DNS MX check (if enabled)
  if (options.checkMx) {
    const mxResult = await checkDomainMxRecord(domain);
    if (mxResult.isNxDomain) {
      return {
        isValid: false,
        reason: `Domain "${domain}" does not exist (DNS NXDOMAIN).`,
        category: 'mx_check',
        mxRecordsFound: false,
      };
    }

    if (!mxResult.hasMx && !mxResult.error) {
      return {
        isValid: false,
        reason: `Domain "${domain}" has no active Mail Exchange (MX) records.`,
        category: 'mx_check',
        mxRecordsFound: false,
      };
    }

    return {
      isValid: true,
      category: 'valid',
      mxRecordsFound: mxResult.hasMx,
    };
  }

  return {
    isValid: true,
    category: 'valid',
  };
}
