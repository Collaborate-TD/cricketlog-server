import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false
})
.then(() => console.log('Connected to database'))
.catch(err => console.error('Database connection error:', err));

async function fixVideoUrls() {
  try {
    // Get all videos regardless of blobUrl status
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos`);
    
    for (const video of videos) {
      // Construct the blob URL
      const blobUrl = `https://cricketvideos.blob.core.windows.net/videos/${video.studentId}/${video.fileName}`;
      
      // Force update with $set operator
      const result = await Video.updateOne(
        { _id: video._id },
        { $set: { blobUrl: blobUrl } }
      );
      
      console.log(`Updated video ${video._id} with URL: ${blobUrl}`);
      console.log(`Update result: ${result.modifiedCount} documents modified`);
    }
    
    // Verify the update
    const verifyVideos = await Video.find({});
    console.log("Verification check - Video URLs after update:");
    verifyVideos.forEach(v => console.log(`ID: ${v._id}, blobUrl: ${v.blobUrl}`));
    
    console.log('Finished updating video URLs');
  } catch (error) {
    console.error('Error updating video URLs:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixVideoUrls();