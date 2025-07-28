import express from 'express';
import {
    requestRelation,
    getStudentRequests,
    getCoachRequests,
    handleRelationAction
} from '../controllers/relationController.js';

const router = express.Router();

// Send a relation request
router.post('/request', requestRelation);

// Approve/Reject a relation request
router.post('/action', handleRelationAction);

// Get all requests for a student
router.get('/student/:studentId', getStudentRequests);

// Get all requests for a coach
router.get('/coach/:coachId', getCoachRequests);

export default router;