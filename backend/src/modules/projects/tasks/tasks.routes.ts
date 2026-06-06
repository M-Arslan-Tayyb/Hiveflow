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
