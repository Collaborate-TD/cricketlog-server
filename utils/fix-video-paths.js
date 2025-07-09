import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

async function fixVideoPaths() {
  try {
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos`);
    
    for (const video of videos) {
      // Add the missing "videos/" in the path
      const currentUrl = video.blobUrl;
      
      // Only fix if URL exists and doesn't already have double videos/
      if (currentUrl && !currentUrl.includes('videos/videos/')) {
        const parts = currentUrl.split('/videos/');
        const newUrl = `${parts[0]}/videos/videos/${parts[1]}`;
        
        await Video.updateOne(
          { _id: video._id },
          { $set: { blobUrl: newUrl } }
        );
        
        console.log(`Updated video ${video._id}:`);
        console.log(`  From: ${currentUrl}`);
        console.log(`  To:   ${newUrl}`);
      }
    }
    
    console.log('Finished updating video paths');
  } catch (error) {
    console.error('Error updating video paths:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixVideoPaths();