import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { config } from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = `http://localhost:${process.env.PORT || 5000}`;

// Test data
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  password: 'testpassword123',
};

let authToken: string;
let socket: Socket;
let projectId: string;
let taskId: string;

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Test cases
const tests = {
  async healthCheck() {
    console.log('\n🔍 Testing health check...');
    const response = await api.get('/health');
    console.log('✅ Health check passed:', response.data);
  },

  async signup() {
    console.log('\n👤 Testing user signup...');
    const response = await api.post('/auth/signup', TEST_USER);
    console.log('✅ User signed up:', response.data);
  },

  async login() {
    console.log('\n🔑 Testing login...');
    const response = await api.post('/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    
    authToken = response.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('✅ Logged in, token received');
  },

  async createProject() {
    console.log('\n🏗️  Testing project creation...');
    const projectData = {
      name: 'Smoke Test Project',
      description: 'Project created during smoke testing',
    };
    
    const response = await api.post('/projects', projectData);
    projectId = response.data.id;
    
    console.log('✅ Project created:', response.data);
  },

  async createTask() {
    console.log('\n📝 Testing task creation...');
    const taskData = {
      title: 'Test Task',
      description: 'This is a test task',
      status: 'TODO',
    };
    
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    taskId = response.data.id;
    
    console.log('✅ Task created:', response.data);
  },

  async testWebSocket() {
    console.log('\n🔌 Testing WebSocket connection...');
    
    return new Promise<void>((resolve, reject) => {
      socket = io(API_URL, {
        path: '/socket.io',
        auth: { token: authToken },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        
        // Join project room
        socket.emit('joinProject', { projectId });
        
        // Test sending a message
        const testMessage = {
          content: 'This is a test message from smoke test',
          projectId,
        };
        
        socket.emit('sendMessage', testMessage, (response: any) => {
          if (response.error) {
            console.error('❌ Error sending message:', response.error);
            reject(new Error('Failed to send message'));
            return;
          }
          
          console.log('✅ Message sent successfully');
          
          // Disconnect after successful test
          socket.disconnect();
          resolve();
        });
      });

      socket.on('connect_error', (error: any) => {
        console.error('❌ WebSocket connection error:', error.message);
        reject(error);
      });

      socket.on('disconnect', (reason: string) => {
        console.log('ℹ️  WebSocket disconnected:', reason);
      });

      // Set timeout for connection
      setTimeout(() => {
        if (!socket.connected) {
          console.error('❌ WebSocket connection timeout');
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  },

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete the test project (which will cascade delete tasks and messages)
      if (projectId) {
        await api.delete(`/projects/${projectId}`);
        console.log('✅ Test project deleted');
      }
      
      // Note: In a real app, you might want to delete the test user too
      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('⚠️  Error during cleanup:', error);
    }
  },
};

// Run tests
async function runTests() {
  console.log('🚀 Starting smoke tests...');
  console.log(`🔗 API URL: ${API_URL}`);
  
  try {
    await tests.healthCheck();
    await tests.signup();
    await tests.login();
    await tests.createProject();
    await tests.createTask();
    await tests.testWebSocket();
    
    console.log('\n🎉 All smoke tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Smoke tests failed:', error);
    process.exit(1);
  } finally {
    await tests.cleanup();
    
    // Ensure the process exits
    setTimeout(() => process.exit(0), 1000);
  }
}

// Run the tests
runTests();
