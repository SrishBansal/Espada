import express, { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  memberEmails: z.array(z.string().email()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  memberEmails: z.array(z.string().email()).optional(),
});

// Get all projects for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const projects = await prisma.project.findMany({
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
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create a new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, description, memberEmails } = createProjectSchema.parse(req.body);

    // Find members by email if provided
    let members = [];
    if (memberEmails && memberEmails.length > 0) {
      members = await prisma.user.findMany({
        where: {
          email: { in: memberEmails },
        },
        select: { id: true },
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: userId,
        members: {
          connect: members.map(member => ({ id: member.id })),
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
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
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update a project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = req.params.id;
    const updateData = updateProjectSchema.parse(req.body);

    // Check if user owns the project
    const existingProject = await prisma.project.findFirst({
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
    let updatePayload: any = {
      name: updateData.name,
      description: updateData.description,
    };

    if (updateData.memberEmails) {
      // Find new members
      const newMembers = await prisma.user.findMany({
        where: {
          email: { in: updateData.memberEmails },
        },
        select: { id: true },
      });

      updatePayload.members = {
        set: newMembers.map(member => ({ id: member.id })),
      };
    }

    const updatedProject = await prisma.project.update({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = req.params.id;

    // Check if user owns the project
    const project = await prisma.project.findFirst({
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
    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;