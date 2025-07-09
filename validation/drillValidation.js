import Joi from 'joi';

export const createDrillSchema = Joi.object({
    userId: Joi.string().required(),
    isPrivate: Joi.boolean().optional(),
    fileName: Joi.string().required(),
    title: Joi.string().required(),
    desc: Joi.string().optional()
});

export const updateDrillSchema = Joi.object({
    isPrivate: Joi.boolean().optional(),
    fileName: Joi.string().optional(),
    title: Joi.string().optional(),
    desc: Joi.string().optional()
});

export const drillIdParamSchema = Joi.object({
    id: Joi.string().required()
});

// Joi schema for filters in getDrills
export const drillFilterSchema = Joi.object({
    userId: Joi.string().optional(),
    isPrivate: Joi.boolean().optional(),
    title: Joi.string().optional(),
    desc: Joi.string().optional(),
    fileName: Joi.string().optional(),
});

export const deleteDrillsSchema = Joi.object({
    userId: Joi.string().required(),
    ids: Joi.array().items(Joi.string()).min(1).required()
});