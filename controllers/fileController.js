import path from 'path';


const fileUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const results = req.files.map(file => ({
            originalName: file.originalname,
            fileName: file.filename,
            tempPath: path.join('/data/temp', file.filename),
            size: file.size,
            uploadedAt: new Date()
        }));

        res.status(201).json({ message: 'Files uploaded', files: results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export {
    fileUpload
};