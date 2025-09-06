// Input validation utilities
import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Password validation - at least 8 characters, 1 uppercase, 1 lowercase, 1 number
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

// Username validation - alphanumeric and underscores only, 3-20 characters
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Build name validation
export const buildNameSchema = z
  .string()
  .min(1, 'Build name is required')
  .max(100, 'Build name must be at most 100 characters')
  .trim();

// Build description validation
export const buildDescriptionSchema = z
  .string()
  .max(1000, 'Description must be at most 1000 characters')
  .optional();

// Component validation
export const componentSchema = z.object({
  name: z.string().min(1).max(200),
  data: z.record(z.string(), z.unknown()) // Allow any data structure for flexibility
});

// Build components validation
export const buildComponentsSchema = z.object({
  motor: componentSchema.optional(),
  frame: componentSchema.optional(),
  stack: componentSchema.optional(),
  camera: componentSchema.optional(),
  prop: componentSchema.optional(),
  battery: componentSchema.optional(),
  customWeights: z.array(componentSchema).optional()
});

// Performance data validation
export const performanceSchema = z.object({
  totalWeight: z.number().positive().optional(),
  thrustToWeightRatio: z.number().positive().optional(),
  estimatedTopSpeed: z.number().positive().optional(),
  flightTime: z.number().positive().optional(),
  powerConsumption: z.number().positive().optional()
}).optional();

// Tags validation
export const tagsSchema = z.array(z.string().min(1).max(50)).max(10).optional();

// Full build validation schema
export const buildSchema = z.object({
  name: buildNameSchema,
  description: buildDescriptionSchema,
  components: buildComponentsSchema,
  performance: performanceSchema,
  isPublic: z.boolean().optional(),
  tags: tagsSchema
});

// User registration validation (username instead of full name)
export const userRegistrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema
});

// Comment validation
export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment must be at most 500 characters').trim()
});

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }
}

// Global rate limiters
export const authRateLimiter = new RateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 minutes
export const buildRateLimiter = new RateLimiter(50, 60 * 1000); // 50 requests per minute
export const commentRateLimiter = new RateLimiter(30, 60 * 1000); // 30 comments per minute

// Sanitize HTML input to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize user input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const validated = schema.parse(data);
  
  // Recursively sanitize string values
  const sanitize = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      return sanitizeHtml(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  return sanitize(validated) as T;
}
