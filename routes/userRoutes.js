import express from 'express';
import { deleteUser, getUserDetails, getUserList, updateUser, getOtherUserDetails, getMatchedUsers, getUnmatchedUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', getUserDetails);
router.post('/list', getUserList);
router.put('/:id', updateUser);
router.delete('/delete', deleteUser);

router.get('/details/:id', getOtherUserDetails);
router.post('/:id/matched', getMatchedUsers);
router.post('/:id/unmatched', getUnmatchedUsers);

export default router;
