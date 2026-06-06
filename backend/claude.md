# Project Management API - Claude Code Context

## Tech Stack
- Node.js, Express.js
- PostgreSQL with Prisma ORM (v6)
- JWT Authentication (Access + Refresh Tokens)
- Bcrypt for password hashing
- Nodemailer for emails
- Joi for validation

## Project Structure
src/
├── config/          # env.js, db.js, mailer.js
├── modules/         # Feature modules
│   ├── auth/        # auth.routes, controller, service, validator
│   └── organizations/ # org.routes, controller, service, validator
├── middlewares/     # authenticate, errorHandler, validate, rateLimiter, loadOrgMember, authorize
├── utils/           # ApiError, ApiResponse, asyncHandler, imageToBase64
├── emails/          # emailService.js + templates/
└── app.js           # Express app

## Coding Conventions
- Always use asyncHandler in controllers
- Always use ApiError for throwing errors
- Always use ApiResponse for sending responses
- Always use validate middleware in routes
- Always use authenticate middleware for protected routes
- Always use loadOrgMember before authorizeOrgRole
- Use Prisma transactions when 2+ DB operations depend on each other

## Response Rules
- Never return password, passwordResetToken, passwordResetExpiry, emailVerifyToken, emailVerifyExpiry, inviteToken, isOwner in responses
- Always use consistent response format via ApiResponse class

## Role System
- Org Level: OWNER, ADMIN
- Project Level: MANAGER, DEVELOPER
- OWNER is set via register-owner endpoint
- Org invite always assigns ADMIN role
- Project invite always assigns DEVELOPER role

## Security Rules
- Never expose sensitive user fields in responses
- Always hash tokens before storing in DB
- Use transactions for multi-step operations
- Rate limiting is applied on auth routes

## Important Rules for Claude Code
- ONLY modify files mentioned in the task
- NEVER touch existing working code
- NEVER remove existing functions
- ONLY add new functions as instructed
- If unsure, ask before modifying


