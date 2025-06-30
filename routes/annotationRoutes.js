import express from 'express';
import {
    addAnnotation,
    getAnnotations,
    updateAnnotation,
    deleteAnnotation
} from '../controllers/annotationController.js';

const router = express.Router();

router.post('/:videoId/annotations', addAnnotation);
router.get('/:videoId/annotations', getAnnotations);
router.put('/:videoId/annotations/:annotationId', updateAnnotation);
router.delete('/:videoId/annotations/:annotationId', deleteAnnotation);

export default router;