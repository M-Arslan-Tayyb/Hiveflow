# Project Progress

## Completed ✅
- Auth Module (Register, Login, Refresh, Logout)
- Email Verification
- Forgot/Reset Password
- Organizations CRUD
- Invite System
- RBAC Middleware
- Organizations — Remove Member (with email notification)
- Organizations — Get All Members
- OrgRole schema update — added MEMBER to OrgRole enum (migration: 20260523181801_add_member_to_org_role)

## In Progress 🔄
- Organizations — Update Member Role
- Projects Module

## Completed ✅ (recent additions)
- Project Invite Flow (POST /projects/:projectId/members/invite)
- Magic Link Login (GET /auth/magic-link?token=xxx)
- ProjectInvite schema + migration (20260523213210_add_project_invite_magic_link)
- Board System (custom Kanban boards per project; auto-creates Todo/In Progress/Done on project creation; 5 endpoints)
- Tasks Module (CRUD + move between boards + position reordering; 7 endpoints)

## Pending ⏳
- Comments Module
- Attachments — S3
- Notifications — Socket.io
- Redis Caching
- Bull Queue
- Winston Logging
- Docker
- CI/CD
- k6 Testing
- AI Chatbot

## Current Rules
- Org invite = always ADMIN
- Project invite = always DEVELOPER
- Owner registered via /auth/register-owner
- OrgRole values: OWNER, ADMIN, MEMBER
