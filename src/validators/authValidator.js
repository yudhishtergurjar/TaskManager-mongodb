import Joi from "joi";

export const userRegisterSchema = Joi.object({
    username:Joi.string().min(3).required(),
    email:Joi.string().email().required(),
    password: Joi.string().min(6).required()
})

export const userLoginSchema = Joi.object({
    email:Joi.string().email().required(),
    password: Joi.string().min(6).required()
})

