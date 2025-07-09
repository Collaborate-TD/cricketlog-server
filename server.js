import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import relationRoutes from './routes/relationRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import annotateRoutes from './routes/annotateRoutes.js';
import drillRoutes from './routes/drillRoutes.js';
import path from 'path';

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(json());

// Serve static files
app.use('/data', express.static(path.join(process.cwd(), 'data')));

connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/auth', authRoutes);
app.use("/user", userRoutes);
app.use("/relation", relationRoutes);
app.use("/file", fileRoutes);
app.use("/video", videoRoutes);
app.use("/video-ann", annotateRoutes);
app.use("/drill", drillRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
