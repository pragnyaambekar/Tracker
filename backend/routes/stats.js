const express = require('express');
const auth = require('../middleware/auth');
const Problem = require('../models/Problem');
const UserProblem = require('../models/UserProblem');
const Streak = require('../models/Streak');

const router = express.Router();

// Get user statistics
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find();
    const userProblems = await UserProblem.find({ 
      userId: req.user.id,
      completed: true
    });
    
    console.log(`Found ${userProblems.length} completed problems for user ${req.user.id}`);
    
    // Calculate statistics
    const totalProblems = problems.length;
    const solvedProblems = userProblems.length;
    
    // Group problems by category
    const problemsByCategory = {};
    problems.forEach(problem => {
      if (!problemsByCategory[problem.category]) {
        problemsByCategory[problem.category] = {
          total: 0,
          completed: 0
        };
      }
      problemsByCategory[problem.category].total++;
    });
    
    // Count completed problems by category
    for (const up of userProblems) {
      const problem = await Problem.findById(up.problemId);
      if (problem && problemsByCategory[problem.category]) {
        problemsByCategory[problem.category].completed++;
      }
    }
    
    // Count completed categories
    let completedCategories = 0;
    for (const category in problemsByCategory) {
      if (problemsByCategory[category].completed === problemsByCategory[category].total && 
          problemsByCategory[category].total > 0) {
        completedCategories++;
      }
    }
    
    // Get user's streak for calculating pace
    const streak = await Streak.findOne({ userId: req.user.id });
    const pace = streak && streak.currentStreak > 0 
      ? Math.round((solvedProblems / streak.currentStreak) * 7) 
      : 0;
    
    res.json({
      totalProblems,
      solvedProblems,
      completedCategories,
      pace,
      categoryProgress: problemsByCategory
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;