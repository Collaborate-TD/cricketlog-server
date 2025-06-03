import express from 'express';
import { deleteUser, getUserDetails, getUserList, updateUser, getOtherUserDetails, getMatchedUsers, getUnmatchedUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', getUserDetails);
router.post('/list', getUserList);
router.put('/:id', updateUser);
router.delete('/delete', deleteUser);

router.get('/details/:id', getOtherUserDetails);
router.get('/:id/matched', getMatchedUsers);
router.get('/:id/unmatched', getUnmatchedUsers);

export default router;
