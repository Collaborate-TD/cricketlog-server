import path from 'path';
import fs from 'fs';
import { FOLDER_PATH } from '../../constants/folderPath.js';
import { deleteBlob, downloadBlobToBuffer, generateSasUrl, uploadToBlob } from './azureStorage.js';

/**
 * Generates a URL for a file.
 * @param {string} container - The container name.
 * @param {string} subFolder - The subfolder path within the container.
 * This function checks if the environment is not production, it returns the local file path.
 * If in production, it generates a SAS URL for the file.
 * @return {Promise<string>} The URL of the file.
 */
export async function getFileUrl(container, subFolder) {
    if (process.env.NODE_ENV !== 'production') {
        const filePath = `${container}/${subFolder}`;
        const fileExists = fs.existsSync(filePath);

        const fileUrl = `${process.env.BACKEND_URL}/${filePath}`;

        return fileExists ? fileUrl : '';
    }
    else {
        return await generateSasUrl(container, subFolder);
    }
}

/**
 * Saves a file to local or cloud storage.
 * @param {string} container - The container path where the file will be saved.
 * @param {string} subFolder - The subfolder path.
 * @param {string} fileName - The name of the file.
 * @param {Buffer} fileBuffer - The buffer containing the file data.
 * This function checks if the environment is not production, it saves the file locally.
 * If in production, it uploads the file to Azure Blob Storage.
 * @return {Promise<string>} The URL of the saved file.
 */
export async function saveFileUrl(container, subFolder, fileName, fileBuffer, oldFileName) {
    if (process.env.NODE_ENV !== 'production') {
        const userDir = path.join(container, subFolder);
        fs.mkdirSync(userDir, { recursive: true });
        const destPath = path.join(userDir, fileName);

        if (!fileBuffer) {
            const srcPath = path.join(FOLDER_PATH.TMP_PATH, oldFileName);
            fileBuffer = fs.readFileSync(srcPath);
        }

        // Write file buffer into user folder
        fs.writeFileSync(destPath, fileBuffer);

        // Return the local file path
        return await getFileUrl(`${container}${subFolder}`, fileName);

    }
    else {
        const blobName = `${subFolder}${fileName}`;

        if (!fileBuffer) {
            fileBuffer = await downloadBlobToBuffer(FOLDER_PATH.TMP_PATH, oldFileName);
        }

        // console.log(`Uploading file to Azure Blob Storage: ${fileBuffer}`);

        return await uploadToBlob(container, blobName, fileBuffer) ?? "";
    }
}

/**
 * Deletes a file from local or cloud storage.
 * @param {string} path - The path of the file to delete.
 * @param {string} blobUrl - The URL of the blob in Azure Storage (if applicable).
 * @param {string} fileId - The ID of the file being deleted (for logging purposes).
 */
export async function deleteFileUrl(container, paths, blobUrl, fileId) {
    if (process.env.NODE_ENV !== 'production') {
        try {
            const filePath = path.join(container, paths);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.warn(`Failed to delete file ${fileId}`, err);
        }
    }
    else {
        try {
            let blobPath = paths;
            if (blobUrl) {
                // Extract blob name from URL
                const url = new URL(blobUrl);
                blobPath = url.pathname.substring(1); // Remove leading '/'
                // Delete the blob
            }
            await deleteBlob(container, blobPath);
        } catch (err) {
            console.warn(`Failed to delete blob for file ${fileId}`, err);
        }
    }
}