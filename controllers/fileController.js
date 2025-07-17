import { getFileUrl, saveFileUrl } from '../utils/src/localUpload.js';
import { FOLDER_PATH } from '../constants/folderPath.js';
import fs from "fs";

const fileUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const results = [];
        for (const file of req.files) {
            results.push({
                originalName: file.originalname,
                fileName: file.filename,
                path: await getFileUrl(FOLDER_PATH.TEMP_PATH, file.filename),
                size: file.size,
                uploadedAt: new Date()
            });
        }

        res.status(201).json({ message: 'Files uploaded', files: results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export {
    fileUpload
};