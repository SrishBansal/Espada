import { Router, Request, Response } from 'express';
import { Project, User, Task } from '../models';
import { authenticateToken } from '../middleware/auth';
import { validateProject } from '../middleware/validation';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// GET /projects - List projects for logged-in user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get projects where user is owner or member
    const projects = await Project.findAll({
      where: { ownerId: userId },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'priority'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /projects - Create new project with name and members
router.post('/', authenticateToken, validateProject, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, members } = req.body;
    const userId = req.user.id;
    
    const project = await Project.create({
      name,
      description: description || '',
      ownerId: userId,
      status: 'planning'
    });
    
    // Fetch the created project with associations
    const createdProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.status(201).json({
      message: 'Project created successfully',
      project: createdProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /projects/:id - Fetch single project details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const project = await Project.findByPk(projectId, {
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
    
    // Check if user has access to this project
    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /projects/:id - Update project
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { name, description, status } = req.body;
    
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user owns this project
    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    await project.update({
      name,
      description,
      status,
    });
    
    // Fetch the updated project with associations
    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /projects/:id - Delete project
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user owns this project
    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    await project.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;