import { getFileUrl } from '../utils/src/localUpload.js';
import { FOLDER_PATH } from '../constants/folderPath.js';

const fileUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const results = [];
        for (const file of req.files) {
            console.log(`Processing file: ${file}`);
            const fileBuffer = fs.readFileSync(file.path);

            console.log(`Processing file path: ${file.path}`);
            const pathUrl = await saveFileUrl(
                FOLDER_PATH.TMP_PATH,
                "",
                file.filename,
                fileBuffer
            );
            console.log(`File saved at: ${pathUrl}`);
            results.push({
                originalName: file.originalname,
                fileName: file.filename,
                path: pathUrl,
                size: file.size,
                uploadedAt: new Date()
            });
        }

        console.log("Files uploaded:", results);

        res.status(201).json({ message: 'Files uploaded', files: results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export {
    fileUpload
};