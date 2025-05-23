import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['coach', 'student'], default: 'student' }
});

export default mongoose.model('User', userSchema);
