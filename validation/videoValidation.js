import Joi from 'joi';
import { USER_ROLES } from '../constants/userRoles.js';

export const getVideoListSchema = Joi.object({
    params: Joi.object({
        userId: Joi.string().required(),
    }).required()
});

export const updateVideoSchema = Joi.object({
    isFavourite: Joi.boolean().optional()
});