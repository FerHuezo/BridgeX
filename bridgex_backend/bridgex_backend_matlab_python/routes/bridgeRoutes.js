import { Router } from 'express';
import { analyzeBridge } from '../controllers/bridgeCtrl.js';

const router = Router();

router.post('/analyze', analyzeBridge);

export default router;
