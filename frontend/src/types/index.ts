export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  startDate?: string;
  endDate?: string;
  ownerId: number;
  owner?: User;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  projectId: number;
  assigneeId?: number;
  createdById: number;
  project?: Project;
  assignee?: User;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  projectId: number;
  senderId: number;
  replyToId?: number;
  isEdited: boolean;
  sender?: User;
  project?: Project;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}
