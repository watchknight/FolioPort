import { describe, it, expect } from 'vitest';
import {
  validateAttachment,
  formatBytes,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../fileAttachmentValidation';

describe('File Attachment Validation Engine (fileAttachmentValidation.ts)', () => {
  describe('1. Byte Formatting Utility (formatBytes)', () => {
    it('formats 0 or negative bytes as 0 B', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-10)).toBe('0 B');
    });

    it('formats byte boundaries correctly', () => {
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
      expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB');
    });
  });

  describe('2. Attachment Whitelist & File Size (validateAttachment)', () => {
    it('safely handles null and undefined file objects without crashing', () => {
      expect(validateAttachment(null).isValid).toBe(false);
      expect(validateAttachment(undefined).isValid).toBe(false);
    });

    it('accepts safe documents (PDF, DOCX, TXT, MD, CSV)', () => {
      expect(validateAttachment({ name: 'resume.pdf', size: 1024 * 500 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'job_description.docx', size: 1024 * 200 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'notes.txt', size: 1024 * 10 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'specs.md', size: 1024 * 50 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'data.csv', size: 1024 * 30 }).isValid).toBe(true);
    });

    it('handles files with whitespace in names', () => {
      expect(validateAttachment({ name: '  my resume.pdf  ', size: 1024 * 100 }).isValid).toBe(true);
    });

    it('accepts safe image formats (PNG, JPG, WEBP, SVG)', () => {
      expect(validateAttachment({ name: 'screenshot.png', size: 1024 * 800 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'photo.jpg', size: 1024 * 600 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'diagram.webp', size: 1024 * 400 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'icon.svg', size: 1024 * 20 }).isValid).toBe(true);
    });

    it('accepts safe compressed archives (ZIP, TAR, GZ, 7Z)', () => {
      expect(validateAttachment({ name: 'project_archive.zip', size: 1024 * 1024 * 2 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'bundle.tar.gz', size: 1024 * 1024 * 3 }).isValid).toBe(true);
      expect(validateAttachment({ name: 'docs.7z', size: 1024 * 1024 * 1 }).isValid).toBe(true);
    });

    it('rejects files without extensions or missing names', () => {
      expect(validateAttachment({ name: 'noextension', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: '', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'trailingdot.', size: 1000 }).isValid).toBe(false);
    });

    it('rejects empty or negative size files (0 bytes)', () => {
      const res = validateAttachment({ name: 'empty.pdf', size: 0 });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('0 bytes');

      const negativeRes = validateAttachment({ name: 'neg.pdf', size: -100 });
      expect(negativeRes.isValid).toBe(false);
    });

    it('rejects files exceeding maximum size boundary (10 MB)', () => {
      // 10 MB exact is allowed (10,485,760 bytes)
      expect(validateAttachment({ name: 'large.pdf', size: MAX_ATTACHMENT_SIZE_BYTES }).isValid).toBe(true);

      // 10 MB + 1 byte is rejected
      const overflow = validateAttachment({ name: 'too_large.pdf', size: MAX_ATTACHMENT_SIZE_BYTES + 1 });
      expect(overflow.isValid).toBe(false);
      expect(overflow.error).toContain('exceeds the maximum 10 MB limit');
    });
  });

  describe('3. Prohibited Executable & Security Blacklist', () => {
    it('strictly prohibits Windows executables (.exe, .bat, .cmd, .msi, .com)', () => {
      expect(validateAttachment({ name: 'malware.exe', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'script.bat', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'command.cmd', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'installer.msi', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'legacy.com', size: 1000 }).isValid).toBe(false);
    });

    it('strictly prohibits script payloads (.vbs, .js, .ps1, .sh)', () => {
      expect(validateAttachment({ name: 'exploit.vbs', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'script.js', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'powershell.ps1', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'run.sh', size: 1000 }).isValid).toBe(false);
    });

    it('strictly prohibits macOS & Linux package payloads (.dmg, .pkg, .deb, .rpm, .app)', () => {
      expect(validateAttachment({ name: 'app_installer.dmg', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'package.pkg', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'binary.deb', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'binary.rpm', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'payload.app', size: 1000 }).isValid).toBe(false);
    });

    it('prohibits system libraries and binaries (.dll, .sys, .iso, .cpl, .inf, .reg)', () => {
      expect(validateAttachment({ name: 'driver.sys', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'hook.dll', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'disk.iso', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'control.cpl', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'setup.inf', size: 1000 }).isValid).toBe(false);
      expect(validateAttachment({ name: 'registry.reg', size: 1000 }).isValid).toBe(false);
    });

    it('detects dangerous double extension payloads (resume.pdf.exe)', () => {
      const res = validateAttachment({ name: 'resume.pdf.exe', size: 5000 });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('prohibited for security');
    });

    it('error message specifically mentions security risk for executables', () => {
      const res = validateAttachment({ name: 'payload.exe', size: 5000 });
      expect(res.error).toContain('prohibited for security');
    });
  });
});
