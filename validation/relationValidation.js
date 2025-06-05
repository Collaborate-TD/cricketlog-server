import Joi from 'joi';
import { RELATION_STATUS } from '../constants/relationStatus.js';

export const requestRelationSchema = Joi.object({
    requesterId: Joi.string().required(),
    targetId: Joi.string().required()
});

export const approveDeclineRelationSchema = Joi.object({
    approverId: Joi.string().required(),
    requesterId: Joi.string().required(),
    action: Joi.string().valid(RELATION_STATUS.APPROVED, RELATION_STATUS.REJECTED).required(),
    feedback: Joi.string().allow('').optional()
});