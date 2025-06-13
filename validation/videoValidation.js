import Joi from 'joi';
import { USER_ROLES } from '../constants/userRoles.js';

export const getVideoListSchema = Joi.object({
    params: Joi.object({
        userId: Joi.string().required(),
    }).required()
});