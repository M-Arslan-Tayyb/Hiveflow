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
