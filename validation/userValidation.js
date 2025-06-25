import Joi from 'joi';

export const updateUserSchema = Joi.object({
    userName: Joi.string(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    role: Joi.string(),
    profilePhoto: Joi.any().optional().empty(null).empty('')
});