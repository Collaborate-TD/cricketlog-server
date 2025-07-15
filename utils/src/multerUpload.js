import multer from 'multer';
import path from 'path';
import fs from 'fs';

export function getTempMulterUpload({ allowedExtensions = [], maxSizeMB = 5, fieldName = 'files', maxCount = 10 } = {}) {
    const MAX_SIZE = maxSizeMB * 1024 * 1024;

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
            if (allowedExtensions.length > 0) {
                const ext = path.extname(file.originalname).toLowerCase();
                if (!allowedExtensions.includes(ext)) {
                    return cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed`));
                }
            }
            // Size filter
            if (file.size > MAX_SIZE) {
                return cb(new Error(`File size exceeds the maximum allowed size of ${maxSizeMB} MB`));
            }
            cb(null, true);
        }
    });

    return upload.array(fieldName, maxCount);
}