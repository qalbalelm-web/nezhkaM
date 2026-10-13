import { Router } from 'express';
import { requireTeacher } from '../middleware/auth.js';
import {
  getTeacherProfile,
  getUploadCredentials,
  getMyVideos,
  registerVideo,
  deleteMyVideo,
} from '../controllers/teacherController.js';

const router = Router();

// All routes here strictly require teacher authentication and enforce teacher isolation
router.use(requireTeacher);

router.get('/profile', getTeacherProfile);
router.get('/upload-credentials', getUploadCredentials);
router.get('/videos', getMyVideos);
router.post('/videos', registerVideo);
router.delete('/videos/:id', deleteMyVideo);

export default router;
