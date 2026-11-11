require('dotenv').config();
const express = require('express');
const cors = require('cors');

const projectRoutes = require('./routes/projectRoutes');
const promptRoutes = require('./routes/promptRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Healthcheck / Root
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AI Prompt Version Control API',
    endpoints: {
      projects: {
        create: 'POST /api/projects',
        list: 'GET /api/projects',
        getById: 'GET /api/projects/:projectId',
        createPromptForProject: 'POST /api/projects/:projectId/prompts',
        getPromptsForProject: 'GET /api/projects/:projectId/prompts',
      },
      prompts: {
        createDirect: 'POST /api/prompts',
        getById: 'GET /api/prompts/:id',
        deleteById: 'DELETE /api/prompts/:id',
      },
    },
  });
});

// Mount Routes
app.use('/api/projects', projectRoutes);
app.use('/api/prompts', promptRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Prompt Version Control Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
