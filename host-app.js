const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the frontend dist directory
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Proxy API requests to the backend server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to backend
  },
}));

// Proxy auth requests to the backend server
app.use('/auth', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

// Proxy projects requests to the backend server
app.use('/projects', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

// Proxy tasks requests to the backend server
app.use('/tasks', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

// Proxy users requests to the backend server
app.use('/users', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

// Proxy health check to the backend server
app.use('/health', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SynergySphere is now hosted on http://localhost:${PORT}`);
  console.log(`📁 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
  console.log(`💾 Database: SQLite with Prisma`);
  console.log(`📡 Real-time: Socket.IO enabled`);
  console.log(`\n🎉 Your application is ready to use!`);
});
