import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// LOGIN
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            role: user.role
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Server error during login.' });
    }
};

// REGISTER
const registerUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists.' });
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            role
        });
        await user.save();

        return res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ error: 'Server error during registration.' });
    }
};

export { loginUser, registerUser };
