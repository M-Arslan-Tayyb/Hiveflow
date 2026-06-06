import Joi from "joi";

export const addMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  role: Joi.string().valid("MANAGER", "DEVELOPER").required(),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid("MANAGER", "DEVELOPER").required(),
});

export const inviteProjectMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(50).optional(),
  role: Joi.string().valid("MANAGER", "DEVELOPER").required(),
});
