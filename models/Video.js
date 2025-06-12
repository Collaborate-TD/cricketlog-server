import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const videoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    thumbnailUrl: { type: String, required: false, default: null },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    size: { type: Number, required: true },
    feedback: { type: [feedbackSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Video', videoSchema);
