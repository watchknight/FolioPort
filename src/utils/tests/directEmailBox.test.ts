import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DirectEmailBox } from '../../components/DirectEmailBox';
import { ResumeView, processCliCommand } from '../../components/views/ResumeView';
import { RetroOSProvider } from '../../context/RetroOSContext';

describe('Direct Email Box Component (DirectEmailBox.tsx)', () => {
  describe('1. Static DOM Structure & Accessibility', () => {
    it('renders DirectEmailBox container with cyberdeck aesthetic and status indicator', () => {
      const html = renderToString(React.createElement(DirectEmailBox));

      expect(html).toContain('data-testid="direct-email-box-container"');
      expect(html).toContain('id="direct-email-dispatcher"');
      expect(html).toContain('w-full');
      expect(html).toContain('Direct Email Dispatcher');
      expect(html).toContain('data-testid="email-box-status-pill"');
      expect(html).toContain('[Channel Online]');
      expect(html).toContain('armabdur.rahman04@gmail.com');
    });

    it('renders all mandatory direct email fields', () => {
      const html = renderToString(React.createElement(DirectEmailBox));

      // 1. Name input
      expect(html).toContain('data-testid="input-sender-name"');
      expect(html).toContain('Your Name or Organization');

      // 2. Email input with anti-fake mail indicator
      expect(html).toContain('data-testid="input-sender-email"');
      expect(html).toContain('Your Email (No Fake Mail Allowed)');
      expect(html).toContain('data-testid="email-verification-feedback"');
      expect(html).toContain('Disposable addresses rejected');

      // 3. Subject input
      expect(html).toContain('data-testid="input-sender-subject"');
      expect(html).toContain('Subject');

      // 4. Message textarea
      expect(html).toContain('data-testid="textarea-sender-message"');
      expect(html).toContain('Direct Message');

      // 5. File Attachment box with accessible keyboard interaction
      expect(html).toContain('data-testid="email-attachment-box"');
      expect(html).toContain('data-testid="input-email-attachment"');
      expect(html).toContain('data-testid="btn-choose-file"');
      expect(html).toContain('Attachment (PDF, Documents, Images, Archives - Max 10MB)');
      expect(html).toContain('class="sr-only"');
      expect(html).toContain('role="button"');
      expect(html).toContain('tabindex="0"');

      // 6. Anti-bot Security Handshake
      expect(html).toContain('Security Handshake:');
      expect(html).toContain('data-testid="input-security-answer"');

      // 7. Transmit button & Mail client dual options
      expect(html).toContain('data-testid="btn-transmit-email"');
      expect(html).toContain('Transmit Direct Email');
      expect(html).toContain('data-testid="btn-presubmit-mailto"');
      expect(html).toContain('Open in Mail Client');

      // 8. Mobile iOS zoom prevention (minimum 16px font size on touch inputs)
      expect(html).toContain('text-[16px]');
    });

    it('supports custom targetEmail prop', () => {
      const html = renderToString(
        React.createElement(DirectEmailBox, { targetEmail: 'contact@customdomain.org' })
      );

      expect(html).toContain('contact@customdomain.org');
    });

    it('contains hidden honeypot field for automated spam/bot detection', () => {
      const html = renderToString(React.createElement(DirectEmailBox));

      expect(html).toContain('id="website-honeypot"');
      expect(html).toContain('name="website"');
      expect(html).toContain('tabindex="-1"');
      expect(html).toContain('aria-hidden="true"');
    });

    it('renders collapse/expand toggle button', () => {
      const html = renderToString(React.createElement(DirectEmailBox));

      expect(html).toContain('data-testid="btn-toggle-email-box"');
      expect(html).toContain('[ - ]');
    });

    it('supports collapsed initial state when defaultExpanded={false}', () => {
      const html = renderToString(
        React.createElement(DirectEmailBox, { defaultExpanded: false })
      );

      expect(html).toContain('data-testid="direct-email-box-container"');
      expect(html).toContain('[ + ]');
      expect(html).not.toContain('data-testid="direct-email-form"');
    });
  });

  describe('2. Integration with ResumeView (Contact Section)', () => {
    it('seamlessly renders DirectEmailBox inside ResumeView contact section', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'resume' },
          React.createElement(ResumeView)
        )
      );

      // Verify presence in Resume & Contact view
      expect(html).toContain('data-testid="retro-content-resume"');
      expect(html).toContain('3. Resume &amp; Contact');
      expect(html).toContain('data-testid="direct-email-box-container"');
      expect(html).toContain('Direct Email Dispatcher');
      expect(html).toContain('data-testid="btn-transmit-email"');
    });

    it('preserves top action bar and 2-column dashboard alongside DirectEmailBox', () => {
      const html = renderToString(React.createElement(ResumeView));

      // 1. Top action bar
      expect(html).toContain('data-testid="retro-resume-action-bar"');
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('data-testid="retro-link-linkedin"');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('data-testid="retro-resume-download-btn"');

      // 2. Direct Email Box
      expect(html).toContain('data-testid="direct-email-box-container"');

      // 3. Widescreen Dashboard
      expect(html).toContain('data-testid="resume-widescreen-dashboard"');
      expect(html).toContain('data-testid="academic-coursework-card"');
      expect(html).toContain('data-testid="btn-toggle-linux-cli"');
    });

    it('positions DirectEmailBox full-width directly beneath 2-column widescreen dashboard', () => {
      const html = renderToString(React.createElement(ResumeView));

      const dashboardIdx = html.indexOf('data-testid="resume-widescreen-dashboard"');
      const courseworkIdx = html.indexOf('data-testid="academic-coursework-card"');
      const highlightsIdx = html.indexOf('data-testid="key-engineering-highlights-card"');
      const terminalToggleIdx = html.indexOf('data-testid="btn-toggle-linux-cli"');
      const mailboxIdx = html.indexOf('data-testid="direct-email-box-container"');

      // 1. Dashboard begins before DirectEmailBox (DirectEmailBox is positioned full-width beneath dashboard)
      expect(dashboardIdx).toBeGreaterThan(-1);
      expect(mailboxIdx).toBeGreaterThan(dashboardIdx);

      // 2. Left column cards (Education & Coursework, Key Highlights) precede right column
      expect(courseworkIdx).toBeGreaterThan(dashboardIdx);
      expect(highlightsIdx).toBeGreaterThan(courseworkIdx);

      // 3. Right column Interactive Terminal precedes DirectEmailBox
      expect(terminalToggleIdx).toBeGreaterThan(highlightsIdx);
      expect(mailboxIdx).toBeGreaterThan(terminalToggleIdx);
    });

    it('updates CLI sendmail/mailbox commands to reference the direct mail form below in Contact view', () => {
      const sendmailResult = processCliCommand('sendmail');
      const mailboxResult = processCliCommand('mailbox');
      const directmailResult = processCliCommand('directmail');
      const composeResult = processCliCommand('compose');
      const helpResult = processCliCommand('help');
      const contactResult = processCliCommand('contact');

      expect(sendmailResult).not.toBeNull();
      expect(sendmailResult?.output.join(' ')).toContain('available directly below in this Contact view');
      expect(sendmailResult?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');

      expect(mailboxResult).not.toBeNull();
      expect(mailboxResult?.output.join(' ')).toContain('available directly below in this Contact view');

      expect(directmailResult).not.toBeNull();
      expect(directmailResult?.output.join(' ')).toContain('Direct Email Dispatcher');

      expect(composeResult).not.toBeNull();
      expect(composeResult?.output.join(' ')).toContain('Direct Email Dispatcher');

      expect(helpResult?.output.join(' ')).toContain('sendmail');
      expect(contactResult?.output.join(' ')).toContain('available directly below');
    });
  });

  describe('3. Strict Anti-Slop, Zero-Clutter & GEMINI Compliance', () => {
    it('ensures zero forbidden strings appear in the rendered DirectEmailBox markup', () => {
      const html = renderToString(React.createElement(DirectEmailBox));

      const forbidden = ['Neon Vanguard', 'POSIX', 'SYS.96', '===', '.EXE', '.SYS'];
      forbidden.forEach((term) => {
        expect(html).not.toContain(term);
      });

      // No double slash '//' outside of URLs
      const strippedOfUrls = html
        .replace(/https?:\/\/[^\s"'<>]+/g, '')
        .replace(/data:image\/[^\s"'<>]+/g, '');
      expect(strippedOfUrls).not.toContain('//');
    });
  });
});
