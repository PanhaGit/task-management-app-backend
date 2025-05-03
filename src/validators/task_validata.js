const Joi = require('joi-oid');

const taskValidator = {
    create: async (body) => {
        const schema = Joi.object({
            title: Joi.string().required().trim().max(100).messages({
                "string.empty": "Title is required",
                "string.max": "Title cannot exceed 100 characters",
            }),
            description: Joi.string().trim().max(800).optional().messages({
                "string.max": "Description cannot exceed 800 characters",
            }),
            status: Joi.string()
                .valid("todo", "in_progress", "done", "complete")
                .default("todo"),
            start_date: Joi.date().required().messages({
                "date.base": "Start date must be a valid date",
                "any.required": "Start date is required",
            }),
            end_date: Joi.date()
                .required()
                .greater(Joi.ref("start_date"))
                .messages({
                    "date.base": "End date must be a valid date",
                    "any.required": "End date is required",
                    "date.greater": "End date must be after start date",
                }),
            hours: Joi.number().min(0).max(23).optional(),
            minutes: Joi.number().min(0).max(59).optional(),
        });

        return schema.validateAsync(body);
    },

    update: async (body) => {
        const schema = Joi.object({
            title: Joi.string().trim().max(100).optional(),
            description: Joi.string().trim().max(800).optional(),
            status: Joi.string()
                .valid("todo", "in_progress", "done", "complete")
                .optional(),
            start_date: Joi.date().optional(),
            end_date: Joi.date()
                .optional()
                .when('start_date', {
                    is: Joi.exist(),
                    then: Joi.date().greater(Joi.ref('start_date'))
                        .messages({
                            "date.greater": "End date must be after start date"
                        })
                }),
            hours: Joi.number().min(0).max(23).optional(),
            minutes: Joi.number().min(0).max(59).optional(),
        }).min(1);

        return schema.validateAsync(body);
    }
};

module.exports = taskValidator;