import Joi from "joi";

export const createOrgSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  slug: Joi.string()
    .min(3)
    .max(50)
    .lowercase()
    .regex(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Slug can only contain lowercase letters, numbers and hyphens",
    }),
});

export const updateOrgSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  slug: Joi.string()
    .min(3)
    .max(50)
    .lowercase()
    .regex(/^[a-z0-9-]+$/)
    .messages({
      "string.pattern.base":
        "Slug can only contain lowercase letters, numbers and hyphens",
    }),
});

export const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  // role: Joi.string().valid('ADMIN', 'MEMBER').required(),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid("ADMIN", "MEMBER").required(),
});
