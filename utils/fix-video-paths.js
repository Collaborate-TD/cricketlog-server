import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false,
    ssl: true,
    serverSelectionTimeoutMS: 60000
})
    .then(() => console.log('Connected to database'))
    .catch(err => console.error('Database connection error:', err));

async function fixVideoPaths() {
    try {
        const videos = await Video.find({});
        console.log(`Found ${videos.length} videos`);

        for (const video of videos) {
            const currentUrl = video.blobUrl;

            // Only fix URLs that don't already have the double videos/ path
            if (currentUrl && !currentUrl.includes('/videos/videos/')) {
                // Parse the URL to separate the base from the path
                const baseUrl = currentUrl.split('/videos/')[0];
                const pathPart = currentUrl.split('/videos/')[1];

                // Construct the new URL with the extra videos/ segment
                const newUrl = `${baseUrl}/videos/videos/${pathPart}`;

                // Update the database
                await Video.updateOne(
                    { _id: video._id },
                    { $set: { blobUrl: newUrl } }
                );

                console.log(`Updated video ${video._id}:`);
                console.log(`  From: ${currentUrl}`);
                console.log(`  To:   ${newUrl}`);
            }
        }

        console.log('Finished fixing video paths');
    } catch (error) {
        console.error('Error fixing video paths:', error);
    } finally {
        mongoose.disconnect();
    }
}

fixVideoPaths();