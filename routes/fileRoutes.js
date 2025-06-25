import express from 'express';
import { getTempMulterUpload } from '../utils/src/multerUpload.js';
import { fileUpload } from '../controllers/fileController.js';

const router = express.Router();

// Allow all common extensions (images, videos, docs, etc.)
const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', // images
    '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv',   // videos
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', // docs
    '.txt', '.csv', '.zip', '.rar', '.7z', '.tar', '.gz'
];

const generalUpload = getTempMulterUpload({
    allowedExtensions,
    maxSizeMB: 50,
    fieldName: 'files',
    maxCount: 20
});

router.post('/general-upload', generalUpload, fileUpload);

export default router;