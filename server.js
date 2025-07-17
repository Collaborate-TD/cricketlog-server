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
import drillRoutes from './routes/drillRoutes.js';
import path from 'path';

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());

// For JSON bodies (e.g., application/json)
// app.use(json());
app.use(express.json({ limit: '100mb' }));

// Serve static files
app.use('/data', express.static(path.join(process.cwd(), 'data')));

console.log('MONGO_URI is set:', !!process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false,  // Required for Cosmos DB
    serverSelectionTimeoutMS: 30000, // Increased timeout
    socketTimeoutMS: 45000, // Socket timeout
    family: 4  // Use IPv4, avoid IPv6
})
    .then(() => console.log(
        process.env.NODE_ENV === "production" ?
            'Connected to Azure Cosmos DB' : 'Connected to MongoDB')
    )
    .catch(err => console.error(
        process.env.NODE_ENV === "production" ?
            'Azure Cosmos DB connection error:' : 'MongoDB connection error:'
        , err
    ));

app.use('/auth', authRoutes);
app.use("/user", userRoutes);
app.use("/relation", relationRoutes);
app.use("/file", fileRoutes);
app.use("/video", videoRoutes);
app.use("/video-ann", annotateRoutes);
app.use("/drill", drillRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));