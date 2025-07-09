import fs from 'fs';
import path from 'path';
import { FOLDER_PATH } from '../../constants/folderPath.js';

/**
 * Handles drill file upload.
 * @param {Object} file - The file object (from multer or similar middleware).
 * @param {String} userId - The user's ID to organize files per user.
 * @returns {String} The saved file name.
 */
export const uploadDrillFile = (filename, userId) => {
    if (!filename || !userId) throw new Error('File and userId are required');

    const ext = path.extname(filename).toLowerCase();
    const timestamp = Date.now();
    const newFileName = `drill_${timestamp}${ext}`;
    const userDir = path.join('data', 'drills', userId);
    fs.mkdirSync(userDir, { recursive: true });
    const srcPath = path.join(FOLDER_PATH.TMP_PATH, filename);
    const destPath = path.join(userDir, newFileName);

    fs.renameSync(srcPath, destPath);

    return newFileName;
};

// Utility to delete all files for a drill
export const deleteDrillFiles = (files, userId) => {
    if (!Array.isArray(files) || !userId) return;
    for (const fileName of files) {
        const filePath = path.join('data', 'drills', userId.toString(), fileName);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.warn(`Failed to delete file: ${filePath}`, err);
            }
        }
    }
};