import express from 'express';
import { requestRelation, approveRelation, declineRelation, getStudentRequests, getCoachRequests } from '../controllers/relationController.js';

const router = express.Router();

// Send a relation request
router.post('/request', requestRelation);

// Approve a relation request
router.post('/approve', approveRelation);

// Decline a relation request
router.post('/decline', declineRelation);

// Get all requests for a student
router.get('/student/:studentId', getStudentRequests);

// Get all requests for a coach
router.get('/coach/:coachId', getCoachRequests);

export default router;