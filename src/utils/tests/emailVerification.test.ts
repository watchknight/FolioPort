import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  verifyEmailSyntax,
  isDisposableEmail,
  isReservedOrTestDomain,
  isSuspiciousPattern,
  checkDomainTypo,
  checkDomainMxRecord,
  verifySenderEmail,
  DISPOSABLE_DOMAINS,
} from '../emailVerification';

describe('Email Verification & Anti-Fake Mail Engine (emailVerification.ts)', () => {
  describe('1. Syntax & RFC Structure Verification (verifyEmailSyntax)', () => {
    it('rejects empty, whitespace-only, or null-like inputs', () => {
      expect(verifyEmailSyntax('').isValid).toBe(false);
      expect(verifyEmailSyntax('   ').isValid).toBe(false);
      expect(verifyEmailSyntax('\t\n').isValid).toBe(false);
    });

    it('rejects emails exceeding RFC length limits', () => {
      const veryLongDomain = 'a'.repeat(250) + '@gmail.com';
      expect(verifyEmailSyntax(veryLongDomain).isValid).toBe(false);

      const veryLongUser = 'u'.repeat(65) + '@domain.com';
      expect(verifyEmailSyntax(veryLongUser).isValid).toBe(false);
    });

    it('rejects consecutive dots or malformed dots', () => {
      expect(verifyEmailSyntax('user..name@gmail.com').isValid).toBe(false);
      expect(verifyEmailSyntax('username@gmail..com').isValid).toBe(false);
      expect(verifyEmailSyntax('.username@gmail.com').isValid).toBe(false);
      expect(verifyEmailSyntax('username.@gmail.com').isValid).toBe(false);
    });

    it('rejects emails missing @ or containing multiple @ symbols', () => {
      expect(verifyEmailSyntax('plainaddress.com').isValid).toBe(false);
      expect(verifyEmailSyntax('user@@gmail.com').isValid).toBe(false);
      expect(verifyEmailSyntax('user@extra@gmail.com').isValid).toBe(false);
    });

    it('rejects emails with invalid TLDs or missing domain parts', () => {
      expect(verifyEmailSyntax('user@domain').isValid).toBe(false);
      expect(verifyEmailSyntax('user@domain.c').isValid).toBe(false); // TLD must be >= 2 chars
      expect(verifyEmailSyntax('user@.com').isValid).toBe(false);
      expect(verifyEmailSyntax('@gmail.com').isValid).toBe(false);
    });

    it('accepts strictly valid email syntaxes', () => {
      expect(verifyEmailSyntax('armabdur.rahman04@gmail.com').isValid).toBe(true);
      expect(verifyEmailSyntax('recruiter@google.com').isValid).toBe(true);
      expect(verifyEmailSyntax('engineering.lead@company.co.uk').isValid).toBe(true);
      expect(verifyEmailSyntax('contact+tag@domain.org').isValid).toBe(true);
    });
  });

  describe('2. Disposable & Temporary Burner Domain Blocklist (isDisposableEmail)', () => {
    it('identifies well-known disposable email domains', () => {
      expect(isDisposableEmail('test@mailinator.com')).toBe(true);
      expect(isDisposableEmail('throwaway@guerrillamail.com')).toBe(true);
      expect(isDisposableEmail('burner@tempmail.com')).toBe(true);
      expect(isDisposableEmail('anon@10minutemail.com')).toBe(true);
      expect(isDisposableEmail('trash@yopmail.com')).toBe(true);
      expect(isDisposableEmail('user@trashmail.com')).toBe(true);
      expect(isDisposableEmail('fake@sharklasers.com')).toBe(true);
      expect(isDisposableEmail('bot@getnada.com')).toBe(true);
      expect(isDisposableEmail('temp@dispostable.com')).toBe(true);
      expect(isDisposableEmail('burner@throwawaymail.com')).toBe(true);
    });

    it('identifies subdomains of disposable providers', () => {
      expect(isDisposableEmail('user@sub.mailinator.com')).toBe(true);
      expect(isDisposableEmail('user@east.guerrillamail.com')).toBe(true);
    });

    it('detects unlisted disposable domains via keyword heuristic', () => {
      expect(isDisposableEmail('anon@custom-tempmail.xyz')).toBe(true);
      expect(isDisposableEmail('throwaway@fast-trashmail.net')).toBe(true);
      expect(isDisposableEmail('user@myburnermail.io')).toBe(true);
    });

    it('allows legitimate corporate, personal, and educational domains', () => {
      expect(isDisposableEmail('armabdur.rahman04@gmail.com')).toBe(false);
      expect(isDisposableEmail('student@ewubd.edu')).toBe(false);
      expect(isDisposableEmail('recruiter@microsoft.com')).toBe(false);
      expect(isDisposableEmail('engineer@github.com')).toBe(false);
      expect(isDisposableEmail('hello@fastmail.com')).toBe(false);
      expect(isDisposableEmail('user@protonmail.com')).toBe(false);
    });

    it('contains over 100 verified disposable providers in blocklist', () => {
      expect(DISPOSABLE_DOMAINS.size).toBeGreaterThan(100);
    });
  });

  describe('3. Reserved & Test Domains Blocklist (isReservedOrTestDomain)', () => {
    it('blocks RFC 2606 reserved domains', () => {
      expect(isReservedOrTestDomain('test@example.com')).toBe(true);
      expect(isReservedOrTestDomain('user@example.org')).toBe(true);
      expect(isReservedOrTestDomain('dev@test.com')).toBe(true);
      expect(isReservedOrTestDomain('root@localhost')).toBe(true);
      expect(isReservedOrTestDomain('user@invalid.com')).toBe(true);
    });

    it('blocks subdomains of reserved and test domains', () => {
      expect(isReservedOrTestDomain('user@sub.example.com')).toBe(true);
      expect(isReservedOrTestDomain('user@test.example.org')).toBe(true);
      expect(isReservedOrTestDomain('admin@api.test.com')).toBe(true);
      expect(isReservedOrTestDomain('me@dev.fake.com')).toBe(true);
    });

    it('blocks dummy and placeholder domains', () => {
      expect(isReservedOrTestDomain('me@fake.com')).toBe(true);
      expect(isReservedOrTestDomain('me@fakemail.com')).toBe(true);
      expect(isReservedOrTestDomain('user@dummy.com')).toBe(true);
      expect(isReservedOrTestDomain('test@nowhere.com')).toBe(true);
      expect(isReservedOrTestDomain('test@nobody.com')).toBe(true);
      expect(isReservedOrTestDomain('user@asdf.com')).toBe(true);
      expect(isReservedOrTestDomain('user@qwerty.com')).toBe(true);
    });

    it('blocks reserved and internal TLDs (.test, .example, .invalid, .localhost, .corp, .lan)', () => {
      expect(isReservedOrTestDomain('user@corp.test')).toBe(true);
      expect(isReservedOrTestDomain('admin@server.example')).toBe(true);
      expect(isReservedOrTestDomain('host@net.invalid')).toBe(true);
      expect(isReservedOrTestDomain('node@box.localhost')).toBe(true);
      expect(isReservedOrTestDomain('user@workstation.corp')).toBe(true);
      expect(isReservedOrTestDomain('user@router.lan')).toBe(true);
    });

    it('allows legitimate public email domains', () => {
      expect(isReservedOrTestDomain('user@gmail.com')).toBe(false);
      expect(isReservedOrTestDomain('user@yahoo.com')).toBe(false);
      expect(isReservedOrTestDomain('user@outlook.com')).toBe(false);
    });
  });

  describe('4. Common Domain Typo Detection (checkDomainTypo)', () => {
    it('detects common typos and suggests proper provider domain', () => {
      const gamil = checkDomainTypo('user@gamil.com');
      expect(gamil.isTypo).toBe(true);
      expect(gamil.suggestedDomain).toBe('gmail.com');
      expect(gamil.suggestedEmail).toBe('user@gmail.com');

      const hotmial = checkDomainTypo('contact@hotmial.com');
      expect(hotmial.isTypo).toBe(true);
      expect(hotmial.suggestedDomain).toBe('hotmail.com');

      const yaho = checkDomainTypo('alex@yaho.com');
      expect(yaho.isTypo).toBe(true);
      expect(yaho.suggestedDomain).toBe('yahoo.com');

      const outlok = checkDomainTypo('lead@outlok.com');
      expect(outlok.isTypo).toBe(true);
      expect(outlok.suggestedDomain).toBe('outlook.com');
    });

    it('returns isTypo=false for legitimate domains', () => {
      expect(checkDomainTypo('armabdur.rahman04@gmail.com').isTypo).toBe(false);
      expect(checkDomainTypo('recruiter@outlook.com').isTypo).toBe(false);
      expect(checkDomainTypo('engineer@yahoo.com').isTypo).toBe(false);
    });
  });

  describe('5. Suspicious Pattern & Mash Username Detection (isSuspiciousPattern)', () => {
    it('detects single repeating character handles (aaaa@, 1111@)', () => {
      expect(isSuspiciousPattern('aaaa@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('1111@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('xxxx@company.com')).toBe(true);
    });

    it('detects keyboard mash handles (asdf@, qwerty@, zxcv@, asdf123@)', () => {
      expect(isSuspiciousPattern('asdf@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('asdfgh@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('qwerty@domain.com')).toBe(true);
      expect(isSuspiciousPattern('12345@domain.com')).toBe(true);
      expect(isSuspiciousPattern('asdf123@domain.com')).toBe(true);
      expect(isSuspiciousPattern('qwerty99@domain.com')).toBe(true);
    });

    it('detects automated and no-reply handles (noreply@, no-reply@, donotreply@)', () => {
      expect(isSuspiciousPattern('noreply@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('no-reply@company.com')).toBe(true);
      expect(isSuspiciousPattern('donotreply@domain.com')).toBe(true);
      expect(isSuspiciousPattern('mailerdaemon@host.com')).toBe(true);
    });

    it('detects placeholder stems with numbers (test123@, fake1@, dummy99@)', () => {
      expect(isSuspiciousPattern('fake@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('test@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('test123@gmail.com')).toBe(true);
      expect(isSuspiciousPattern('fake99@domain.com')).toBe(true);
      expect(isSuspiciousPattern('dummy1@company.com')).toBe(true);
      expect(isSuspiciousPattern('nobody@domain.com')).toBe(true);
    });

    it('detects pure numeric handles of 4 or more digits (1234567@)', () => {
      expect(isSuspiciousPattern('1234567@domain.com')).toBe(true);
      expect(isSuspiciousPattern('987654321@domain.com')).toBe(true);
    });

    it('allows legitimate human and team usernames', () => {
      expect(isSuspiciousPattern('armabdur.rahman04@gmail.com')).toBe(false);
      expect(isSuspiciousPattern('alex.turner@company.com')).toBe(false);
      expect(isSuspiciousPattern('sarah_connor@tech.org')).toBe(false);
      expect(isSuspiciousPattern('careers@startup.io')).toBe(false);
      expect(isSuspiciousPattern('elena.rostova@acme.com')).toBe(false);
    });
  });

  describe('6. Live DNS MX Verification via DoH (checkDomainMxRecord)', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('detects valid domain with MX records from DNS response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [
            { name: 'mockmail.com', type: 15, data: '10 mail.mockmail.com' },
          ],
        }),
      } as unknown as Response);

      const result = await checkDomainMxRecord('mockmail.com');
      expect(result.hasMx).toBe(true);
      expect(result.isNxDomain).toBe(false);
    });

    it('detects NXDOMAIN (Status: 3) for non-existent fake domains', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Status: 3,
          Answer: [],
        }),
      } as unknown as Response);

      const result = await checkDomainMxRecord('completelyfakenonexistentdomain9999.xyz');
      expect(result.hasMx).toBe(false);
      expect(result.isNxDomain).toBe(true);
    });

    it('detects domain without MX or A mail routing records', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [
            { name: 'nomxdomain.com', type: 16, data: '"v=spf1 ~all"' }, // TXT only, no MX/A
          ],
        }),
      } as unknown as Response);

      const result = await checkDomainMxRecord('nomxdomain.com');
      expect(result.hasMx).toBe(false);
      expect(result.isNxDomain).toBe(false);
    });

    it('falls back safely to neutral result when network is offline or times out', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkDomainMxRecord('offline-test-domain.com');
      expect(result.hasMx).toBe(true);
      expect(result.error).toContain('offline');
    });
  });

  describe('7. Master Multi-Layer Verification (verifySenderEmail)', () => {
    it('rejects invalid syntax with category="syntax"', async () => {
      const res = await verifySenderEmail('not-an-email', { checkMx: false });
      expect(res.isValid).toBe(false);
      expect(res.category).toBe('syntax');
    });

    it('rejects disposable emails with category="disposable"', async () => {
      const res = await verifySenderEmail('testuser@mailinator.com', { checkMx: false });
      expect(res.isValid).toBe(false);
      expect(res.category).toBe('disposable');
      expect(res.reason).toContain('Disposable');
    });

    it('rejects reserved test domains with category="reserved_test"', async () => {
      const res = await verifySenderEmail('user@example.com', { checkMx: false });
      expect(res.isValid).toBe(false);
      expect(res.category).toBe('reserved_test');
    });

    it('rejects domain typos with category="typo" and provides suggestedFix', async () => {
      const res = await verifySenderEmail('candidate@gamil.com', { checkMx: false });
      expect(res.isValid).toBe(false);
      expect(res.category).toBe('typo');
      expect(res.suggestedFix).toBe('candidate@gmail.com');
      expect(res.reason).toContain('Did you mean "candidate@gmail.com"?');
    });

    it('rejects suspicious patterns with category="suspicious_pattern"', async () => {
      const res = await verifySenderEmail('asdfgh@realcompany.com', { checkMx: false });
      expect(res.isValid).toBe(false);
      expect(res.category).toBe('suspicious_pattern');
    });

    it('accepts legitimate sender email and confirms valid category', async () => {
      const res = await verifySenderEmail('armabdur.rahman04@gmail.com', { checkMx: false });
      expect(res.isValid).toBe(true);
      expect(res.category).toBe('valid');
    });
  });
});
