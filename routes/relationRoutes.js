import express from 'express';
import { requestRelation, approveRelation, declineRelation } from '../controllers/relationController.js';

const router = express.Router();

// Send a relation request
router.post('/request', requestRelation);

// Approve a relation request
router.post('/approve', approveRelation);

// Decline a relation request
router.post('/decline', declineRelation);

export default router;