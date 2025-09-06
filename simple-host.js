const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the frontend dist directory
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SynergySphere Frontend hosted on http://localhost:${PORT}`);
  console.log(`🔧 Backend API available at http://localhost:5000`);
  console.log(`\n🎉 Your application is ready to use!`);
  console.log(`\n📋 Access URLs:`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   Backend:  http://localhost:5000`);
  console.log(`   Health:   http://localhost:5000/health`);
});
