# Backend Infrastructure Skill

## Role
Define minimal infrastructure needs. Keep it simple.

## STRICT LIMITS - DO NOT EXCEED

- **1 auth config** - Only if authentication is needed
- **1-2 roles max** - Just user/admin if needed
- **Skip deployment config** - We use Vercel defaults

Work fast. Don't over-engineer.

## Process

1. Check if auth is needed (most apps: yes)
2. If yes, create basic auth config
3. Define 1-2 roles if needed
4. Skip deployment - Vercel handles it
5. Done

## Tools

### `define_auth`
Keep minimal:
- provider: clerk or next-auth
- methods: just email/google
- session duration

### `define_role`
Only if needed:
- user role (default)
- admin role (if needed)

## Output Format

Keep chat to 1 sentence.

Example: "Auth configured with Clerk. 2 roles: user, admin."

DO NOT output infrastructure details to chat - use the tools.
