---
name: pm-add-endpoint
description: Use when adding a new API endpoint to this backend. Covers the exact file structure, middleware chain order, Joi validation, controller pattern, service pattern, and forbidden response fields for this specific codebase.
---

# Add Endpoint — project_management_fullStack Backend

## Tech Stack
Node.js + Express, Prisma ORM, Joi validation, JWT auth via Bearer token, Nodemailer emails.

## Module File Structure
Every feature lives in `src/modules/<feature>/`:
```
<feature>.route.js       ← Express router
<feature>.controller.js  ← asyncHandler wrappers only
<feature>.service.js     ← all business logic + Prisma
<feature>.validator.js   ← Joi schemas
```

---

## Step 1 — Validator (`<feature>.validator.js`)

```js
const Joi = require('joi');

const createThingSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(255).optional(),
});

module.exports = { createThingSchema };
```

---

## Step 2 — Service (`<feature>.service.js`)

- All Prisma calls go here — NEVER in controller
- Throw `ApiError` for all error cases
- Use `prisma.$transaction(async (tx) => { ... })` when 2+ DB ops depend on each other
- NEVER return sensitive fields (see Forbidden Fields section)

```js
const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const createThing = async ({ name, userId }) => {
    const existing = await prisma.thing.findUnique({ where: { name } });
    if (existing) throw new ApiError(409, 'Thing already exists');

    const thing = await prisma.thing.create({
        data: { name, userId },
    });

    return thing;
};

module.exports = { createThing };
```

---

## Step 3 — Controller (`<feature>.controller.js`)

- Always wrap with `asyncHandler`
- Always respond with `new ApiResponse(statusCode, message, data)`
- Extract from `req.body`, `req.params`, `req.user`, `req.orgMember`
- No business logic here

```js
const asyncHandler  = require('../../utils/asyncHandler');
const ApiResponse   = require('../../utils/ApiResponse');
const thingService  = require('./thing.service');

const createThing = asyncHandler(async (req, res) => {
    const thing = await thingService.createThing({
        name: req.body.name,
        userId: req.user.id,
    });
    res.status(201).json(new ApiResponse(201, 'Thing created successfully', thing));
});

module.exports = { createThing };
```

---

## Step 4 — Route (`<feature>.route.js`)

### Middleware Order — MUST follow exactly

```
authenticate → loadOrgMember → authorizeOrgRole(...) → validate(schema) → controller
```

- `loadOrgMember` MUST come before `authorizeOrgRole` — it loads `req.orgMember` which authorize reads
- `validate(schema)` is always the last middleware before the controller
- Rate limiters (`registerLimiter`, `authLimiter`) only on auth routes

### Templates by Access Level

```js
const express    = require('express');
const router     = express.Router();
const validate   = require('../../middlewares/validate');
const authenticate         = require('../../middlewares/auth/authenticate');
const loadOrgMember        = require('../../middlewares/organizations/loadOrgMember');
const { authorizeOrgRole } = require('../../middlewares/auth/authorize');
const { createThingSchema } = require('./thing.validator');
const thingController       = require('./thing.controller');

// Public — no auth
router.post('/', validate(createThingSchema), thingController.createThing);

// Auth required only
router.get('/', authenticate, thingController.listThings);

// Auth + org membership
router.get('/:orgId/things', authenticate, loadOrgMember, thingController.listThings);

// Auth + org membership + role (OWNER or ADMIN)
router.post(
    '/:orgId/things',
    authenticate,
    loadOrgMember,
    authorizeOrgRole('OWNER', 'ADMIN'),
    validate(createThingSchema),
    thingController.createThing,
);

// OWNER only
router.delete(
    '/:orgId/things/:thingId',
    authenticate,
    loadOrgMember,
    authorizeOrgRole('OWNER'),
    thingController.deleteThing,
);

module.exports = router;
```

---

## Step 5 — Register in `src/app.js`

```js
const thingRouter = require('./modules/things/thing.route');
app.use('/api/things', thingRouter);
```

---

## Forbidden Response Fields

**NEVER return these from any endpoint:**
`password`, `passwordResetToken`, `passwordResetExpiry`, `emailVerifyToken`, `emailVerifyExpiry`, `inviteToken`, `isOwner`

Strip them in the service layer:
```js
const { password: _, passwordResetToken: __, ...safeUser } = user;
return safeUser;
```

---

## ApiError Status Codes

```js
throw new ApiError(400, 'Bad request');
throw new ApiError(401, 'Unauthorized');
throw new ApiError(403, 'Forbidden');
throw new ApiError(404, 'Not found');
throw new ApiError(409, 'Already exists');
```

## ApiResponse Format

```js
// With data
res.status(200).json(new ApiResponse(200, 'Fetched successfully', data));
// Without data (delete, logout, etc.)
res.status(200).json(new ApiResponse(200, 'Deleted successfully'));
```

---

## Role Reference

| Scope   | Roles                  | Assigned by              |
|---------|------------------------|--------------------------|
| Org     | `OWNER`, `ADMIN`       | isOwner flag / org invite |
| Project | `MANAGER`, `DEVELOPER` | project invite           |

- Org invite always assigns `ADMIN`
- Project invite always assigns `DEVELOPER`
- Only `OWNER` can delete orgs or remove members

---

## Step 6 — Sync to Postman (ALWAYS do this after creating files)

After all 4 files are written and registered in app.js, add the endpoint to the Postman collection using the MCP.

### Fixed IDs — never look these up, always use them

| Resource | Value |
|----------|-------|
| Workspace | `b018b1ab-865c-4435-8386-e88225f48944` (My Workspace) |
| Collection ID | `0c113700-cc29-4645-95cc-870f62fd9503` |
| `auth` folder | `35c00180-4c5a-41d2-b066-2901952071b6` |
| `organizations` folder | `73248cb3-deb3-488a-9e63-d4f33ba94bd5` |

For **new modules** (projects, tasks, etc.) that don't have a folder yet, create the folder first via `mcp__claude_ai_Postman__createCollectionFolder`, then use the returned folder ID.

### How to call `mcp__claude_ai_Postman__createCollectionRequest`

```
collectionId  → "0c113700-cc29-4645-95cc-870f62fd9503"
folderId      → folder ID from the table above (or newly created folder ID)
name          → descriptive name, e.g. "Update Member Role"
method        → GET / POST / PATCH / DELETE
url           → "{{BASE_URL}}/api/<path>"  (path params as :paramName, e.g. :orgId)
headerData    → [{ key: "Content-Type", value: "application/json" }]  ← only for POST/PATCH/PUT
dataMode      → "raw"  (omit for GET/DELETE)
rawModeData   → JSON string built from Joi schema fields (omit for GET/DELETE)
dataOptions   → { raw: { language: "json" } }  (omit for GET/DELETE)
description   → one-line description of what the endpoint does
```

### How to build `rawModeData` from the Joi schema

Read the validator file for this endpoint. For each field in the Joi schema, put a realistic example value in the JSON body:

| Joi type | Example value |
|----------|--------------|
| `string().email()` | `"user@example.com"` |
| `string().min(8)` (password) | `"Password123!"` |
| `string()` | `"Example text"` |
| `string().valid(...)` | first valid value from the list |
| `boolean()` | `true` |
| `number()` | `1` |

Example — if Joi schema is `{ role: Joi.string().valid('ADMIN', 'MEMBER').required() }`:
```json
{
  "role": "ADMIN"
}
```

Pass that as a JSON string in `rawModeData`.

### URL pattern

| Route definition | Postman URL |
|-----------------|-------------|
| `router.get('/')` registered at `/api/orgs` | `{{BASE_URL}}/api/orgs` |
| `router.patch('/:orgId')` | `{{BASE_URL}}/api/orgs/:orgId` |
| `router.delete('/:orgId/members/:userId')` | `{{BASE_URL}}/api/orgs/:orgId/members/:userId` |

### Auth
The collection already has `Bearer {{ACCESS_TOKEN}}` set at collection level — do NOT add auth per-request. Only add `Content-Type: application/json` header for body-carrying methods.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `authorizeOrgRole` before `loadOrgMember` | `req.orgMember` is undefined — always load first |
| Business logic in controller | Move all Prisma/logic to service |
| Returning sensitive fields | Strip in service before returning |
| Missing `asyncHandler` on controller | All controller functions must be wrapped |
| Multiple dependent DB ops without transaction | Use `prisma.$transaction` |
| `validate` not last before controller | Always put validate immediately before controller |