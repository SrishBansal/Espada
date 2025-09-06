import { Router, Request, Response } from 'express';
import { Message, Project, User } from '../models';

const router = Router();

// GET /api/messages/project/:projectId - Get messages by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const messages = await Message.findAll({
      where: { projectId: req.params.projectId },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
        { 
          model: Message, 
          as: 'replyTo',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/:id - Get message by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const message = await Message.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
        { 
          model: Message, 
          as: 'replyTo',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
          ]
        },
        { 
          model: Message, 
          as: 'replies',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] }
          ]
        }
      ]
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// POST /api/messages - Create new message
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content, messageType, projectId, senderId, replyToId } = req.body;
    
    const message = await Message.create({
      content,
      messageType: messageType || 'text',
      projectId,
      senderId,
      replyToId,
    });
    
    // Fetch the created message with associations
    const createdMessage = await Message.findByPk(message.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
        { 
          model: Message, 
          as: 'replyTo',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
          ]
        }
      ]
    });
    
    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create message' });
  }
});

// PUT /api/messages/:id - Update message (edit)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await message.update({
      content,
      isEdited: true,
    });
    
    // Fetch the updated message with associations
    const updatedMessage = await Message.findByPk(message.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
        { 
          model: Message, 
          as: 'replyTo',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
          ]
        }
      ]
    });
    
    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update message' });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await message.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
