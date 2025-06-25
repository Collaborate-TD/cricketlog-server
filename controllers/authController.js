import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation/authValidation.js';
import { saveProfilePhoto } from '../utils/src/profilePhotoHandler.js';

// LOGIN
const loginUser = async (req, res) => {
    const { error } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { userData, password } = req.body;

    if (!userData || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [
                { email: userData.toLowerCase() },
                { userName: userData }
            ]
        }
        );


        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const profilePhotoUrl = user.profilePhoto
            ? `${process.env.BACKEND_URL}/data/profile/${user._id}/${user.profilePhoto}`
            : null;

        const token = jwt.sign(
            {
                id: user._id,
                userName: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profilePhoto: profilePhotoUrl
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                userName: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profilePhoto: profilePhotoUrl
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ message: 'Server error during login.' });
    }
};

// REGISTER
const registerUser = async (req, res) => {
    const { error } = registerSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { userName, firstName, lastName, email, password, role } = req.body;

    if (!userName | !firstName | !lastName | !email | !password | !role) {
        return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    try {
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() }, { userName }
            ]
        });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists.' });
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user first to get userId for folder
        const user = new User({
            userName,
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role
        });
        await user.save();

        // Handle profile photo if present
        let profilePhotoFileName = null;
        if (req.body.profilePhoto) {
            profilePhotoFileName = saveProfilePhoto({
                filename: req.body.profilePhoto,
                userId: user._id.toString(),
                username: userName
            });
            user.profilePhoto = profilePhotoFileName;
            await user.save();
        }

        return res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ message: 'Server error during registration.' });
    }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    const { error } = forgotPasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
        await user.save();

        // In production, send email. Here, just return the link.
        const resetLink = `${process.env.FRONTEND_URL}/reset-pass?token=${token}`;
        return res.status(200).json({ message: 'Reset link sent.', resetLink });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        return res.status(500).json({ message: 'Server error during password reset.' });
    }
};

// VALIDATE RESET TOKEN
const validateResetToken = async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: 'Token is required.' });
    }
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        return res.status(200).json({ message: 'Token is valid.' });
    } catch (err) {
        console.error('Validate Token Error:', err);
        return res.status(500).json({ message: 'Server error during token validation.' });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    const { error } = resetPasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { token, password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
        user.password = await bcrypt.hash(password, saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        return res.status(500).json({ message: 'Server error during password update.' });
    }
};

export {
    loginUser,
    registerUser,
    forgotPassword,
    validateResetToken,
    resetPassword
};