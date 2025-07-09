import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import relationRoutes from './routes/relationRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import annotateRoutes from './routes/annotateRoutes.js';
import path from 'path';

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(json());

// Serve static files
app.use('/data', express.static(path.join(process.cwd(), 'data')));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false // Important for Cosmos DB compatibility
})
.then(() => console.log('Connected to Azure Cosmos DB'))
.catch(err => console.error('Azure Cosmos DB connection error:', err));

app.use('/auth', authRoutes);
app.use("/user", userRoutes);
app.use("/relation", relationRoutes);
app.use("/file", fileRoutes);
app.use("/video", videoRoutes);
app.use("/video-ann", annotateRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
