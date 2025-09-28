// Security utilities for custom parts feature
import { createHash, randomBytes } from 'crypto';

// Rate limiting tracking (client-side)
export const rateLimitTracking = {
  trackAction(action: string, userId: string): boolean {
    const key = `rateLimit_${action}_${userId}`;
    const now = Date.now();
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const data = JSON.parse(stored);
      const windowMs = this.getWindowMs(action);
      const maxRequests = this.getMaxRequests(action);
      
      // Clean old entries
      data.requests = data.requests.filter((time: number) => now - time < windowMs);
      
      if (data.requests.length >= maxRequests) {
        return false; // Rate limited
      }
      
      data.requests.push(now);
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, JSON.stringify({ requests: [now] }));
    }
    
    return true;
  },
  
  getWindowMs(action: string): number {
    const windows = {
      'general': 15 * 60 * 1000,
      'fileUpload': 60 * 60 * 1000,
      'partCreation': 24 * 60 * 60 * 1000,
      'importData': 60 * 60 * 1000,
    };
    return windows[action as keyof typeof windows] || 15 * 60 * 1000;
  },
  
  getMaxRequests(action: string): number {
    const limits = {
      'general': 100,
      'fileUpload': 10,
      'partCreation': 20,
      'importData': 5,
    };
    return limits[action as keyof typeof limits] || 100;
  },
};

// Input sanitization
export class InputSanitizer {
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove HTML tags and dangerous characters
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>"'&]/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/data:/gi, '') // Remove data protocols
      .replace(/vbscript:/gi, '') // Remove vbscript protocols
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 1000); // Limit length
  }

  static sanitizeSpecifications(specs: Record<string, unknown>): Record<string, string | number> {
    const sanitized: Record<string, string | number> = {};
    
    for (const [key, value] of Object.entries(specs)) {
      const cleanKey = this.sanitizeText(key);
      if (cleanKey && cleanKey.length <= 50) {
        if (typeof value === 'number' && isFinite(value)) {
          sanitized[cleanKey] = value;
        } else if (typeof value === 'string') {
          const cleanValue = this.sanitizeText(value);
          if (cleanValue && cleanValue.length <= 200) {
            sanitized[cleanKey] = cleanValue;
          }
        }
      }
    }
    
    return sanitized;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateFileName(fileName: string): boolean {
    // Only allow safe file names
    const safeNameRegex = /^[a-zA-Z0-9._-]+$/;
    return safeNameRegex.test(fileName) && fileName.length <= 255;
  }
}

// File security validation
export class FileSecurityValidator {
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'model/stl',
    'application/sla',
    'model/obj',
    'model/gltf+json',
    'model/gltf-binary',
    'application/json', // For GLTF
    'model/3mf',
    'application/vnd.ms-3mfdocument',
    'model/ply',
    'application/ply',
  ]);

  private static readonly ALLOWED_EXTENSIONS = new Set([
    '.stl', '.obj', '.gltf', '.glb', '.3mf', '.ply'
  ]);

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MIN_FILE_SIZE = 100; // 100 bytes

  static async validateFile(file: File): Promise<{valid: boolean; error?: string}> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    if (file.size < this.MIN_FILE_SIZE) {
      return { valid: false, error: 'File is too small to be valid' };
    }

    // Check file extension
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.has(extension)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.has(file.type)) {
      return { valid: false, error: 'Invalid file format' };
    }

    // Check file name
    if (!InputSanitizer.validateFileName(file.name)) {
      return { valid: false, error: 'Invalid file name' };
    }

    // Additional binary validation
    const isValid = await this.validateFileContent(file, extension);
    if (!isValid) {
      return { valid: false, error: 'File content validation failed' };
    }

    return { valid: true };
  }

  private static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  private static async validateFileContent(file: File, extension: string): Promise<boolean> {
    try {
      // Read first few bytes to validate file signature
      const buffer = await file.slice(0, 512).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      switch (extension) {
        case '.stl':
          return this.validateSTLHeader(bytes);
        case '.obj':
          return this.validateOBJHeader(bytes);
        case '.gltf':
          return this.validateGLTFHeader(bytes);
        case '.glb':
          return this.validateGLBHeader(bytes);
        case '.ply':
          return this.validatePLYHeader(bytes);
        default:
          return true; // Allow other formats for now
      }
    } catch (error) {
      console.error('File validation error:', error);
      return false;
    }
  }

  private static validateSTLHeader(bytes: Uint8Array): boolean {
    // STL files can be ASCII or binary
    // Binary STL starts with 80-byte header
    // ASCII STL starts with "solid"
    const text = new TextDecoder().decode(bytes.slice(0, 5));
    return text.toLowerCase().startsWith('solid') || bytes.length >= 80;
  }

  private static validateOBJHeader(bytes: Uint8Array): boolean {
    // OBJ files are text-based and typically start with comments or vertex data
    const text = new TextDecoder().decode(bytes.slice(0, 50));
    return /^(#|v |vn |vt |f |o |g |s |mtllib |usemtl )/m.test(text);
  }

  private static validateGLTFHeader(bytes: Uint8Array): boolean {
    // GLTF files are JSON and should start with "{"
    const text = new TextDecoder().decode(bytes.slice(0, 10));
    return text.trim().startsWith('{');
  }

  private static validateGLBHeader(bytes: Uint8Array): boolean {
    // GLB files have a specific header: "glTF" magic string
    const magic = new TextDecoder().decode(bytes.slice(0, 4));
    return magic === 'glTF';
  }

  private static validatePLYHeader(bytes: Uint8Array): boolean {
    // PLY files start with "ply" and format specification
    const text = new TextDecoder().decode(bytes.slice(0, 20));
    return text.toLowerCase().startsWith('ply\n');
  }

  static generateSecureFileName(originalName: string, userId: string): string {
    const extension = this.getFileExtension(originalName);
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    const userHash = createHash('sha256').update(userId).digest('hex').substring(0, 8);
    
    return `${userHash}_${timestamp}_${random}${extension}`;
  }
}

// CSRF token management
export class CSRFTokenManager {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  static verifyToken(token: string, storedToken: string, timestamp: number): boolean {
    if (!token || !storedToken || token !== storedToken) {
      return false;
    }

    // Check if token has expired
    return Date.now() - timestamp < this.TOKEN_EXPIRY;
  }
}

// Content validation and AI moderation
export class ContentModerationService {
  private static readonly SUSPICIOUS_PATTERNS = [
    /\b(hack|exploit|malware|virus|trojan)\b/i,
    /\b(admin|root|password|login)\b/i,
    /<script|javascript:|data:|vbscript:/i,
    /\b(download|crack|keygen|serial)\b/i,
  ];

  private static readonly SPAM_INDICATORS = [
    /\b(buy now|click here|limited time|act now)\b/i,
    /\$\d+|\d+\$|\d+\s*(dollars?|usd|eur|gbp)/i,
    /(http|https):\/\/[^\s]+/gi,
    /\b(casino|poker|lottery|gambling)\b/i,
  ];

  static async moderateContent(content: {
    name: string;
    description?: string;
    specifications: Record<string, unknown>;
  }): Promise<{approved: boolean; issues: string[]}> {
    const issues: string[] = [];
    const textToCheck = [
      content.name,
      content.description || '',
      ...Object.keys(content.specifications),
      ...Object.values(content.specifications).map(v => String(v)),
    ].join(' ');

    // Check for suspicious patterns
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(textToCheck)) {
        issues.push('Content contains suspicious patterns');
        break;
      }
    }

    // Check for spam indicators
    let spamScore = 0;
    for (const pattern of this.SPAM_INDICATORS) {
      if (pattern.test(textToCheck)) {
        spamScore++;
      }
    }

    if (spamScore >= 2) {
      issues.push('Content appears to be spam');
    }

    // Check content length and quality
    if (content.name.length < 3) {
      issues.push('Part name too short');
    }

    if (content.name.length > 100) {
      issues.push('Part name too long');
    }

    if (content.description && content.description.length > 2000) {
      issues.push('Description too long');
    }

    // Check specifications count
    if (Object.keys(content.specifications).length > 50) {
      issues.push('Too many specifications');
    }

    return {
      approved: issues.length === 0,
      issues,
    };
  }

  static async analyzeFileForThreats(file: File): Promise<{safe: boolean; threats: string[]}> {
    const threats: string[] = [];

    // Check file size patterns that might indicate malicious files
    if (file.size === 0) {
      threats.push('Empty file detected');
    }

    // Check for suspicious file names
    const suspiciousNames = [
      /\.(exe|bat|cmd|scr|vbs|js|jar)$/i,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    ];

    for (const pattern of suspiciousNames) {
      if (pattern.test(file.name)) {
        threats.push('Suspicious file name detected');
        break;
      }
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }
}

// Audit logging
export class SecurityAuditLogger {
  static logSecurityEvent(event: {
    type: 'file_upload' | 'part_creation' | 'import_export' | 'suspicious_activity';
    userId?: string;
    ip?: string;
    userAgent?: string;
    details: Record<string, unknown>;
    timestamp?: Date;
  }): void {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    // In production, this would send to a proper logging service
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry, null, 2));
    
    // Store in database for analysis
    // await prisma.securityLog.create({ data: logEntry });
  }

  static async detectAnomalousActivity(): Promise<boolean> {
    // This would analyze patterns in database
    // For now, return false (no anomalies detected)
    return false;
  }
}

const SecurityUtils = {
  rateLimitTracking,
  InputSanitizer,
  FileSecurityValidator,
  CSRFTokenManager,
  ContentModerationService,
  SecurityAuditLogger,
};

export default SecurityUtils;