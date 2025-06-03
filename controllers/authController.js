import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema } from '../validation/authValidation.js';

// LOGIN
const loginUser = async (req, res) => {
    const { error } = loginSchema.validate(req.body);
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

        const token = jwt.sign(
            {
                id: user._id,
                userName: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
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
        return res.status(500).json({ message: 'Server error during login.' });
    }
};

// REGISTER
const registerUser = async (req, res) => {
    const { error } = registerSchema.validate(req.body);
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
        const user = new User({
            userName,
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role
        });
        await user.save();

        return res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ message: 'Server error during registration.' });
    }
};

export { loginUser, registerUser };