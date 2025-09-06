import express, { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
});

// Get all tasks for a project
router.get('/projects/:projectId/tasks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = req.params.projectId;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
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

    const tasks = await prisma.task.findMany({
      where: { projectId },
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create a new task
router.post('/projects/:projectId/tasks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const projectId = req.params.projectId;
    const taskData = createTaskSchema.parse(req.body);

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
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

    // Verify assignee exists and has access to the project if provided
    if (taskData.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: taskData.assigneeId,
          OR: [
            { id: project.ownerId },
            { projects: { some: { id: projectId } } },
          ],
        },
      });

      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found or does not have access to this project',
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        projectId,
        createdById: userId,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      },
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
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get a specific task
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const taskId = req.params.id;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } },
          ],
        },
      },
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update a task
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const taskId = req.params.id;
    const updateData = updateTaskSchema.parse(req.body);

    // Verify user has access to the task's project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } },
          ],
        },
      },
      include: {
        project: true,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    // Verify assignee exists and has access to the project if provided
    if (updateData.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: updateData.assigneeId,
          OR: [
            { id: existingTask.project.ownerId },
            { projects: { some: { id: existingTask.projectId } } },
          ],
        },
      });

      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assignee not found or does not have access to this project',
        });
      }
    }

    const updatePayload: any = { ...updateData };
    if (updateData.dueDate) {
      updatePayload.dueDate = new Date(updateData.dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updatePayload,
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
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete a task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const taskId = req.params.id;

    // Verify user has access to the task's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } },
          ],
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;