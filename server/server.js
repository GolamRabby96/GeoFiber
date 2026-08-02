import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload.js';
import distanceRoutes from './routes/distance.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/upload', uploadRoutes);
app.use('/api/distance', distanceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Distribution Distance API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
