import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import generateRandomString from '../utils/generateRandomString.js';
import Video from '../models/Video.js';

const router = express.Router();

// Allowed extensions and max size
const allowedExtensions = ['.mp4', '.mov', '.avi'];
const MAX_SIZE = 6 * 1024 * 1024; // 5MB

// Multer storage for temp folder
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join('data', 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload = multer({
    storage: tempStorage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only mp4, mov, avi files are allowed'));
        }
    }
});

// Upload endpoint
router.post('/upload', upload.array('videos', 10), async (req, res) => {
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

            // Move file from temp to user folder]
            fs.renameSync(file.path, destPath);

            const url = `/data/videos/${userId}/raw/${newFileName}`;
            const thumbnailUrl = `${url}`;
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
});

export default router;