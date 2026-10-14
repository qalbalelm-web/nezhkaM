import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './src/server/config/db.js';
import setupRoutes from './src/server/routes/setupRoutes.js';
import authRoutes from './src/server/routes/authRoutes.js';
import adminRoutes from './src/server/routes/adminRoutes.js';
import teacherRoutes from './src/server/routes/teacherRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Database (MongoDB with automatic persistent fallback)
  await connectDB();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  // API Routes
  app.use('/api/setup', setupRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/teacher', teacherRoutes);

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'مخزن منصة قلب العلم',
      timestamp: new Date().toISOString(),
    });
  });

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProduction) {
    // Mount Vite dev server in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production / built app
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [مخزن منصة قلب العلم] الخادم يعمل بنجاح على المنفذ: ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
