import express from 'express';
import {
    createDrill,
    getDrills,
    getDrill,
    updateDrill,
    deleteDrill
} from '../controllers/drillController.js';

const router = express.Router();

router.post('/', createDrill);
router.post('/list/', getDrills);
router.get('/:id', getDrill);
router.put('/:id', updateDrill);
router.delete('/', deleteDrill);

export default router;