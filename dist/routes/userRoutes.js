"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Validation schemas
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: zod_1.z.string().email('Invalid email address').optional(),
});
// Get all users (for project member selection)
router.get('/', async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Get current user profile
router.get('/me', async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                projects: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        tasks: true,
                        messages: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Get a specific user
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                projects: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        tasks: true,
                        messages: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Update current user profile
router.put('/me', async (req, res) => {
    try {
        const userId = req.user.userId;
        const updateData = updateUserSchema.parse(req.body);
        // Check if email is already taken by another user
        if (updateData.email) {
            const existingUser = await db_1.default.user.findFirst({
                where: {
                    email: updateData.email,
                    id: { not: userId },
                },
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken by another user',
                });
            }
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
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
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Delete current user account
router.delete('/me', async (req, res) => {
    try {
        const userId = req.user.userId;
        // Delete the user (cascade will handle related records)
        await db_1.default.user.delete({
            where: { id: userId },
        });
        res.json({
            success: true,
            message: 'Account deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete user account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map