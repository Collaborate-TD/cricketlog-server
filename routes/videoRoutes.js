import express from 'express';
import { getVideoList, uploadVideo, editDetails, deleteVideos } from '../controllers/videoController.js';
import { getTempMulterUpload } from '../utils/src/multerUpload.js';

const router = express.Router();

const allowedExtensions = ['.mp4', '.mov', '.avi'];
const videoUpload = getTempMulterUpload({
    allowedExtensions,
    maxSizeMB: 50,
    fieldName: 'videos',
    maxCount: 10
});

// Get list of all videos
router.post('/list', getVideoList);

// Upload videos
router.post('/upload', videoUpload, uploadVideo);

// Edit video details
router.put('/:id', editDetails);

// Delete video
router.delete('/delete', deleteVideos);

export default router;
