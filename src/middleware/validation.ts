import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Auth validation rules
export const validateSignup = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Project validation rules
export const validateProject = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').optional().isString(),
  body('members').optional().isArray(),
  handleValidationErrors
];

// Task validation rules
export const validateTask = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional().isString(),
  body('assignee').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['todo', 'in-progress', 'completed', 'blocked']),
  handleValidationErrors
];

// Message validation rules
export const validateMessage = [
  body('text').notEmpty().withMessage('Message text is required'),
  handleValidationErrors
];
