import Joi from 'joi';

export const updateUserSchema = Joi.object({
    userName: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    // email and password should not be allowed to update here
    role: Joi.string()
});