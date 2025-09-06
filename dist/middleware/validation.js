"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessage = exports.validateTask = exports.validateProject = exports.validateLogin = exports.validateSignup = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// Auth validation rules
exports.validateSignup = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    exports.handleValidationErrors
];
exports.validateLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    exports.handleValidationErrors
];
// Project validation rules
exports.validateProject = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Project name is required'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('members').optional().isArray(),
    exports.handleValidationErrors
];
// Task validation rules
exports.validateTask = [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Task title is required'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('assignee').optional().isString(),
    (0, express_validator_1.body)('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.body)('status').optional().isIn(['todo', 'in-progress', 'completed', 'blocked']),
    exports.handleValidationErrors
];
// Message validation rules
exports.validateMessage = [
    (0, express_validator_1.body)('text').notEmpty().withMessage('Message text is required'),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.js.map