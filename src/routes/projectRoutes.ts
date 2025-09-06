import { Router, Request, Response } from 'express';
import { Project, User, Task } from '../models';
import { authenticateToken } from '../middleware/auth';
import { validateProject } from '../middleware/validation';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// GET /api/projects - Get all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'priority'] }
      ]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { 
          model: Task, 
          as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
            { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
          ]
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, status, startDate, endDate, ownerId } = req.body;
    
    const project = await Project.create({
      name,
      description,
      status: status || 'planning',
      startDate,
      endDate,
      ownerId,
    });
    
    // Fetch the created project with associations
    const createdProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, status, startDate, endDate } = req.body;
    
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.update({
      name,
      description,
      status,
      startDate,
      endDate,
    });
    
    // Fetch the updated project with associations
    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
