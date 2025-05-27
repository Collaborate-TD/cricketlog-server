import express from 'express';
import { deleteUser, getUserDetails, getUserList, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/details', getUserDetails);
router.post('/list', getUserList);
router.post('/update', updateUser);
router.post('/delete', deleteUser);

export default router;
