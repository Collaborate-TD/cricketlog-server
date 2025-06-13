import User from '../models/User.js';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';
import { getVideoListSchema } from '../validation/videoValidation.js';

// Get list of all videos
const getVideoList = async (req, res) => {
    const { error } = getVideoListSchema.validate(req.body, { stripUnknown: true });
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
        const param = {};
        if (user.role === 'coach') {
            if (req.body.params.studentId) {
                // If studentId is provided, fetch only that student's videos
                userIds = [req.body.params.studentId];
            } else {
                // If no studentId, fetch all students under this coach
                userIds = user.relation
                    .filter(r => r.status === 'approved')
                    .map(r => r.userId);
                userIds.push(userId); // Include coach's own videos
            }
        }
        else {
            if (req.body.params.coachId) {
                param.feedback = { $elemMatch: { coachId } };
            }
            else {
                // If no coachId, fetch all of my own videos
                userIds = [userId];
            }
        }

        // Find videos for these userIds
        const videos = await Video.find({
            userId: { $in: userIds },
            ...param
        }).sort({ createdAt: -1 });

        const list = videos.map(video => {
            const filePath = path.join('data', 'videos', video.userId.toString(), 'raw', video.fileName);
            const fileExists = fs.existsSync(filePath);
            return {
                _id: video._id,
                url: fileExists ? `${process.env.BACKEND_URL}${video.thumbnailUrl}` : null,
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
