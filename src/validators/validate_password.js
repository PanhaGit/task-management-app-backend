const Joi = require('joi-oid');

const passwordSchema = Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
        'string.base': 'Password should be a string',
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password cannot exceed 30 characters',
        'string.pattern.base': 'Password must contain at least one lowercase, uppercase, number, and special character',
        'any.required': 'Password is required'
    });

const changePasswordSchema = Joi.object({
    params: Joi.object({
        _id: Joi.objectId().required()
            .messages({
                'any.required': 'User ID is required',
                'objectId.base': 'Invalid user ID format'
            })
    }),
    body: Joi.object({
        current_password: Joi.string().required()
            .messages({
                'any.required': 'Current password is required',
                'string.empty': 'Current password cannot be empty'
            }),
        new_password: passwordSchema,
        confirm_password: Joi.string()
            .valid(Joi.ref('new_password'))
            .required()
            .messages({
                'any.required': 'Please confirm your new password',
                'any.only': 'Passwords do not match'
            })
    }).with('new_password', 'confirm_password')
});

const validatePasswordChange = (data) => {
    return changePasswordSchema.validate(data, { abortEarly: false });
};

module.exports = {
    validatePasswordChange,
    passwordSchema
};