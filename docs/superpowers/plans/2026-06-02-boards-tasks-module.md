# Boards & Tasks Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a custom Kanban Board system with full Task management, replacing the old `TaskStatus` enum with a flexible `Board` model so tasks live in user-defined columns.

**Architecture:** Schema first — remove `TaskStatus`, add `Board` model (linked to `Project`), update `Task` to reference `Board`. On project creation, auto-create 3 default boards (Todo, In Progress, Done) in the same transaction. Boards and Tasks each get their own module under `src/modules/projects/`.

**Tech Stack:** TypeScript, Express, Prisma ORM (PostgreSQL), Joi validation, JWT auth middleware already in place.

---

## File Map

| Action   | File                                                                    | Responsibility                              |
|----------|-------------------------------------------------------------------------|---------------------------------------------|
| Modify   | `backend/prisma/schema.prisma`                                          | Remove TaskStatus enum, add Board model, update Task + Project |
| Modify   | `backend/src/modules/projects/projects.service.ts`                     | Auto-create 3 default boards in createProject |
| Modify   | `backend/src/middlewares/projects/authorizeProjectAccess.ts`            | Add `requireProjectMember` export           |
| Modify   | `backend/src/modules/projects/projects.routes.ts`                       | Mount boards + tasks sub-routers            |
| Create   | `backend/src/modules/projects/boards/boards.validation.ts`             | Joi schemas for board endpoints             |
| Create   | `backend/src/modules/projects/boards/boards.service.ts`                | Board CRUD + position reorder logic         |
| Create   | `backend/src/modules/projects/boards/boards.controller.ts`             | asyncHandler wrappers → boardService        |
| Create   | `backend/src/modules/projects/boards/boards.routes.ts`                 | 5 board routes with auth middleware chain   |
| Create   | `backend/src/modules/projects/tasks/tasks.validation.ts`               | Joi schemas for task endpoints              |
| Create   | `backend/src/modules/projects/tasks/tasks.service.ts`                  | Task CRUD + move + position reorder logic   |
| Create   | `backend/src/modules/projects/tasks/tasks.controller.ts`               | asyncHandler wrappers → taskService         |
| Create   | `backend/src/modules/projects/tasks/tasks.routes.ts`                   | 7 task routes with auth middleware chain    |
| Modify   | `backend/TASKS.md`                                                      | Mark Board System + Tasks Module as complete |

---

## Task 1: Schema Changes

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Update schema.prisma**

Replace the entire file content (keep all existing models, apply changes below):

1. **Delete** the `TaskStatus` enum block (lines 22–28).
2. **Add** `Board` model before the `Task` model.
3. **Update** `Task` model — remove `status` field, add `boardId`/`board`.
4. **Update** `Project` model — add `boards Board[]` relation.

The updated `schema.prisma` should look like this (full file):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

enum ProjectRole {
  MANAGER
  DEVELOPER
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  password   String
  fullName   String
  avatar     String?
  isVerified Boolean  @default(false)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  orgMembers     OrgMember[]
  projectMembers ProjectMember[]
  assignedTasks  Task[]          @relation("AssignedTo")
  createdTasks   Task[]          @relation("CreatedBy")
  comments       Comment[]
  auditLogs      AuditLog[]

  notifications     Notification[] @relation("NotificationReceiver")
  sentNotifications Notification[] @relation("NotificationSender")

  passwordResetToken  String?
  passwordResetExpiry DateTime?

  isOwner Boolean @default(false)

  emailVerifyToken  String?
  emailVerifyExpiry DateTime?
  inviteToken       String?
  sentInvites       OrgInvite[] @relation("InvitedBy")

  magicLinkToken  String?
  magicLinkExpiry DateTime?
  sentProjectInvites ProjectInvite[] @relation("ProjectInvitedBy")
}

model Organization {
  id        String      @id @default(uuid())
  name      String
  slug      String      @unique
  logo      String?
  isActive  Boolean     @default(true)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  members   OrgMember[]
  projects  Project[]
  invites   OrgInvite[]
}

model OrgMember {
  id       String   @id @default(uuid())
  role     OrgRole  @default(ADMIN)
  joinedAt DateTime @default(now())

  userId String
  user   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  orgId  String
  org    Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
}

model OrgInvite {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  expiry    DateTime
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())

  org   Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  orgId String

  invitedBy   User   @relation("InvitedBy", fields: [invitedById], references: [id])
  invitedById String
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orgId   String
  org     Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  members ProjectMember[]
  tasks   Task[]
  boards  Board[]
  invites ProjectInvite[]
}

model ProjectMember {
  id       String      @id @default(uuid())
  role     ProjectRole @default(DEVELOPER)
  joinedAt DateTime    @default(now())

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])
}

model Board {
  id        String   @id @default(uuid())
  name      String
  position  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  position    Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String

  boardId String
  board   Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)

  assignee   User?   @relation("AssignedTo", fields: [assigneeId], references: [id])
  assigneeId String?

  creator   User   @relation("CreatedBy", fields: [creatorId], references: [id])
  creatorId String

  comments    Comment[]
  attachments Attachment[]
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  taskId String
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)

  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

model Attachment {
  id        String   @id @default(uuid())
  fileName  String
  fileUrl   String
  fileSize  Int
  mimeType  String
  createdAt DateTime @default(now())

  taskId String
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Notification {
  id        String   @id @default(uuid())
  title     String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user   User   @relation("NotificationReceiver", fields: [userId], references: [id], onDelete: Cascade)
  userId String

  sender   User?   @relation("NotificationSender", fields: [senderId], references: [id], onDelete: SetNull)
  senderId String?
}

model AuditLog {
  id        String   @id @default(uuid())
  action    String
  entity    String
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model ProjectInvite {
  id        String      @id @default(uuid())
  email     String
  token     String      @unique
  role      ProjectRole @default(DEVELOPER)
  expiry    DateTime
  isUsed    Boolean     @default(false)
  createdAt DateTime    @default(now())

  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  invitedBy   User   @relation("ProjectInvitedBy", fields: [invitedById], references: [id])
  invitedById String
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend
npx prisma migrate dev --name add-board-remove-task-status
```

Expected output ends with: `Your database is now in sync with your schema.`

- [ ] **Step 3: Regenerate Prisma client (if not auto-done)**

```bash
npx prisma generate
```

---

## Task 2: Add `requireProjectMember` Middleware

**Files:**
- Modify: `backend/src/middlewares/projects/authorizeProjectAccess.ts`

The existing file has `authorizeProjectMemberAccess` which allows OWNER/ADMIN (org) or MANAGER (project) — it blocks DEVELOPERs. Boards and Tasks allow any project member (MANAGER or DEVELOPER), so we need a new export.

- [ ] **Step 1: Add `requireProjectMember` export**

Open `backend/src/middlewares/projects/authorizeProjectAccess.ts` and append this export at the end of the file (after the closing brace of `authorizeProjectMemberAccess`):

```typescript
export const requireProjectMember: RequestHandler = (req, _res, next) => {
  if (!req.projectMember) {
    throw new ApiError(403, "You must be a project member to perform this action");
  }
  next();
};
```

The full file after edit:

```typescript
import { RequestHandler } from "express";
import ApiError from "@/utils/ApiError.js";

export const authorizeProjectMemberAccess: RequestHandler = (
  req,
  _res,
  next
) => {
  const orgRole = req.orgMember?.role;
  const projectRole = req.projectMember?.role;

  if (orgRole === "OWNER" || orgRole === "ADMIN" || projectRole === "MANAGER") {
    return next();
  }

  throw new ApiError(403, "You do not have permission to perform this action");
};

export const requireProjectMember: RequestHandler = (req, _res, next) => {
  if (!req.projectMember) {
    throw new ApiError(403, "You must be a project member to perform this action");
  }
  next();
};
```

---

## Task 3: Update `createProject` to Auto-Create Default Boards

**Files:**
- Modify: `backend/src/modules/projects/projects.service.ts`

- [ ] **Step 1: Update the `createProject` function**

The existing function creates the project + projectMember in a transaction. Extend it to also create 3 default boards in that same transaction. Replace only the `createProject` function body:

```typescript
const createProject = async ({
  orgId,
  name,
  description,
  creatorId,
}: CreateProjectInput) => {
  const project = await prisma.$transaction(async (tx) => {
    const newProject = await tx.project.create({
      data: { name, description, orgId },
    });

    await tx.projectMember.create({
      data: {
        userId: creatorId,
        projectId: newProject.id,
        role: "MANAGER",
      },
    });

    await tx.board.createMany({
      data: [
        { name: "Todo", position: 1, projectId: newProject.id },
        { name: "In Progress", position: 2, projectId: newProject.id },
        { name: "Done", position: 3, projectId: newProject.id },
      ],
    });

    return newProject;
  });

  return project;
};
```

All other functions (`getProjects`, `getProject`, `updateProject`, `deleteProject`) stay unchanged.

---

## Task 4: Boards Validation

**Files:**
- Create: `backend/src/modules/projects/boards/boards.validation.ts`

- [ ] **Step 1: Create the validation file**

```typescript
import Joi from "joi";

export const createBoardSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});

export const updateBoardSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});

export const updateBoardPositionSchema = Joi.object({
  position: Joi.number().integer().min(1).required(),
});
```

---

## Task 5: Boards Service

**Files:**
- Create: `backend/src/modules/projects/boards/boards.service.ts`

- [ ] **Step 1: Create the boards service**

```typescript
import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";

interface CreateBoardInput {
  projectId: string;
  orgId: string;
  name: string;
}

interface GetBoardsInput {
  projectId: string;
  orgId: string;
}

interface UpdateBoardInput {
  boardId: string;
  projectId: string;
  orgId: string;
  name: string;
}

interface UpdateBoardPositionInput {
  boardId: string;
  projectId: string;
  orgId: string;
  position: number;
}

interface DeleteBoardInput {
  boardId: string;
  projectId: string;
  orgId: string;
}

const getBoards = async ({ projectId, orgId }: GetBoardsInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  return prisma.board.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
    include: {
      tasks: {
        orderBy: { position: "asc" },
        include: {
          assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
          creator: { select: { id: true, fullName: true, email: true, avatar: true } },
        },
      },
    },
  });
};

const createBoard = async ({ projectId, orgId, name }: CreateBoardInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const existingBoard = await prisma.board.findFirst({ where: { projectId, name } });
  if (existingBoard) throw new ApiError(409, "A board with this name already exists in the project");

  const lastBoard = await prisma.board.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
  });
  const position = lastBoard ? lastBoard.position + 1 : 1;

  return prisma.board.create({ data: { name, position, projectId } });
};

const updateBoard = async ({ boardId, projectId, orgId, name }: UpdateBoardInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const board = await prisma.board.findFirst({ where: { id: boardId, projectId } });
  if (!board) throw new ApiError(404, "Board not found");

  const duplicateName = await prisma.board.findFirst({
    where: { projectId, name, id: { not: boardId } },
  });
  if (duplicateName) throw new ApiError(409, "A board with this name already exists in the project");

  return prisma.board.update({ where: { id: boardId }, data: { name } });
};

const updateBoardPosition = async ({
  boardId,
  projectId,
  orgId,
  position,
}: UpdateBoardPositionInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const board = await prisma.board.findFirst({ where: { id: boardId, projectId } });
  if (!board) throw new ApiError(404, "Board not found");

  const allBoards = await prisma.board.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });

  const clampedPosition = Math.min(position, allBoards.length);
  const filteredBoards = allBoards.filter((b) => b.id !== boardId);
  filteredBoards.splice(clampedPosition - 1, 0, board);

  await prisma.$transaction(
    filteredBoards.map((b, index) =>
      prisma.board.update({ where: { id: b.id }, data: { position: index + 1 } })
    )
  );

  return prisma.board.findUnique({ where: { id: boardId } });
};

const deleteBoard = async ({ boardId, projectId, orgId }: DeleteBoardInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const board = await prisma.board.findFirst({
    where: { id: boardId, projectId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!board) throw new ApiError(404, "Board not found");

  if (board._count.tasks > 0) {
    throw new ApiError(400, "Cannot delete a board that has tasks. Move or delete the tasks first.");
  }

  await prisma.board.delete({ where: { id: boardId } });
  return true;
};

export { getBoards, createBoard, updateBoard, updateBoardPosition, deleteBoard };
```

---

## Task 6: Boards Controller

**Files:**
- Create: `backend/src/modules/projects/boards/boards.controller.ts`

- [ ] **Step 1: Create the boards controller**

```typescript
import { Request, Response } from "express";
import * as boardService from "@/modules/projects/boards/boards.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";

const getBoards = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as { orgId: string; projectId: string };
  const boards = await boardService.getBoards({ projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Boards fetched successfully", boards));
});

const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as { orgId: string; projectId: string };
  const { name } = req.body;
  const board = await boardService.createBoard({ projectId, orgId, name });
  res.status(201).json(new ApiResponse(201, "Board created successfully", board));
});

const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, boardId } = req.params as {
    orgId: string;
    projectId: string;
    boardId: string;
  };
  const { name } = req.body;
  const board = await boardService.updateBoard({ boardId, projectId, orgId, name });
  res.status(200).json(new ApiResponse(200, "Board updated successfully", board));
});

const updateBoardPosition = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, boardId } = req.params as {
    orgId: string;
    projectId: string;
    boardId: string;
  };
  const { position } = req.body;
  const board = await boardService.updateBoardPosition({ boardId, projectId, orgId, position });
  res.status(200).json(new ApiResponse(200, "Board position updated successfully", board));
});

const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, boardId } = req.params as {
    orgId: string;
    projectId: string;
    boardId: string;
  };
  await boardService.deleteBoard({ boardId, projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Board deleted successfully"));
});

export { getBoards, createBoard, updateBoard, updateBoardPosition, deleteBoard };
```

---

## Task 7: Boards Routes

**Files:**
- Create: `backend/src/modules/projects/boards/boards.routes.ts`

- [ ] **Step 1: Create the boards routes file**

Note: `Router({ mergeParams: true })` is critical — without it, `:orgId` and `:projectId` from the parent router won't be accessible in `req.params`.

The middleware chain for every route: `authenticate → loadOrgMember → loadProjectMember → requireProjectMember → [validate?] → controller`.

```typescript
import { Router } from "express";
import * as boardController from "@/modules/projects/boards/boards.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import loadProjectMember from "@/middlewares/projects/loadProjectMember.js";
import { requireProjectMember } from "@/middlewares/projects/authorizeProjectAccess.js";
import {
  createBoardSchema,
  updateBoardSchema,
  updateBoardPositionSchema,
} from "@/modules/projects/boards/boards.validation.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  boardController.getBoards
);

router.post(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(createBoardSchema),
  boardController.createBoard
);

router.patch(
  "/:boardId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(updateBoardSchema),
  boardController.updateBoard
);

router.patch(
  "/:boardId/position",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(updateBoardPositionSchema),
  boardController.updateBoardPosition
);

router.delete(
  "/:boardId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  boardController.deleteBoard
);

export default router;
```

---

## Task 8: Wire Boards Router into projects.routes.ts

**Files:**
- Modify: `backend/src/modules/projects/projects.routes.ts`

- [ ] **Step 1: Add boards router import and mount**

Add the import at the top (after the existing membersRouter import):

```typescript
import boardsRouter from "@/modules/projects/boards/boards.routes.js";
```

Add the mount line after the existing `membersRouter` mount:

```typescript
router.use("/:orgId/projects/:projectId/boards", boardsRouter);
```

The full updated `projects.routes.ts`:

```typescript
import { Router } from "express";
import * as projectController from "@/modules/projects/projects.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import { authorizeOrgRole } from "@/middlewares/auth/authorize.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/modules/projects/projects.validation.js";
import membersRouter from "@/modules/projects/members/members.routes.js";
import boardsRouter from "@/modules/projects/boards/boards.routes.js";

const router = Router();

router.use("/:orgId/projects/:projectId/members", membersRouter);
router.use("/:orgId/projects/:projectId/boards", boardsRouter);

router.post(
  "/:orgId/projects",
  authenticate,
  loadOrgMember,
  authorizeOrgRole("OWNER", "ADMIN"),
  validate(createProjectSchema),
  projectController.createProject
);

router.get(
  "/:orgId/projects",
  authenticate,
  loadOrgMember,
  projectController.getProjects
);

router.get(
  "/:orgId/projects/:projectId",
  authenticate,
  loadOrgMember,
  projectController.getProject
);

router.patch(
  "/:orgId/projects/:projectId",
  authenticate,
  loadOrgMember,
  authorizeOrgRole("OWNER", "ADMIN"),
  validate(updateProjectSchema),
  projectController.updateProject
);

router.delete(
  "/:orgId/projects/:projectId",
  authenticate,
  loadOrgMember,
  authorizeOrgRole("OWNER", "ADMIN"),
  projectController.deleteProject
);

export default router;
```

---

## Task 9: Tasks Validation

**Files:**
- Create: `backend/src/modules/projects/tasks/tasks.validation.ts`

- [ ] **Step 1: Create the tasks validation file**

```typescript
import Joi from "joi";

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional().allow(""),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").optional(),
  dueDate: Joi.date().iso().optional().allow(null),
  boardId: Joi.string().uuid().optional(),
  assigneeId: Joi.string().uuid().optional().allow(null),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional().allow(""),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").optional(),
  dueDate: Joi.date().iso().optional().allow(null),
  assigneeId: Joi.string().uuid().optional().allow(null),
});

export const moveTaskSchema = Joi.object({
  boardId: Joi.string().uuid().required(),
});

export const updateTaskPositionSchema = Joi.object({
  position: Joi.number().integer().min(1).required(),
});
```

---

## Task 10: Tasks Service

**Files:**
- Create: `backend/src/modules/projects/tasks/tasks.service.ts`

- [ ] **Step 1: Create the tasks service**

Business rules encoded here:
- If no `boardId` on create → use the project's first board (lowest position)
- DEVELOPER can only set `assigneeId` to their own userId; MANAGER can assign to anyone
- Assignee must be a project member
- `moveTask` places the task at the end of the target board
- `updateTaskPosition` reorders all tasks in the same board with new sequential positions

```typescript
import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";
import type { TaskPriority } from "@prisma/client";

interface CreateTaskInput {
  projectId: string;
  orgId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
  boardId?: string;
  assigneeId?: string | null;
  creatorId: string;
  requestingUserProjectRole: string;
}

interface GetTasksInput {
  projectId: string;
  orgId: string;
  boardId?: string;
}

interface GetTaskInput {
  taskId: string;
  projectId: string;
  orgId: string;
}

interface UpdateTaskInput {
  taskId: string;
  projectId: string;
  orgId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  requestingUserId: string;
  requestingUserProjectRole: string;
}

interface DeleteTaskInput {
  taskId: string;
  projectId: string;
  orgId: string;
}

interface MoveTaskInput {
  taskId: string;
  projectId: string;
  orgId: string;
  boardId: string;
}

interface UpdateTaskPositionInput {
  taskId: string;
  projectId: string;
  orgId: string;
  position: number;
}

const taskSelectIncludes = {
  board: true,
  assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
  creator: { select: { id: true, fullName: true, email: true, avatar: true } },
} as const;

const createTask = async ({
  projectId,
  orgId,
  title,
  description,
  priority,
  dueDate,
  boardId,
  assigneeId,
  creatorId,
  requestingUserProjectRole,
}: CreateTaskInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  let targetBoardId: string;
  if (boardId) {
    const board = await prisma.board.findFirst({ where: { id: boardId, projectId } });
    if (!board) throw new ApiError(404, "Board not found");
    targetBoardId = board.id;
  } else {
    const firstBoard = await prisma.board.findFirst({
      where: { projectId },
      orderBy: { position: "asc" },
    });
    if (!firstBoard) throw new ApiError(400, "Project has no boards. Create a board first.");
    targetBoardId = firstBoard.id;
  }

  if (assigneeId !== undefined && assigneeId !== null) {
    if (requestingUserProjectRole === "DEVELOPER" && assigneeId !== creatorId) {
      throw new ApiError(403, "Developers can only assign tasks to themselves");
    }
    const assigneeMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: assigneeId, projectId } },
    });
    if (!assigneeMember) throw new ApiError(400, "Assignee must be a project member");
  }

  const lastTask = await prisma.task.findFirst({
    where: { boardId: targetBoardId },
    orderBy: { position: "desc" },
  });
  const position = lastTask ? lastTask.position + 1 : 1;

  return prisma.task.create({
    data: {
      title,
      description,
      priority: priority ?? "MEDIUM",
      dueDate: dueDate ?? null,
      boardId: targetBoardId,
      projectId,
      assigneeId: assigneeId ?? null,
      creatorId,
      position,
    },
    include: taskSelectIncludes,
  });
};

const getTasks = async ({ projectId, orgId, boardId }: GetTasksInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const where: { projectId: string; boardId?: string } = { projectId };
  if (boardId) where.boardId = boardId;

  return prisma.task.findMany({
    where,
    orderBy: { position: "asc" },
    include: taskSelectIncludes,
  });
};

const getTask = async ({ taskId, projectId, orgId }: GetTaskInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    include: {
      board: true,
      assignee: { select: { id: true, fullName: true, email: true, avatar: true } },
      creator: { select: { id: true, fullName: true, email: true, avatar: true } },
      comments: {
        include: {
          author: { select: { id: true, fullName: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) throw new ApiError(404, "Task not found");
  return task;
};

const updateTask = async ({
  taskId,
  projectId,
  orgId,
  title,
  description,
  priority,
  dueDate,
  assigneeId,
  requestingUserId,
  requestingUserProjectRole,
}: UpdateTaskInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) throw new ApiError(404, "Task not found");

  if (assigneeId !== undefined && assigneeId !== null) {
    if (requestingUserProjectRole === "DEVELOPER" && assigneeId !== requestingUserId) {
      throw new ApiError(403, "Developers can only assign tasks to themselves");
    }
    const assigneeMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: assigneeId, projectId } },
    });
    if (!assigneeMember) throw new ApiError(400, "Assignee must be a project member");
  }

  const data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date | null;
    assigneeId?: string | null;
  } = {};

  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (assigneeId !== undefined) data.assigneeId = assigneeId;

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: taskSelectIncludes,
  });
};

const deleteTask = async ({ taskId, projectId, orgId }: DeleteTaskInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) throw new ApiError(404, "Task not found");

  await prisma.task.delete({ where: { id: taskId } });
  return true;
};

const moveTask = async ({ taskId, projectId, orgId, boardId }: MoveTaskInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) throw new ApiError(404, "Task not found");

  if (task.boardId === boardId) throw new ApiError(400, "Task is already in this board");

  const targetBoard = await prisma.board.findFirst({ where: { id: boardId, projectId } });
  if (!targetBoard) throw new ApiError(404, "Target board not found");

  const lastTask = await prisma.task.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });
  const position = lastTask ? lastTask.position + 1 : 1;

  return prisma.task.update({
    where: { id: taskId },
    data: { boardId, position },
    include: taskSelectIncludes,
  });
};

const updateTaskPosition = async ({
  taskId,
  projectId,
  orgId,
  position,
}: UpdateTaskPositionInput) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw new ApiError(404, "Project not found");

  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) throw new ApiError(404, "Task not found");

  const allTasks = await prisma.task.findMany({
    where: { boardId: task.boardId },
    orderBy: { position: "asc" },
  });

  const clampedPosition = Math.min(position, allTasks.length);
  const filteredTasks = allTasks.filter((t) => t.id !== taskId);
  filteredTasks.splice(clampedPosition - 1, 0, task);

  await prisma.$transaction(
    filteredTasks.map((t, index) =>
      prisma.task.update({ where: { id: t.id }, data: { position: index + 1 } })
    )
  );

  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskSelectIncludes,
  });
};

export { createTask, getTasks, getTask, updateTask, deleteTask, moveTask, updateTaskPosition };
```

---

## Task 11: Tasks Controller

**Files:**
- Create: `backend/src/modules/projects/tasks/tasks.controller.ts`

- [ ] **Step 1: Create the tasks controller**

`getTasks` supports an optional `?boardId=` query param for filtering tasks by board.

```typescript
import { Request, Response } from "express";
import * as taskService from "@/modules/projects/tasks/tasks.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";

const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as { orgId: string; projectId: string };
  const { title, description, priority, dueDate, boardId, assigneeId } = req.body;
  const task = await taskService.createTask({
    projectId,
    orgId,
    title,
    description,
    priority,
    dueDate,
    boardId,
    assigneeId,
    creatorId: req.user!.id,
    requestingUserProjectRole: req.projectMember!.role,
  });
  res.status(201).json(new ApiResponse(201, "Task created successfully", task));
});

const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as { orgId: string; projectId: string };
  const boardId = req.query.boardId as string | undefined;
  const tasks = await taskService.getTasks({ projectId, orgId, boardId });
  res.status(200).json(new ApiResponse(200, "Tasks fetched successfully", tasks));
});

const getTask = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };
  const task = await taskService.getTask({ taskId, projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Task fetched successfully", task));
});

const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };
  const { title, description, priority, dueDate, assigneeId } = req.body;
  const task = await taskService.updateTask({
    taskId,
    projectId,
    orgId,
    title,
    description,
    priority,
    dueDate,
    assigneeId,
    requestingUserId: req.user!.id,
    requestingUserProjectRole: req.projectMember!.role,
  });
  res.status(200).json(new ApiResponse(200, "Task updated successfully", task));
});

const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };
  await taskService.deleteTask({ taskId, projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Task deleted successfully"));
});

const moveTask = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };
  const { boardId } = req.body;
  const task = await taskService.moveTask({ taskId, projectId, orgId, boardId });
  res.status(200).json(new ApiResponse(200, "Task moved successfully", task));
});

const updateTaskPosition = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };
  const { position } = req.body;
  const task = await taskService.updateTaskPosition({ taskId, projectId, orgId, position });
  res.status(200).json(new ApiResponse(200, "Task position updated successfully", task));
});

export { createTask, getTasks, getTask, updateTask, deleteTask, moveTask, updateTaskPosition };
```

---

## Task 12: Tasks Routes

**Files:**
- Create: `backend/src/modules/projects/tasks/tasks.routes.ts`

- [ ] **Step 1: Create the tasks routes file**

The `/:taskId/move` and `/:taskId/position` routes must be defined **after** the `/:taskId` PATCH route — Express matches routes in order and these specific paths won't conflict since they have different path segments, but keeping them ordered avoids future confusion.

```typescript
import { Router } from "express";
import * as taskController from "@/modules/projects/tasks/tasks.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import loadProjectMember from "@/middlewares/projects/loadProjectMember.js";
import { requireProjectMember } from "@/middlewares/projects/authorizeProjectAccess.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  updateTaskPositionSchema,
} from "@/modules/projects/tasks/tasks.validation.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(createTaskSchema),
  taskController.createTask
);

router.get(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  taskController.getTasks
);

router.get(
  "/:taskId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  taskController.getTask
);

router.patch(
  "/:taskId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(updateTaskSchema),
  taskController.updateTask
);

router.delete(
  "/:taskId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  taskController.deleteTask
);

router.patch(
  "/:taskId/move",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(moveTaskSchema),
  taskController.moveTask
);

router.patch(
  "/:taskId/position",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(updateTaskPositionSchema),
  taskController.updateTaskPosition
);

export default router;
```

---

## Task 13: Wire Tasks Router into projects.routes.ts

**Files:**
- Modify: `backend/src/modules/projects/projects.routes.ts`

- [ ] **Step 1: Add tasks router import and mount**

Add the import (after the boardsRouter import added in Task 8):

```typescript
import tasksRouter from "@/modules/projects/tasks/tasks.routes.js";
```

Add the mount line (after the boardsRouter mount):

```typescript
router.use("/:orgId/projects/:projectId/tasks", tasksRouter);
```

The full updated `projects.routes.ts`:

```typescript
import { Router } from "express";
import * as projectController from "@/modules/projects/projects.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import { authorizeOrgRole } from "@/middlewares/auth/authorize.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/modules/projects/projects.validation.js";
import membersRouter from "@/modules/projects/members/members.routes.js";
import boardsRouter from "@/modules/projects/boards/boards.routes.js";
import tasksRouter from "@/modules/projects/tasks/tasks.routes.js";

const router = Router();

router.use("/:orgId/projects/:projectId/members", membersRouter);
router.use("/:orgId/projects/:projectId/boards", boardsRouter);
router.use("/:orgId/projects/:projectId/tasks", tasksRouter);

router.post(
  "/:orgId/projects",
  authenticate,
  loadOrgMember,
  authorizeOrgRole("OWNER", "ADMIN"),
  validate(createProjectSchema),
  projectController.createProject
);

router.get(
  "/:orgId/projects",
  authenticate,
  loadOrgMember,
  projectController.getProjects
);

router.get(
  "/:orgId/projects/:projectId",
  authenticate,
  loadOrgMember,
  projectController.getProject
);

router.patch(
  "/:orgId/projects/:projectId",
  authenticate,
  loadOrgMember,
  authorizeOrgRole("OWNER", "ADMIN"),
  validate(updateProjectSchema),
  projectController.updateProject
);

router.delete(
  "/:orgId/projects/:projectId",
  authenticate,
  loadOrgMember,
  authorizeOrgRole("OWNER", "ADMIN"),
  projectController.deleteProject
);

export default router;
```

---

## Task 14: Update TASKS.md

**Files:**
- Modify: `backend/TASKS.md`

- [ ] **Step 1: Mark Board System and Tasks Module as complete**

Update the file to reflect completed work. Add both items to the Completed section and remove from Pending:

```markdown
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
- Project Invite Flow (POST /projects/:projectId/members/invite)
- Magic Link Login (GET /auth/magic-link?token=xxx)
- ProjectInvite schema + migration (20260523213210_add_project_invite_magic_link)
- Board System (custom Kanban boards per project, auto-creates Todo/In Progress/Done on project creation)
- Tasks Module (CRUD + move between boards + position reordering)

## In Progress 🔄
- Organizations — Update Member Role
- Projects Module

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
```

---

## Spec Coverage Self-Review

| Requirement | Covered by Task |
|-------------|----------------|
| Remove TaskStatus enum | Task 1 |
| Remove status field from Task | Task 1 |
| Add Board model | Task 1 |
| Update Task with boardId | Task 1 |
| Add boards relation to Project | Task 1 |
| Run migration | Task 1 |
| Auto-create 3 default boards on project create | Task 3 |
| GET /boards | Task 7 + Task 8 |
| POST /boards | Task 7 + Task 8 |
| PATCH /boards/:boardId | Task 7 + Task 8 |
| PATCH /boards/:boardId/position | Task 7 + Task 8 |
| DELETE /boards/:boardId | Task 7 + Task 8 |
| POST /tasks | Task 12 + Task 13 |
| GET /tasks | Task 12 + Task 13 |
| GET /tasks/:taskId | Task 12 + Task 13 |
| PATCH /tasks/:taskId | Task 12 + Task 13 |
| DELETE /tasks/:taskId | Task 12 + Task 13 |
| PATCH /tasks/:taskId/move | Task 12 + Task 13 |
| PATCH /tasks/:taskId/position | Task 12 + Task 13 |
| Auth: authenticate on all routes | Tasks 7, 12 |
| Auth: project member only (MANAGER or DEVELOPER) | Task 2 + Tasks 7, 12 |
| Board: cannot delete if has tasks | Task 5 |
| Board: name unique within project | Task 5 |
| Board: position reorder all boards | Task 5 |
| Task: default boardId = first board | Task 10 |
| Task: creator = req.user.id | Task 11 |
| Task: MANAGER assigns to anyone | Task 10 |
| Task: DEVELOPER assigns only to themselves | Task 10 |
| Task: assignee must be project member | Task 10 |
| Task: priority default MEDIUM | Task 10 |
| Task: dueDate optional | Task 9 |
| Update TASKS.md | Task 14 |
