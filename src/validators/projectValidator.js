import Joi from "joi";

export const createProjectSchema = Joi.object({
    title:Joi.string().min(5).required(),
    description:Joi.string().min(5).required()
})

export const updateProjectSchema = Joi.object({
    title:Joi.string().min(5).optional(),
    description:Joi.string().min(10).optional()
})