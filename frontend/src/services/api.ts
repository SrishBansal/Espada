import axios from 'axios';
import type { AuthResponse, LoginCredentials, SignupCredentials, Project, Task, Message } from '../types';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', credentials);
    return response.data as AuthResponse;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data as AuthResponse;
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data as Project[];
  },

  getProject: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data as Project;
  },

  createProject: async (project: { name: string; description?: string; members?: string[] }): Promise<Project> => {
    const response = await api.post('/projects', project);
    return (response.data as any).project;
  },

  updateProject: async (id: number, project: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, project);
    return (response.data as any).project;
  },

  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

// Tasks API
export const tasksAPI = {
  getProjectTasks: async (projectId: number): Promise<Task[]> => {
    const response = await api.get(`/tasks/projects/${projectId}/tasks`);
    return response.data as Task[];
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data as Task;
  },

  createTask: async (projectId: number, task: {
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    status?: string;
  }): Promise<Task> => {
    const response = await api.post(`/tasks/projects/${projectId}/tasks`, task);
    return (response.data as any).task;
  },

  updateTask: async (id: number, task: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, task);
    return (response.data as any).task;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

// Messages API
export const messagesAPI = {
  getProjectMessages: async (projectId: number): Promise<Message[]> => {
    const response = await api.get(`/api/messages/project/${projectId}`);
    return response.data as Message[];
  },

  createMessage: async (message: {
    content: string;
    messageType?: string;
    projectId: number;
    senderId: number;
    replyToId?: number;
  }): Promise<Message> => {
    const response = await api.post('/api/messages', message);
    return response.data as Message;
  },
};

export default api;