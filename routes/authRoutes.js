import express from 'express';
import {
    loginUser,
    registerUser,
    forgotPassword,
    validateResetToken,
    resetPassword
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.get('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

export default router;
