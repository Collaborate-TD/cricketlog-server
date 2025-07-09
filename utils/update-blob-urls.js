import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false
})
.then(() => console.log('Connected to database'))
.catch(err => console.error('Database connection error:', err));

async function updateVideoUrls() {
  try {
    const videos = await Video.find({ blobUrl: { $exists: false } });
    console.log(`Found ${videos.length} videos without blobUrl`);
    
    for (const video of videos) {
      // Construct the blob URL based on the video's ID and filename
      const blobUrl = `https://cricketvideos.blob.core.windows.net/videos/${video.studentId}/${video.fileName}`;
      
      // Update the video document
      await Video.updateOne(
        { _id: video._id },
        { $set: { blobUrl: blobUrl } }
      );
      
      console.log(`Updated video ${video._id} with URL: ${blobUrl}`);
    }
    
    console.log('Finished updating video URLs');
  } catch (error) {
    console.error('Error updating video URLs:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateVideoUrls();