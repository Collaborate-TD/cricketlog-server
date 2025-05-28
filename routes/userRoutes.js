import express from 'express';
import { deleteUser, getUserDetails, getUserList, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', getUserDetails);
router.post('/list', getUserList);
router.put('/:id', updateUser);
router.delete('/delete', deleteUser);

export default router;
