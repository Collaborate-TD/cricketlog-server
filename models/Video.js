import mongoose from 'mongoose';


const videoSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hasAccess: { type: Boolean, default: true },
    thumbnailUrl: { type: String, required: false, default: null },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    size: { type: Number, required: true },
    isFavourite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    annotations: { type: Object, default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Video', videoSchema);
