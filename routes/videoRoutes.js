import express from 'express';
import { getVideoList } from '../controllers/videoController.js';

const router = express.Router();

router.post('/list', getVideoList);

export default router;
