import Joi from "joi";
export const createProjectSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional().allow(""),
});
export const updateProjectSchema = Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow(""),
});
//# sourceMappingURL=projects.validation.js.map