import Video from '../models/Video.js';
import { annotationSchema } from '../validation/annotateValidation.js';

// Add an annotation to a video
export const addAnnotation = async (req, res) => {

    const { error, value } = annotationSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    let { coachId, data } = value;
    const { videoId } = req.params;

    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        // If coachId exists, check if it matches
        if (video.coachId) {
            if (video.coachId.toString() !== coachId) {
                return res.status(403).json({ message: 'You are not authorized to annotate this video.' });
            }
        } else {
            // If no coachId, assign it
            video.coachId = coachId;
        }

        const annotation = { data: JSON.stringify(data), createdAt: new Date() };
        if (!video.annotations) video.annotations = [];
        console.log('Received request to add annotation:', annotation);
        video.annotations.push(annotation);
        await video.save();
        res.status(201).json({ message: 'Annotation added', annotation });
    } catch (err) {
        console.error('Error adding annotation:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// Get all annotations for a video
export const getAnnotations = async (req, res) => {
    const { videoId } = req.params;
    try {
        const video = await Video.findById(videoId).select('annotations');
        if (!video) return res.status(404).json({ message: 'Video not found' });
        const annotations = video.annotations.map(a => ({
            ...a.toObject(),
            data: JSON.parse(a.data)
        }));
        res.status(200).json(annotations || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};