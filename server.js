const express = require('express');
const cors = require('cors');
const { PORT, HOST, DB_PATH, CORS_ORIGIN } = require('./config');
const { db } = require('./db');
const publicRoutes = require('./routes/public');
const toolsRoutes = require('./routes/tools');
const adminRoutes = require('./routes/admin');

const app = express();

// JSON body parsing for admin endpoints (no-op for multipart/form-data)
app.use(express.json({ limit: '1mb' }));

// CORS — same-origin only by default; via env CORS_ORIGIN für cross-origin clients lockern.
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(publicRoutes);
app.use(toolsRoutes);
app.use(adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Beim direkten Start (npm start / node server.js) Listener starten.
// Beim require() aus Tests bleibt der App-Export "passiv" — Tests rufen listen(0) selbst auf.
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Database: ${DB_PATH}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    db.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
