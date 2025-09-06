# Espada - Project Management Platform

A full-stack project management application built for the hackathon, featuring real-time collaboration, task management, and team communication.

## 🚀 Features

- **Project Management**: Create and manage projects with your team
- **Task Tracking**: Kanban-style task board with drag-and-drop functionality
- **Real-time Chat**: Built-in chat for each project
- **User Authentication**: Secure JWT-based authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Form Validation**: Client and server-side validation for all forms

## Features

- **Express.js** server with TypeScript support
- **SQLite** database with Sequelize ORM
- **Socket.IO** for real-time project chat
- RESTful API endpoints for Users, Projects, Tasks, and Messages
- Real-time messaging on `/messages` namespace

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Socket.IO Client for real-time updates
- React Query for data fetching and caching

### Backend
- Node.js + Express
- TypeScript
- SQLite + Sequelize ORM
- JWT Authentication
- Socket.IO for real-time communication
- CORS enabled

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/espada.git
cd espada
```

2. **Set up the backend**
```bash
# Install dependencies
npm install

# Create a .env file from the example
cp .env.example .env

# Update the .env file with your configuration

# Start the development server
npm run dev
```

3. **Set up the frontend**
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables (see `.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📚 Project Structure

```
├── .github/              # GitHub workflows and templates
├── frontend/             # Frontend React application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── App.tsx       # Main application component
│   └── ...
├── src/                  # Backend source code
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── server.ts         # Server entry point
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore file
├── package.json          # Backend dependencies
└── README.md             # This file

## 📝 API Documentation

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user and get JWT token

### Projects
- `GET /projects` - Get all projects for the current user
- `POST /projects` - Create a new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks
- `GET /tasks/projects/:projectId/tasks` - Get all tasks for a project
- `POST /tasks/projects/:projectId/tasks` - Create a new task
- `PATCH /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task

### Messages
- `GET /api/messages/project/:projectId` - Get messages for a project
- `POST /api/messages` - Send a new message

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

## 💬 Real-time Features

### Socket.IO Events

**Client to Server:**
- `joinProject` - Join a project room
- `leaveProject` - Leave a project room
- `sendMessage` - Send a message to project room
- `updateTaskStatus` - Update task status in real-time

**Server to Client:**
- `newMessage` - New message in project
- `taskUpdated` - Task was updated
- `userJoined` - User joined the project
- `userLeft` - User left the project
- `notification` - General notifications

## 🧪 Testing

To run tests:

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the production server:
```bash
npm start
```

### Environment Variables for Production

Make sure to set the following environment variables in production:
- `NODE_ENV=production`
- `JWT_SECRET` - A secure secret key for JWT
- `DB_PATH` - Path to your production database
- `CORS_ORIGIN` - Your production frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- [Team Member 1](https://github.com/username1)
- [Team Member 2](https://github.com/username2)
- [Team Member 3](https://github.com/username3)

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [Tailwind CSS](https://tailwindcss.com/)

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
