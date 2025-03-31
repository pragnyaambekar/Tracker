const express = require('express');
const auth = require('../middleware/auth');
const Problem = require('../models/Problem');
const UserProblem = require('../models/UserProblem');

const router = express.Router();

// Get all problems with user completion status
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find();
    const userProblems = await UserProblem.find({ userId: req.user.id });
    
    // Create a map for quick lookup
    const completedMap = {};
    userProblems.forEach(up => {
      completedMap[up.problemId.toString()] = up.completed;
    });
    
    // Group problems by category
    const problemsByCategory = {};
    problems.forEach(problem => {
      if (!problemsByCategory[problem.category]) {
        problemsByCategory[problem.category] = [];
      }
      
      problemsByCategory[problem.category].push({
        id: problem._id,
        name: problem.name,
        completed: completedMap[problem._id.toString()] || false
      });
    });
    
    res.json(problemsByCategory);
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle problem completion status
// Toggle problem completion status
router.post('/:problemId/toggle', auth, async (req, res) => {
    try {
      const { problemId } = req.params;
      
      let userProblem = await UserProblem.findOne({
        userId: req.user.id,
        problemId
      });
      
      if (!userProblem) {
        userProblem = new UserProblem({
          userId: req.user.id,
          problemId,
          completed: true,
          completedAt: new Date()
        });
      } else {
        userProblem.completed = !userProblem.completed;
        userProblem.completedAt = userProblem.completed ? new Date() : null;
      }
      
      await userProblem.save();
      
      // Log successful update
      console.log(`Problem ${problemId} toggled to ${userProblem.completed} for user ${req.user.id}`);
      
      res.json({
        problemId,
        completed: userProblem.completed
      });
    } catch (error) {
      console.error('Toggle problem error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;