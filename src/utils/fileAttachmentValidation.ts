/**
 * File Attachment Validation Engine
 * Enforces file size boundaries, extension whitelist/blacklist,
 * and security scanning for email attachments.
 */

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes (10,485,760 bytes)

// Dangerous executable & script extensions explicitly banned across Windows, Mac, and Linux
export const PROHIBITED_EXTENSIONS: ReadonlySet<string> = new Set([
  'exe',
  'bat',
  'cmd',
  'sh',
  'vbs',
  'js',
  'mjs',
  'msi',
  'com',
  'scr',
  'pif',
  'bin',
  'jar',
  'ps1',
  'apk',
  'dll',
  'sys',
  'iso',
  'vbe',
  'jse',
  'wsf',
  'wsh',
  'dmg',
  'pkg',
  'deb',
  'rpm',
  'app',
  'hta',
  'cpl',
  'inf',
  'reg',
  'gadget',
]);

// Allowed safe extensions for professional communications
export const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  // Documents
  'pdf',
  'doc',
  'docx',
  'txt',
  'rtf',
  'odt',
  'csv',
  'tsv',
  'md',
  'epub',
  // Spreadsheets & Presentations
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  // Images
  'png',
  'jpg',
  'jpeg',
  'webp',
  'svg',
  'gif',
  'bmp',
  'tiff',
  // Compressed Archives
  'zip',
  'tar',
  'gz',
  'rar',
  '7z',
  // Code & Data
  'json',
  'xml',
  'yaml',
  'yml',
  'c',
  'cpp',
  'h',
  'hpp',
  'py',
  'java',
  'ts',
  'tsx',
  'html',
  'css',
]);

export interface AttachmentValidationResult {
  isValid: boolean;
  error?: string;
  formattedSize: string;
  extension: string;
}

/**
 * Converts a raw byte count into a human-readable string (e.g. 1.25 MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, clampedIndex);
  return `${size.toFixed(size >= 10 || clampedIndex === 0 ? 0 : 1)} ${units[clampedIndex]}`;
}

/**
 * Validates file size, file extension, and security rules for attachments.
 */
export function validateAttachment(
  file: { name?: string; size?: number; type?: string } | null | undefined
): AttachmentValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: 'No file attachment selected.',
      formattedSize: '0 B',
      extension: '',
    };
  }

  const fileName = (file.name || '').trim();
  const size = typeof file.size === 'number' ? file.size : 0;
  const formattedSize = formatBytes(size);

  // Extract file extension
  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot !== -1 ? fileName.slice(lastDot + 1).toLowerCase().trim() : '';

  if (!fileName || !extension) {
    return {
      isValid: false,
      error: 'Attachment must have a valid file extension.',
      formattedSize,
      extension: '',
    };
  }

  // 1. Check for prohibited executables, packages, and scripts
  if (PROHIBITED_EXTENSIONS.has(extension)) {
    return {
      isValid: false,
      error: `Executable and script files (.${extension}) are prohibited for security.`,
      formattedSize,
      extension,
    };
  }

  // 2. Check maximum size limit (10 MB = 10,485,760 bytes)
  if (size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Attachment size (${formattedSize}) exceeds the maximum 10 MB limit.`,
      formattedSize,
      extension,
    };
  }

  // 3. Check for empty or non-positive file size
  if (size <= 0) {
    return {
      isValid: false,
      error: 'Attachment file is empty (0 bytes).',
      formattedSize,
      extension,
    };
  }

  // 4. Check if extension is in the safe whitelist
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      isValid: false,
      error: `File format (.${extension}) is not supported. Please attach PDF, images, documents, or archives.`,
      formattedSize,
      extension,
    };
  }

  return {
    isValid: true,
    formattedSize,
    extension,
  };
}
