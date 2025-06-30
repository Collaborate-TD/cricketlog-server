import Joi from 'joi';
import { USER_ROLES } from '../constants/userRoles.js';

export const getVideoListSchema = Joi.object({
    params: Joi.object({
        userId: Joi.string().required(),
        studentId: Joi.string().optional(),
        coachId: Joi.string().optional()
    }).required()
});

// Joi schema for upload video
export const uploadVideoSchema = Joi.object({
    studentId: Joi.string().required(),
    coachId: Joi.string().required()
});

export const updateVideoSchema = Joi.object({
    userId: Joi.string().required(),
    isFavourite: Joi.boolean().required()
});

export const deleteVideosSchema = Joi.object({
    userId: Joi.string().required(),
    ids: Joi.array().items(Joi.string()).min(1).required()
});