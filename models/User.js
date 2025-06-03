import mongoose from 'mongoose';
import { RELATION_STATUS, REQUEST_TYPES } from '../constants/relationStatus.js';
import { USER_ROLES } from '../constants/userRoles.js';

const relationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(RELATION_STATUS), required: true },
    requestType: { type: String, enum: Object.values(REQUEST_TYPES), required: true },
    feedback: { type: String, required: false },
    requestDate: { type: Date, required: true, default: Date.now },
    approvedDate: { type: Date, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(USER_ROLES), required: true },
    relation: { type: [relationSchema], default: [] },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);