import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import userRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Health check endpoint for Render monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.use('/api/auth', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notes', noteRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React build
    app.use(express.static(path.join(__dirname, '..', 'dist')));

    // Handle React routing - send all non-API requests to index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
} else {
    // Development: show API message
    app.get('/', (req, res) => {
        res.send('API is running... Frontend is served separately in development.');
    });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));

