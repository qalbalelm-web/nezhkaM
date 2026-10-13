import { Router } from 'express';
import { getSetupStatus, performSetup } from '../controllers/setupController.js';

const router = Router();

router.get('/status', getSetupStatus);
router.post('/', performSetup);

export default router;
