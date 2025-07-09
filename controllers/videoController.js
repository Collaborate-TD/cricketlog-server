import User from '../models/User.js';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';
import { deleteVideosSchema, getVideoListSchema, updateVideoSchema, uploadVideoSchema } from '../validation/videoValidation.js';
import generateRandomString from '../utils/src/generateRandomString.js';
import Joi from 'joi';
import { uploadToBlob } from '../utils/src/azureStorage.js';

// Get list of all videos
const getVideoList = async (req, res) => {
    const { error } = getVideoListSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const { userId, studentId, coachId } = req.body.params;

        // Get user and their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let filter = {};

        if (user.role === 'coach') {
            if (studentId) {
                // Coach wants videos of a specific student
                filter = { studentId, coachId: userId, hasAccess: true };
            } else {
                // Coach wants all their students' videos + their own
                filter = { coachId: userId, hasAccess: true };
            }
        } else if (user.role === 'student') {
            if (coachId) {
                // Student wants videos with a specific coach
                filter = { coachId, studentId: userId };
            } else {
                // Student wants all their own videos
                filter = { studentId: userId };
            }
        } else {
            // Fallback: invalid role or insufficient parameters
            return res.status(403).json({ message: 'You are not authorized to view these videos or invalid role.' });
        }

        //  const videos = await Video.find(filter).sort({ createdAt: -1 });
        const videos = await Video.find({ studentId: userId })
            .sort({ createdAt: -1 })
            .populate('studentId', 'name email')
            .exec();

        const list = videos.map(video => {
            const filePath = path.join('data', 'videos', video.studentId.toString(), 'raw', video.fileName);
            const fileExists = fs.existsSync(filePath);
            return {
                _id: video._id,
                url: fileExists ? `${process.env.BACKEND_URL}${video.thumbnailUrl}` : null,
                thumbnailUrl: fileExists ? video.thumbnailUrl : null,
                title: video.originalName || video.fileName,
                isFavourite: video.isFavourite.includes(userId),
                studentId: video.studentId,
                coachId: video.coachId,
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
    // Validate request body
    const { error, value } = uploadVideoSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { studentId, coachId } = value;

    try {
        console.log('Upload request received:', req.body);
        console.log('Files received:', req.files);
        
        // Make sure req.files exists and has the video file
        if (!req.files || !req.files.length) {
          return res.status(400).json({ message: 'No video file uploaded' });
        }
        
        const file = req.files[0];
        console.log('File path:', file.path);
        
        // Create a more robust uploadToBlob function that handles buffers
        // Instead of relying on file paths
        const blobName = `videos/${Date.now()}-${file.originalname}`;
        
        // Read the file into buffer instead of relying on the path
        const fs = await import('fs');
        const fileBuffer = fs.readFileSync(file.path);
        
        // Call uploadToBlob with the buffer instead of the path
        const blobUrl = await uploadToBlob('videos', blobName, fileBuffer);
        
        // Rest of your function...
        
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
      }
};

// Edit video details (e.g., title, description, etc.)
const editDetails = async (req, res) => {
    // Validate and strip unknown fields
    const { value, error } = updateVideoSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const videoId = req.params.id;
    const { userId, isFavourite } = value;

    if (!videoId) {
        return res.status(400).json({ message: 'videoId is required in URL parameter' });
    }

    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: 'Video not found.' });

        // Only student or coach can favourite/unfavourite
        if (
            video.studentId.toString() !== userId &&
            video.coachId.toString() !== userId
        ) {
            return res.status(403).json({ message: 'Not authorized to update favourite for this video.' });
        }

        let update;
        if (isFavourite) {
            update = { $addToSet: { isFavourite: userId } };
        } else {
            update = { $pull: { isFavourite: userId } };
        }

        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            update,
            { new: true }
        );

        res.status(200).json({ message: 'Favourite status updated.', video: updatedVideo });
    } catch (err) {
        console.error('Update Video Error:', err);
        res.status(500).json({ message: 'Server error while updating video.' });
    }
};

// Delete videos by IDs
const deleteVideos = async (req, res) => {
    const { error, value } = deleteVideosSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { userId, ids } = value;

    try {
        // Find the user to check their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'coach') {
            // Coach is not allowed to delete videos
            return res.status(403).json({ message: 'Coaches are not allowed to delete videos.' });
        } else if (user.role === 'student') {
            // Student: delete videos and remove files
            const videos = await Video.find({ _id: { $in: ids }, studentId: userId });
            for (const video of videos) {
                const filePath = path.join('data', 'videos', video.studentId.toString(), 'raw', video.fileName);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.warn(`Failed to delete file: ${filePath}`, err);
                    }
                }
            }
            const result = await Video.deleteMany({ _id: { $in: ids }, studentId: userId });
            return res.status(200).json({ message: 'Videos deleted', deletedCount: result.deletedCount });
        } else {
            return res.status(403).json({ message: 'Not authorized to delete videos.' });
        }
    } catch (err) {
        console.error('Delete Videos Error:', err);
        res.status(500).json({ message: 'Server error while deleting videos.' });
    }
};



export {
    getVideoList,
    uploadVideo,
    editDetails,
    deleteVideos
};
