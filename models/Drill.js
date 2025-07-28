import mongoose from 'mongoose';

const drillSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPrivate: { type: Boolean, default: false },
    fileName: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: false, default: '' },
    url: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Drill', drillSchema);