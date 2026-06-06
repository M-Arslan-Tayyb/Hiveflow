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
      ...taskSelectIncludes,
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

  return prisma.$transaction(async (tx) => {
    const allTasks = await tx.task.findMany({
      where: { boardId: task.boardId },
      orderBy: { position: "asc" },
    });

    const clampedPosition = Math.min(position, allTasks.length);

    if (task.position === clampedPosition) {
      const updated = await tx.task.findUnique({ where: { id: taskId }, include: taskSelectIncludes });
      if (!updated) throw new ApiError(404, "Task not found after position update");
      return updated;
    }

    const filteredTasks = allTasks.filter((t) => t.id !== taskId);
    filteredTasks.splice(clampedPosition - 1, 0, task);

    for (const [index, t] of filteredTasks.entries()) {
      await tx.task.update({ where: { id: t.id }, data: { position: index + 1 } });
    }

    const updated = await tx.task.findUnique({ where: { id: taskId }, include: taskSelectIncludes });
    if (!updated) throw new ApiError(404, "Task not found after position update");
    return updated;
  });
};

export { createTask, getTasks, getTask, updateTask, deleteTask, moveTask, updateTaskPosition };
