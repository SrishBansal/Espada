"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = require('jsonwebtoken');
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const env_1 = require("../config/env");
const router = express_1.default.Router();
// Validation schemas
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = signupSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await db_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await db_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, env_1.jwtConfig.secret, { expiresIn: env_1.jwtConfig.expiresIn });
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors,
            });
        }
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        // Find user by email
        const user = await db_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, env_1.jwtConfig.secret, { expiresIn: env_1.jwtConfig.expiresIn });
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors,
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map