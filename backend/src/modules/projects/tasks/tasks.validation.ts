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
