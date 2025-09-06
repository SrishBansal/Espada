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

### Authentication
- `POST /auth/signup` - Create new user (name, email, password)
- `POST /auth/login` - Login user (email, password) → returns JWT token

### Projects (Protected - requires JWT token)
- `GET /projects` - List projects for logged-in user
- `POST /projects` - Create new project (name, description, members)
- `GET /projects/:id` - Fetch single project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks (Protected - requires JWT token)
- `GET /tasks/projects/:projectId/tasks` - List tasks in that project
- `POST /tasks/projects/:projectId/tasks` - Add new task (title, description, assignee, dueDate, status)
- `PATCH /tasks/:id` - Update task (status, description, etc.)
- `GET /tasks/:id` - Get single task
- `DELETE /tasks/:id` - Delete task

### Messages (Protected - requires JWT token)
- `GET /api/messages/project/:projectId` - Get messages by project
- `GET /api/messages/:id` - Get message by ID
- `POST /api/messages` - Create new message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

## Socket.IO Real-time Messaging

Connect to the `/messages` namespace for real-time project chat:

### Events

**Client to Server:**
- `joinProject` - Join a project room (projectId, userId)
- `leaveProject` - Leave a project room (projectId, userId)
- `sendMessage` - Send a message to project room (projectId, senderId, text)

**Server to Client:**
- `newMessage` - Receive new message in project room
- `userJoined` - User joined the project room
- `userLeft` - User left the project room
- `error` - Error message

### Example Usage

```javascript
const socket = io('/messages');

// Join a project room
socket.emit('joinProject', {
  projectId: '123',
  userId: '456'
});

// Send a message
socket.emit('sendMessage', {
  projectId: '123',
  senderId: '456',
  text: 'Hello team!'
});

// Listen for new messages
socket.on('newMessage', (data) => {
  console.log('New message:', data);
  // data contains: { id, content, sender, projectId, timestamp }
});

// Listen for user events
socket.on('userJoined', (data) => {
  console.log('User joined:', data.userId);
});

socket.on('userLeft', (data) => {
  console.log('User left:', data.userId);
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

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Authentication Flow

1. **Signup:**
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

3. **Use token in protected routes:**
```bash
curl -X GET http://localhost:5000/projects \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Environment Variables

Create a `.env` file:
```
PORT=5000
NODE_ENV=development
DB_PATH=./database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-in-production
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