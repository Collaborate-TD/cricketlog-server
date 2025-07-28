import Joi from 'joi';

export const loginSchema = Joi.object({
    userData: Joi.string().required(),
    password: Joi.string().required()
});

export const registerSchema = Joi.object({
    userName: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(),
    profilePhoto: Joi.any().optional().default(null)
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
});