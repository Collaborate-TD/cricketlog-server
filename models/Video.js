import mongoose from 'mongoose';

// Define annotation schema
const annotationSchema = new mongoose.Schema({
    data: { type: String, required: true }, // Store annotation data (e.g., drawings, comments)
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const videoSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hasAccess: { type: Boolean, default: true },
    thumbnailUrl: { type: String, required: false, default: null },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    size: { type: Number, required: true },
    isFavourite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    annotations: { type: [annotationSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Video', videoSchema);
