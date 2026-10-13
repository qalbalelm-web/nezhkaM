import { Router } from 'express';
import { unifiedLogin, adminLogin, teacherLogin, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', unifiedLogin);
router.post('/admin-login', adminLogin);
router.post('/teacher-login', teacherLogin);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', logout);

export default router;
