
import Joi from "joi";

export const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^\+?\d{10,14}$/).required(),
    password: Joi.string().min(8).required()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

export const changePasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(8).required()
});

export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: "Validation error",
            errors: error.details.map((detail) => detail.message)
        });
    }
    next();
};
