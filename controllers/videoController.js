import User from '../models/User.js';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';
import { getVideoListSchema } from '../validation/videoValidation.js';

// Get list of all videos
const getVideoList = async (req, res) => {
    // Joi validation
    const { error } = getVideoListSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const { userId } = req.body.params;

        // Get user and their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let userIds = [];
        if (user.role === 'coach') {
            userIds = user.relation
                .filter(r => r.status === 'approved')
                .map(r => r.userId);
        }
        else {
            userIds = [userId];
        }

        // Find videos for these userIds
        const videos = await Video.find({ userId: { $in: userIds } }).sort({ createdAt: -1 });

        const list = videos.map(video => {
            const filePath = path.join('data', 'videos', video.userId.toString(), 'raw', video.fileName);
            const fileExists = fs.existsSync(filePath);
            return {
                _id: video._id,
                url: fileExists ? video.thumbnailUrl : null,
                thumbnailUrl: fileExists ? video.thumbnailUrl : null,
                title: video.originalName || video.fileName
            };
        });

        res.status(200).json({ list });
    } catch (err) {
        console.error('Get Video List Error:', err);
        res.status(500).json({ message: 'Server error while fetching videos.' });
    }
};

export {
    getVideoList
};
