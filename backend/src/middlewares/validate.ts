import { RequestHandler } from "express";
import { ObjectSchema } from "joi";

/**
 * Validates `req.body` against a Joi schema, collecting all errors.
 */
const validate = (schema: ObjectSchema): RequestHandler => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors,
      });
      return;
    }

    next();
  };
};

export default validate;
