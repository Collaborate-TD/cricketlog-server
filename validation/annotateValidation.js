import Joi from "joi";

// Joi schema for annotation
export const annotationSchema = Joi.object({
    coachId: Joi.string().required(),
    data: Joi.object().required()
});