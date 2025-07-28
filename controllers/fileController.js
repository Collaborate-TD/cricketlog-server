import { saveFileUrl } from '../utils/src/localUpload.js';
import { FOLDER_PATH } from '../constants/folderPath.js';
import fs from "fs";

const fileUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const results = [];
        for (const file of req.files) {
            const fileBuffer = fs.readFileSync(file.path);

            const pathUrl = await saveFileUrl(
                FOLDER_PATH.TMP_PATH,
                "",
                file.filename,
                fileBuffer
            );

            results.push({
                originalName: file.originalname,
                fileName: file.filename,
                path: pathUrl,
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