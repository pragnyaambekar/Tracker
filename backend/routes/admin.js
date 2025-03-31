const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Streak = require('../models/Streak');
const Problem = require('../models/Problem');
const UserProblem = require('../models/UserProblem');
const UserAchievement = require('../models/UserAchievement');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user && user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users with pagination and search
router.get('/users', [auth, isAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    
    // Create search query
    const searchQuery = search 
      ? { username: { $regex: search, $options: 'i' } } 
      : {};
    
    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);
    
    // Get users
    const users = await User.find(searchQuery)
      .sort({ username: 1 })
      .skip(skip)
      .limit(limit)
      .select('-password');
    
    // Get additional data for each user
    const usersWithData = await Promise.all(users.map(async (user) => {
      // Get streak information
      const streak = await Streak.findOne({ userId: user._id });
      
      // Get problem solving stats
      const totalProblems = await Problem.countDocuments();
      const solvedProblems = await UserProblem.countDocuments({ 
        userId: user._id, 
        completed: true 
      });
      
      // Check if user is active (updated streak in last 7 days)
      const lastActive = streak ? streak.lastUpdateDate : null;
      const isActive = lastActive ? 
        (new Date() - new Date(lastActive)) / (1000 * 60 * 60 * 24) < 7 : 
        false;
      
      return {
        _id: user._id,
        username: user.username,
        timezone: user.timezone,
        createdAt: user.createdAt,
        currentStreak: streak ? streak.currentStreak : 0,
        lastActive,
        isActive,
        problemsSolved: solvedProblems,
        totalProblems
      };
    }));
    
    res.json({
      users: usersWithData,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new user (admin can add users)
router.post('/users', [auth, isAdmin], async (req, res) => {
  try {
    const { username, password, timezone } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      timezone,
      avatarUrl: `${username}.jpg` // Default avatar name based on username
    });
    
    await user.save();
    
    // Create initial streak
    const streak = new Streak({ userId: user._id });
    await streak.save();
    
    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a user
router.delete('/users/:userId', [auth, isAdmin], async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user and related data
    await User.findByIdAndDelete(userId);
    await Streak.deleteMany({ userId });
    await UserProblem.deleteMany({ userId });
    await UserAchievement.deleteMany({ userId });
    
    res.json({ message: 'User and related data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset a user's streak
router.post('/users/:userId/reset-streak', [auth, isAdmin], async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user's streak
    const streak = await Streak.findOne({ userId });
    
    if (!streak) {
      // Create a new streak with 0 value if it doesn't exist
      const newStreak = new Streak({
        userId,
        currentStreak: 0,
        lastUpdateDate: null
      });
      await newStreak.save();
    } else {
      // Reset existing streak
      streak.currentStreak = 0;
      streak.lastUpdateDate = null;
      await streak.save();
    }
    
    res.json({ message: 'User streak reset successfully' });
  } catch (error) {
    console.error('Reset streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get admin dashboard statistics
router.get('/stats', [auth, isAdmin], async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count active users (active in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeStreaks = await Streak.countDocuments({
      lastUpdateDate: { $gte: sevenDaysAgo }
    });
    
    // Count total problems
    const totalProblems = await Problem.countDocuments();
    
    // Get the longest streak
    const streaks = await Streak.find().sort({ currentStreak: -1 }).limit(1);
    const longestStreak = streaks.length > 0 ? streaks[0].currentStreak : 0;
    
    res.json({
      totalUsers,
      activeUsers: activeStreaks,
      totalProblems,
      longestStreak
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create initial admin user if it doesn't exist
async function createAdminIfNotExists() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      
      // Create admin user
      const admin = new User({
        username: 'admin',
        password: hashedPassword,
        timezone: 'PST',
        isAdmin: true
      });
      
      await admin.save();
      
      // Create streak for admin
      const streak = new Streak({ userId: admin._id });
      await streak.save();
      
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Create admin error:', error);
  }
}

// Call this function when the server starts
createAdminIfNotExists();

module.exports = router;