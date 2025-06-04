import Joi from 'joi';

export const requestRelationSchema = Joi.object({
    requesterId: Joi.string().required(),
    targetId: Joi.string().required()
});

export const approveDeclineRelationSchema = Joi.object({
    approverId: Joi.string().required(),
    requesterId: Joi.string().required(),
    feedback: Joi.string().allow('').optional()
});