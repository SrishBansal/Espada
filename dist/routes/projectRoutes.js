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
const createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required'),
    description: zod_1.z.string().optional(),
    memberEmails: zod_1.z.array(zod_1.z.string().email()).optional(),
});
const updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    memberEmails: zod_1.z.array(zod_1.z.string().email()).optional(),
});
// Get all projects for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const projects = await db_1.default.project.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { id: userId } } },
                ],
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        dueDate: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        messages: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        res.json({
            success: true,
            data: projects,
        });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Create a new project
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description, memberEmails } = createProjectSchema.parse(req.body);
        // Find members by email if provided
        let members = [];
        if (memberEmails && memberEmails.length > 0) {
            members = await db_1.default.user.findMany({
                where: {
                    email: { in: memberEmails },
                },
                select: { id: true },
            });
        }
        const project = await db_1.default.project.create({
            data: {
                name,
                description,
                ownerId: userId,
                members: {
                    connect: members.map((member) => ({ id: member.id })),
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        messages: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project,
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
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Get a specific project
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const projectId = req.params.id;
        const project = await db_1.default.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { id: userId } } },
                ],
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                messages: {
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
                        createdAt: 'desc',
                    },
                    take: 50, // Limit to last 50 messages
                },
            },
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Update a project
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const projectId = req.params.id;
        const updateData = updateProjectSchema.parse(req.body);
        // Check if user owns the project
        const existingProject = await db_1.default.project.findFirst({
            where: {
                id: projectId,
                ownerId: userId,
            },
        });
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have permission to update it',
            });
        }
        // Handle member updates if provided
        let updatePayload = {
            name: updateData.name,
            description: updateData.description,
        };
        if (updateData.memberEmails) {
            // Find new members
            const newMembers = await db_1.default.user.findMany({
                where: {
                    email: { in: updateData.memberEmails },
                },
                select: { id: true },
            });
            updatePayload.members = {
                set: newMembers.map((member) => ({ id: member.id })),
            };
        }
        const updatedProject = await db_1.default.project.update({
            where: { id: projectId },
            data: updatePayload,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        messages: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            message: 'Project updated successfully',
            data: updatedProject,
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
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Delete a project
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const projectId = req.params.id;
        // Check if user owns the project
        const project = await db_1.default.project.findFirst({
            where: {
                id: projectId,
                ownerId: userId,
            },
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have permission to delete it',
            });
        }
        // Delete the project (cascade will handle related records)
        await db_1.default.project.delete({
            where: { id: projectId },
        });
        res.json({
            success: true,
            message: 'Project deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=projectRoutes.js.map