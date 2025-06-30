import Video from '../models/Video.js';

const addAnnotation = async (req, res) => {
    const { videoId } = req.params;
    const { coachId, data } = req.body;
    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const annotation = { coachId, data, createdAt: new Date() };
        video.annotations.push(annotation);
        await video.save();
        res.status(201).json({ message: 'Annotation added', annotation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAnnotations = async (req, res) => {
    const { videoId } = req.params;
    try {
        const video = await Video.findById(videoId).select('annotations');
        if (!video) return res.status(404).json({ message: 'Video not found' });
        res.status(200).json(video.annotations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateAnnotation = async (req, res) => {
    const { videoId, annotationId } = req.params;
    const { data } = req.body;
    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const annotation = video.annotations.id(annotationId);
        if (!annotation) return res.status(404).json({ message: 'Annotation not found' });

        annotation.data = data;
        annotation.updatedAt = new Date();
        await video.save();
        res.status(200).json({ message: 'Annotation updated', annotation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteAnnotation = async (req, res) => {
    const { videoId, annotationId } = req.params;
    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        video.annotations.id(annotationId).remove();
        await video.save();
        res.status(200).json({ message: 'Annotation deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export {
    addAnnotation,
    getAnnotations,
    updateAnnotation,  
    deleteAnnotation
};