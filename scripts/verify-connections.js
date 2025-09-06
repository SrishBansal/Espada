#!/usr/bin/env node

const axios = require('axios');
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';
const JWT_SECRET = 'super-secret-key-change-in-production'; // Should match your env

// Test data
const testUser = {
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'testpassword123'
};

let authToken = '';
let userId = '';
let projectId = '';
let taskId = '';
let messageId = '';

// Utility functions
function logStep(step, description) {
  console.log(`\n🔍 Step ${step}: ${description}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error = null) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Test functions
async function testHealthEndpoint() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      logSuccess('Health endpoint is working');
      return true;
    } else {
      logError('Health endpoint returned unexpected response', response.data);
      return false;
    }
  } catch (error) {
    logError('Health endpoint failed', error);
    return false;
  }
}

async function testUserSignup() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, testUser);
    
    if (response.status === 201 && response.data.success) {
      authToken = response.data.data.token;
      userId = response.data.data.user.id;
      logSuccess(`User signup successful - ID: ${userId}`);
      return true;
    } else {
      logError('User signup failed', response.data);
      return false;
    }
  } catch (error) {
    logError('User signup failed', error);
    return false;
  }
}

async function testUserLogin() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200 && response.data.success) {
      const token = response.data.data.token;
      
      // Verify JWT token
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId === userId) {
          logSuccess('User login and JWT verification successful');
          return true;
        } else {
          logError('JWT token contains incorrect user ID');
          return false;
        }
      } catch (jwtError) {
        logError('JWT verification failed', jwtError);
        return false;
      }
    } else {
      logError('User login failed', response.data);
      return false;
    }
  } catch (error) {
    logError('User login failed', error);
    return false;
  }
}

async function testCreateProject() {
  try {
    const response = await axios.post(`${API_BASE_URL}/projects`, {
      name: 'Test Project',
      description: 'A test project for verification'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 201 && response.data.success) {
      projectId = response.data.data.id;
      logSuccess(`Project created successfully - ID: ${projectId}`);
      return true;
    } else {
      logError('Project creation failed', response.data);
      return false;
    }
  } catch (error) {
    logError('Project creation failed', error);
    return false;
  }
}

async function testVerifyProjectInDB() {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const project = response.data.data;
      if (project.id === projectId && project.name === 'Test Project') {
        logSuccess('Project verified in database');
        return true;
      } else {
        logError('Project data mismatch in database');
        return false;
      }
    } else {
      logError('Failed to fetch project from database', response.data);
      return false;
    }
  } catch (error) {
    logError('Failed to verify project in database', error);
    return false;
  }
}

async function testCreateTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/tasks/projects/${projectId}/tasks`, {
      title: 'Test Task',
      description: 'A test task for verification',
      status: 'TODO'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 201 && response.data.success) {
      taskId = response.data.data.id;
      logSuccess(`Task created successfully - ID: ${taskId}`);
      return true;
    } else {
      logError('Task creation failed', response.data);
      return false;
    }
  } catch (error) {
    logError('Task creation failed', error);
    return false;
  }
}

async function testFetchTasks() {
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const tasks = response.data.data;
      const createdTask = tasks.find(task => task.id === taskId);
      
      if (createdTask && createdTask.title === 'Test Task') {
        logSuccess('Task fetched successfully via API');
        return true;
      } else {
        logError('Created task not found in fetched tasks');
        return false;
      }
    } else {
      logError('Failed to fetch tasks', response.data);
      return false;
    }
  } catch (error) {
    logError('Failed to fetch tasks', error);
    return false;
  }
}

async function testSocketIOConnection() {
  return new Promise((resolve) => {
    logInfo('Testing Socket.IO connection...');
    
    const socket = io(SOCKET_URL, {
      auth: {
        token: authToken,
        userId: userId
      }
    });
    
    let connectionEstablished = false;
    let projectJoined = false;
    let messageSent = false;
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      if (!connectionEstablished) {
        logError('Socket.IO connection timeout');
        socket.disconnect();
        resolve(false);
      }
    }, 10000);
    
    socket.on('connect', () => {
      logSuccess('Socket.IO connection established');
      connectionEstablished = true;
      
      // Join project room
      socket.emit('joinProject', { projectId });
    });
    
    socket.on('userJoined', (data) => {
      if (data.projectId === projectId) {
        logSuccess('Successfully joined project room');
        projectJoined = true;
        
        // Send a test message
        socket.emit('sendMessage', {
          projectId: projectId,
          content: 'Test message from verification script'
        }, (response) => {
          if (response.success) {
            logSuccess('Message sent via Socket.IO');
            messageSent = true;
          } else {
            logError('Failed to send message via Socket.IO', response.error);
          }
        });
      }
    });
    
    socket.on('newMessage', (message) => {
      if (message.projectId === projectId && message.content === 'Test message from verification script') {
        logSuccess('Message received via Socket.IO');
        messageReceived = true;
        messageId = message.id;
        
        // Clean up
        clearTimeout(timeout);
        socket.disconnect();
        resolve(true);
      }
    });
    
    socket.on('error', (error) => {
      logError('Socket.IO error', error);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(false);
    });
    
    socket.on('disconnect', () => {
      if (connectionEstablished && projectJoined && messageSent && messageReceived) {
        logSuccess('Socket.IO test completed successfully');
      }
    });
  });
}

async function testMessagePersistence() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/messages/project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const messages = response.data.data;
      const sentMessage = messages.find(msg => msg.id === messageId);
      
      if (sentMessage && sentMessage.content === 'Test message from verification script') {
        logSuccess('Message persisted in database');
        return true;
      } else {
        logError('Sent message not found in database');
        return false;
      }
    } else {
      logError('Failed to fetch messages from database', response.data);
      return false;
    }
  } catch (error) {
    logError('Failed to verify message persistence', error);
    return false;
  }
}

async function cleanupTestData() {
  try {
    logInfo('Cleaning up test data...');
    
    // Delete the test project (this will cascade delete tasks and messages)
    await axios.delete(`${API_BASE_URL}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Delete the test user
    await axios.delete(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    logSuccess('Test data cleaned up successfully');
  } catch (error) {
    logError('Failed to clean up test data', error);
  }
}

// Main verification function
async function runVerification() {
  console.log('🚀 Starting SynergySphere Connection Verification');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // Step 1: Health endpoint
  logStep(1, 'Testing health endpoint');
  results.push(await testHealthEndpoint());
  
  // Step 2: User signup
  logStep(2, 'Testing user signup');
  results.push(await testUserSignup());
  
  // Step 3: User login and JWT verification
  logStep(3, 'Testing user login and JWT verification');
  results.push(await testUserLogin());
  
  // Step 4: Create project
  logStep(4, 'Testing project creation');
  results.push(await testCreateProject());
  
  // Step 5: Verify project in database
  logStep(5, 'Verifying project exists in database');
  results.push(await testVerifyProjectInDB());
  
  // Step 6: Create task
  logStep(6, 'Testing task creation');
  results.push(await testCreateTask());
  
  // Step 7: Fetch tasks
  logStep(7, 'Testing task fetching');
  results.push(await testFetchTasks());
  
  // Step 8: Socket.IO connection and messaging
  logStep(8, 'Testing Socket.IO connection and real-time messaging');
  results.push(await testSocketIOConnection());
  
  // Step 9: Message persistence
  logStep(9, 'Verifying message persistence in database');
  results.push(await testMessagePersistence());
  
  // Cleanup
  await cleanupTestData();
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! SynergySphere is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run verification
runVerification().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
