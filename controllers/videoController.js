import User from '../models/User.js';
import { USER_ROLES } from '../constants/userRoles.js';

// Get list of all videos
const getVideoList = async (req, res) => {
    try {
        const filters = req.body;
        const videoData = {
                list: [
    {
      "_id": "v1.mp4",
      "url": "http://127.0.0.1:5000/temp/v1.mp4",
      "thumbnailUrl": "http://127.0.0.1:5000/temp/th1.webp",
      "title": "Video 1"
    },
    {
      "_id": "v2.mp4",
      "url": "http://127.0.0.1:5000/temp/v2.mp4",
      "thumbnailUrl": "http://127.0.0.1:5000/temp/th1.webp",
      "title": "Video 2"
    },
    {
      "_id": "v3.mp4",
      "url": "http://127.0.0.1:5000/temp/v3.mp4",
      "thumbnailUrl": "http://127.0.0.1:5000/temp/th1.webp",
      "title": "Video 3"
    },
    {
      "_id": "v4.mp4",
      "url": "http://127.0.0.1:5000/temp/v3.mp4",
      "thumbnailUrl": "http://127.0.0.1:5000/temp/th1.webp",
      "title": "Video 4"
    }
  ]

        };
        // const videoData = { list:[
            // 'http://127.0.0.1:5000/temp/v1.mp4',
            // 'http://127.0.0.1:5000/temp/v2.mp4',
            // 'http://127.0.0.1:5000/temp/v3.mp4'
        // ] };
        
        res.status(200).json(videoData);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

export {
    getVideoList
};
