import path from 'path';
import fs from 'fs';
import generateRandomString from './generateRandomString.js';
import { FOLDER_PATH } from '../../constants/folderPath.js';
import { uploadToBlob } from './azureStorage.js';

/** * Saves a profile photo for a user.
 * @param {Object} params - The parameters containing the file name, user ID, and username.
 * @param {string} params.filename - The original file name of the photo.
 * @param {string} params.userId - The ID of the user.
 * @param {string} params.username - The username of the user.
 * * @returns {string|null} The new file name if saved successfully, otherwise null.
 */
export function saveProfilePhoto({ filename, userId, username }) {
    if (!filename) return null;
    const ext = path.extname(filename).toLowerCase();
    const timestamp = Date.now();
    const randStr = generateRandomString(6);
    const newFileName = `${username}_${timestamp}_${randStr}${ext}`;
    const userDir = path.join('data', 'profile', userId);
    fs.mkdirSync(userDir, { recursive: true });

    const srcPath = path.join(FOLDER_PATH.TMP_PATH, filename);
    const destPath = path.join(userDir, newFileName);
    fs.renameSync(srcPath, destPath);

    return newFileName;
}

/** * Generates a URL for a video file.
 * @param {string} container - The container name.
 * @param {string} subFolder - The subfolder path within the container.
 * * This function checks if the environment is not production, it returns the local file path.
 * If in production, it generates a SAS URL for the video file.
 * @return {Promise<string>} The URL of the video file.
 */
export async function getVideoUrl(subFolder) {
    if (process.env.NODE_ENV !== 'production') {
        const filePath = `${FOLDER_PATH.CONTAINER_PATH}/${subFolder}`;
        const fileExists = fs.existsSync(filePath);

        const fileUrl = `${process.env.BACKEND_URL}/${filePath}`;

        console.log(`File exists at ${filePath}:`, fileExists);

        return fileExists ? fileUrl : '';
    }
    else {
        console.log(`Container = ${FOLDER_PATH.CONTAINER_PATH}, folder = ${subFolder}`)
        const url =  await generateSasUrl(FOLDER_PATH.CONTAINER_PATH, subFolder);
        console.log("Url  = ", url)
        return url;
    }
}

/** * Saves a video file to local or cloud storage.
 * @param {string} subFolder - The subfolder path where the video will be saved.
 * @param {string} fileName - The name of the video file.
 * @param {string} ext - The file extension of the video.
 * @param {Buffer} fileBuffer - The buffer containing the video file data.
 * * This function checks if the environment is not production, it saves the file locally.
 * If in production, it uploads the file to Azure Blob Storage.
 * @return {Promise<string>} The URL of the saved video file.
 */
export async function saveVideoUrl(subFolder, fileName, ext, fileBuffer) {
    if (process.env.NODE_ENV !== 'production') {
        const userDir = path.join(FOLDER_PATH.CONTAINER_PATH, subFolder);
        fs.mkdirSync(userDir, { recursive: true });
        const destPath = path.join(userDir, fileName);

        // Write file buffer into user folder
        fs.writeFileSync(destPath, fileBuffer);

        // Return the local file path
        return await getVideoUrl(`${subFolder}/${fileName}`, '');

    }
    else {
        const blobName = `${subFolder}${fileName}`;
        return await uploadToBlob(FOLDER_PATH.CONTAINER_PATH, blobName, fileBuffer) ?? "";
    }
}

/** * Deletes a video file from local or cloud storage.
 * @param {string} path - The path of the video file to delete.
 * @param {string} blobUrl - The URL of the blob in Azure Storage (if applicable).
 * @param {string} videoId - The ID of the video being deleted (for logging purposes).
 */
export async function deleteVideoFile(path, blobUrl, videoId) {
    if (process.env.NODE_ENV !== 'production') {
        try {
            const filePath = path.join(FOLDER_PATH.CONTAINER_PATH, path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.warn(`Failed to delete video ${videoId}`, err);
        }
    }
    else {
        try {
            if (blobUrl) {
                // Extract blob name from URL
                const url = new URL(blobUrl);
                const blobPath = url.pathname.substring(1); // Remove leading '/'
                // Delete the blob
                await deleteBlob('videos', blobPath);
            }
        } catch (err) {
            console.warn(`Failed to delete blob for video ${videoId}`, err);
        }
    }
}

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