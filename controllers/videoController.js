import User from '../models/User.js';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';
import { deleteVideosSchema, getVideoListSchema, updateVideoSchema, uploadVideoSchema } from '../validation/videoValidation.js';
import generateRandomString from '../utils/src/generateRandomString.js';
import Joi from 'joi';
import { uploadToBlob, deleteBlob } from '../utils/src/azureStorage.js';
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

// Function to generate SAS URL
const generateSasUrl = async (containerName, blobName) => {
  try {
    const account = "cricketvideos";
    const accountKey = process.env.STORAGE_ACCOUNT_KEY;
    
    if (!accountKey) {
      console.error("STORAGE_ACCOUNT_KEY environment variable is not set");
      // Fall back to direct URL if SAS can't be generated
      return `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;
    }
    
    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );
    
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    // Generate SAS token that expires in 1 hour
    const sasToken = await blobClient.generateSasUrl({
      permissions: "r", // Read permission
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
    });
    
    return sasToken;
  } catch (error) {
    console.error("Error generating SAS URL:", error);
    // Fall back to direct URL
    return `https://cricketvideos.blob.core.windows.net/${containerName}/${blobName}`;
  }
};

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
            .sort({ _id: -1 }) // _id contains a timestamp, so sorting by it is similar to createdAt
            .populate('studentId', 'name email')
            .exec();

        // Add debug logging
        console.log("Raw videos from DB:", videos.map(v => ({
            id: v._id,
            blobUrl: v.blobUrl,
            fileName: v.fileName
        })));

        const list = await Promise.all(videos.map(async (video) => {
            // Extract blob name from URL
            const blobName = video.fileName;
            // Generate SAS URL with temporary access
            const sasUrl = await generateSasUrl('videos', `${video.studentId}/${blobName}`);
            
            return {
                _id: video._id,
                url: sasUrl,
                thumbnailUrl: video.blobUrl || null,
                title: video.originalName || video.fileName,
                isFavourite: video.isFavourite.includes(userId),
                studentId: video.studentId,
                coachId: video.coachId,
            };
        }));

        console.log("Processed list URLs:", list.map(v => v.url));
        
        return res.status(200).json({ list });
    } catch (err) {
        console.error('Get Video List Error:', err);
        res.status(500).json({ message: 'Server error while fetching videos.' });
    }
};

// Upload video files
const uploadVideo = async (req, res) => {
    try {
        console.log('Upload request received:', req.body);
        const { studentId, coachId } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }
        
        const file = req.files[0];
        console.log('File received:', file.originalname);
        
        // Generate a unique blob name
        const timestamp = Date.now();
        const blobName = `${studentId}/${timestamp}-${file.originalname}`; // FIXED: Removed extra 'videos/' prefix
        
        // Read file as buffer
        const fs = await import('fs');
        const fileBuffer = fs.readFileSync(file.path);
        
        // Upload to Azure Blob Storage
        const blobUrl = await uploadToBlob('videos', blobName, fileBuffer);
        console.log('Video uploaded to Azure, URL:', blobUrl); // ADDED: Debug log
        
        // Create video record with correct blobUrl
        const newVideo = new Video({
            fileName: `${timestamp}-${file.originalname}`,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            studentId,
            coachId,
            blobUrl: blobUrl, // Store the Azure blob URL
            uploadedAt: new Date(),
            hasAccess: true,
            isFavourite: []
        });
        
        const savedVideo = await newVideo.save();
        console.log('Video saved to database with ID:', savedVideo._id);
        
        // Delete temporary file
        fs.unlinkSync(file.path);
        
        res.status(201).json({
            message: 'Video uploaded successfully',
            video: {
                _id: savedVideo._id,
                url: blobUrl, // Make sure this is passed to frontend
                title: file.originalname
            }
        });
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

                // Delete from Azure Blob Storage if blobUrl exists
                if (video.blobUrl) {
                    try {
                        // Extract blob name from URL
                        const url = new URL(video.blobUrl);
                        const blobPath = url.pathname.substring(1); // Remove leading '/'
                        
                        // Delete the blob
                        await deleteBlob('videos', blobPath);
                    } catch (err) {
                        console.warn(`Failed to delete blob for video ${video._id}`, err);
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
