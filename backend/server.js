const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const streakRoutes = require('./routes/streaks');
const problemRoutes = require('./routes/problems');
const statsRoutes = require('./routes/stats');
const comparisonRoutes = require('./routes/comparison');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

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

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});