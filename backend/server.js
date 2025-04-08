const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const streakRoutes = require('./routes/streaks');
const problemRoutes = require('./routes/problems');
const statsRoutes = require('./routes/stats');
const comparisonRoutes = require('./routes/comparison');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads/avatars');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/streak-tracker')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});