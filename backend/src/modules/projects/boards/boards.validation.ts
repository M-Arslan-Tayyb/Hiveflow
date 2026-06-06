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
