import { Router, Request, Response } from 'express';
import { Task, Project, User } from '../models';
import { authenticateToken } from '../middleware/auth';
import { validateTask } from '../middleware/validation';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// GET /projects/:id/tasks - List tasks in that project
router.get('/projects/:projectId/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    
    // First check if user has access to this project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /projects/:id/tasks - Add new task
router.post('/projects/:projectId/tasks', authenticateToken, validateTask, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { title, description, assignee, dueDate, status } = req.body;
    
    // First check if user has access to this project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    // Find assignee user if provided
    let assigneeId = null;
    if (assignee) {
      const assigneeUser = await User.findOne({ where: { username: assignee } });
      if (assigneeUser) {
        assigneeId = assigneeUser.id;
      }
    }
    
    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'todo',
      priority: 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      projectId: parseInt(projectId),
      assigneeId: assigneeId || undefined,
      createdById: userId,
    });
    
    // Fetch the created task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.status(201).json({
      message: 'Task created successfully',
      task: createdTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id - Update task
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, status, priority, dueDate, assignee } = req.body;
    
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access to the project this task belongs to
    if ((task as any).project && (task as any).project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    // Find assignee user if provided
    let assigneeId = task.assigneeId;
    if (assignee !== undefined) {
      if (assignee) {
        const assigneeUser = await User.findOne({ where: { username: assignee } });
        assigneeId = assigneeUser ? assigneeUser.id : undefined;
      } else {
        assigneeId = undefined;
      }
    }
    
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      status: status || task.status,
      priority: priority || task.priority,
      dueDate: dueDate ? new Date(dueDate) : task.dueDate,
      assigneeId,
    });
    
    // Fetch the updated task with associations
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// GET /tasks/:id - Get single task
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    
    const task = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access to the project this task belongs to
    if ((task as any).project && (task as any).project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// DELETE /tasks/:id - Delete task
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access to the project this task belongs to
    if ((task as any).project && (task as any).project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    await task.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;