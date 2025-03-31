const express = require('express');
const auth = require('../middleware/auth');
const Streak = require('../models/Streak');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

const router = express.Router();

// Get user's streak
router.get('/', auth, async (req, res) => {
  try {
    let streak = await Streak.findOne({ userId: req.user.id });
    
    if (!streak) {
      streak = new Streak({ userId: req.user.id });
      await streak.save();
    }
    
    // Check if streak is active
    let isStreakActive = true;
    if (streak.lastUpdateDate) {
      const user = await User.findById(req.user.id);
      
      // Convert dates to user's timezone
      const lastUpdate = new Date(streak.lastUpdateDate);
      const now = new Date();
      
      // Get dates in user's timezone
      const lastUpdateStr = lastUpdate.toLocaleString('en-US', { timeZone: user.timezone });
      const nowStr = now.toLocaleString('en-US', { timeZone: user.timezone });
      
      const lastUpdateDate = new Date(lastUpdateStr);
      const nowDate = new Date(nowStr);
      
      // Reset time part to compare just the dates
      lastUpdateDate.setHours(0, 0, 0, 0);
      nowDate.setHours(0, 0, 0, 0);
      
      // Check if more than one day has passed
      const diffTime = Math.abs(nowDate - lastUpdateDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      isStreakActive = diffDays <= 1;
    }
    
    res.json({
      currentStreak: streak.currentStreak,
      lastUpdateDate: streak.lastUpdateDate,
      streakActive: isStreakActive
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update streak
router.post('/update', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let streak = await Streak.findOne({ userId: req.user.id });
    
    if (!streak) {
      streak = new Streak({ userId: req.user.id });
    }
    
    // Check if already updated today in user's timezone
    let shouldIncrementStreak = true;
    
    if (streak.lastUpdateDate) {
      // Convert dates to user's timezone
      const lastUpdate = new Date(streak.lastUpdateDate);
      const now = new Date();
      
      // Get dates in user's timezone
      const lastUpdateStr = lastUpdate.toLocaleString('en-US', { timeZone: user.timezone });
      const nowStr = now.toLocaleString('en-US', { timeZone: user.timezone });
      
      const lastUpdateDate = new Date(lastUpdateStr);
      const nowDate = new Date(nowStr);
      
      // Reset time part to compare just the dates
      lastUpdateDate.setHours(0, 0, 0, 0);
      nowDate.setHours(0, 0, 0, 0);
      
      if (lastUpdateDate.getTime() === nowDate.getTime()) {
        return res.status(400).json({ error: 'Already updated today' });
      }
      
      // Check if streak needs to be reset (more than one day passed)
      const diffTime = Math.abs(nowDate - lastUpdateDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      shouldIncrementStreak = diffDays === 1;
      
      if (diffDays > 1) {
        // Reset streak if more than a day has passed
        streak.currentStreak = 0;
      }
    }
    
    // Increment streak if conditions are met
    if (shouldIncrementStreak) {
      streak.currentStreak += 1;
    }
    
    // Update last update time
    streak.lastUpdateDate = new Date();
    await streak.save();
    
    // Check for achievements
    await checkAndUpdateAchievements(req.user.id, streak.currentStreak);
    
    res.json({
      currentStreak: streak.currentStreak,
      lastUpdateDate: streak.lastUpdateDate
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset streak (admin function)
router.delete('/reset', auth, async (req, res) => {
  try {
    const { userId } = req.body; // If resetting someone else's streak
    const targetUserId = userId || req.user.id;
    
    const streak = await Streak.findOne({ userId: targetUserId });
    
    if (streak) {
      streak.currentStreak = 0;
      streak.lastUpdateDate = null;
      await streak.save();
    }
    
    res.json({ message: 'Streak reset successfully' });
  } catch (error) {
    console.error('Reset streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to check and update achievements
async function checkAndUpdateAchievements(userId, streakCount) {
  try {
    // Get all streak-based achievements
    const achievements = await Achievement.find();
    
    for (const achievement of achievements) {
      // Check if user already has this achievement
      const existingAchievement = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id
      });
      
      // If not earned and threshold is met, grant the achievement
      if (!existingAchievement && streakCount >= achievement.threshold) {
        const userAchievement = new UserAchievement({
          userId,
          achievementId: achievement._id
        });
        await userAchievement.save();
      }
    }
  } catch (error) {
    console.error('Achievement update error:', error);
  }
}

module.exports = router;