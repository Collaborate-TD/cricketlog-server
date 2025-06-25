import User from '../models/User.js';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';
import { getVideoListSchema, updateVideoSchema } from '../validation/videoValidation.js';
import generateRandomString from '../utils/src/generateRandomString.js';

// Get list of all videos
const getVideoList = async (req, res) => {
    const { error } = getVideoListSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const { userId, ...param } = req.body.params;

        // Get user and their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let userIds = [];
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
                title: video.originalName || video.fileName,
                isFavourite: video.isFavourite || false,
            };
        });

        res.status(200).json({ list });
    } catch (err) {
        console.error('Get Video List Error:', err);
        res.status(500).json({ message: 'Server error while fetching videos.' });
    }
};

// Upload video files
const uploadVideo = async (req, res) => {
    try {
        const { userId, username } = req.body;
        if (!userId || !username) {
            return res.status(400).json({ message: 'userId and username required in body' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const results = [];
        for (const file of req.files) {
            const ext = path.extname(file.originalname).toLowerCase();
            const timestamp = Date.now();
            const randStr = generateRandomString(6);
            const newFileName = `${username}_${timestamp}_${randStr}${ext}`;
            const userDir = path.join('data', 'videos', userId, 'raw');
            fs.mkdirSync(userDir, { recursive: true });
            const destPath = path.join(userDir, newFileName);

            // Move file from temp to user folder
            fs.renameSync(file.path, destPath);

            const url = `/data/videos/${userId}/raw/${newFileName}`;
            const thumbnailUrl = url;
            const uploadedAt = new Date(timestamp);

            // Save to DB
            const videoDoc = await Video.create({
                userId,
                username,
                thumbnailUrl,
                originalName: file.originalname,
                fileName: newFileName,
                size: file.size,
            });

            results.push({
                _id: videoDoc._id,
                userId,
                thumbnailUrl,
                originalName: file.originalname,
                size: file.size,
                uploadedAt
            });
        }

        res.status(201).json({ message: 'Files uploaded', files: results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Edit video details (e.g., title, description, etc.)
const editDetails = async (req, res) => {
    // Validate and strip unknown fields
    const { value: updateDetails, error } = updateVideoSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const videoId = req.params.id;
    if (!videoId) {
        return res.status(400).json({ message: 'videoId is required in URL parameter' });
    }

    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: 'Video not found.' });

        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            updateDetails,
            { new: true, runValidators: true }
        );
        if (!updatedVideo) return res.status(404).json({ message: 'Video not found.' });

        res.status(200).json({ message: 'Video updated successfully.', video: updatedVideo });
    } catch (err) {
        console.error('Update Video Error:', err);
        res.status(500).json({ message: 'Server error while updating video.' });
    }
};

export {
    getVideoList,
    uploadVideo,
    editDetails
};
