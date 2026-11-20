import React, { useState, useRef, useEffect, useId } from 'react';
import type { PhosphorColorTokens } from './RetroOSWindow';
import { useRetroOS } from '../context/RetroOSContext';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import {
  verifySenderEmail,
  type EmailVerificationResult,
} from '../utils/emailVerification';
import {
  validateAttachment,
  formatBytes,
} from '../utils/fileAttachmentValidation';

export interface DirectEmailBoxProps {
  palette?: PhosphorColorTokens;
  targetEmail?: string;
  defaultExpanded?: boolean;
}

export interface DirectEmailFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string;
  securityAnswer: string;
}

export const DirectEmailBox: React.FC<DirectEmailBoxProps> = ({
  palette,
  targetEmail = 'armabdur.rahman04@gmail.com',
  defaultExpanded = true,
}) => {
  const os = useRetroOS();
  const isAmber = os.isInsideProvider && os.phosphorMode === 'amber';
  const bright = palette?.bright ?? (isAmber ? '#d4a359' : '#c2cdb4');
  const voidCol = palette?.void ?? (isAmber ? '#140f07' : '#111712');
  const mid = palette?.mid ?? (isAmber ? '#8c6830' : '#6e7d62');
  const dim = palette?.dim ?? (isAmber ? '#3d2b12' : '#2e3b2b');

  const fileInputId = useId();

  // Collapsible panel state
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(defaultExpanded);

  // Form input state
  const [formData, setFormData] = useState<DirectEmailFormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
    securityAnswer: '',
  });

  // Attached file state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Email verification state
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle');
  const [emailFeedback, setEmailFeedback] = useState<string>('');
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);

  // Interactive Security Handshake (math challenge)
  const [securityProblem, setSecurityProblem] = useState<{ a: number; b: number; expected: number }>({
    a: 4,
    b: 7,
    expected: 11,
  });

  // Transmission lifecycle state
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmitProgress, setTransmitProgress] = useState<number>(0);
  const [transmitSuccess, setTransmitSuccess] = useState<boolean>(false);
  const [transmissionReceipt, setTransmissionReceipt] = useState<{
    id: string;
    timestamp: string;
    sender: string;
    subject: string;
    fileName?: string;
  } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize random security challenge on mount
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 8) + 2;
    const num2 = Math.floor(Math.random() * 8) + 1;
    setSecurityProblem({ a: num1, b: num2, expected: num1 + num2 });

    return () => {
      if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const playSound = (freq: number = 740) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {
      // Audio safety
    }
  };

  // Perform async multi-layer email verification
  const runEmailVerification = async (emailToVerify: string) => {
    const trimmed = emailToVerify.trim();
    if (!trimmed) {
      setEmailStatus('idle');
      setEmailFeedback('');
      setSuggestedFix(null);
      return;
    }

    setEmailStatus('checking');
    setEmailFeedback('Validating domain & active MX records...');

    try {
      const result: EmailVerificationResult = await verifySenderEmail(trimmed, { checkMx: true });

      if (result.isValid) {
        setEmailStatus('valid');
        setEmailFeedback('Sender verified (Active MX records confirmed)');
        setSuggestedFix(null);
      } else {
        setEmailStatus('invalid');
        setEmailFeedback(result.reason || 'Email rejected: Fake or invalid address');
        setSuggestedFix(result.suggestedFix || null);
      }
    } catch {
      setEmailStatus('invalid');
      setEmailFeedback('Verification failed: Network or address error');
      setSuggestedFix(null);
    }
  };

  // Handle email input change with debounced verification
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));
    setGeneralError(null);

    if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);

    if (!val.trim()) {
      setEmailStatus('idle');
      setEmailFeedback('');
      setSuggestedFix(null);
      return;
    }

    setEmailStatus('checking');
    setEmailFeedback('Verifying sender authenticity...');

    verificationTimerRef.current = setTimeout(() => {
      runEmailVerification(val);
    }, 450);
  };

  // Immediate verification on blur
  const handleEmailBlur = () => {
    if (verificationTimerRef.current) clearTimeout(verificationTimerRef.current);
    if (formData.email.trim()) {
      runEmailVerification(formData.email);
    }
  };

  // Handle file attachment selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setAttachedFile(null);
      setFileError(null);
      return;
    }

    const file = files[0];
    const validation = validateAttachment(file);

    if (!validation.isValid) {
      playSound(380);
      setAttachedFile(null);
      setFileError(validation.error || 'Invalid file attachment.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    playSound(880);
    setAttachedFile(file);
    setFileError(null);
  };

  // Remove attached file
  const handleRemoveFile = () => {
    playSound(450);
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // 1. Anti-bot honeypot check
    if (formData.honeypot) {
      playSound(320);
      setGeneralError('Automated bot submission detected and blocked.');
      return;
    }

    // 2. Validate mandatory text fields
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      playSound(400);
      setGeneralError('Please enter your name or organization (minimum 2 characters).');
      return;
    }

    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      playSound(400);
      setGeneralError('Please enter a subject (minimum 3 characters).');
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      playSound(400);
      setGeneralError('Please enter a detailed message (minimum 10 characters).');
      return;
    }

    // 3. Strict Email Verification Check (NO FAKE MAIL ALLOWED)
    const emailResult = await verifySenderEmail(formData.email.trim(), { checkMx: true });
    if (!emailResult.isValid) {
      playSound(350);
      setEmailStatus('invalid');
      setEmailFeedback(emailResult.reason || 'Fake or invalid email rejected.');
      setSuggestedFix(emailResult.suggestedFix || null);
      setGeneralError(
        `Email rejected: ${emailResult.reason || 'Fake or invalid addresses are prohibited.'}`
      );
      return;
    }

    // 4. Security Handshake check
    const answerParsed = parseInt(formData.securityAnswer.trim(), 10);
    if (isNaN(answerParsed) || answerParsed !== securityProblem.expected) {
      playSound(350);
      setGeneralError(
        `Security verification failed: ${securityProblem.a} + ${securityProblem.b} = ${securityProblem.expected}. Please solve the math challenge.`
      );
      return;
    }

    // 5. Attachment check (if attached, double check)
    if (attachedFile) {
      const attachCheck = validateAttachment(attachedFile);
      if (!attachCheck.isValid) {
        playSound(350);
        setGeneralError(attachCheck.error || 'Invalid attachment.');
        return;
      }
    }

    // All validations passed! Begin transmission sequence
    playSound(960);
    setIsTransmitting(true);
    setTransmitProgress(15);

    // Stepped transmission progress animation
    let step = 15;
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      step += 18;
      playSound(520 + step * 4);
      if (step >= 85) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setTransmitProgress(90);
      } else {
        setTransmitProgress(step);
      }
    }, 120);

    try {
      // Determine delivery endpoint:
      // Priority 1: VITE_CONTACT_ENDPOINT (custom webhook / worker)
      // Priority 2: VITE_WEB3FORMS_ACCESS_KEY (Web3Forms API)
      // Priority 3: FormSubmit AJAX endpoint (zero-config, free file upload delivery to targetEmail)
      const customEndpoint =
        typeof import.meta !== 'undefined' && import.meta.env
          ? import.meta.env.VITE_CONTACT_ENDPOINT ||
            (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
              ? 'https://api.web3forms.com/submit'
              : '')
          : '';

      const endpoint =
        customEndpoint || `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`;

      const formPayload = new FormData();
      formPayload.append('name', formData.name.trim());
      formPayload.append('email', formData.email.trim());
      formPayload.append('subject', formData.subject.trim());
      formPayload.append('message', formData.message.trim());
      formPayload.append('to', targetEmail);
      formPayload.append('_subject', `[FolioPort Dispatch] ${formData.subject.trim()}`);
      formPayload.append('_captcha', 'false');

      if (
        typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY
      ) {
        formPayload.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY);
      }

      if (attachedFile) {
        formPayload.append('attachment', attachedFile);
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutTimer = controller ? setTimeout(() => controller.abort(), 12000) : null;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formPayload,
          signal: controller?.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          let errDetail = `Relay server responded with status ${response.status}`;
          try {
            const data = await response.json();
            if (data?.message) errDetail = data.message;
          } catch {
            // Non-JSON error body
          }
          throw new Error(errDetail);
        }
      } finally {
        if (timeoutTimer) clearTimeout(timeoutTimer);
      }

      // Finish transmission animation
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setTransmitProgress(100);
      setIsTransmitting(false);
      setTransmitSuccess(true);
      playSound(1080);

      const receiptId = `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      setTransmissionReceipt({
        id: receiptId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        sender: formData.email.trim(),
        subject: formData.subject.trim(),
        fileName: attachedFile ? attachedFile.name : undefined,
      });
    } catch (err: unknown) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setTransmitProgress(0);
      setIsTransmitting(false);
      setTransmitSuccess(false);
      playSound(350);

      const message =
        err instanceof Error
          ? err.message
          : 'Network relay error. Server could not be reached.';
      setGeneralError(
        `Transmission error: ${message}. You can dispatch directly via your email client using the fallback button below.`
      );
    }
  };

  const handleResetForm = () => {
    playSound(720);
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      honeypot: '',
      securityAnswer: '',
    });
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEmailStatus('idle');
    setEmailFeedback('');
    setSuggestedFix(null);
    setGeneralError(null);
    setTransmitSuccess(false);
    setTransmissionReceipt(null);
    setTransmitProgress(0);

    const num1 = Math.floor(Math.random() * 8) + 2;
    const num2 = Math.floor(Math.random() * 8) + 1;
    setSecurityProblem({ a: num1, b: num2, expected: num1 + num2 });
  };

  // Generate backup mailto URL
  const getMailtoUrl = () => {
    const subjectEncoded = encodeURIComponent(formData.subject || 'Direct Contact');
    const bodyEncoded = encodeURIComponent(
      `From: ${formData.name} <${formData.email}>\n\nMessage:\n${formData.message}\n\n${
        attachedFile ? `[Note: Attachment "${attachedFile.name}" (${formatBytes(attachedFile.size)}) attached via web form]` : ''
      }`
    );
    return `mailto:${targetEmail}?subject=${subjectEncoded}&body=${bodyEncoded}`;
  };

  return (
    <section
      id="direct-email-dispatcher"
      data-testid="direct-email-box-container"
      className="border-2 flex flex-col font-mono w-full"
      style={{
        backgroundColor: `${dim}33`,
        borderColor: mid,
        boxShadow: `2px 2px 0px 0px ${voidCol}`,
      }}
    >
      {/* 1. RETRO WINDOW TITLEBAR */}
      <div
        className="px-2.5 py-1.5 border-b flex items-center justify-between select-none"
        style={{
          backgroundColor: `${dim}80`,
          borderColor: mid,
          color: bright,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider font-bold">
            Direct Email Dispatcher
          </span>
          <span
            data-testid="email-box-status-pill"
            className="text-[7px] px-1 py-0.5 border font-mono font-bold"
            style={{
              backgroundColor: voidCol,
              borderColor: bright,
              color: bright,
            }}
          >
            [Channel Online]
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[8px] font-pixel">
          <span className="text-[7.5px] font-mono hidden md:inline truncate max-w-xs sm:max-w-md" style={{ color: mid }}>
            To: {targetEmail}
          </span>
          <button
            type="button"
            data-testid="btn-toggle-email-box"
            aria-label={isPanelExpanded ? 'Collapse Direct Email Box' : 'Expand Direct Email Box'}
            onClick={() => {
              playSound(620);
              setIsPanelExpanded((prev) => !prev);
            }}
            className="px-1.5 py-0.5 border text-[7.5px] font-mono cursor-pointer transition-none outline-none focus-visible:outline-dashed"
            style={{
              backgroundColor: isPanelExpanded ? dim : bright,
              color: isPanelExpanded ? bright : voidCol,
              borderColor: bright,
            }}
          >
            {isPanelExpanded ? '[ - ]' : '[ + ]'}
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      {isPanelExpanded && (
        <div className="p-3 sm:p-4 flex flex-col gap-3">
          {/* Target recipient banner */}
          <div
            className="p-2 border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[8px] sm:text-[8.5px]"
            style={{
              backgroundColor: `${voidCol}99`,
              borderColor: `${mid}60`,
              color: bright,
            }}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold" style={{ color: mid }}>RECIPIENT:</span>
              <span className="font-bold">{targetEmail}</span>
              <span className="text-[7.5px]" style={{ color: mid }}>(Abdur Rahman Moayed)</span>
            </div>
            <div className="text-[7.5px] font-mono" style={{ color: mid }}>
              Anti-Spoof &amp; MX Verification Active
            </div>
          </div>

          {/* SUCCESS TRANSMISSION RECEIPT CARD */}
          {transmitSuccess && transmissionReceipt && (
            <div
              data-testid="direct-email-success-card"
              className="p-3 sm:p-3.5 border-2 flex flex-col gap-2.5 animate-fadeIn"
              style={{
                backgroundColor: voidCol,
                borderColor: bright,
                color: bright,
                boxShadow: `2px 2px 0px 0px ${voidCol}`,
              }}
            >
              <div
                className="flex items-center justify-between border-b pb-1 text-[8.5px] sm:text-[9.5px] font-pixel font-bold uppercase"
                style={{ borderColor: mid }}
              >
                <span>Transmission Dispatched Successfully</span>
                <span className="font-mono text-[8px] font-bold">[CONFIRMED]</span>
              </div>

              <div className="flex flex-col gap-1 text-[8.5px] sm:text-[9.5px] font-mono leading-relaxed">
                <div>
                  • <span style={{ color: mid }}>RECEIPT ID:</span>{' '}
                  <strong className="tracking-wider">{transmissionReceipt.id}</strong>
                </div>
                <div>
                  • <span style={{ color: mid }}>TIMESTAMP:</span> {transmissionReceipt.timestamp}
                </div>
                <div>
                  • <span style={{ color: mid }}>VERIFIED SENDER:</span> {transmissionReceipt.sender}
                </div>
                <div>
                  • <span style={{ color: mid }}>SUBJECT:</span> {transmissionReceipt.subject}
                </div>
                {transmissionReceipt.fileName && (
                  <div>
                    • <span style={{ color: mid }}>ATTACHMENT PACKET:</span> {transmissionReceipt.fileName}
                  </div>
                )}
                <div className="pt-1 text-[8px]" style={{ color: mid }}>
                  Status: Delivery queue confirmed for {targetEmail}. Expect a direct reply within 24 hours.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: `${mid}40` }}>
                <button
                  type="button"
                  data-testid="btn-send-another-email"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 border-2 font-mono font-bold text-[8.5px] sm:text-[9px] uppercase cursor-pointer transition-none active:translate-y-[1px]"
                  style={{
                    backgroundColor: bright,
                    color: voidCol,
                    borderColor: bright,
                  }}
                >
                  Send Another Message
                </button>

                <a
                  href={getMailtoUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="btn-open-mailto-backup"
                  onClick={() => playSound(760)}
                  className="px-2.5 py-1.5 border font-mono text-[8px] sm:text-[8.5px] uppercase cursor-pointer transition-none no-underline text-center"
                  style={{
                    backgroundColor: `${dim}60`,
                    color: bright,
                    borderColor: mid,
                  }}
                >
                  Open in Email Client
                </a>
              </div>
            </div>
          )}

          {/* EMAIL COMPOSITION FORM */}
          {!transmitSuccess && (
            <form
              onSubmit={handleSubmit}
              data-testid="direct-email-form"
              className="flex flex-col gap-3"
            >
              {/* Anti-bot Honeypot field (hidden from legitimate users) */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <label htmlFor="website-honeypot">Leave this blank</label>
                <input
                  id="website-honeypot"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.honeypot}
                  onChange={(e) => setFormData((prev) => ({ ...prev, honeypot: e.target.value }))}
                />
              </div>

              {/* Row 1: Sender Name & Sender Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Field 1: Name */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="sender-name-input"
                    className="text-[8px] sm:text-[8.5px] uppercase font-bold"
                    style={{ color: bright }}
                  >
                    Your Name or Organization <span style={{ color: mid }}>*</span>
                  </label>
                  <input
                    id="sender-name-input"
                    data-testid="input-sender-name"
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova / Acme Corp"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                      setGeneralError(null);
                    }}
                    className="w-full px-2.5 py-1.5 border font-mono text-[16px] sm:text-[13.5px] bg-transparent outline-none transition-none focus:border-current"
                    style={{
                      borderColor: mid,
                      color: bright,
                      backgroundColor: `${voidCol}80`,
                    }}
                  />
                </div>

                {/* Field 2: Email (With Live Multi-Layer Verification) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="sender-email-input"
                      className="text-[8px] sm:text-[8.5px] uppercase font-bold"
                      style={{ color: bright }}
                    >
                      Your Email (No Fake Mail Allowed) <span style={{ color: mid }}>*</span>
                    </label>
                  </div>

                  <input
                    id="sender-email-input"
                    data-testid="input-sender-email"
                    type="email"
                    required
                    placeholder="e.g. contact@yourcompany.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className="w-full px-2.5 py-1.5 border font-mono text-[16px] sm:text-[13.5px] bg-transparent outline-none transition-none focus:border-current"
                    style={{
                      borderColor:
                        emailStatus === 'valid'
                          ? bright
                          : emailStatus === 'invalid'
                          ? '#ff2a85'
                          : mid,
                      color: bright,
                      backgroundColor: `${voidCol}80`,
                    }}
                  />

                  {/* Verification Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[7px] sm:text-[7.5px] pt-0.5">
                    <span
                      data-testid="email-verification-feedback"
                      className="font-mono break-all sm:break-normal"
                      style={{
                        color:
                          emailStatus === 'valid'
                            ? bright
                            : emailStatus === 'invalid'
                            ? '#ff2a85'
                            : mid,
                      }}
                    >
                      {emailStatus === 'checking' && '[Verifying sender...]'}
                      {emailStatus === 'valid' && `[✓ ${emailFeedback}]`}
                      {emailStatus === 'invalid' && `[✗ ${emailFeedback}]`}
                      {emailStatus === 'idle' && '[RFC & MX validation active]'}
                    </span>
                    <span className="text-[7px]" style={{ color: mid }}>
                      Disposable addresses rejected
                    </span>
                  </div>

                  {/* Typo Correction Suggestion */}
                  {suggestedFix && (
                    <div
                      data-testid="email-typo-suggestion"
                      className="p-1 border flex items-center justify-between gap-1 text-[7.5px] font-mono"
                      style={{
                        backgroundColor: `${dim}60`,
                        borderColor: bright,
                        color: bright,
                      }}
                    >
                      <span className="truncate">Suggestion: Did you mean <strong>{suggestedFix}</strong>?</span>
                      <button
                        type="button"
                        data-testid="btn-apply-email-suggestion"
                        onClick={() => {
                          playSound(720);
                          setFormData((prev) => ({ ...prev, email: suggestedFix }));
                          setSuggestedFix(null);
                          runEmailVerification(suggestedFix);
                        }}
                        className="px-1.5 py-0.5 border text-[7px] font-mono uppercase cursor-pointer shrink-0"
                        style={{
                          backgroundColor: bright,
                          color: voidCol,
                          borderColor: bright,
                        }}
                      >
                        [Apply Fix]
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Subject */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="sender-subject-input"
                  className="text-[8px] sm:text-[8.5px] uppercase font-bold"
                  style={{ color: bright }}
                >
                  Subject <span style={{ color: mid }}>*</span>
                </label>
                <input
                  id="sender-subject-input"
                  data-testid="input-sender-subject"
                  type="text"
                  required
                  placeholder="e.g. Software Engineering Opportunity / Project Collaboration"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, subject: e.target.value }));
                    setGeneralError(null);
                  }}
                  className="w-full px-2.5 py-1.5 border font-mono text-[16px] sm:text-[13.5px] bg-transparent outline-none transition-none focus:border-current"
                  style={{
                    borderColor: mid,
                    color: bright,
                    backgroundColor: `${voidCol}80`,
                  }}
                />
              </div>

              {/* Row 3: Message Body */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="sender-message-textarea"
                    className="text-[8px] sm:text-[8.5px] uppercase font-bold"
                    style={{ color: bright }}
                  >
                    Direct Message <span style={{ color: mid }}>*</span>
                  </label>
                  <span className="text-[7px] font-mono" style={{ color: mid }}>
                    {formData.message.length} characters (min 10)
                  </span>
                </div>
                <textarea
                  id="sender-message-textarea"
                  data-testid="textarea-sender-message"
                  required
                  rows={4}
                  placeholder="Write your message, project specifications, or job inquiry here..."
                  value={formData.message}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, message: e.target.value }));
                    setGeneralError(null);
                  }}
                  className="w-full px-2.5 py-1.5 border font-mono text-[16px] sm:text-[13.5px] bg-transparent outline-none transition-none resize-y focus:border-current"
                  style={{
                    borderColor: mid,
                    color: bright,
                    backgroundColor: `${voidCol}80`,
                    minHeight: '80px',
                  }}
                />
              </div>

              {/* Row 4: File Attachment Section (PDF, DOCX, Images, Archives up to 10MB) */}
              <div
                data-testid="email-attachment-box"
                className="p-2.5 border flex flex-col gap-1.5"
                style={{
                  backgroundColor: `${voidCol}60`,
                  borderColor: fileError ? '#ff2a85' : `${mid}80`,
                }}
              >
                <div className="flex items-center justify-between text-[7.5px] sm:text-[8px]">
                  <span className="font-bold uppercase" style={{ color: bright }}>
                    Attachment (PDF, Documents, Images, Archives - Max 10MB)
                  </span>
                  <span className="font-mono text-[7px]" style={{ color: mid }}>
                    Optional
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor={fileInputId}
                    data-testid="btn-choose-file"
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="px-2.5 py-1.5 border font-mono text-[8.5px] sm:text-[9px] uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-none active:translate-y-[1px] outline-none focus-visible:outline-dashed"
                    style={{
                      backgroundColor: `${dim}80`,
                      borderColor: bright,
                      color: bright,
                    }}
                  >
                    <span>Attach File</span>
                  </label>
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    data-testid="input-email-attachment"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.csv,.md,.png,.jpg,.jpeg,.webp,.svg,.gif,.zip,.tar,.gz,.rar,.7z,.json,.xml"
                    className="sr-only"
                  />

                  {/* Attached File Preview Chip */}
                  {attachedFile ? (
                    <div
                      data-testid="attached-file-chip"
                      className="flex-1 p-1.5 border flex items-center justify-between gap-2 text-[8px] sm:text-[8.5px]"
                      style={{
                        backgroundColor: `${dim}60`,
                        borderColor: bright,
                        color: bright,
                      }}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold">[Attached]:</span>
                        <span className="truncate font-bold">{attachedFile.name}</span>
                        <span className="shrink-0 text-[7.5px]" style={{ color: mid }}>
                          ({formatBytes(attachedFile.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        data-testid="btn-remove-attachment"
                        aria-label="Remove attached file"
                        onClick={handleRemoveFile}
                        className="px-1.5 py-0.5 border text-[7px] font-mono cursor-pointer shrink-0"
                        style={{
                          backgroundColor: voidCol,
                          borderColor: '#ff2a85',
                          color: '#ff2a85',
                        }}
                      >
                        [X Remove]
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 text-[7.5px] sm:text-[8px] font-mono" style={{ color: mid }}>
                      No file attached. Executables and scripts are prohibited.
                    </div>
                  )}
                </div>

                {/* File Error Notification */}
                {fileError && (
                  <div
                    data-testid="attachment-error-message"
                    className="p-1 border text-[7.5px] sm:text-[8px] font-mono font-bold"
                    style={{
                      backgroundColor: voidCol,
                      borderColor: '#ff2a85',
                      color: '#ff2a85',
                    }}
                  >
                    ✗ {fileError}
                  </div>
                )}
              </div>

              {/* Row 5: Anti-Bot Human Security Challenge */}
              <div
                className="p-2 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap"
                style={{
                  backgroundColor: `${voidCol}60`,
                  borderColor: `${mid}80`,
                }}
              >
                <div className="flex items-center gap-2 text-[8px] sm:text-[8.5px]">
                  <span className="font-bold uppercase" style={{ color: mid }}>
                    Security Handshake:
                  </span>
                  <span className="font-mono font-bold" style={{ color: bright }}>
                    {securityProblem.a} + {securityProblem.b} = ?
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="security-answer-input"
                    data-testid="input-security-answer"
                    type="text"
                    required
                    placeholder="Solve"
                    value={formData.securityAnswer}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, securityAnswer: e.target.value }));
                      setGeneralError(null);
                    }}
                    className="w-20 px-2 py-1 border font-mono text-[16px] sm:text-[12px] bg-transparent outline-none text-center"
                    style={{
                      borderColor: mid,
                      color: bright,
                      backgroundColor: `${voidCol}80`,
                    }}
                  />
                  <span className="text-[7px] font-mono" style={{ color: mid }}>
                    (Bot Prevention)
                  </span>
                </div>
              </div>

              {/* General Error Banner with Direct Mail Client Fallback */}
              {generalError && (
                <div
                  data-testid="direct-email-general-error"
                  className="p-2 border-2 flex flex-col gap-1.5 text-[8px] sm:text-[8.5px] font-mono font-bold"
                  style={{
                    backgroundColor: voidCol,
                    borderColor: '#ff2a85',
                    color: '#ff2a85',
                  }}
                >
                  <div className="leading-snug">✗ {generalError}</div>
                  <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: '#ff2a8560' }}>
                    <a
                      href={getMailtoUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="btn-error-mailto-fallback"
                      onClick={() => playSound(760)}
                      className="px-2 py-1 border font-mono text-[7.5px] sm:text-[8px] uppercase no-underline cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: `${dim}80`,
                        color: bright,
                        borderColor: bright,
                      }}
                    >
                      <span>Open Pre-filled Email in Mail Client</span>
                    </a>
                    {attachedFile && (
                      <span className="text-[7px] font-mono font-normal" style={{ color: mid }}>
                        (Attach "{attachedFile.name}" manually in client)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Transmission Progress Bar */}
              {isTransmitting && (
                <div
                  data-testid="direct-email-transmitting-gauge"
                  className="p-2 border flex flex-col gap-1 text-[8px] sm:text-[8.5px] font-mono"
                  style={{
                    backgroundColor: voidCol,
                    borderColor: bright,
                    color: bright,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>DISPATCHING DIRECT TRANSMISSION:</span>
                    <span className="font-bold">{transmitProgress}%</span>
                  </div>
                  <div className="w-full h-2 border flex items-center p-0.5" style={{ borderColor: mid }}>
                    <div
                      className="h-full transition-all duration-150"
                      style={{
                        width: `${transmitProgress}%`,
                        backgroundColor: bright,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button & Mail Client Dual Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap pt-1 border-t" style={{ borderColor: `${mid}40` }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="submit"
                    disabled={isTransmitting || emailStatus === 'invalid'}
                    data-testid="btn-transmit-email"
                    className="min-h-[40px] px-3.5 py-2 border-2 font-mono font-bold text-[9px] sm:text-[10px] uppercase cursor-pointer flex items-center justify-center gap-2 transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed disabled:opacity-50 text-center"
                    style={{
                      backgroundColor: bright,
                      color: voidCol,
                      borderColor: bright,
                      boxShadow: `2px 2px 0px 0px ${voidCol}`,
                    }}
                  >
                    <span>Transmit Direct Email</span>
                  </button>

                  <a
                    href={getMailtoUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="btn-presubmit-mailto"
                    onClick={() => playSound(720)}
                    className="min-h-[40px] px-2.5 py-2 border font-mono text-[8px] sm:text-[8.5px] uppercase flex items-center justify-center text-center no-underline cursor-pointer transition-none active:translate-y-[1px]"
                    style={{
                      backgroundColor: `${dim}60`,
                      color: bright,
                      borderColor: mid,
                    }}
                  >
                    Open in Mail Client
                  </a>
                </div>

                <div className="flex items-center gap-2 text-[7.5px] font-mono" style={{ color: mid }}>
                  <span>Fast Delivery: armabdur.rahman04@gmail.com</span>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
};

export default DirectEmailBox;
