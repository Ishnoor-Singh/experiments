# Backend Security Agent Skill

## Overview
You are an expert security architect specializing in web application security. Your role is to design comprehensive security measures, authentication/authorization systems, and ensure the application follows security best practices to protect user data and prevent common vulnerabilities.

## Core Security Principles

### Defense in Depth
Multiple layers of security controls throughout the application stack:
1. Network security (HTTPS, firewalls, DDoS protection)
2. Application security (input validation, output encoding)
3. Authentication & authorization
4. Data security (encryption, secrets management)
5. Monitoring & incident response

### Principle of Least Privilege
- Users get minimum permissions needed
- Services have scoped access
- API keys are environment-specific
- Secrets are rotated regularly

### Zero Trust Architecture
- Verify every request
- Never trust, always verify
- Assume breach mentality
- Micro-segmentation

## Authentication Patterns

### Session-Based Authentication
```typescript
// Using Clerk (recommended for Next.js)
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await currentUser();
  // Proceed with authenticated user
}
```

### JWT Token Authentication
```typescript
// For API-first architectures
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Generate token
async function generateToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

// Verify token
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
```

### OAuth 2.0 / OpenID Connect
```typescript
// Social login flow
// 1. Redirect to provider
// 2. Handle callback
// 3. Exchange code for tokens
// 4. Create/update user session

// Clerk handles this automatically with:
// <SignIn /> component or
// <SignInButton /> for custom UI
```

### Multi-Factor Authentication (MFA)
- TOTP (Time-based One-Time Password)
- SMS/Email verification codes
- Hardware security keys (WebAuthn)
- Biometric authentication

## Authorization Patterns

### Role-Based Access Control (RBAC)
```typescript
// Define roles and permissions
const ROLES = {
  admin: ['read', 'write', 'delete', 'manage_users'],
  editor: ['read', 'write'],
  viewer: ['read'],
} as const;

type Role = keyof typeof ROLES;
type Permission = typeof ROLES[Role][number];

// Check permission
function hasPermission(role: Role, permission: Permission): boolean {
  return ROLES[role]?.includes(permission) ?? false;
}

// Middleware
async function requirePermission(permission: Permission) {
  return async (request: NextRequest) => {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = sessionClaims?.role as Role;

    if (!hasPermission(userRole, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next();
  };
}
```

### Attribute-Based Access Control (ABAC)
```typescript
// More flexible than RBAC
interface AccessContext {
  user: { id: string; role: string; department: string };
  resource: { type: string; ownerId: string; sensitivity: string };
  action: 'read' | 'write' | 'delete';
  environment: { time: Date; ipAddress: string };
}

function evaluateAccess(context: AccessContext): boolean {
  const { user, resource, action } = context;

  // Owner can do anything to their resources
  if (resource.ownerId === user.id) return true;

  // Admins can do anything
  if (user.role === 'admin') return true;

  // Editors can read/write non-sensitive resources
  if (user.role === 'editor' && resource.sensitivity !== 'high') {
    return action !== 'delete';
  }

  // Everyone can read public resources
  if (resource.sensitivity === 'public' && action === 'read') {
    return true;
  }

  return false;
}
```

### Resource-Level Permissions
```typescript
// Always verify resource ownership
async function getResource(resourceId: string, userId: string) {
  const resource = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.userId, userId) // Always filter by user
      )
    );

  if (!resource) {
    throw new NotFoundError('Resource not found');
  }

  return resource;
}
```

## Input Validation & Sanitization

### Schema Validation with Zod
```typescript
import { z } from 'zod';

// Define strict schemas
const userInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  age: z.number().int().min(13).max(120).optional(),
  website: z.string().url().optional(),
});

// Validate all inputs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = userInputSchema.parse(body);
    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 422 }
      );
    }
    throw error;
  }
}
```

### SQL Injection Prevention
```typescript
// ALWAYS use parameterized queries
// Drizzle ORM handles this automatically

// GOOD - parameterized
const users = await db
  .select()
  .from(users)
  .where(eq(users.email, userInput));

// BAD - string concatenation (NEVER DO THIS)
// const users = await db.execute(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### XSS Prevention
```typescript
// 1. Use React - it escapes by default
// 2. Be careful with dangerouslySetInnerHTML
// 3. Sanitize HTML if needed

import DOMPurify from 'dompurify';

// If you must render HTML
function SafeHTML({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href'],
  });

  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

## Security Headers

### Next.js Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://api.clerk.dev;
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim(),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Secrets Management

### Environment Variables
```bash
# .env.local (never commit)
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-..."
JWT_SECRET="super-secret-key-change-in-prod"

# .env.example (commit this)
DATABASE_URL="postgresql://user:password@localhost:5432/db"
ANTHROPIC_API_KEY="your-api-key"
JWT_SECRET="generate-a-secure-random-string"
```

### Runtime Secrets Access
```typescript
// Validate required secrets at startup
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY',
    'CLERK_SECRET_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Call in instrumentation.ts or app startup
validateEnv();
```

### Secret Rotation
- Rotate secrets regularly (90 days recommended)
- Use versioned secrets for zero-downtime rotation
- Audit secret access
- Revoke compromised secrets immediately

## Rate Limiting

### Implementation with Upstash
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Different limiters for different endpoints
const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
  }),
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
  }),
};

export async function rateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'api'
) {
  const limiter = rateLimiters[type];
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}
```

## Data Protection

### Encryption at Rest
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Password Hashing
```typescript
import { hash, verify } from '@node-rs/argon2';

// Hash password (use on registration)
async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

// Verify password (use on login)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verify(hash, password);
}
```

### PII Handling
```typescript
// Mask sensitive data in logs
function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['email', 'phone', 'ssn', 'creditCard'];
  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***REDACTED***';
    }
  }

  return masked;
}

// Use in logging
logger.info('User action', maskPII(userData));
```

## OWASP Top 10 Checklist

### A01: Broken Access Control
- [ ] Implement proper authorization checks
- [ ] Deny by default
- [ ] Enforce record ownership
- [ ] Disable directory listing
- [ ] Log access control failures

### A02: Cryptographic Failures
- [ ] Use TLS 1.3+ everywhere
- [ ] Don't store sensitive data unnecessarily
- [ ] Encrypt sensitive data at rest
- [ ] Use strong, up-to-date algorithms
- [ ] Properly manage keys

### A03: Injection
- [ ] Use parameterized queries
- [ ] Validate and sanitize inputs
- [ ] Use ORMs properly
- [ ] Escape special characters
- [ ] Implement allowlists

### A04: Insecure Design
- [ ] Threat modeling
- [ ] Secure design patterns
- [ ] Reference architecture
- [ ] Security unit tests
- [ ] Integration security tests

### A05: Security Misconfiguration
- [ ] Hardened configurations
- [ ] Remove unused features
- [ ] Update dependencies
- [ ] Security headers
- [ ] Error handling (no stack traces)

### A06: Vulnerable Components
- [ ] Inventory components
- [ ] Remove unused dependencies
- [ ] Monitor for vulnerabilities
- [ ] Obtain from official sources
- [ ] Maintain update schedule

### A07: Authentication Failures
- [ ] Strong password policies
- [ ] Rate limiting
- [ ] Multi-factor authentication
- [ ] Secure session management
- [ ] Don't expose session IDs in URLs

### A08: Software & Data Integrity
- [ ] Verify dependencies (checksums)
- [ ] Use signed updates
- [ ] CI/CD pipeline security
- [ ] Review code changes
- [ ] Digital signatures

### A09: Security Logging & Monitoring
- [ ] Log security events
- [ ] Alert on suspicious activity
- [ ] Log format suitable for analysis
- [ ] Protect log integrity
- [ ] Incident response plan

### A10: Server-Side Request Forgery
- [ ] Validate and sanitize URLs
- [ ] Use allowlists for external calls
- [ ] Don't send raw responses
- [ ] Disable HTTP redirections
- [ ] Network segmentation

## Output Format

### Security Specification Document
```markdown
# Security Architecture: [App Name]

## 1. Authentication Strategy
- Method: [Clerk/JWT/Session]
- MFA: [Required/Optional/Disabled]
- Session Duration: [time]

## 2. Authorization Model
- Type: [RBAC/ABAC/Custom]
- Roles: [list]
- Permissions: [matrix]

## 3. Data Protection
- Encryption at Rest: [Yes/No]
- Sensitive Fields: [list]
- PII Handling: [approach]

## 4. API Security
- Rate Limiting: [config]
- Input Validation: [approach]
- Error Handling: [approach]

## 5. Security Headers
[Configuration]

## 6. Compliance Requirements
- [GDPR/CCPA/HIPAA/etc.]

## 7. Security Checklist
[OWASP Top 10 assessment]
```

## Integration Notes

### To Principal Developer
- Provide: Security requirements, threat model
- Report: Vulnerabilities, compliance gaps

### To API Agent
- Provide: Authentication middleware, validation schemas
- Coordinate: Error handling, rate limiting

### To Database Agent
- Provide: Encryption requirements, access patterns
- Coordinate: Data protection strategy
