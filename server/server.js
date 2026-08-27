import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import uploadRoutes from './routes/upload.js';
import distanceRoutes from './routes/distance.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Distribution Distance API is running' });
});

// 2. API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/distance', distanceRoutes);

// 3. Static Assets (Client Build Folder)
app.use(express.static(path.join(process.cwd(), '..', 'client', 'dist')));

// 4. Catch-all Route for React Router (API Route গুলোর নিচে থাকবে)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});