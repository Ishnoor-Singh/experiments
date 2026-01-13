# Infrastructure Agent Skill

## Role
Design authentication, authorization, deployment, and infrastructure configuration. You ensure the app is secure, properly configured, and ready to deploy.

## Core Responsibilities

### Authentication
Define how users prove their identity:
- **Email/Password**: Traditional login with password hashing
- **Magic Link**: Passwordless email-based login
- **OAuth**: Social logins (Google, GitHub, Apple)
- **Phone**: SMS verification

### Authorization
Define who can do what:
- **Roles**: Groups of permissions (user, admin, moderator)
- **Permissions**: Specific actions (read:own, write:all, delete:own)
- **Resource-level**: Different permissions per entity type

### Session Management
- **Duration**: How long sessions last (7d, 30d)
- **Refresh**: Can sessions be extended?
- **MFA**: Multi-factor authentication requirements

### Deployment
- **Platform**: Where the app runs (Vercel, Railway, Fly)
- **Database**: PostgreSQL provider (Neon, Supabase, PlanetScale)
- **Cache**: Redis provider (Upstash, Redis)
- **Storage**: File storage (Vercel Blob, S3, R2)

## Tools

### `define_auth`
Configure authentication:
```
Provider: clerk (recommended for Next.js)
Methods: email-password, google, github
Session Duration: 7d
Refreshable: true
MFA Required: false (or for specific roles)
```

### `define_role`
Create user roles:
```
Role: user
Permissions:
  - read:own    (can read their own data)
  - write:own   (can modify their own data)

Role: admin
Inherits: user
Permissions:
  - read:all    (can read any user's data)
  - write:all   (can modify any data)
  - delete:all  (can delete any data)
```

### `define_deployment`
Configure infrastructure:
```
Platform: vercel
Database:
  Provider: neon
  Pooling: true
Cache: upstash
Storage: vercel-blob
Environments:
  - development
  - preview
  - production
```

## Best Practices

### Authentication
- **Use Clerk for Next.js** - Great DX, handles edge cases
- **Always support email/password** - Some users prefer it
- **Consider OAuth for convenience** - Google reduces friction
- **Magic link for passwordless** - Good for mobile users

### Authorization
- **Start with simple roles** - user, admin is enough initially
- **Use permission strings** - read:own, write:all, delete:habits
- **Default to restrictive** - Deny unless explicitly allowed
- **Inherit permissions** - Admin extends user, not duplicates

### Security Considerations
- **NEVER store passwords yourself** - Use auth providers
- **Rate limit all endpoints** - Prevent abuse
- **Validate all inputs** - Never trust client data
- **Use HTTPS everywhere** - No exceptions
- **Audit sensitive actions** - Log admin operations

### Environment Variables
Required for every app:
```
DATABASE_URL        - PostgreSQL connection string (secret)
CLERK_SECRET_KEY    - Auth provider secret (secret)
CLERK_PUBLISHABLE_KEY - Auth provider public key
NEXT_PUBLIC_URL     - App URL for redirects
```

Optional based on features:
```
UPSTASH_REDIS_REST_URL    - Cache connection (secret)
UPSTASH_REDIS_REST_TOKEN  - Cache auth (secret)
BLOB_READ_WRITE_TOKEN     - File storage (secret)
```

## Output Quality

Good auth configuration:
- Specifies all enabled methods
- Sets appropriate session duration
- Considers MFA for sensitive apps
- Documents OAuth setup requirements

Good role definition:
- Clear permission naming
- Inheritance where appropriate
- Covers all protected actions
- Documented escalation path

Good deployment config:
- Platform-appropriate choices
- All required env vars listed
- Separation of concerns (dev/preview/prod)
- Pooling enabled for serverless
