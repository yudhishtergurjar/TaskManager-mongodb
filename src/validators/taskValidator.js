import Joi from "joi";

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).required(),

  description: Joi.string().min(5).required(),

  assigneeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "assigneeId must be a valid MongoDB ObjectId",
    }),

  deadline: Joi.date()
    .iso()
    .optional()
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(5).required()
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "completed").required()
});
