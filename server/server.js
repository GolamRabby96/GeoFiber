import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

import uploadRoutes from './routes/upload.js';
import distanceRoutes from './routes/distance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 3. Static Assets (ডাইরেক্টরি ডাইনামিকালি পয়েন্ট করা হয়েছে)
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// 4. Catch-all Route for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});