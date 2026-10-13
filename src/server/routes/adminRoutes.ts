import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getTeachers,
  createTeacher,
  deleteTeacher,
  getStorageMetrics,
  getDatabaseStatus,
  updateMongoConnection,
  exportDatabaseBackup,
  restoreDatabaseBackup,
} from '../controllers/adminController.js';

const router = Router();

// All routes here strictly require admin authentication
router.use(requireAdmin);

router.get('/teachers', getTeachers);
router.post('/teachers', createTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.get('/metrics', getStorageMetrics);
router.get('/database-status', getDatabaseStatus);
router.post('/database-connect', updateMongoConnection);
router.get('/backup', exportDatabaseBackup);
router.post('/restore', restoreDatabaseBackup);

export default router;
