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
const createMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Message content is required'),
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
});
// Get all messages for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const projectId = req.params.projectId;
        // Verify user has access to the project
        const project = await db_1.default.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { id: userId } } },
                ],
            },
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or access denied',
            });
        }
        const messages = await db_1.default.message.findMany({
            where: { projectId },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        res.json({
            success: true,
            data: messages,
        });
    }
    catch (error) {
        console.error('Get project messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Get a specific message
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        const message = await db_1.default.message.findFirst({
            where: {
                id: messageId,
                project: {
                    OR: [
                        { ownerId: userId },
                        { members: { some: { id: userId } } },
                    ],
                },
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or access denied',
            });
        }
        res.json({
            success: true,
            data: message,
        });
    }
    catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Create a new message
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { content, projectId } = createMessageSchema.parse(req.body);
        // Verify user has access to the project
        const project = await db_1.default.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { id: userId } } },
                ],
            },
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or access denied',
            });
        }
        const message = await db_1.default.message.create({
            data: {
                content: content.trim(),
                projectId,
                senderId: userId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            message: 'Message created successfully',
            data: message,
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
        console.error('Create message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Update a message (only by sender)
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        const { content } = zod_1.z.object({
            content: zod_1.z.string().min(1, 'Message content is required'),
        }).parse(req.body);
        const message = await db_1.default.message.findFirst({
            where: {
                id: messageId,
                senderId: userId,
            },
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you do not have permission to update it',
            });
        }
        const updatedMessage = await db_1.default.message.update({
            where: { id: messageId },
            data: { content: content.trim() },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            message: 'Message updated successfully',
            data: updatedMessage,
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
        console.error('Update message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Delete a message (only by sender)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        const message = await db_1.default.message.findFirst({
            where: {
                id: messageId,
                senderId: userId,
            },
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you do not have permission to delete it',
            });
        }
        await db_1.default.message.delete({
            where: { id: messageId },
        });
        res.json({
            success: true,
            message: 'Message deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map