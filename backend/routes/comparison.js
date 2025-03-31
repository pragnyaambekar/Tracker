const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Streak = require('../models/Streak');
const Problem = require('../models/Problem');
const UserProblem = require('../models/UserProblem');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

const router = express.Router();

// Get comparison data for all users
router.get('/', auth, async (req, res) => {
  try {
    // Get all users (limit to relevant fields)
    const users = await User.find().select('_id username avatarUrl timezone');
    
    const usersData = await Promise.all(users.map(async (user) => {
      // Get streak data
      const streak = await Streak.findOne({ userId: user._id });
      
      // Check if streak is active
      let streakActive = false;
      if (streak && streak.lastUpdateDate) {
        const lastUpdate = new Date(streak.lastUpdateDate);
        const now = new Date();
        
        const lastUpdateStr = lastUpdate.toLocaleString('en-US', { timeZone: user.timezone });
        const nowStr = now.toLocaleString('en-US', { timeZone: user.timezone });
        
        const lastUpdateDate = new Date(lastUpdateStr);
        const nowDate = new Date(nowStr);
        
        lastUpdateDate.setHours(0, 0, 0, 0);
        nowDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(nowDate - lastUpdateDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        streakActive = diffDays <= 1;
      }
      
      // Get problem stats
      const problems = await Problem.find();
      const userProblems = await UserProblem.find({ 
        userId: user._id,
        completed: true
      });
      
      // Calculate problem stats
      const solvedProblems = userProblems.length;
      
      // Group by category for category progress
      const categoryProgress = {};
      
      // Initialize categories with all problems
      problems.forEach(problem => {
        if (!categoryProgress[problem.category]) {
          categoryProgress[problem.category] = {
            completed: 0,
            total: 0
          };
        }
        categoryProgress[problem.category].total++;
      });
      
      // Count completed problems per category
      for (const up of userProblems) {
        const problem = await Problem.findById(up.problemId);
        if (problem && categoryProgress[problem.category]) {
          categoryProgress[problem.category].completed++;
        }
      }
      
      // Get achievements
      const userAchievements = await UserAchievement.find({ userId: user._id });
      const achievements = await Promise.all(userAchievements.map(async (ua) => {
        const achievementData = await Achievement.findById(ua.achievementId);
        return {
          badgeText: achievementData ? achievementData.badgeText : 'Unknown'
        };
      }));
      
      return {
        id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
        streak: streak ? streak.currentStreak : 0,
        streakActive,
        lastUpdateDate: streak ? streak.lastUpdateDate : null,
        solvedCount: solvedProblems,
        totalProblems: problems.length,
        categoryProgress,
        achievements
      };
    }));
    
    res.json(usersData);
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;