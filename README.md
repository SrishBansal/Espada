# SynergySphere Backend

A Node.js + Express backend for the SynergySphere hackathon project with real-time messaging capabilities.

## Features

- **Express.js** server with TypeScript support
- **SQLite** database with Sequelize ORM
- **Socket.IO** for real-time project chat
- RESTful API endpoints for Users, Projects, Tasks, and Messages
- Real-time messaging on `/messages` namespace

## Tech Stack

- Node.js + Express
- TypeScript
- SQLite + Sequelize ORM
- Socket.IO
- CORS enabled

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Messages
- `GET /api/messages/project/:projectId` - Get messages by project
- `GET /api/messages/:id` - Get message by ID
- `POST /api/messages` - Create new message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

## Socket.IO Real-time Messaging

Connect to the `/messages` namespace for real-time project chat:

### Events

**Client to Server:**
- `join-project` - Join a project room
- `leave-project` - Leave a project room
- `send-message` - Send a message to project room

**Server to Client:**
- `new-message` - Receive new message in project room

### Example Usage

```javascript
const socket = io('/messages');

// Join a project room
socket.emit('join-project', 'project-123');

// Send a message
socket.emit('send-message', {
  projectId: '123',
  content: 'Hello team!',
  senderId: '456'
});

// Listen for new messages
socket.on('new-message', (data) => {
  console.log('New message:', data);
});
```

## Database Models

### User
- id, username, email, password, firstName, lastName, avatar, isActive

### Project
- id, name, description, status, startDate, endDate, ownerId

### Task
- id, title, description, status, priority, dueDate, projectId, assigneeId, createdById

### Message
- id, content, messageType, projectId, senderId, replyToId, isEdited

## Environment Variables

Create a `.env` file:
```
PORT=5000
NODE_ENV=development
DB_PATH=./database.sqlite
```

## Project Structure

```
src/
├── config/
│   └── database.ts
├── controllers/
├── middleware/
├── models/
│   ├── User.ts
│   ├── Project.ts
│   ├── Task.ts
│   ├── Message.ts
│   └── index.ts
├── routes/
│   ├── userRoutes.ts
│   ├── projectRoutes.ts
│   ├── taskRoutes.ts
│   └── messageRoutes.ts
├── types/
└── server.ts
```

## Development

The project uses:
- **TypeScript** for type safety
- **Nodemon** for development auto-restart
- **Sequelize** for database operations
- **Socket.IO** for real-time features

Happy coding! 🚀