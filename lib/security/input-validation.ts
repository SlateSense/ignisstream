import { z } from 'zod'

// SQL injection patterns to detect and block
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|OR|AND)\b)/gi,
  /('|(\\x27)|(\\x2D\\x2D)|(\;)|(\||\\x7C)|(\\*|\\x2A))/gi,
  /(\\x31\\x3D\\x31)/gi, // 1=1
  /(\\x31\\x27\\x20\\x4F\\x52\\x20\\x27\\x31)/gi, // 1' OR '1
]

// XSS patterns to detect and block
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
]

export class InputValidator {
  // Sanitize string input
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new z.ZodError([{
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: typeof input,
        path: [],
        message: 'Input must be a string'
      }])
    }

    // Check length
    if (input.length > maxLength) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.too_big,
        maximum: maxLength,
        type: 'string',
        inclusive: true,
        path: [],
        message: `Input too long (max ${maxLength} characters)`
      }])
    }

    // Check for SQL injection
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          path: [],
          message: 'Potentially malicious input detected'
        }])
      }
    }

    // HTML encode to prevent XSS
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // Validate and sanitize HTML content (for rich text)
  static sanitizeHTML(input: string, maxLength: number = 10000): string {
    if (typeof input !== 'string') {
      throw new z.ZodError([{
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: typeof input,
        path: [],
        message: 'Input must be a string'
      }])
    }

    if (input.length > maxLength) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.too_big,
        maximum: maxLength,
        type: 'string',
        inclusive: true,
        path: [],
        message: `HTML content too long (max ${maxLength} characters)`
      }])
    }

    // Check for dangerous XSS patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          path: [],
          message: 'Potentially malicious HTML detected'
        }])
      }
    }

    // Allow only safe HTML tags
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
    
    let match
    while ((match = tagPattern.exec(input)) !== null) {
      const tag = match[1].toLowerCase()
      if (!allowedTags.includes(tag)) {
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          path: [],
          message: `Disallowed HTML tag: ${tag}`
        }])
      }
    }

    return input
  }

  // Validate URLs
  static validateURL(input: string): string {
    try {
      const url = new URL(input)
      
      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol')
      }

      // Block suspicious domains
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
      if (process.env.NODE_ENV === 'production' && suspiciousDomains.includes(url.hostname)) {
        throw new Error('Blocked domain')
      }

      return url.toString()
    } catch (error) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Invalid URL format'
      }])
    }
  }

  // Validate file uploads
  static validateFile(file: File, allowedTypes: string[], maxSize: number = 10 * 1024 * 1024): void {
    // Check file size
    if (file.size > maxSize) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.too_big,
        maximum: maxSize,
        type: 'number',
        inclusive: true,
        path: [],
        message: `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`
      }])
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }])
    }

    // Check file name for path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Invalid file name'
      }])
    }
  }
}

// Common validation schemas
export const validationSchemas = {
  // User input schemas
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform(val => InputValidator.sanitizeString(val, 30)),

  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .transform(val => InputValidator.sanitizeString(val, 254).toLowerCase()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),

  displayName: z.string()
    .min(1, 'Display name required')
    .max(100, 'Display name too long')
    .transform(val => InputValidator.sanitizeString(val, 100)),

  bio: z.string()
    .max(500, 'Bio too long')
    .transform(val => InputValidator.sanitizeString(val, 500)),

  // Post/Content schemas
  postTitle: z.string()
    .min(1, 'Title required')
    .max(200, 'Title too long')
    .transform(val => InputValidator.sanitizeString(val, 200)),

  postContent: z.string()
    .min(1, 'Content required')
    .max(10000, 'Content too long')
    .transform(val => InputValidator.sanitizeHTML(val, 10000)),

  // Gaming schemas
  gameTitle: z.string()
    .min(1, 'Game title required')
    .max(100, 'Game title too long')
    .transform(val => InputValidator.sanitizeString(val, 100)),

  // URL schemas
  url: z.string()
    .url('Invalid URL')
    .transform(val => InputValidator.validateURL(val)),

  // Stream schemas
  streamTitle: z.string()
    .min(1, 'Stream title required')
    .max(200, 'Stream title too long')
    .transform(val => InputValidator.sanitizeString(val, 200)),

  streamDescription: z.string()
    .max(1000, 'Stream description too long')
    .transform(val => InputValidator.sanitizeString(val, 1000)),

  // Chat message schema
  chatMessage: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .transform(val => InputValidator.sanitizeString(val, 500)),

  // Search query schema
  searchQuery: z.string()
    .min(1, 'Search query required')
    .max(100, 'Search query too long')
    .transform(val => InputValidator.sanitizeString(val, 100)),

  // Team/Tournament schemas
  teamName: z.string()
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name too long')
    .transform(val => InputValidator.sanitizeString(val, 50)),

  tournamentName: z.string()
    .min(3, 'Tournament name must be at least 3 characters')
    .max(100, 'Tournament name too long')
    .transform(val => InputValidator.sanitizeString(val, 100)),

  // File validation
  imageFile: z.custom<File>().refine(
    (file) => {
      try {
        InputValidator.validateFile(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 5 * 1024 * 1024)
        return true
      } catch {
        return false
      }
    },
    'Invalid image file'
  ),

  videoFile: z.custom<File>().refine(
    (file) => {
      try {
        InputValidator.validateFile(file, ['video/mp4', 'video/webm', 'video/ogg'], 100 * 1024 * 1024)
        return true
      } catch {
        return false
      }
    },
    'Invalid video file'
  ),
}

// API request validation wrapper
export function validateApiRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log the validation error for security monitoring
      console.warn('Validation failed:', {
        errors: error.errors,
        data: typeof data === 'object' ? Object.keys(data as any) : typeof data,
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      path: [],
      message: 'Validation error occurred'
    }])
  }
}
