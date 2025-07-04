import express from 'express';
import {
    addAnnotation,
    getAnnotations
} from '../controllers/annotateController.js';

const router = express.Router();

router.post('/:videoId/add', addAnnotation);
router.get('/:videoId/fetch', getAnnotations);

export default router;